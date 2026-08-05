import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Ops manual override: force-assign a specific driver to a ride.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'admin only' }, { status: 403 });
    const { order_id, driver_id } = await req.json();
    if (!order_id || !driver_id) return Response.json({ error: 'order_id and driver_id required' }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
    if (order.status === 'cancelled' || order.status === 'delivered')
      return Response.json({ error: 'Order not active' }, { status: 400 });

    const pickup_code = String(Math.floor(1000 + Math.random() * 9000));
    const delivery_pin = String(Math.floor(1000 + Math.random() * 9000));
    const nowIso = new Date().toISOString();

    await base44.asServiceRole.entities.Order.update(order_id, {
      driver_id, status: 'preparing', pickup_code, delivery_pin, state_changed_at: nowIso,
    }).catch(() => {});

    const profs = await base44.asServiceRole.entities.DriverProfile.filter({ created_by_id: driver_id }, '-created_date', 1).catch(() => []);
    if (profs?.[0]) {
      await base44.asServiceRole.entities.DriverProfile.update(profs[0].id, {
        availability_status: 'en_route',
        offers_received: (profs[0].offers_received ?? 0) + 1,
        offers_accepted: (profs[0].offers_accepted ?? 0) + 1,
      }).catch(() => {});
    }

    await base44.asServiceRole.entities.Notification.updateMany(
      { order_id, type: 'ride_request' }, { $set: { read: true } }
    ).catch(() => {});
    await base44.asServiceRole.entities.Notification.create({
      user_id: driver_id, title: 'Ride assigned by ops',
      body: `Pickup ${order.restaurant_name || ''}`, type: 'order_assigned',
      order_id, link: '/driver', read: false,
    }).catch(() => {});

    await base44.asServiceRole.entities.DispatchEvent.create({
      order_id, actor_id: user.id, from_state: order.status, to_state: 'accepted',
      detail: 'Manual assignment by ops', severity: 'info',
    }).catch(() => {});

    return Response.json({ assigned: true });
  } catch (e) {
    console.error('manualAssign', e?.message || e);
    return Response.json({ error: e?.message || 'error' }, { status: 500 });
  }
}