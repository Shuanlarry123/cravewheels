import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const REROUTE_THRESHOLD_M = 120;
const REROUTE_COOLDOWN_MS = 20000;

/**
 * Multi-stop route fetch through [driver, ...stops] with traffic congestion
 * annotations so each segment can be coloured green/yellow/red.
 */
async function fetchRoute(token, coords) {
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

    // Split the full geometry into consecutive segments grouped by congestion
    // level so a single data-driven line-colour can paint each one.
    const features = [];
    legs.forEach((leg) => {
      const geom = leg.geometry?.coordinates || [];
      const cong = leg.annotation?.congestion || [];
      if (geom.length < 2) return;
      let cur = cong[0] || "unknown";
      let seg = [geom[0]];
      for (let i = 0; i < geom.length - 1; i++) {
        const c = cong[i] || "unknown";
        if (c === cur) {
          seg.push(geom[i + 1]);
        } else {
          features.push(lineFeature(seg, cur));
          cur = c;
          seg = [geom[i], geom[i + 1]];
        }
      }
      if (seg.length > 1) features.push(lineFeature(seg, cur));
    });

    return {
      features,
      coordinates: route.geometry?.coordinates || [],
      legs,
      steps: legs[0]?.steps || [],
      duration: route.duration,
      distance: route.distance,
      etaToNext: legs[0]?.duration,
    };
  } catch {
    return null;
  }
}

function lineFeature(coordinates, congestion) {
  return {
    type: "Feature",
    properties: { congestion },
    geometry: { type: "LineString", coordinates },
  };
}

function bearing(lng1, lat1, lng2, lat2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function toMeters(lat, lng, refLat, refLng) {
  const R = 6371000;
  const x = R * ((lng - refLng) * Math.PI) / 180 * Math.cos((refLat * Math.PI) / 180);
  const y = R * ((lat - refLat) * Math.PI) / 180;
  return { x, y };
}

function pointSegDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Perpendicular distance (m) from a point to the nearest route segment. */
function distanceToRouteMeters(lat, lng, coords) {
  if (!coords || coords.length < 2) return Infinity;
  let min = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const a = toMeters(coords[i][1], coords[i][0], lat, lng);
    const b = toMeters(coords[i + 1][1], coords[i + 1][0], lat, lng);
    const d = pointSegDist(0, 0, a.x, a.y, b.x, b.y);
    if (d < min) min = d;
  }
  return min;
}

function makeArrowEl() {
  const el = document.createElement("div");
  el.style.cssText =
    "width:36px;height:36px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.6));";
  el.innerHTML =
    '<svg width="36" height="36" viewBox="0 0 24 24"><path d="M12 2 L20 21 L12 16 L4 21 Z" fill="#FF6B2C" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  return el;
}

function makeStopEl(num, type) {
  const el = document.createElement("div");
  const color = type === "pickup" ? "#FF6B2C" : "#22c55e";
  el.style.cssText =
    `width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);` +
    `background:#fff;border:3px solid ${color};display:flex;align-items:center;` +
    `justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.5);`;
  const span = document.createElement("span");
  span.style.cssText = `transform:rotate(45deg);font-size:12px;font-weight:700;color:${color};`;
  span.textContent = num;
  el.appendChild(span);
  return el;
}

