import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

function makeMarker(color, emoji, onClick) {
  const el = document.createElement("div");
  el.style.cssText = `width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.6);border:2px solid rgba(255,255,255,.85);cursor:pointer;`;
  const span = document.createElement("span");
  span.textContent = emoji;
  span.style.cssText = "transform:rotate(45deg);font-size:14px;line-height:1;";
  el.appendChild(span);
  if (onClick) el.onclick = onClick;
  return el;
}

export default function AdminLiveMap({
  token,
  restaurants,
  drivers,
  users,
  deliveries,
  onSelectRestaurant,
  onSelectUser,
  onSelectDelivery,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const fitRef = useRef(false);

  useEffect(() => {
    if (!token || !containerRef.current) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-72.9, 41.5],
      zoom: 8,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
      fitRef.current = false;
    };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const seen = new Set();

    const upsert = (key, lat, lng, color, emoji, onClick) => {
      if (lat == null || lng == null) return;
      seen.add(key);
      const existing = markersRef.current[key];
      if (existing) {
        existing.marker.setLngLat([lng, lat]);
      } else {
        const m = new mapboxgl.Marker(makeMarker(color, emoji, onClick))
          .setLngLat([lng, lat])
          .addTo(map);
        markersRef.current[key] = { marker: m };
      }
    };

    restaurants.forEach((r) =>
      upsert(`r:${r.id}`, r.latitude, r.longitude, "#FF6B2C", "🍴", () => onSelectRestaurant?.(r))
    );
    drivers.forEach((d) =>
      upsert(`d:${d.id}`, d.latitude, d.longitude, "#22c55e", "🛵")
    );
    users.forEach((u) =>
      upsert(
        `u:${u.user?.id || u.order?.id || u.id}`,
        u.latitude,
        u.longitude,
        "#a855f7",
        "👤",
        () => onSelectUser?.(u)
      )
    );
    deliveries.forEach((o) =>
      upsert(`o:${o.id}`, o.latitude, o.longitude, "#3b82f6", "📦", () => onSelectDelivery?.(o))
    );

    Object.keys(markersRef.current).forEach((k) => {
      if (!seen.has(k)) {
        markersRef.current[k].marker.remove();
        delete markersRef.current[k];
      }
    });

    if (!fitRef.current) {
      const points = [
        ...restaurants,
        ...drivers,
        ...users,
        ...deliveries,
      ]
        .filter((p) => p.latitude != null && p.longitude != null)
        .map((p) => [p.longitude, p.latitude]);
      if (points.length) {
        const bounds = new mapboxgl.LngLatBounds();
        points.forEach((p) => bounds.extend(p));
        map.fitBounds(bounds, { padding: 60, maxZoom: 12 });
        fitRef.current = true;
      }
    }
  }, [restaurants, drivers, users, deliveries, onSelectRestaurant, onSelectUser, onSelectDelivery]);

  return <div ref={containerRef} className="w-full h-full" />;
}