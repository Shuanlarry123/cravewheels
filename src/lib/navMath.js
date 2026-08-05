// Navigation math + Mapbox API helpers for the driver map.

export function bearing(lng1, lat1, lng2, lat2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function haversineM(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((v) => v == null || isNaN(v))) return 0;
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Project (lng,lat) onto segment a-b. Returns projected lng/lat + distance in meters.
function nearestOnSeg(plng, plat, alng, alat, blng, blat) {
  const R = 6371000;
  const toXY = (lat, lng) => ({
    x: R * ((lng - plng) * Math.PI) / 180 * Math.cos((plat * Math.PI) / 180),
    y: R * ((lat - plat) * Math.PI) / 180,
  });
  const a = toXY(alat, alng);
  const b = toXY(blat, blng);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let t = 0;
  const len2 = dx * dx + dy * dy;
  if (len2 > 0) t = Math.max(0, Math.min(1, (-a.x * dx - a.y * dy) / len2));
  const mx = a.x + t * dx;
  const my = a.y + t * dy;
  return {
    t,
    dist: Math.hypot(mx, my),
    x: alng + t * (blng - alng),
    y: alat + t * (blat - alat),
  };
}

/** Nearest projection of a point onto a route (array of step LineString features). */
export function projectOnRoute(features, lng, lat) {
  let best = { dist: Infinity, fi: 0, si: 0, t: 0, x: lng, y: lat };
  if (!features?.length) return best;
  for (let fi = 0; fi < features.length; fi++) {
    const coords = features[fi].geometry.coordinates;
    for (let si = 0; si < coords.length - 1; si++) {
      const r = nearestOnSeg(lng, lat, coords[si][0], coords[si][1], coords[si + 1][0], coords[si + 1][1]);
      if (r.dist < best.dist) best = { dist: r.dist, fi, si, t: r.t, x: r.x, y: r.y };
    }
  }
  return best;
}

/** Split a route into traveled coords (gray) and remaining features (keep congestion). */
export function splitRoute(features, proj) {
  if (!features?.length) return { traveledCoords: [], remainingFeatures: [] };
  const traveledCoords = [];
  for (let fi = 0; fi <= proj.fi; fi++) {
    const coords = features[fi].geometry.coordinates;
    const limit = fi === proj.fi ? proj.si : coords.length - 1;
    for (let i = 0; i <= limit; i++) traveledCoords.push(coords[i]);
    if (fi === proj.fi) traveledCoords.push([proj.x, proj.y]);
  }
  const remainingFeatures = [];
  for (let fi = proj.fi; fi < features.length; fi++) {
    const f = features[fi];
    const coords = f.geometry.coordinates;
    const cong = f.properties?.congestion || "unknown";
    const seg = fi === proj.fi ? [[proj.x, proj.y], ...coords.slice(proj.si + 1)] : coords.slice();
    if (seg.length >= 2) {
      remainingFeatures.push({
        type: "Feature",
        properties: { congestion: cong },
        geometry: { type: "LineString", coordinates: seg },
      });
    }
  }
  return { traveledCoords, remainingFeatures };
}

/** Offset a lng/lat forward (along bearing) by `meters` — used to bias the puck below screen center. */
export function offsetForward(lng, lat, bearingDeg, meters) {
  const br = (bearingDeg * Math.PI) / 180;
  const dLat = (meters / 111111) * Math.cos(br);
  const dLng = (meters / (111111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(br);
  return [lng + dLng, lat + dLat];
}

function lineFeature(coordinates, congestion) {
  return { type: "Feature", properties: { congestion }, geometry: { type: "LineString", coordinates } };
}

/** Driving route through coords with per-step traffic congestion. */
export async function fetchRoute(token, coords) {
  if (!coords || coords.length < 2) return null;
  try {
    const path = coords.map((c) => `${c[0]},${c[1]}`).join(";");
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/driving/${path}` +
      `?geometries=geojson&overview=full&steps=true&annotations=congestion,duration,distance&access_token=${token}`;
    const res = await fetch(url);
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) return null;
    const legs = route.legs || [];
    const features = [];
    legs.forEach((leg) => {
      const cong = leg.annotation?.congestion || [];
      let congIdx = 0;
      (leg.steps || []).forEach((step) => {
        const sc = step.geometry?.coordinates || [];
        if (sc.length < 2) return;
        features.push(lineFeature(sc, cong[congIdx] || "unknown"));
        congIdx += sc.length - 1;
      });
    });
    if (!features.length) {
      const full = route.geometry?.coordinates || [];
      if (full.length >= 2) features.push(lineFeature(full, "unknown"));
    }
    return {
      features,
      coordinates: route.geometry?.coordinates || [],
      steps: legs[0]?.steps || [],
      duration: route.duration,
      distance: route.distance,
      etaToNext: legs[0]?.duration,
    };
  } catch {
    return null;
  }
}

/** Snap a trace of raw GPS points to the road network; returns {lng,lat,bearing} or null. */
export async function mapMatch(token, points) {
  if (!points || points.length < 2) return null;
  try {
    const coords = points.map((p) => `${p[0]},${p[1]}`).join(";");
    const url =
      `https://api.mapbox.com/matching/v5/mapbox/driving/${coords}` +
      `?geometries=geojson&overview=full&tidy=true&access_token=${token}`;
    const res = await fetch(url);
    const data = await res.json();
    const match = data.matchings?.[0];
    if (!match) return null;
    const geo = match.geometry?.coordinates || [];
    const tps = data.tracepoints || [];
    let lastTp = null;
    for (let i = tps.length - 1; i >= 0; i--) {
      if (tps[i] && tps[i].location) {
        lastTp = tps[i];
        break;
      }
    }
    const loc = lastTp?.location || geo[geo.length - 1];
    let b = null;
    if (geo.length >= 2) {
      let bi = 0;
      let bd = Infinity;
      geo.forEach((c, i) => {
        const d = (c[0] - loc[0]) ** 2 + (c[1] - loc[1]) ** 2;
        if (d < bd) {
          bd = d;
          bi = i;
        }
      });
      if (bi < geo.length - 1) b = bearing(geo[bi][0], geo[bi][1], geo[bi + 1][0], geo[bi + 1][1]);
    }
    return { lng: loc[0], lat: loc[1], bearing: b };
  } catch {
    return null;
  }
}

/**
 * Mapbox Matrix API — driving-time/distance table between every pair of coords.
 * Returns { durations, distances } (2D arrays, seconds / meters) or null.
 * Index 0 corresponds to coords[0]. Max 25 coordinates per call.
 */
export async function fetchMatrix(token, coords, profile = "driving") {
  if (!token || !coords || coords.length < 2) return null;
  try {
    const path = coords.map((c) => `${c[0]},${c[1]}`).join(";");
    const url =
      `https://api.mapbox.com/directions-matrix/v1/mapbox/${profile}/${path}` +
      `?annotations=duration,distance&access_token=${token}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.durations) return null;
    return { durations: data.durations, distances: data.distances || null };
  } catch {
    return null;
  }
}

/**
 * Mapbox Isochrone API — area reachable from a point within `minutes` by car.
 * Returns an array of GeoJSON Polygon features (contour rings) or null.
 */
export async function fetchIsochrone(token, { lng, lat, minutes = 10, profile = "driving" }) {
  if (token == null || lng == null || lat == null) return null;
  try {
    const url =
      `https://api.mapbox.com/isochrone/v1/mapbox/${profile}/${lng},${lat}` +
      `?contours_minutes=${minutes}&polygons=true&denoise=0.4&generalize=50&access_token=${token}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.features || [];
  } catch {
    return null;
  }
}