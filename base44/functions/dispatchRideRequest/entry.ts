import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

function haversineKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((v) => v == null || isNaN(v))) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Matching pass: rank online+idle+approved drivers by ETA, rating, acceptance rate.
function rankCandidates(drivers, pickupLat, pickupLng) {
  return drivers
    .filter((d) => d.latitude != null && d.longitude != null && (!d.availability_status || d.availability_status === 'online_idle'))
    .map((d) => {
      const distKm = haversineKm(pickupLat, pickupLng, d.latitude, d.longitude);
      const etaMin = distKm == null ? null : Math.max(1, Math.round(distKm * 2.5 + 2));
      const rating = d.rating ?? 5;
      const received = d.offers_received ?? 0;
      const accepted = d.offers_accepted ?? 0;
      const acceptanceRate = received > 0 ? accepted / received : 1;
      // Lower score = better: small ETA, high rating, high acceptance.
      const score = (etaMin == null ? 999 : etaMin) - rating * 2 - acceptanceRate * 5;
      return { d, distKm, etaMin, rating, acceptanceRate, score };
    })
    .filter((c) => c.distKm != null && c.distKm <= 30);
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await req.json();
    const orderId = payload?.order_id;
    const model = payload?.model === 'sequential' ? 'sequential' : 'broadcast';
    const maxCandidates = Math.min(Math.max(payload?.max_candidates || 5, 1), 10);
    if (!orderId) return Response.json({ error: 'order_id required' }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(orderId).catch(() => null);
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
    if (order.driver_id) return Response.json({ skipped: true, reason: 'already assigned' });

    const restaurant = order.restaurant_id
      ? await base44.asServiceRole.entities.Restaurant.get(order.restaurant_id).catch(() => null)
      : null;
    const pickupLat = restaurant?.latitude;
    const pickupLng = restaurant?.longitude;

    if (pickupLat == null || pickupLng == null) {
      await base44.asServiceRole.entities.DispatchEvent.create({
        order_id: orderId, actor_id: user.id, from_state: order.status, to_state: order.status,
        detail: 'No pickup coordinates; cannot match', severity: 'warning',
      }).catch(() => {});
      return Response.json({ dispatched: false, reason: 'no pickup coords' });
    }

    const drivers = await base44.asServiceRole.entities.DriverProfile.filter({ is_available: true, is_approved: true });
    const candidates = rankCandidates(drivers, pickupLat, pickupLng).sort((a, b) => a.score - b.score);
    const selected = model === 'sequential' ? candidates.slice(0, 1) : candidates.slice(0, maxCandidates);

    // Move to "matching" regardless so it leaves the passive list and only the
    // full-screen request cards can claim it.
    await base44.asServiceRole.entities.Order.update(orderId, { status: 'matching' }).catch(() => {});

    if (!selected.length) {
      await base44.asServiceRole.entities.DispatchEvent.create({
        order_id: orderId, actor_id: user.id, from_state: order.status, to_state: 'matching',
        detail: 'No idle drivers nearby; awaiting manual dispatch', severity: 'warning',
      }).catch(() => {});
      return Response.json({ dispatched: false, candidates: 0, reason: 'no candidates' });
    }

    const fare = Number(order.total_amount || 0);
    const earnings = Number(order.delivery_fee || 2.99) + Number(order.tip || 0);
    let created = 0;
    for (const c of selected) {
      try {
        await base44.asServiceRole.entities.Notification.create({
          user_id: c.d.created_by_id,
          title: 'New ride request',
          body: `Pickup ${order.restaurant_name || 'restaurant'} · ${c.etaMin ?? '?'} min away · Earn $${earnings.toFixed(2)} · Order $${fare.toFixed(2)}`,
          type: 'ride_request',
          order_id: orderId,
          link: '/driver',
          read: false,
        });
        await base44.asServiceRole.entities.DriverProfile.update(c.d.id, {
          offers_received: (c.d.offers_received ?? 0) + 1,
        }).catch(() => {});
        created++;
      } catch (e) {
        console.error('dispatch notification failed', e?.message || e);
      }
    }

    await base44.asServiceRole.entities.DispatchEvent.create({
      order_id: orderId, actor_id: user.id, from_state: order.status, to_state: 'matching',
      detail: `${model} to ${created} driver(s)`, severity: 'info',
    }).catch(() => {});

    return Response.json({ dispatched: true, model, candidates: created });
  } catch (error) {
    console.error('dispatchRideRequest error', error?.message || error);
    return Response.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}