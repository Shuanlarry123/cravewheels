import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Atomic accept: only the first driver to call this while driver_id is null wins.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await req.json();
    const orderId = payload?.order_id;
    if (!orderId) return Response.json({ error: 'order_id required' }, { status: 400 });

    const pickup_code = String(Math.floor(1000 + Math.random() * 9000));
    const delivery_pin = String(Math.floor(1000 + Math.random() * 9000));

    // Atomic guard: only matches while the order is still unassigned.
    await base44.asServiceRole.entities.Order.updateMany(
      { id: orderId, driver_id: null },
      { $set: { driver_id: user.id, status: 'preparing', pickup_code, delivery_pin, state_changed_at: new Date().toISOString() } }
    ).catch(() => {});

    const after = await base44.asServiceRole.entities.Order.get(orderId).catch(() => null);
    if (!after) return Response.json({ error: 'Order not found' }, { status: 404 });
    if (after.driver_id !== user.id) {
      return Response.json({ accepted: false, reason: 'taken' });
    }

    // Won the ride — update driver stats + state, dismiss other offers, log it.
    const profs = await base44.asServiceRole.entities.DriverProfile.filter({ created_by_id: user.id }, '-created_date', 1).catch(() => []);
    if (profs?.[0]) {
      await base44.asServiceRole.entities.DriverProfile.update(profs[0].id, {
        offers_accepted: (profs[0].offers_accepted ?? 0) + 1,
        availability_status: 'en_route',
      }).catch(() => {});
    }
    await base44.asServiceRole.entities.Notification.updateMany(
      { order_id: orderId, type: 'ride_request' },
      { $set: { read: true } }
    ).catch(() => {});
    await base44.asServiceRole.entities.DispatchEvent.create({
      order_id: orderId, actor_id: user.id, from_state: 'matching', to_state: 'accepted',
      detail: 'Driver accepted request', severity: 'info',
    }).catch(() => {});

    return Response.json({ accepted: true, order: after });
  } catch (error) {
    console.error('acceptRide error', error?.message || error);
    return Response.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}