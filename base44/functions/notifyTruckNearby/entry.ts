import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const restaurantId = payload?.restaurant_id;
    if (!restaurantId) return Response.json({ error: 'restaurant_id required' }, { status: 400 });

    const restaurant = await base44.asServiceRole.entities.Restaurant.get(restaurantId);
    if (!restaurant) return Response.json({ error: 'Restaurant not found' }, { status: 404 });
    if (restaurant.restaurant_type !== 'food_truck') {
      return Response.json({ skipped: true, reason: 'not a food truck' });
    }

    const name = restaurant.name || 'A food truck';
    const address = restaurant.address || 'a new spot';

    // Notify all customer-role users
    let users = [];
    try {
      users = await base44.asServiceRole.entities.User.filter({ role: 'user' }, '-created_date', 5000);
    } catch (e) {
      console.error('notifyTruckNearby user fetch failed', e?.message || e);
    }

    if (!users || !users.length) return Response.json({ notified: true, count: 0 });

    const notifications = users.map((u) => ({
      user_id: u.id,
      title: `${name} just settled nearby`,
      body: `A food truck parked at ${address}. Tap to see today's video menu and grab a bite!`,
      type: 'truck_nearby',
      link: `/restaurant/${restaurantId}`,
      read: false,
    }));

    await base44.asServiceRole.entities.Notification.bulkCreate(notifications);

    return Response.json({ notified: true, count: notifications.length });
  } catch (error) {
    console.error('notifyTruckNearby error', error?.message || error);
    return Response.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}