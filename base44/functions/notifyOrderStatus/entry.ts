import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const orderId = payload?.order_id;
    const status = payload?.status;
    if (!orderId || !['picked_up', 'delivered'].includes(status)) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    const order = await base44.entities.Order.get(orderId);
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
    if (order.driver_id !== user.id) {
      return Response.json({ error: 'Not your delivery' }, { status: 403 });
    }

    await base44.entities.Order.update(orderId, { status });

    let emailed = false;
    if (order.created_by_id) {
      try {
        const customer = await base44.asServiceRole.entities.User.get(order.created_by_id);
        const email = customer?.email;
        if (email) {
          const isPickedUp = status === 'picked_up';
          const subject = isPickedUp
            ? 'Your Cravewheels order is on its way'
            : 'Your Cravewheels order has been delivered';
          const intro = isPickedUp
            ? `Good news! Your driver picked up your order from ${order.restaurant_name || 'the restaurant'} and is heading your way.`
            : `Your order from ${order.restaurant_name || 'the restaurant'} has been delivered. Enjoy your meal!`;
          const message =
            `Hi,\n\n${intro}\n\nOrder total: $${Number(order.total_amount || 0).toFixed(2)}\n\nThanks for ordering with Cravewheels.`;
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: email,
            subject,
            body: message,
          });
          emailed = true;
        }
      } catch (_e) {
        // email failure should not block the status update
      }
    }

    return Response.json({ status, emailed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});