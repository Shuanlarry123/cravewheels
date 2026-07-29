import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

async function fetchRoute(token, fromLng, fromLat, toLng, toLat) {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${fromLng},${fromLat};${toLng},${toLat}?geometries=geojson&overview=full&steps=true&access_token=${token}`;
    const res = await fetch(url);
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) return null;
    return {
      coordinates: route.geometry?.coordinates || [],
      steps: route.legs?.[0]?.steps || [],
      duration: route.duration,
      distance: route.distance,
    };
  } catch {
    return null;
  }
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

function makeArrowEl() {
  const el = document.createElement("div");
  el.style.cssText =
    "width:36px;height:36px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.6));";
  el.innerHTML =
    '<svg width="36" height="36" viewBox="0 0 24 24"><path d="M12 2 L20 21 L12 16 L4 21 Z" fill="#FF6B2C" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  return el;
}

const MapboxMap = forwardRef(function MapboxMap(
  { token, driverLng, driverLat, destLng, destLat, onRouteInfo, follow },
  ref
) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const routeSourceRef = useRef(null);
  const headingRef = useRef(null);
  const prevPosRef = useRef(null);
  const pulseMarkerRef = useRef(null);
  const fitRef = useRef(() => {});

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
      // Soft orange glow under the route for depth on a tilted map
      map.addLayer({
        id: "route-glow",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#FF6B2C", "line-width": 22, "line-opacity": 0.22, "line-blur": 6 },
      });
      // White casing border, like in-car turn-by-turn navigation
      map.addLayer({
        id: "route-casing",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#ffffff", "line-width": 12, "line-opacity": 0.95 },
      });
      // Bright orange core on top
      map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#FF6B2C", "line-width": 6, "line-opacity": 1 },
      });
      routeSourceRef.current = map.getSource("route");
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      driverMarkerRef.current = null;
      destMarkerRef.current = null;
      routeSourceRef.current = null;
      pulseMarkerRef.current = null;
    };
  }, [token]);

  // Update driver marker + driving-style navigation view (3D, course-up, follow)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || driverLng == null || driverLat == null) return;

    // Derive heading from movement so the map rotates in the direction of travel
    const prev = prevPosRef.current;
    if (prev) {
      const moved = Math.abs(driverLng - prev.lng) + Math.abs(driverLat - prev.lat);
      if (moved > 0.0001) headingRef.current = bearing(prev.lng, prev.lat, driverLng, driverLat);
    }
    prevPosRef.current = { lng: driverLng, lat: driverLat };
    const heading = headingRef.current;

    // Pulsing location "flash" behind the driver arrow (navigation mode only)
    if (follow) {
      if (!pulseMarkerRef.current) {
        const pEl = document.createElement("div");
        pEl.className = "driver-pulse";
        pEl.innerHTML =
          '<div class="driver-pulse-ring"></div><div class="driver-pulse-ring driver-pulse-ring--2"></div>';
        pulseMarkerRef.current = new mapboxgl.Marker(pEl)
          .setLngLat([driverLng, driverLat])
          .addTo(map);
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
  }, [driverLng, driverLat, follow]);

  // Reset to a flat, north-up overview when leaving navigation mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!follow) {
      headingRef.current = null;
      prevPosRef.current = null;
      map.easeTo({ pitch: 0, bearing: 0, duration: 600 });
    }
  }, [follow]);

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
    if (!follow) fitBounds();
  }, [destLng, destLat, follow]);

  function fitBounds() {
    const map = mapRef.current;
    if (!map) return;
    const pts = [];
    if (driverLng != null) pts.push([driverLng, driverLat]);
    if (destLng != null) pts.push([destLng, destLat]);
    if (pts.length === 2) {
      const bounds = pts.reduce((b, p) => b.extend(p), new mapboxgl.LngLatBounds(pts[0], pts[0]));
      map.fitBounds(bounds, { padding: 80, maxZoom: 16 });
    } else if (pts.length === 1) {
      map.flyTo({ center: pts[0], zoom: 14 });
    }
  }
  fitRef.current = fitBounds;

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
        fitRef.current();
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

  // Draw route + emit turn-by-turn info
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !token) return;
    if (driverLng == null || destLng == null) {
      routeSourceRef.current?.setData({ type: "Feature", geometry: { type: "LineString", coordinates: [] } });
      onRouteInfo?.(null);
      return;
    }
    let active = true;
    fetchRoute(token, driverLng, driverLat, destLng, destLat).then((res) => {
      if (!active) return;
      if (!res || !routeSourceRef.current) {
        onRouteInfo?.(null);
        return;
      }
      routeSourceRef.current.setData({ type: "Feature", geometry: { type: "LineString", coordinates: res.coordinates } });
      onRouteInfo?.({ steps: res.steps, duration: res.duration, distance: res.distance });
    });
    return () => {
      active = false;
    };
  }, [token, driverLng, driverLat, destLng, destLat]);

  return <div ref={containerRef} className="w-full h-full min-h-[300px] rounded-2xl overflow-hidden" />;
});

export default MapboxMap;