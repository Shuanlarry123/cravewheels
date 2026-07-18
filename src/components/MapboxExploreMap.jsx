import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export default function MapboxExploreMap({ token, restaurants, focusId, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = token;
    const first = restaurants[0];
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: first ? [first.longitude, first.latitude] : [-73.9851, 40.7589],
      zoom: 12,
    });
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
    map.on("load", () => {
      if (restaurants.length > 1) fitBounds(map, restaurants);
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, [token]);

  function fitBounds(map, list) {
    const bounds = list.reduce(
      (b, r) => b.extend([r.longitude, r.latitude]),
      new mapboxgl.LngLatBounds([list[0].longitude, list[0].latitude], [list[0].longitude, list[0].latitude])
    );
    map.fitBounds(bounds, { padding: { top: 150, bottom: 230, left: 40, right: 40 }, maxZoom: 14 });
  }

  // sync markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const existing = markersRef.current;
    const seen = new Set();
    restaurants.forEach((r) => {
      seen.add(r.id);
      if (existing[r.id]) return;
      const el = document.createElement("div");
      el.style.cssText = "width:34px;height:34px;cursor:pointer;";
      el.innerHTML =
        '<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#fff;border:2px solid #FF6B2C;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.5);"><span style="transform:rotate(45deg);font-size:15px;">🍴</span></div>';
      const popup = new mapboxgl.Popup({ offset: 22, closeButton: false }).setHTML(
        `<div style="font-weight:600;color:#fff">${r.name}</div><div style="color:#999;font-size:11px">${r.cuisine_type || ""}</div>`
      );
      const marker = new mapboxgl.Marker(el).setLngLat([r.longitude, r.latitude]).setPopup(popup).addTo(map);
      el.addEventListener("click", () => onSelect && onSelect(r.id));
      existing[r.id] = marker;
    });
    Object.keys(existing).forEach((id) => {
      if (!seen.has(id)) {
        existing[id].remove();
        delete existing[id];
      }
    });
  }, [restaurants]);

  // fly to selected
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusId) return;
    const r = restaurants.find((x) => x.id === focusId);
    if (r) map.flyTo({ center: [r.longitude, r.latitude], zoom: 15, essential: true });
  }, [focusId]);

  return <div ref={containerRef} className="w-full h-full" />;
}