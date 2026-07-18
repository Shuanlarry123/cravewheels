import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

async function fetchRoute(token, fromLng, fromLat, toLng, toLat) {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${fromLng},${fromLat};${toLng},${toLat}?geometries=geojson&overview=full&access_token=${token}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.routes?.[0]?.geometry?.coordinates || null;
  } catch {
    return null;
  }
}

export default function MapboxMap({ token, driverLng, driverLat, destLng, destLat }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const routeSourceRef = useRef(null);

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
      map.addSource("route", { type: "geojson", data: { type: "Feature", geometry: { type: "LineString", coordinates: [] } } });
      map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#FF6B2C", "line-width": 5, "line-opacity": 0.9 },
      });
      routeSourceRef.current = map.getSource("route");
    });
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      driverMarkerRef.current = null;
      destMarkerRef.current = null;
      routeSourceRef.current = null;
    };
  }, [token]);

  // Update driver marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || driverLng == null || driverLat == null) return;
    const el = document.createElement("div");
    el.style.cssText =
      "width:20px;height:20px;border-radius:50%;background:#FF6B2C;border:3px solid #fff;box-shadow:0 0 0 4px rgba(255,107,44,0.35);";
    if (!driverMarkerRef.current) {
      driverMarkerRef.current = new mapboxgl.Marker(el).setLngLat([driverLng, driverLat]).addTo(map);
    } else {
      driverMarkerRef.current.setLngLat([driverLng, driverLat]);
    }
    fitBounds();
  }, [driverLng, driverLat]);

  // Update destination marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (destLng == null || destLat == null) {
      if (destMarkerRef.current) {
        destMarkerRef.current.remove();
        destMarkerRef.current = null;
      }
      return;
    }
    const el = document.createElement("div");
    el.style.cssText =
      "width:26px;height:26px;display:flex;align-items:center;justify-content:center;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#fff;border:3px solid #FF6B2C;box-shadow:0 2px 6px rgba(0,0,0,0.5);";
    const dot = document.createElement("div");
    dot.style.cssText = "width:8px;height:8px;border-radius:50%;background:#FF6B2C;";
    el.appendChild(dot);
    if (!destMarkerRef.current) {
      destMarkerRef.current = new mapboxgl.Marker(el).setLngLat([destLng, destLat]).addTo(map);
    } else {
      destMarkerRef.current.setLngLat([destLng, destLat]);
    }
    fitBounds();
  }, [destLng, destLat]);

  function fitBounds() {
    const map = mapRef.current;
    if (!map) return;
    const pts = [];
    if (driverLng != null) pts.push([driverLng, driverLat]);
    if (destLng != null) pts.push([destLng, destLat]);
    if (pts.length === 2) {
      const bounds = pts.reduce((b, p) => b.extend(p), new mapboxgl.LngLatBounds(pts[0], pts[0]));
      map.fitBounds(bounds, { padding: 80, maxZoom: 15 });
    } else if (pts.length === 1) {
      map.flyTo({ center: pts[0], zoom: 14 });
    }
  }

  // Draw route
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !token) return;
    if (driverLng == null || destLng == null) {
      routeSourceRef.current?.setData({ type: "Feature", geometry: { type: "LineString", coordinates: [] } });
      return;
    }
    let active = true;
    fetchRoute(token, driverLng, driverLat, destLng, destLat).then((coords) => {
      if (!active || !routeSourceRef.current || !coords) return;
      routeSourceRef.current.setData({ type: "Feature", geometry: { type: "LineString", coordinates: coords } });
    });
    return () => {
      active = false;
    };
  }, [token, driverLng, driverLat, destLng, destLat]);

  return <div ref={containerRef} className="w-full h-full min-h-[300px] rounded-2xl overflow-hidden" />;
}