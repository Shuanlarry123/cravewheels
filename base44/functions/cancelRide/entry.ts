import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Centralized cancellation with stage-based fees + audit record.
// actor: 'rider' (caller owns the order) | 'system' (admin/timeout).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { order_id, actor, reason } = await req.json();
    if (!order_id) return Response.json({ error: 'order_id required' }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
    if (order.status === 'cancelled' || order.status === 'delivered')
      return Response.json({ skipped: true });

    if (actor === 'rider') {
      if (user.id !== order.created_by_id && user.role !== 'admin')
        return Response.json({ error: 'Not your order' }, { status: 403 });
      if (order.status === 'picked_up')
        return Response.json({ error: 'Cannot cancel after pickup — contact support' }, { status: 400 });
    } else if (actor === 'system') {
      if (user.role !== 'admin') return Response.json({ error: 'admin only' }, { status: 403 });
    } else {
      return Response.json({ error: 'invalid actor' }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    let fee = 0;
    let severity = 'info';

    if (actor === 'rider') {
      // Post-accept cancellation incurs the delivery fee; pre-accept is free.
      fee = order.driver_id ? Number(order.delivery_fee || 2.99) : 0;
      if (order.driver_id) severity = 'warning';
      await base44.asServiceRole.entities.Order.update(order_id, {
        status: 'cancelled', state_changed_at: nowIso, cancellation_fee: fee,
        cancelled_by: order.created_by_id, cancel_reason: reason || 'rider_cancelled',
      }).catch(() => {});
      if (order.driver_id) {
        await base44.asServiceRole.entities.Notification.create({
          user_id: order.driver_id, title: 'Ride cancelled by rider',
          body: order.restaurant_name || '', type: 'order_assigned',
          order_id, link: '/driver', read: false,
        }).catch(() => {});
      }
    } else {
      severity = 'urgent';
      await base44.asServiceRole.entities.Order.update(order_id, {
        status: 'cancelled', state_changed_at: nowIso, cancellation_fee: 0,
        cancelled_by: 'system', cancel_reason: reason || 'system_timeout',
      }).catch(() => {});
    }

    await base44.asServiceRole.entities.DispatchEvent.create({
      order_id, actor_id: actor === 'rider' ? order.created_by_id || 'rider' : 'system',
      from_state: order.status, to_state: 'cancelled',
      detail: reason || `${actor}_cancellation`, severity,
    }).catch(() => {});

    return Response.json({ cancelled: true, fee });
  } catch (e) {
    console.error('cancelRide', e?.message || e);
    return Response.json({ error: e?.message || 'error' }, { status: 500 });
  }
}