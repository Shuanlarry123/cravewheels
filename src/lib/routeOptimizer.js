import { haversineKm } from "@/lib/distance";

/**
 * Build an optimized, ordered list of stops for a driver's active orders.
 *
 * Each order contributes a pickup stop (at the restaurant) and/or a drop-off
 * stop (at the customer). A drop-off is only reachable after its pickup is
 * done. We sequence stops with a nearest-neighbour greedy walk starting from
 * the driver's current position — good enough for a handful of concurrent
 * deliveries without needing the Mapbox Optimization API.
 *
 * Already-picked-up orders omit their pickup stop (only the drop-off remains).
 *
 * @returns {Array<{ type: "pickup"|"dropoff", order, lat, lng, label }>}
 */
export function buildStops(driverLat, driverLng, activeOrders, restaurants) {
  if (!activeOrders?.length) return [];

  const pending = [];
  const pickedOrders = new Set();

  activeOrders.forEach((o) => {
    const pickedUp = o.status === "picked_up" || o.pickup_confirmed;
    if (pickedUp) pickedOrders.add(o.id);
    const rest = restaurants?.[o.restaurant_id];

    if (!pickedUp && rest && rest.latitude != null && rest.longitude != null) {
      pending.push({
        type: "pickup",
        order: o,
        lat: rest.latitude,
        lng: rest.longitude,
        label: o.restaurant_name || "Pickup",
      });
    }
    if (o.latitude != null && o.longitude != null) {
      pending.push({
        type: "dropoff",
        order: o,
        lat: o.latitude,
        lng: o.longitude,
        label: o.delivery_address || "Customer",
      });
    }
  });

  const stops = [];
  let curLat = driverLat;
  let curLng = driverLng;
  const avail = [...pending];

  while (avail.length) {
    let bestIdx = -1;
    let bestDist = Infinity;

    // Prefer the nearest stop whose prerequisites are satisfied (pickups are
    // always available; a drop-off needs its pickup already done).
    avail.forEach((s, i) => {
      if (s.type === "dropoff" && !pickedOrders.has(s.order.id)) return;
      const d = haversineKm(curLat, curLng, s.lat, s.lng);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });

    // No drop-offs eligible yet → fall back to the nearest pickup.
    if (bestIdx === -1) {
      avail.forEach((s, i) => {
        const d = haversineKm(curLat, curLng, s.lat, s.lng);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      });
    }
    if (bestIdx === -1) break;

    const s = avail.splice(bestIdx, 1)[0];
    stops.push(s);
    curLat = s.lat;
    curLng = s.lng;
    if (s.type === "pickup") pickedOrders.add(s.order.id);
  }

  return stops;
}