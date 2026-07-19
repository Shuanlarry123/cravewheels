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
  const markersRef = useRef([]);
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
      fitRef.current = false;
    };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    const points = [];

    restaurants.forEach((r) => {
      if (r.latitude == null || r.longitude == null) return;
      const m = new mapboxgl.Marker(makeMarker("#FF6B2C", "🍴", () => onSelectRestaurant?.(r)))
        .setLngLat([r.longitude, r.latitude])
        .addTo(map);
      markersRef.current.push(m);
      points.push([r.longitude, r.latitude]);
    });

    drivers.forEach((d) => {
      if (d.latitude == null || d.longitude == null) return;
      const m = new mapboxgl.Marker(makeMarker("#22c55e", "🛵"))
        .setLngLat([d.longitude, d.latitude])
        .addTo(map);
      markersRef.current.push(m);
      points.push([d.longitude, d.latitude]);
    });

    users.forEach((u) => {
      if (u.latitude == null || u.longitude == null) return;
      const m = new mapboxgl.Marker(makeMarker("#a855f7", "👤", () => onSelectUser?.(u)))
        .setLngLat([u.longitude, u.latitude])
        .addTo(map);
      markersRef.current.push(m);
      points.push([u.longitude, u.latitude]);
    });

    deliveries.forEach((o) => {
      if (o.latitude == null || o.longitude == null) return;
      const m = new mapboxgl.Marker(makeMarker("#3b82f6", "📦", () => onSelectDelivery?.(o)))
        .setLngLat([o.longitude, o.latitude])
        .addTo(map);
      markersRef.current.push(m);
      points.push([o.longitude, o.latitude]);
    });

    if (points.length && !fitRef.current) {
      const bounds = new mapboxgl.LngLatBounds();
      points.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, { padding: 60, maxZoom: 12 });
      fitRef.current = true;
    }
  }, [restaurants, drivers, users, deliveries, onSelectRestaurant, onSelectUser, onSelectDelivery]);

  return <div ref={containerRef} className="w-full h-full" />;
}