import React, { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { Bike, Package, Navigation, X, Phone, MapPin, Store, List, Sparkles, LocateFixed, Flame } from "lucide-react";

const ACTIVE = ["confirmed", "preparing", "picked_up"];

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

function makeDriverMarker(color, emoji, onClick) {
  const el = document.createElement("div");
  el.style.cssText = `width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,.6);border:2px solid rgba(255,255,255,.9);cursor:pointer;`;
  const span = document.createElement("span");
  span.textContent = emoji;
  span.style.cssText = "transform:rotate(45deg);font-size:15px;line-height:1;";
  el.appendChild(span);
  if (onClick) el.onclick = onClick;
  return el;
}

function makePinMarker(emoji, bg, onClick) {
  const el = document.createElement("div");
  el.style.cssText = `width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${bg};display:flex;align-items:center;justify-content:center;border:2px solid rgba(255,255,255,.95);box-shadow:0 2px 8px rgba(0,0,0,.5);cursor:pointer;`;
  const span = document.createElement("span");
  span.textContent = emoji;
  span.style.cssText = "transform:rotate(45deg);font-size:13px;line-height:1;";
  el.appendChild(span);
  if (onClick) el.onclick = onClick;
  return el;
}

function makePulseMarker(emoji, color) {
  const el = document.createElement("div");
  el.style.cssText = "width:0;height:0;";
  el.innerHTML =
    `<div style="position:absolute;left:0;top:0;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:radial-gradient(circle,${color}66 0%,${color}22 45%,${color}00 70%);animation:driver-pulse 2.4s cubic-bezier(.2,.6,.3,1) infinite;"></div>` +
    `<div style="position:absolute;left:0;top:0;width:28px;height:28px;margin:-14px 0 0 -14px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.5);">${emoji}</div>`;
  return el;
}

function Stat({ icon: Icon, value, label, color }) {
  return (
    <div className="flex-1 bg-card/90 border border-border rounded-xl p-2 flex items-center gap-2">
      <Icon className="w-4 h-4 shrink-0" style={{ color }} />
      <div className="min-w-0">
        <p className="text-sm font-bold leading-none">{value}</p>
        <p className="text-[10px] text-muted-foreground truncate">{label}</p>
      </div>
    </div>
  );
}

export default function AdminDispatchMap({ data }) {
  const { token, drivers, orders, restaurants, users } = data;
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const driverMarkersRef = useRef({});
  const pickupMarkersRef = useRef({});
  const dropoffMarkersRef = useRef({});
  const newOrderMarkersRef = useRef({});
  const routeSourceRef = useRef(null);
  const heatSourceRef = useRef(null);
  const heatPointsRef = useRef({ type: "FeatureCollection", features: [] });
  const [selectedId, setSelectedId] = useState(null);
  const [listOpen, setListOpen] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);

  const userById = useMemo(() => Object.fromEntries((users || []).map((u) => [u.id, u])), [users]);
  const restById = useMemo(() => Object.fromEntries((restaurants || []).map((r) => [r.id, r])), [restaurants]);

  const activeOrders = (orders || []).filter((o) => ACTIVE.includes(o.status));

  const deliveries = useMemo(() => {
    return activeOrders
      .filter((o) => o.driver_id && restById[o.restaurant_id])
      .map((o) => {
        const drv = (drivers || []).find((d) => d.created_by_id === o.driver_id);
        if (!drv || drv.latitude == null || drv.longitude == null) return null;
        const pickedUp = o.status === "picked_up";
        const rest = restById[o.restaurant_id];
        const dest = pickedUp
          ? { lng: o.longitude, lat: o.latitude }
          : { lng: rest.longitude, lat: rest.latitude };
        if (dest.lng == null || dest.lat == null) return null;
        return { driver: drv, order: o, restaurant: rest, destLng: dest.lng, destLat: dest.lat, pickedUp };
      })
      .filter(Boolean);
  }, [orders, drivers, restById]);

  const newOrders = useMemo(
    () =>
      (orders || []).filter(
        (o) => !o.driver_id && ["confirmed", "preparing"].includes(o.status) && restById[o.restaurant_id]?.latitude != null
      ),
    [orders, restById]
  );

  // Order-volume heatmap points — customer delivery coords, falling back to
  // the restaurant location so every order contributes a point.
  const heatPoints = useMemo(() => {
    const feats = [];
    (orders || []).forEach((o) => {
      const rest = restById[o.restaurant_id];
      const lng = o.longitude != null ? o.longitude : rest?.longitude;
      const lat = o.latitude != null ? o.latitude : rest?.latitude;
      if (lng != null && lat != null) {
        feats.push({ type: "Feature", geometry: { type: "Point", coordinates: [lng, lat] } });
      }
    });
    return { type: "FeatureCollection", features: feats };
  }, [orders, restById]);
  heatPointsRef.current = heatPoints;

  const activeDriverUserIds = useMemo(() => new Set(deliveries.map((d) => d.driver.created_by_id)), [deliveries]);
  const activeDrivers = useMemo(
    () =>
      (drivers || []).filter(
        (d) => d.latitude != null && d.longitude != null && (d.is_available || activeDriverUserIds.has(d.created_by_id))
      ),
    [drivers, activeDriverUserIds]
  );

  const onDeliveryCount = deliveries.length;
  const availableCount = activeDrivers.length - onDeliveryCount;

  useEffect(() => {
    if (!token || !containerRef.current) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-72.9, 41.5],
      zoom: 9,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.on("load", () => {
      map.addSource("order-heatmap-src", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "order-heatmap",
        type: "heatmap",
        source: "order-heatmap-src",
        maxzoom: 15,
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["heatmap-density"], 0, 0, 0.5, 1.2],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 15, 3],
          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(0,0,0,0)",
            0.2, "#14b8a6",
            0.4, "#facc15",
            0.6, "#fb923c",
            0.8, "#ef4444",
            1, "#b91c1c",
          ],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 18, 15, 55],
          "heatmap-opacity": 0.7,
        },
      });
      heatSourceRef.current = map.getSource("order-heatmap-src");
      heatSourceRef.current?.setData(heatPointsRef.current);
      map.addSource("routes", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "routes-glow",
        type: "line",
        source: "routes",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#FF6B2C", "line-width": 14, "line-opacity": 0.2, "line-blur": 5 },
      });
      map.addLayer({
        id: "routes-casing",
        type: "line",
        source: "routes",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#ffffff", "line-width": 8, "line-opacity": 0.9 },
      });
      map.addLayer({
        id: "routes",
        type: "line",
        source: "routes",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#FF6B2C", "line-width": 4, "line-opacity": 1 },
      });
      routeSourceRef.current = map.getSource("routes");
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      driverMarkersRef.current = {};
      pickupMarkersRef.current = {};
      dropoffMarkersRef.current = {};
      newOrderMarkersRef.current = {};
      routeSourceRef.current = null;
      heatSourceRef.current = null;
    };
  }, [token]);

  // Driver markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const seen = new Set();
    activeDrivers.forEach((d) => {
      const key = `d:${d.id}`;
      seen.add(key);
      const onDelivery = activeDriverUserIds.has(d.created_by_id);
      const ex = driverMarkersRef.current[key];
      if (ex) ex.setLngLat([d.longitude, d.latitude]);
      else {
        const m = new mapboxgl.Marker(
          makeDriverMarker(onDelivery ? "#3b82f6" : "#22c55e", onDelivery ? "🛵" : "🛵", () => focusDriver(d.id))
        )
          .setLngLat([d.longitude, d.latitude])
          .addTo(map);
        driverMarkersRef.current[key] = m;
      }
    });
    Object.keys(driverMarkersRef.current).forEach((k) => {
      if (!seen.has(k)) {
        driverMarkersRef.current[k].remove();
        delete driverMarkersRef.current[k];
      }
    });
  }, [activeDrivers, activeDriverUserIds]);

  // Pickup / dropoff markers + new-order pulses
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const upsert = (store, key, lng, lat, el) => {
      const ex = store[key];
      if (ex) ex.setLngLat([lng, lat]);
      else store[key] = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map);
    };

    const seenPick = new Set();
    const seenDrop = new Set();
    deliveries.forEach((d) => {
      const r = d.restaurant;
      if (d.pickedUp) {
        const key = `drop:${d.order.id}`;
        seenDrop.add(key);
        upsert(dropoffMarkersRef.current, key, d.destLng, d.destLat, makePinMarker("🏠", "#a855f7", () => focusDriver(d.driver.id)));
        const pk = `pick:${d.order.id}`;
        if (pickupMarkersRef.current[pk]) {
          pickupMarkersRef.current[pk].remove();
          delete pickupMarkersRef.current[pk];
        }
      } else {
        const key = `pick:${d.order.id}`;
        seenPick.add(key);
        upsert(pickupMarkersRef.current, key, r.longitude, r.latitude, makePinMarker("🍽️", "#FF6B2C", () => focusDriver(d.driver.id)));
      }
    });
    Object.keys(pickupMarkersRef.current).forEach((k) => {
      if (!seenPick.has(k)) {
        pickupMarkersRef.current[k].remove();
        delete pickupMarkersRef.current[k];
      }
    });
    Object.keys(dropoffMarkersRef.current).forEach((k) => {
      if (!seenDrop.has(k)) {
        dropoffMarkersRef.current[k].remove();
        delete dropoffMarkersRef.current[k];
      }
    });

    // New (unassigned) orders — pulsing at the restaurant
    const seenNew = new Set();
    newOrders.forEach((o) => {
      const r = restById[o.restaurant_id];
      const key = `new:${o.id}`;
      seenNew.add(key);
      const ex = newOrderMarkersRef.current[key];
      if (ex) ex.setLngLat([r.longitude, r.latitude]);
      else newOrderMarkersRef.current[key] = new mapboxgl.Marker(makePulseMarker("🔔", "#22c55e")).setLngLat([r.longitude, r.latitude]).addTo(map);
    });
    Object.keys(newOrderMarkersRef.current).forEach((k) => {
      if (!seenNew.has(k)) {
        newOrderMarkersRef.current[k].remove();
        delete newOrderMarkersRef.current[k];
      }
    });
  }, [deliveries, newOrders, restById]);

  // Live routes for each active delivery
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !token) return;
    let active = true;
    const feats = [];
    Promise.all(
      deliveries.map(async (d) => {
        const coords = await fetchRoute(token, d.driver.longitude, d.driver.latitude, d.destLng, d.destLat);
        if (coords && active) {
          feats.push({
            type: "Feature",
            geometry: { type: "LineString", coordinates: coords },
            properties: { driverId: d.driver.id, status: d.order.status, pickedUp: d.pickedUp ? 1 : 0 },
          });
        }
      })
    ).then(() => {
      if (!active) return;
      routeSourceRef.current?.setData({ type: "FeatureCollection", features: feats });
    });
    return () => {
      active = false;
    };
  }, [deliveries, token]);

  // Push latest order-volume points into the heatmap source
  useEffect(() => {
    heatSourceRef.current?.setData(heatPoints);
  }, [heatPoints]);

  // Toggle heatmap layer visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("order-heatmap")) return;
    map.setLayoutProperty("order-heatmap", "visibility", showHeatmap ? "visible" : "none");
  }, [showHeatmap]);

  const recenter = () => {
    const map = mapRef.current;
    if (!map) return;
    if (selected) {
      map.flyTo({ center: [selected.longitude, selected.latitude], zoom: 14, speed: 1.2 });
      return;
    }
    const pts = [
      ...activeDrivers.map((d) => [d.longitude, d.latitude]),
      ...deliveries.map((d) => [d.destLng, d.destLat]),
      ...deliveries.filter((d) => !d.pickedUp).map((d) => [d.restaurant.longitude, d.restaurant.latitude]),
      ...newOrders.map((o) => {
        const r = restById[o.restaurant_id];
        return r ? [r.longitude, r.latitude] : null;
      }).filter(Boolean),
    ];
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.flyTo({ center: pts[0], zoom: 14, speed: 1.2 });
    } else {
      const lngs = pts.map((p) => p[0]);
      const lats = pts.map((p) => p[1]);
      map.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: 80, maxZoom: 15, duration: 800 }
      );
    }
  };

  const focusDriver = (id) => {
    const d = activeDrivers.find((x) => x.id === id);
    if (!d) return;
    setSelectedId(id);
    setListOpen(false);
    mapRef.current?.flyTo({ center: [d.longitude, d.latitude], zoom: 14, speed: 1.2 });
  };

  const selected = activeDrivers.find((d) => d.id === selectedId) || null;
  const selDelivery = selected ? deliveries.find((d) => d.driver.id === selected.id) : null;
  const selUser = selected ? userById[selected.created_by_id] : null;

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0">
        {token ? (
          <div ref={containerRef} className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
            Loading map…
          </div>
        )}
      </div>

      {/* Top stats */}
      <div className="absolute top-0 inset-x-0 z-10 p-3 bg-gradient-to-b from-background/90 to-transparent pb-8">
        <div className="flex gap-2">
          <Stat icon={Bike} value={availableCount} label="Available" color="#22c55e" />
          <Stat icon={Package} value={onDeliveryCount} label="On delivery" color="#3b82f6" />
          <Stat icon={Sparkles} value={newOrders.length} label="New orders" color="#22c55e" />
        </div>
      </div>

      {/* List toggle */}
      <button
        onClick={() => setListOpen((o) => !o)}
        className="absolute top-24 left-3 z-10 h-9 px-3 rounded-xl bg-card/95 border border-border shadow-lg flex items-center gap-1.5 text-xs font-semibold"
      >
        <List className="w-4 h-4" /> {listOpen ? "Hide" : "Drivers"}
      </button>

      <button
        onClick={() => setShowHeatmap((s) => !s)}
        className={`absolute top-24 right-3 z-10 h-9 px-3 rounded-xl border shadow-lg flex items-center gap-1.5 text-xs font-semibold ${
          showHeatmap ? "bg-primary/20 border-primary/40 text-primary" : "bg-card/95 border-border"
        }`}
      >
        <Flame className="w-4 h-4" /> {showHeatmap ? "Heatmap on" : "Heatmap"}
      </button>

      {/* Driver list panel */}
      {listOpen && (
        <div className="absolute top-36 left-3 right-3 sm:right-auto sm:w-72 z-10 bg-card/95 backdrop-blur border border-border rounded-2xl shadow-xl max-h-[55%] overflow-y-auto no-scrollbar">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground px-3 pt-3">
            Active drivers ({activeDrivers.length})
          </p>
          {activeDrivers.length === 0 ? (
            <p className="text-xs text-muted-foreground px-3 py-4">No active drivers right now.</p>
          ) : (
            <div className="p-2 space-y-1">
              {activeDrivers.map((d) => {
                const onDelivery = activeDriverUserIds.has(d.created_by_id);
                const u = userById[d.created_by_id];
                return (
                  <button
                    key={d.id}
                    onClick={() => focusDriver(d.id)}
                    className={`w-full flex items-center gap-2 p-2 rounded-xl text-left ${
                      selectedId === d.id ? "bg-primary/15" : "hover:bg-background"
                    }`}
                  >
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: onDelivery ? "#3b82f622" : "#22c55e22" }}
                    >
                      {onDelivery ? (
                        <Package className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Bike className="w-4 h-4 text-green-400" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate">
                        {d.legal_full_name || u?.full_name || "Driver"}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {onDelivery ? "On delivery" : "Available"} · ★ {(d.rating || 5).toFixed(1)}
                      </p>
                    </div>
                    <Navigation className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected driver detail */}
      {selected && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-80 z-10 bg-card/95 backdrop-blur border border-border rounded-2xl shadow-xl p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: activeDriverUserIds.has(selected.created_by_id) ? "#3b82f622" : "#22c55e22" }}
              >
                {activeDriverUserIds.has(selected.created_by_id) ? (
                  <Package className="w-4 h-4 text-blue-400" />
                ) : (
                  <Bike className="w-4 h-4 text-green-400" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {selected.legal_full_name || selUser?.full_name || "Driver"}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{selUser?.email}</p>
              </div>
            </div>
            <button onClick={() => setSelectedId(null)} className="p-1 -m-1 text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-background rounded-lg p-2">
              <p className="text-muted-foreground">Status</p>
              <p className="font-semibold">
                {activeDriverUserIds.has(selected.created_by_id) ? "On delivery" : "Available"}
              </p>
            </div>
            <div className="bg-background rounded-lg p-2">
              <p className="text-muted-foreground">Rating</p>
              <p className="font-semibold">★ {(selected.rating || 5).toFixed(1)}</p>
            </div>
          </div>

          {selDelivery ? (
            <div className="mt-2 bg-background rounded-lg p-2 space-y-1">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                {selDelivery.pickedUp ? "En route to customer" : "Heading to pickup"} · {selDelivery.order.status}
              </p>
              <p className="text-xs flex items-center gap-1 truncate">
                <Store className="w-3 h-3 shrink-0 text-primary" />
                {selDelivery.restaurant?.name || selDelivery.order.restaurant_name || "—"}
              </p>
              <p className="text-[11px] flex items-start gap-1 text-muted-foreground">
                <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                <span className="truncate">
                  {selDelivery.pickedUp ? selDelivery.order.delivery_address : selDelivery.restaurant?.address || "—"}
                </span>
              </p>
              {selDelivery.order.customer_phone && (
                <a href={`tel:${selDelivery.order.customer_phone}`} className="text-[11px] flex items-center gap-1 text-primary">
                  <Phone className="w-3 h-3" /> {selDelivery.order.customer_phone}
                </a>
              )}
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-muted-foreground">No active order assigned. Ready for dispatch.</p>
          )}
        </div>
      )}

      {/* Recenter button */}
      <button
        onClick={recenter}
        className="absolute right-3 bottom-24 z-20 w-10 h-10 rounded-full bg-card/95 backdrop-blur border border-border shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Recenter map"
      >
        <LocateFixed className="w-5 h-5 text-primary" />
      </button>

      {/* Legend */}
      <div className="absolute bottom-3 right-3 z-10 bg-card/90 border border-border rounded-xl p-2 space-y-1 text-[11px] pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full" style={{ background: "#22c55e" }} />
          <span className="text-muted-foreground">Available driver</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full" style={{ background: "#3b82f6" }} />
          <span className="text-muted-foreground">On delivery</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full" style={{ background: "#FF6B2C" }} />
          <span className="text-muted-foreground">Pickup (restaurant)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full" style={{ background: "#a855f7" }} />
          <span className="text-muted-foreground">Drop-off (customer)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full border-2 border-green-400" />
          <span className="text-muted-foreground">New order (unassigned)</span>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-border mt-1">
          <span
            className="w-4 h-4 rounded-full"
            style={{ background: "linear-gradient(90deg,#14b8a6,#facc15,#fb923c,#ef4444)" }}
          />
          <span className="text-muted-foreground">Order volume (heatmap)</span>
        </div>
      </div>
    </div>
  );
}