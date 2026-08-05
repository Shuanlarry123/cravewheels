import { haversineKm } from "@/lib/distance";
import { fetchMatrix } from "@/lib/navMath";

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

/**
 * Matrix-optimized variant of buildStops: reorders the greedy sequence using
 * real driving times from the Mapbox Matrix API (when a token is available),
 * still respecting the pickup-before-dropoff constraint. Falls back to the
 * haversine-based greedy order if the matrix call fails or there are <=2 stops.
 */
export async function buildStopsOptimized(driverLat, driverLng, activeOrders, restaurants, token) {
  const base = buildStops(driverLat, driverLng, activeOrders, restaurants);
  if (!token || base.length <= 2) return base;

  const coords = [[driverLng, driverLat], ...base.map((s) => [s.lng, s.lat])];
  const matrix = await fetchMatrix(token, coords, "driving");
  if (!matrix?.durations) return base;
  const dur = matrix.durations;

  const pickedOrders = new Set(
    (activeOrders || [])
      .filter((o) => o.status === "picked_up" || o.pickup_confirmed)
      .map((o) => o.id)
  );

  const remaining = base.map((s, i) => ({ ...s, mi: i + 1 }));
  const ordered = [];
  let cur = 0; // matrix index of the driver's current position
  while (remaining.length) {
    let best = null;
    let bestDur = Infinity;
    remaining.forEach((s) => {
      if (s.type === "dropoff" && !pickedOrders.has(s.order.id)) return;
      const t = dur[cur]?.[s.mi];
      if (t == null || t < 0) return;
      if (t < bestDur) {
        bestDur = t;
        best = s;
      }
    });
    // No eligible drop-offs yet → fall back to nearest stop by driving time.
    if (!best) {
      remaining.forEach((s) => {
        const t = dur[cur]?.[s.mi];
        const d = t == null || t < 0 ? Infinity : t;
        if (d < bestDur) {
          bestDur = d;
          best = s;
        }
      });
    }
    if (!best) break;
    ordered.push(best);
    cur = best.mi;
    remaining.splice(remaining.indexOf(best), 1);
    if (best.type === "pickup") pickedOrders.add(best.order.id);
  }

  // Append any stops the optimizer couldn't place, in their original order.
  if (ordered.length < base.length) {
    const placed = new Set(ordered.map((s) => s.mi));
    base.forEach((s, i) => {
      if (!placed.has(i + 1)) ordered.push(s);
    });
  }
  return ordered;
}