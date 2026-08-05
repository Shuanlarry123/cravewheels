import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { LocateFixed } from "lucide-react";
import {
  bearing,
  haversineM,
  projectOnRoute,
  splitRoute,
  offsetForward,
  fetchRoute,
  mapMatch,
} from "@/lib/navMath";

const REROUTE_THRESHOLD_M = 120;
const REROUTE_COOLDOWN_MS = 20000;
const MATCH_INTERVAL_MS = 3000;
const MATCH_MIN_MOVE_M = 15;
const ARRIVE_M = 45;
const FOLLOW_OFFSET_M = 95;
const PROGRESS_INTERVAL_MS = 333;

function pickStyle() {
  const darkMQ = window.matchMedia?.("(prefers-color-scheme: dark)");
  const h = new Date().getHours();
  const night = h < 6 || h >= 19;
  return darkMQ?.matches || night ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/light-v11";
}

function makePuckEl() {
  const el = document.createElement("div");
  el.style.cssText = "width:40px;height:40px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 2px 5px rgba(0,0,0,0.55));";
  el.innerHTML =
    '<svg width="40" height="40" viewBox="0 0 40 40">' +
    '<circle cx="20" cy="20" r="15" fill="#FF6B2C" stroke="#ffffff" stroke-width="3"/>' +
    '<path d="M20 7 L28 27 L20 22 L12 27 Z" fill="#ffffff"/></svg>';
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

const DriverNavMap = forwardRef(function DriverNavMap(
  { token, driverLng, driverLat, stops, onRouteInfo, onProgress, onDeviation, follow },
  ref
) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const puckRef = useRef(null);
  const pulseRef = useRef(null);
  const stopMarkersRef = useRef([]);
  const remainingSrcRef = useRef(null);
  const traveledSrcRef = useRef(null);
  const routeDataRef = useRef(null);
  const displayRef = useRef(null);
  const targetRef = useRef(null);
  const headingRef = useRef(null);
  const prevPosRef = useRef(null);
  const fixBufRef = useRef([]);
  const lastMatchRef = useRef(0);
  const lastRerouteRef = useRef(0);
  const followingRef = useRef(true);
  const rafRef = useRef(null);
  const lastProgRef = useRef(0);
  const arrivedRef = useRef(false);
  const stopsRef = useRef(stops);
  stopsRef.current = stops;

  const onDeviationRef = useRef(onDeviation);
  onDeviationRef.current = onDeviation;
  const lastDevEmitRef = useRef(0);

  const [showRecenter, setShowRecenter] = useState(false);
  const [arrived, setArrived] = useState(false);

  const navigating = (stops || []).length > 0;
  const stopsKey = (stops || [])
    .map((s) => `${Number(s.lng).toFixed(5)},${Number(s.lat).toFixed(5)}`)
    .join("|");

  const drawRoute = (res) => {
    routeDataRef.current = res;
    if (remainingSrcRef.current)
      remainingSrcRef.current.setData({ type: "FeatureCollection", features: res?.features || [] });
    if (traveledSrcRef.current)
      traveledSrcRef.current.setData({ type: "FeatureCollection", features: [] });
    onRouteInfo?.(
      res ? { steps: res.steps, duration: res.duration, distance: res.distance, etaToNext: res.etaToNext } : null
    );
  };

  const fetchAndDraw = async (coords) => {
    if (!token || !mapRef.current) return;
    const res = await fetchRoute(token, coords);
    if (res) drawRoute(res);
  };

  // Snap a raw fix to the drawn route (cheap, client-side) when no map-match is due.
  const cheapSnap = (lng, lat, moveBearing) => {
    const data = routeDataRef.current;
    if (data && data.features?.length) {
      const proj = projectOnRoute(data.features, lng, lat);
      if (proj.dist < 80) {
        const f = data.features[proj.fi];
        const c = f.geometry.coordinates;
        const segB =
          proj.si < c.length - 1
            ? bearing(c[proj.si][0], c[proj.si][1], c[proj.si + 1][0], c[proj.si + 1][1])
            : null;
        return { lng: proj.x, lat: proj.y, bearing: segB ?? moveBearing ?? headingRef.current };
      }
    }
    return { lng, lat, bearing: moveBearing ?? headingRef.current };
  };

  const updateProgress = () => {
    const map = mapRef.current;
    const data = routeDataRef.current;
    const disp = displayRef.current;
    if (!map || !disp) return;
    const nav = (stopsRef.current || []).length > 0;

    // Arrival check to the current (first) stop
    const firstStop = (stopsRef.current || [])[0];
    if (firstStop && nav) {
      const d = haversineM(disp.lat, disp.lng, firstStop.lat, firstStop.lng);
      const isArrived = d < ARRIVE_M;
      if (isArrived !== arrivedRef.current) {
        arrivedRef.current = isArrived;
        setArrived(isArrived);
      }
      if (isArrived) {
        if (remainingSrcRef.current)
          remainingSrcRef.current.setData({ type: "FeatureCollection", features: [] });
        if (traveledSrcRef.current)
          traveledSrcRef.current.setData({ type: "FeatureCollection", features: [] });
        const info = {
          steps: [
            {
              maneuver: {
                instruction: `You've arrived${firstStop.type === "pickup" ? " at pickup" : ""}`,
                type: "arrive",
              },
              distance: 0,
            },
          ],
          duration: 0,
          distance: 0,
        };
        onProgress?.(info);
        return;
      }
    }

    if (!nav || !data) {
      onProgress?.(null);
      return;
    }

    const proj = projectOnRoute(data.features, disp.lng, disp.lat);
    if (proj.dist > 250 && Date.now() - lastDevEmitRef.current > 10000) {
      lastDevEmitRef.current = Date.now();
      onDeviationRef.current?.(Math.round(proj.dist));
    }
    const { traveledCoords, remainingFeatures } = splitRoute(data.features, proj);
    if (remainingSrcRef.current)
      remainingSrcRef.current.setData({ type: "FeatureCollection", features: remainingFeatures });
    if (traveledSrcRef.current)
      traveledSrcRef.current.setData({
        type: "FeatureCollection",
        features:
          traveledCoords.length >= 2
            ? [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: traveledCoords } }]
            : [],
      });

    let traveledM = 0;
    for (let i = 0; i < traveledCoords.length - 1; i++) {
      traveledM += haversineM(traveledCoords[i][1], traveledCoords[i][0], traveledCoords[i + 1][1], traveledCoords[i + 1][0]);
    }
    const totalM = data.distance || 0;
    const remainM = Math.max(0, totalM - traveledM);

    let cum = 0;
    const steps = data.steps || [];
    let curStep = null;
    let distToTurn = null;
    for (const s of steps) {
      cum += s.distance || 0;
      if (cum > traveledM + 5) {
        curStep = s;
        distToTurn = cum - traveledM;
        break;
      }
    }
    if (!curStep && steps.length) {
      curStep = steps[steps.length - 1];
      distToTurn = 0;
    }
    const etaRemain = data.duration ? Math.max(0, data.duration * (remainM / (totalM || 1))) : null;

    onProgress?.({
      steps: curStep ? [{ maneuver: curStep.maneuver, distance: distToTurn }] : [],
      duration: etaRemain,
      distance: remainM,
    });

    // Off-route reroute (throttled)
    if (proj.dist > REROUTE_THRESHOLD_M && Date.now() - lastRerouteRef.current > REROUTE_COOLDOWN_MS) {
      lastRerouteRef.current = Date.now();
      const coords = [[disp.lng, disp.lat], ...(stopsRef.current || []).map((s) => [s.lng, s.lat])];
      fetchAndDraw(coords);
    }
  };

  const stepFrame = () => {
    const map = mapRef.current;
    if (!map) return;
    const disp = displayRef.current;
    const tgt = targetRef.current;
    if (disp && tgt) {
      const k = 0.14;
      disp.lng += (tgt.lng - disp.lng) * k;
      disp.lat += (tgt.lat - disp.lat) * k;
      if (tgt.bearing != null) {
        let db = tgt.bearing - (disp.bearing ?? 0);
        while (db > 180) db -= 360;
        while (db < -180) db += 360;
        disp.bearing = ((disp.bearing ?? 0) + db * 0.18 + 360) % 360;
      }
      if (puckRef.current) {
        puckRef.current.setLngLat([disp.lng, disp.lat]);
        if (disp.bearing != null) puckRef.current.setRotation(disp.bearing);
      }
      if (pulseRef.current) pulseRef.current.setLngLat([disp.lng, disp.lat]);

      if (followingRef.current) {
        const nav = (stopsRef.current || []).length > 0;
        if (nav) {
          map.jumpTo({
            center: offsetForward(disp.lng, disp.lat, disp.bearing || 0, FOLLOW_OFFSET_M),
            bearing: disp.bearing || 0,
            pitch: 60,
            zoom: 17,
          });
        } else {
          map.jumpTo({ center: [disp.lng, disp.lat], bearing: 0, pitch: 0, zoom: 15 });
        }
      }
    }
    const now = performance.now();
    if (now - lastProgRef.current > PROGRESS_INTERVAL_MS) {
      lastProgRef.current = now;
      updateProgress();
    }
  };

  const recenter = () => {
    followingRef.current = true;
    setShowRecenter(false);
    const map = mapRef.current;
    const disp = displayRef.current;
    if (!map || !disp) return;
    const nav = (stopsRef.current || []).length > 0;
    if (nav) {
      map.easeTo({
        center: offsetForward(disp.lng, disp.lat, disp.bearing || 0, FOLLOW_OFFSET_M),
        bearing: disp.bearing || 0,
        pitch: 60,
        zoom: 17,
        duration: 500,
      });
    } else {
      map.easeTo({ center: [disp.lng, disp.lat], bearing: 0, pitch: 0, zoom: 15, duration: 500 });
    }
  };

  // Init map + layers + rAF loop (once)
  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = token;
    const startLng = driverLng ?? -73.9851;
    const startLat = driverLat ?? 40.7589;
    displayRef.current = { lng: startLng, lat: startLat, bearing: 0 };
    targetRef.current = { lng: startLng, lat: startLat, bearing: 0 };

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: pickStyle(),
      center: [startLng, startLat],
      zoom: 14,
      pitch: 0,
      bearing: 0,
    });
    mapRef.current = map;

    map.on("load", () => {
      map.addSource("route-remaining", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addSource("route-traveled", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "route-glow",
        type: "line",
        source: "route-remaining",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#FF6B2C", "line-width": 22, "line-opacity": 0.2, "line-blur": 6 },
      });
      map.addLayer({
        id: "route-casing",
        type: "line",
        source: "route-remaining",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#ffffff", "line-width": 12, "line-opacity": 0.92 },
      });
      map.addLayer({
        id: "route-core",
        type: "line",
        source: "route-remaining",
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
      map.addLayer({
        id: "route-traveled",
        type: "line",
        source: "route-traveled",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#5a5a66", "line-width": 6, "line-opacity": 0.75 },
      });
      remainingSrcRef.current = map.getSource("route-remaining");
      traveledSrcRef.current = map.getSource("route-traveled");

      puckRef.current = new mapboxgl.Marker({ element: makePuckEl(), rotationAlignment: "map" })
        .setLngLat([startLng, startLat])
        .addTo(map);

      const cur = stopsRef.current || [];
      if (cur.length)
        fetchAndDraw([
          [driverLng ?? 0, driverLat ?? 0],
          ...cur.map((s) => [s.lng, s.lat]),
        ]);
    });

    map.on("dragstart", () => {
      followingRef.current = false;
      setShowRecenter(true);
    });

    const loop = () => {
      stepFrame();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      map.remove();
      mapRef.current = null;
      puckRef.current = null;
      pulseRef.current = null;
      remainingSrcRef.current = null;
      traveledSrcRef.current = null;
      stopMarkersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Process each raw GPS fix → smooth target (road-snapped via map matching or route projection)
  useEffect(() => {
    if (driverLng == null || driverLat == null) return;
    const prev = prevPosRef.current;
    let moveBearing = null;
    let moved = 0;
    if (prev) {
      moved = haversineM(prev.lat, prev.lng, driverLat, driverLng);
      if (moved > 6) moveBearing = bearing(prev.lng, prev.lat, driverLng, driverLat);
    }
    prevPosRef.current = { lng: driverLng, lat: driverLat };
    fixBufRef.current.push([driverLng, driverLat]);
    if (fixBufRef.current.length > 12) fixBufRef.current.shift();

    const nav = (stopsRef.current || []).length > 0;
    const now = Date.now();

    const applyTarget = (lng, lat, br) => {
      const b = br != null ? br : moveBearing ?? headingRef.current ?? 0;
      targetRef.current = { lng, lat, bearing: b };
      if (br != null) headingRef.current = br;
      else if (moveBearing != null) headingRef.current = moveBearing;
    };

    if (nav && now - lastMatchRef.current > MATCH_INTERVAL_MS && moved > MATCH_MIN_MOVE_M && fixBufRef.current.length >= 2) {
      lastMatchRef.current = now;
      const snap = cheapSnap(driverLng, driverLat, moveBearing);
      applyTarget(snap.lng, snap.lat, snap.bearing); // immediate cheap snap
      mapMatch(token, fixBufRef.current.slice())
        .then((m) => {
          if (m) applyTarget(m.lng, m.lat, m.bearing ?? headingRef.current);
        })
        .catch(() => {});
    } else if (nav) {
      const snap = cheapSnap(driverLng, driverLat, moveBearing);
      applyTarget(snap.lng, snap.lat, snap.bearing);
    } else {
      applyTarget(driverLng, driverLat, moveBearing);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverLng, driverLat]);

  // Fetch / clear route when the stop sequence changes
  useEffect(() => {
    if (!token || !mapRef.current) return;
    arrivedRef.current = false;
    setArrived(false);
    const cur = stopsRef.current || [];
    if (!cur.length) {
      drawRoute(null);
      return;
    }
    const origin = [driverLng ?? displayRef.current?.lng ?? 0, driverLat ?? displayRef.current?.lat ?? 0];
    fetchAndDraw([origin, ...cur.map((s) => [s.lng, s.lat])]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopsKey, token]);

  // Stop markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    stopMarkersRef.current.forEach((m) => m.remove());
    stopMarkersRef.current = [];
    (stops || []).forEach((s, i) => {
      const m = new mapboxgl.Marker({ element: makeStopEl(i + 1, s.type) })
        .setLngLat([s.lng, s.lat])
        .addTo(map);
      stopMarkersRef.current.push(m);
    });
  }, [stopsKey]);

  // Pulse halo only while navigating
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (navigating) {
      if (!pulseRef.current) {
        const el = document.createElement("div");
        el.className = "driver-pulse";
        el.innerHTML = '<div class="driver-pulse-ring"></div><div class="driver-pulse-ring driver-pulse-ring--2"></div>';
        pulseRef.current = new mapboxgl.Marker(el)
          .setLngLat([displayRef.current?.lng || 0, displayRef.current?.lat || 0])
          .addTo(map);
      }
    } else if (pulseRef.current) {
      pulseRef.current.remove();
      pulseRef.current = null;
    }
  }, [navigating]);

  useImperativeHandle(ref, () => ({
    recenter,
    follow: recenter,
  }));

  return (
    <div className="relative w-full h-full min-h-[300px] overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
      {showRecenter && (
        <button
          onClick={recenter}
          className="absolute right-3 bottom-28 z-20 w-11 h-11 rounded-full bg-card/95 backdrop-blur border border-border shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Recenter map"
        >
          <LocateFixed className="w-5 h-5 text-primary" />
        </button>
      )}
      {arrived && (
        <div className="absolute top-20 inset-x-3 z-20 flex items-center gap-2.5 bg-primary text-primary-foreground rounded-2xl px-4 py-3 shadow-lg">
          <LocateFixed className="w-5 h-5 shrink-0" />
          <p className="text-sm font-semibold">You've arrived — confirm in the sheet below.</p>
        </div>
      )}
    </div>
  );
});

export default DriverNavMap;