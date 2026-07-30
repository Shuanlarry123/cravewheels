import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { add3DBuildings, addSky, setWarmLight } from "@/lib/mapEnhancements";

// Connecticut centroid — used as the default map focus and geolocation fallback.
const CT_CENTER = { lng: -72.7, lat: 41.5 };

export default function MapboxExploreMap({ token, restaurants, focusId, onSelect, userLocation, centerOnUser }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const userMarkerRef = useRef(null);

  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = token;
    const first = restaurants[0];
    const center = centerOnUser
      ? [CT_CENTER.lng, CT_CENTER.lat]
      : first
      ? [first.longitude, first.latitude]
      : [CT_CENTER.lng, CT_CENTER.lat];
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center,
      zoom: centerOnUser ? 8 : 12,
    });
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
    map.on("load", () => {
      add3DBuildings(map);
      addSky(map);
      setWarmLight(map);
      if (!centerOnUser && restaurants.length > 1) fitBounds(map, restaurants);
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
      userMarkerRef.current = null;
    };
  }, [token]);

  function fitBounds(map, list, user) {
    const points = list.map((r) => [r.longitude, r.latitude]);
    if (user) points.push([user.lng, user.lat]);
    const bounds = points.reduce(
      (b, p) => b.extend(p),
      new mapboxgl.LngLatBounds(points[0], points[0])
    );
    map.fitBounds(bounds, { padding: { top: 150, bottom: 230, left: 40, right: 40 }, maxZoom: 14 });
  }

  // sync restaurant markers
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

  // user location marker + recenter
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;
    const lngLat = [userLocation.lng, userLocation.lat];
    if (!userMarkerRef.current) {
      const el = document.createElement("div");
      el.style.cssText =
        "width:18px;height:18px;border-radius:50%;background:#3B82F6;border:3px solid #fff;box-shadow:0 0 0 8px rgba(59,130,246,0.25);";
      userMarkerRef.current = new mapboxgl.Marker(el).setLngLat(lngLat).addTo(map);
    } else {
      userMarkerRef.current.setLngLat(lngLat);
    }

    if (userLocation.fallback) return; // denied/unavailable → keep Connecticut default
    if (restaurants.length > 1) {
      fitBounds(map, restaurants, userLocation);
    } else {
      map.flyTo({ center: lngLat, zoom: 13, essential: true });
    }
  }, [userLocation]);

  // fly to selected restaurant
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusId) return;
    const r = restaurants.find((x) => x.id === focusId);
    if (r) map.flyTo({ center: [r.longitude, r.latitude], zoom: 15, essential: true });
  }, [focusId]);

  return <div ref={containerRef} className="w-full h-full" />;
}