export function haversineKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((v) => v == null || isNaN(v))) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function rankCandidates(drivers, pickupLat, pickupLng, opts = {}) {
  const radius = opts.radiusKm ?? 30;
  return drivers
    .filter(
      (d) =>
        d.latitude != null &&
        d.longitude != null &&
        (!d.availability_status || d.availability_status === "online_idle")
    )
    .map((d) => {
      const distKm = haversineKm(pickupLat, pickupLng, d.latitude, d.longitude);
      const etaMin = distKm == null ? null : Math.max(1, Math.round(distKm * 2.5 + 2));
      const rating = d.rating ?? 5;
      const received = d.offers_received ?? 0;
      const accepted = d.offers_accepted ?? 0;
      const acceptanceRate = received > 0 ? accepted / received : 1;
      const score = (etaMin == null ? 999 : etaMin) - rating * 2 - acceptanceRate * 5;
      return { d, distKm, etaMin, rating, acceptanceRate, score };
    })
    .filter((c) => c.distKm != null && c.distKm <= radius);
}

export async function broadcast(base44, order, restaurant, selected) {
  const fare = Number(order.total_amount || 0);
  const earnings = Number(order.delivery_fee || 2.99) + Number(order.tip || 0);
  let created = 0;
  for (const c of selected) {
    try {
      await base44.asServiceRole.entities.Notification.create({
        user_id: c.d.created_by_id,
        title: "New ride request",
        body: `Pickup ${order.restaurant_name || "restaurant"} · ${c.etaMin ?? "?"} min away · Earn $${earnings.toFixed(2)} · Order $${fare.toFixed(2)}`,
        type: "ride_request",
        order_id: order.id,
        link: "/driver",
        read: false,
      });
      await base44.asServiceRole.entities.DriverProfile.update(c.d.id, {
        offers_received: (c.d.offers_received ?? 0) + 1,
      }).catch(() => {});
      created++;
    } catch (e) {
      console.error("broadcast fail", e?.message || e);
    }
  }
  return created;
}

// Unassign the current driver, return the ride to `matching`, and re-broadcast
// to nearby idle drivers. Used for heartbeat timeouts, offline-mid-trip, and
// driver-initiated releases.
export async function reassignOrder(base44, order, reason, actor = "system") {
  if (order.status === "cancelled" || order.status === "delivered") return { skipped: true };
  const restaurant = order.restaurant_id
    ? await base44.asServiceRole.entities.Restaurant.get(order.restaurant_id).catch(() => null)
    : null;
  if (order.driver_id) {
    const profs = await base44.asServiceRole.entities.DriverProfile.filter(
      { created_by_id: order.driver_id },
      "-created_date",
      1
    ).catch(() => []);
    if (profs?.[0])
      await base44.asServiceRole.entities.DriverProfile.update(profs[0].id, {
        availability_status: "online_idle",
      }).catch(() => {});
  }
  const nowIso = new Date().toISOString();
  await base44.asServiceRole.entities.Order.update(order.id, {
    driver_id: null,
    status: "matching",
    state_changed_at: nowIso,
    pickup_code: null,
    delivery_pin: null,
  }).catch(() => {});
  let notified = 0;
  const pickupLat = restaurant?.latitude;
  const pickupLng = restaurant?.longitude;
  if (pickupLat != null && pickupLng != null) {
    const drivers = await base44.asServiceRole.entities.DriverProfile
      .filter({ is_available: true, is_approved: true })
      .catch(() => []);
    const selected = rankCandidates(drivers, pickupLat, pickupLng)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5);
    notified = await broadcast(base44, order, restaurant, selected);
  }
  await base44.asServiceRole.entities.DispatchEvent.create({
    order_id: order.id,
    actor_id: actor,
    from_state: order.status,
    to_state: "matching",
    detail: `Reassigned: ${reason}`,
    severity: "warning",
  }).catch(() => {});
  return { reassigned: true, notified };
}