const MapboxMap = forwardRef(function MapboxMap(
  { token, driverLng, driverLat, stops, onRouteInfo, follow },
  ref
) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const routeSourceRef = useRef(null);
  const headingRef = useRef(null);
  const prevPosRef = useRef(null);
  const pulseMarkerRef = useRef(null);
  const stopMarkersRef = useRef([]);
  const routeCoordsRef = useRef(null);
  const lastRerouteRef = useRef(0);
  const stopsRef = useRef(stops);
  stopsRef.current = stops;

  const stopsKey = (stops || [])
    .map((s) => `${Number(s.lng).toFixed(5)},${Number(s.lat).toFixed(5)}`)
    .join("|");

  // Init map once
  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = token;
    const startLng = driverLng ?? -73.9851;
    const startLat = driverLat ?? 40.7589;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [startLng, startLat],
      zoom: 13,
    });
    map.on("load", () => {
      map.addSource("route", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      // Soft orange glow under the route
      map.addLayer({
        id: "route-glow",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#FF6B2C", "line-width": 22, "line-opacity": 0.22, "line-blur": 6 },
      });
      // White casing like in-car navigation
      map.addLayer({
        id: "route-casing",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#ffffff", "line-width": 12, "line-opacity": 0.95 },
      });
      // Traffic-aware core: colour per segment by congestion level
      map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": [
            "match",
            ["get", "congestion"],
            "low",
            "#22c55e",
            "moderate",
            "#eab308",
            "heavy",
            "#ef4444",
            "severe",
            "#b91c1c",
            "#FF6B2C",
          ],
          "line-width": 6,
          "line-opacity": 1,
        },
      });
      routeSourceRef.current = map.getSource("route");
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      driverMarkerRef.current = null;
      routeSourceRef.current = null;
      pulseMarkerRef.current = null;
      stopMarkersRef.current = [];
    };
  }, [token]);

  const drawRoute = (res) => {
    const map = mapRef.current;
    if (!map || !routeSourceRef.current) return;
    routeCoordsRef.current = res ? res.coordinates : null;
    routeSourceRef.current.setData({
      type: "FeatureCollection",
      features: res?.features || [],
    });
    onRouteInfo?.(
      res
        ? {
            steps: res.steps,
            duration: res.duration,
            distance: res.distance,
            etaToNext: res.etaToNext,
          }
        : null
    );
  };

  const fetchAndDraw = async (coords) => {
    if (!token || !mapRef.current) return;
    const res = await fetchRoute(token, coords);
    drawRoute(res);
  };

  // Driver marker + 3D navigation follow + off-route re-routing
  useEffect(() => {
    const map = mapRef.current;
    if (!map || driverLng == null || driverLat == null) return;

    const prev = prevPosRef.current;
    if (prev) {
      const moved = Math.abs(driverLng - prev.lng) + Math.abs(driverLat - prev.lat);
      if (moved > 0.0001) headingRef.current = bearing(prev.lng, prev.lat, driverLng, driverLat);
    }
    prevPosRef.current = { lng: driverLng, lat: driverLat };
    const heading = headingRef.current;

    // Pulsing location flash behind the arrow (navigation mode only)
    if (follow) {
      if (!pulseMarkerRef.current) {
        const pEl = document.createElement("div");
        pEl.className = "driver-pulse";
        pEl.innerHTML =
          '<div class="driver-pulse-ring"></div><div class="driver-pulse-ring driver-pulse-ring--2"></div>';
        pulseMarkerRef.current = new mapboxgl.Marker(pEl).setLngLat([driverLng, driverLat]).addTo(map);
      } else {
        pulseMarkerRef.current.setLngLat([driverLng, driverLat]);
      }
    } else if (pulseMarkerRef.current) {
      pulseMarkerRef.current.remove();
      pulseMarkerRef.current = null;
    }

    if (!driverMarkerRef.current) {
      driverMarkerRef.current = new mapboxgl.Marker({
        element: makeArrowEl(),
        rotationAlignment: "map",
      })
        .setLngLat([driverLng, driverLat])
        .addTo(map);
      if (heading != null) driverMarkerRef.current.setRotation(heading);
    } else {
      driverMarkerRef.current.setLngLat([driverLng, driverLat]);
      if (heading != null) driverMarkerRef.current.setRotation(heading);
    }

    if (follow) {
      map.easeTo({
        center: [driverLng, driverLat],
        bearing: heading ?? map.getBearing(),
        pitch: 60,
        zoom: 17,
        duration: 1000,
      });
    } else {
      fitBounds();
    }

    // Live re-routing: if the driver strays from the drawn route, recompute it
    // from the current position through the remaining stops (throttled).
    if (follow && routeCoordsRef.current) {
      const dev = distanceToRouteMeters(driverLat, driverLng, routeCoordsRef.current);
      const now = Date.now();
      if (dev > REROUTE_THRESHOLD_M && now - lastRerouteRef.current > REROUTE_COOLDOWN_MS) {
        lastRerouteRef.current = now;
        const coords = [
          [driverLng, driverLat],
          ...(stopsRef.current || []).map((s) => [s.lng, s.lat]),
        ];
        fetchAndDraw(coords);
      }
    }
  }, [driverLng, driverLat, follow]);

  // Reset to flat north-up overview when leaving navigation mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!follow) {
      headingRef.current = null;
      prevPosRef.current = null;
      map.easeTo({ pitch: 0, bearing: 0, duration: 600 });
    }
  }, [follow]);

  // Numbered stop markers — pickup (orange) and drop-off (green)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    stopMarkersRef.current.forEach((m) => m.remove());
    stopMarkersRef.current = [];
    (stops || []).forEach((s, i) => {
      const marker = new mapboxgl.Marker({ element: makeStopEl(i + 1, s.type) })
        .setLngLat([s.lng, s.lat])
        .addTo(map);
      stopMarkersRef.current.push(marker);
    });
    if (!follow) fitBounds();
  }, [stopsKey, follow]);

  // Draw (or clear) the route when the stop sequence changes
  useEffect(() => {
    if (!token || !mapRef.current) return;
    const cur = stopsRef.current || [];
    if (!cur.length) {
      drawRoute(null);
      return;
    }
    const coords = [
      [driverLng ?? 0, driverLat ?? 0],
      ...cur.map((s) => [s.lng, s.lat]),
    ];
    fetchAndDraw(coords);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopsKey, token]);

  function fitBounds() {
    const map = mapRef.current;
    if (!map) return;
    const pts = [];
    if (driverLng != null) pts.push([driverLng, driverLat]);
    (stops || []).forEach((s) => pts.push([s.lng, s.lat]));
    if (pts.length >= 2) {
      const bounds = pts.reduce((b, p) => b.extend(p), new mapboxgl.LngLatBounds(pts[0], pts[0]));
      map.fitBounds(bounds, { padding: 80, maxZoom: 16 });
    } else if (pts.length === 1) {
      map.flyTo({ center: pts[0], zoom: 14 });
    }
  }

  useImperativeHandle(ref, () => ({
    recenter: () => {
      const map = mapRef.current;
      if (!map) return;
      if (follow && driverLng != null && driverLat != null) {
        map.easeTo({
          center: [driverLng, driverLat],
          bearing: headingRef.current ?? 0,
          pitch: 60,
          zoom: 17,
          duration: 800,
        });
      } else {
        fitBounds();
      }
    },
    follow: () => {
      const map = mapRef.current;
      if (!map || driverLng == null || driverLat == null) return;
      map.easeTo({
        center: [driverLng, driverLat],
        bearing: headingRef.current ?? 0,
        pitch: 60,
        zoom: 17,
        duration: 800,
      });
    },
  }));

  return <div ref={containerRef} className="w-full h-full min-h-[300px] rounded-2xl overflow-hidden" />;
});

export default MapboxMap;