import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const orderId = payload?.order_id;
    if (!orderId) return Response.json({ error: 'order_id required' }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(orderId);
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
    const driverId = order.driver_id;
    if (!driverId) return Response.json({ skipped: true, reason: 'no driver assigned' });

    let driverName = null;
    let email = null;
    let full_name = null;
    try {
      const profiles = await base44.asServiceRole.entities.DriverProfile.filter({ created_by_id: driverId }, '-created_date', 1);
      driverName = profiles?.[0]?.legal_full_name || null;
    } catch (_) { /* ignore */ }
    try {
      const u = await base44.asServiceRole.entities.User.get(driverId);
      email = u?.email || null;
      full_name = u?.full_name || null;
    } catch (_) { /* ignore */ }

    const name = driverName || full_name || 'there';
    const restName = order.restaurant_name || 'a restaurant';
    const total = Number(order.total_amount || 0).toFixed(2);

    await base44.asServiceRole.entities.Notification.create({
      user_id: driverId,
      title: 'New delivery assigned',
      body: `You've been assigned a delivery from ${restName} — $${total}. Open the dispatch map to get started.`,
      type: 'order_assigned',
      order_id: orderId,
      link: '/driver',
      read: false,
    });

    let emailed = false;
    if (email) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject: 'New delivery assigned — open your dispatch map',
          body: `Hi ${name},\n\nA new delivery has been assigned to you from ${restName}.\n\nOrder total: $${total}\n\nOpen the CraveReel app and tap your Active Deliveries / dispatch map to view the route and get started.\n\nCraveReel`,
        });
        emailed = true;
      } catch (e) {
        console.error('notifyDriverAssignment email failed', e?.message || e);
      }
    }

    return Response.json({ notified: true, driver_id: driverId, emailed });
  } catch (error) {
    console.error('notifyDriverAssignment error', error?.message || error);
    return Response.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}