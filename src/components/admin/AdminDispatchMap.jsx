import React, { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { Bike, Package, Navigation, X, Phone, MapPin, Store, List, Radar } from "lucide-react";

const ACTIVE = ["confirmed", "preparing", "picked_up"];

function makeMarker(color, emoji, onClick) {
  const el = document.createElement("div");
  el.style.cssText = `width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,.6);border:2px solid rgba(255,255,255,.9);cursor:pointer;`;
  const span = document.createElement("span");
  span.textContent = emoji;
  span.style.cssText = "transform:rotate(45deg);font-size:15px;line-height:1;";
  el.appendChild(span);
  if (onClick) el.onclick = onClick;
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
  const markersRef = useRef({});
  const [selectedId, setSelectedId] = useState(null);
  const [listOpen, setListOpen] = useState(true);

  const userById = useMemo(() => Object.fromEntries((users || []).map((u) => [u.id, u])), [users]);
  const restById = useMemo(() => Object.fromEntries((restaurants || []).map((r) => [r.id, r])), [restaurants]);

  const activeOrders = (orders || []).filter((o) => ACTIVE.includes(o.status));
  const activeDriverUserIds = useMemo(
    () => new Set(activeOrders.map((o) => o.driver_id).filter(Boolean)),
    [orders]
  );
  const orderForDriver = useMemo(() => {
    const m = {};
    activeOrders.forEach((o) => {
      if (o.driver_id) m[o.driver_id] = o;
    });
    return m;
  }, [orders]);

  const activeDrivers = useMemo(
    () =>
      (drivers || []).filter(
        (d) =>
          d.latitude != null &&
          d.longitude != null &&
          (d.is_available || activeDriverUserIds.has(d.created_by_id))
      ),
    [drivers, activeDriverUserIds]
  );

  const onDeliveryCount = activeDrivers.filter((d) => activeDriverUserIds.has(d.created_by_id)).length;
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
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const seen = new Set();

    const upsert = (key, lat, lng, color, emoji, onClick) => {
      if (lat == null || lng == null) return;
      seen.add(key);
      const ex = markersRef.current[key];
      if (ex) {
        ex.marker.setLngLat([lng, lat]);
      } else {
        const m = new mapboxgl.Marker(makeMarker(color, emoji, onClick)).setLngLat([lng, lat]).addTo(map);
        markersRef.current[key] = { marker: m };
      }
    };

    activeDrivers.forEach((d) => {
      const onDelivery = activeDriverUserIds.has(d.created_by_id);
      upsert(
        `d:${d.id}`,
        d.latitude,
        d.longitude,
        onDelivery ? "#3b82f6" : "#22c55e",
        onDelivery ? "📦" : "🛵",
        () => focusDriver(d.id)
      );
    });

    Object.keys(markersRef.current).forEach((k) => {
      if (!seen.has(k)) {
        markersRef.current[k].marker.remove();
        delete markersRef.current[k];
      }
    });
  }, [activeDrivers, activeDriverUserIds]);

  const focusDriver = (id) => {
    const d = activeDrivers.find((x) => x.id === id);
    if (!d) return;
    setSelectedId(id);
    setListOpen(false);
    mapRef.current?.flyTo({ center: [d.longitude, d.latitude], zoom: 14, speed: 1.2 });
  };

  const selected = activeDrivers.find((d) => d.id === selectedId) || null;
  const selOrder = selected ? orderForDriver[selected.created_by_id] : null;
  const selRest = selOrder ? restById[selOrder.restaurant_id] : null;
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
          <Stat icon={Radar} value={activeDrivers.length} label="Active drivers" color="#FF6B2C" />
        </div>
      </div>

      {/* List toggle */}
      <button
        onClick={() => setListOpen((o) => !o)}
        className="absolute top-24 left-3 z-10 h-9 px-3 rounded-xl bg-card/95 border border-border shadow-lg flex items-center gap-1.5 text-xs font-semibold"
      >
        <List className="w-4 h-4" /> {listOpen ? "Hide" : "Drivers"}
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
                style={{
                  background: activeDriverUserIds.has(selected.created_by_id) ? "#3b82f622" : "#22c55e22",
                }}
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

          {selOrder ? (
            <div className="mt-2 bg-background rounded-lg p-2 space-y-1">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                Active order · {selOrder.status}
              </p>
              <p className="text-xs flex items-center gap-1 truncate">
                <Store className="w-3 h-3 shrink-0 text-primary" />
                {selRest?.name || selOrder.restaurant_name || "—"}
              </p>
              <p className="text-[11px] flex items-start gap-1 text-muted-foreground">
                <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                <span className="truncate">{selOrder.delivery_address || "—"}</span>
              </p>
              {selOrder.customer_phone && (
                <a
                  href={`tel:${selOrder.customer_phone}`}
                  className="text-[11px] flex items-center gap-1 text-primary"
                >
                  <Phone className="w-3 h-3" /> {selOrder.customer_phone}
                </a>
              )}
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-muted-foreground">
              No active order assigned. Ready for dispatch.
            </p>
          )}
        </div>
      )}

      <div className="absolute bottom-3 right-3 z-10 bg-card/90 border border-border rounded-xl p-2 space-y-1 text-[11px] pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full" style={{ background: "#22c55e" }} />
          <span className="text-muted-foreground">Available driver</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full" style={{ background: "#3b82f6" }} />
          <span className="text-muted-foreground">On delivery</span>
        </div>
      </div>
    </div>
  );
}