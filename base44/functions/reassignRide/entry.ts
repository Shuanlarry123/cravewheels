import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { reassignOrder } from '../../shared/dispatch.js';

// Driver-initiated release: unassign + re-dispatch to the next candidates.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { order_id, reason } = await req.json();
    if (!order_id) return Response.json({ error: 'order_id required' }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
    if (order.driver_id && order.driver_id !== user.id && user.role !== 'admin')
      return Response.json({ error: 'Not your ride' }, { status: 403 });

    const res = await reassignOrder(base44, order, reason || 'driver_initiated', user.id);
    return Response.json(res);
  } catch (e) {
    console.error('reassignRide', e?.message || e);
    return Response.json({ error: e?.message || 'error' }, { status: 500 });
  }
}