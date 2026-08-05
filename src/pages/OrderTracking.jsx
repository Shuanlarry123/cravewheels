import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Check, Truck, Store, MessageCircle, Clock, MapPin, Star, Phone, Navigation } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { add3DBuildings, addSky, setWarmLight, makeTrafficLightEl, makeAnimatedDriverEl } from "@/lib/mapEnhancements";
import { haversineKm } from "@/lib/distance";
import { toast } from "react-hot-toast";

const STEPS = ["pending", "confirmed", "preparing", "picked_up", "delivered"];
const LABELS = {
  pending: "Order Placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  picked_up: "On the Way",
  delivered: "Delivered",
};

async function fetchRoute(token, fromLng, fromLat, toLng, toLat) {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${fromLng},${fromLat};${toLng},${toLat}?geometries=geojson&overview=full&steps=true&access_token=${token}`;
    const res = await fetch(url);
    const data = await res.json();
    const route = data.routes?.[0];
    return {
      coordinates: route?.geometry?.coordinates || [],
      steps: route?.legs?.[0]?.steps || [],
    };
  } catch {
    return null;
  }
}

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [driver, setDriver] = useState(null);

  const fetchDriver = async (driverUserId) => {
    try {
      const profs = await base44.entities.DriverProfile.filter({ created_by_id: driverUserId }, "-created_date", 1);
      setDriver(profs?.[0] || null);
    } catch {
      setDriver(null);
    }
  };
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const driverMarker = useRef(null);
  const destMarker = useRef(null);
  const routeSourceRef = useRef(null);
  const lastRouteAtRef = useRef(0);
  const trafficMarkersRef = useRef([]);

  useEffect(() => {
    (async () => {
      try {
        const o = await base44.entities.Order.get(id);
        setOrder(o);
        if (o.restaurant_id) base44.entities.Restaurant.get(o.restaurant_id).then(setRestaurant).catch(() => {});
        if (o.driver_id) fetchDriver(o.driver_id);
        const t = await base44.functions.invoke("getMapboxToken", {});
        setToken(t.data?.token || null);
      } finally {
        setLoading(false);
      }
    })();
    const unsub = base44.entities.Order.subscribe((event) => {
      if (event.data?.id === id) {
        base44.entities.Order.get(id).then((o) => {
          setOrder(o);
          if (o.driver_id) fetchDriver(o.driver_id);
        }).catch(() => {});
      }
    });
    return () => unsub();
  }, [id]);

  // Live driver updates once a driver is assigned
  useEffect(() => {
    if (!order?.driver_id) return;
    const unsub = base44.entities.DriverProfile.subscribe((event) => {
      if (event.data?.created_by_id === order.driver_id) {
        fetchDriver(order.driver_id);
      }
    });
    return () => unsub();
  }, [order?.driver_id]);

  // init map once token is available
  useEffect(() => {
    if (!token || !mapRef.current || mapInstance.current) return;
    mapboxgl.accessToken = token;
    const center =
      restaurant?.latitude != null
        ? [restaurant.longitude, restaurant.latitude]
        : order?.longitude != null
        ? [order.longitude, order.latitude]
        : [-72.67, 41.76];
    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center,
      zoom: 12,
    });
    map.on("load", () => {
      add3DBuildings(map);
      addSky(map);
      setWarmLight(map);
      map.addSource("route", { type: "geojson", data: { type: "Feature", geometry: { type: "LineString", coordinates: [] } } });
      map.addLayer({
        id: "route-glow",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#FF6B2C", "line-width": 20, "line-opacity": 0.22, "line-blur": 6 },
      });
      map.addLayer({
        id: "route-casing",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#ffffff", "line-width": 8, "line-opacity": 0.5 },
      });
      map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#FF6B2C", "line-width": 5, "line-opacity": 0.9 },
      });
      routeSourceRef.current = map.getSource("route");
    });
    map.setPitch(40);
    mapInstance.current = map;
    return () => {
      map.remove();
      mapInstance.current = null;
      driverMarker.current = null;
      destMarker.current = null;
      routeSourceRef.current = null;
      trafficMarkersRef.current = [];
    };
  }, [token]);

  // restaurant marker
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !restaurant || restaurant.latitude == null) return;
    new mapboxgl.Marker({ color: "#FF6B2C" })
      .setLngLat([restaurant.longitude, restaurant.latitude])
      .addTo(map);
  }, [restaurant, token]);

  // driver marker (live) + route to drop-off
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !driver || driver.latitude == null) return;
    if (driverMarker.current) {
      driverMarker.current.setLngLat([driver.longitude, driver.latitude]);
    } else {
      driverMarker.current = new mapboxgl.Marker({ element: makeAnimatedDriverEl() })
        .setLngLat([driver.longitude, driver.latitude])
        .addTo(map);
    }
    // destination marker (customer drop-off)
    if (order?.latitude != null) {
      if (!destMarker.current) {
        destMarker.current = new mapboxgl.Marker({ color: "#FF6B2C" }).setLngLat([order.longitude, order.latitude]).addTo(map);
      } else {
        destMarker.current.setLngLat([order.longitude, order.latitude]);
      }
    }
    // draw live route driver -> drop-off (throttled so the marker moves smoothly
    // without spamming the directions API)
    if (order?.latitude != null && token && Date.now() - lastRouteAtRef.current >= 10000) {
      lastRouteAtRef.current = Date.now();
      fetchRoute(token, driver.longitude, driver.latitude, order.longitude, order.latitude).then((res) => {
        if (!routeSourceRef.current || !res?.coordinates?.length) return;
        routeSourceRef.current.setData({ type: "Feature", geometry: { type: "LineString", coordinates: res.coordinates } });
        // Traffic-light markers at major intersections
        trafficMarkersRef.current.forEach((m) => m.remove());
        trafficMarkersRef.current = [];
        (res.steps || []).forEach((step) => {
          const loc = step.maneuver?.location;
          const type = step.maneuver?.type;
          if (!loc || type === "depart" || type === "arrive" || type === "continue") return;
          const marker = new mapboxgl.Marker({ element: makeTrafficLightEl() })
            .setLngLat(loc)
            .addTo(map);
          trafficMarkersRef.current.push(marker);
        });
        const bounds = res.coordinates.reduce((b, p) => b.extend(p), new mapboxgl.LngLatBounds(res.coordinates[0], res.coordinates[0]));
        bounds.extend([driver.longitude, driver.latitude]);
        bounds.extend([order.longitude, order.latitude]);
        map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
      });
    } else if (order?.latitude == null) {
      map.flyTo({ center: [driver.longitude, driver.latitude], zoom: 13 });
    }
  }, [driver, order, token]);

  if (loading)
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  if (!order) return <div className="p-8 text-center text-muted-foreground">Order not found.</div>;

  const cancelled = order.status === "cancelled";
  const currentStep = STEPS.indexOf(order.status);
  const isPickup = order.order_type === "pickup";

  let etaLabel = "";
  if (driver && driver.latitude != null) {
    const toDropoff = order.status === "picked_up";
    const tLat = toDropoff ? order.latitude : restaurant?.latitude;
    const tLng = toDropoff ? order.longitude : restaurant?.longitude;
    if (tLat != null && tLng != null) {
      const km = haversineKm(driver.latitude, driver.longitude, tLat, tLng);
      if (km != null) {
        const etaMin = Math.max(1, Math.round(km * 2.5 + 2));
        const mi = (km * 0.621371).toFixed(1);
        etaLabel = toDropoff ? `Arriving in ${etaMin} min · ${mi} mi away` : `Pickup in ${etaMin} min · ${mi} mi away`;
      }
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={() => navigate("/orders")} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Order Tracking</h1>
      </div>

      <div className="px-4">
        <div className="bg-card border border-border rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{order.restaurant_name}</p>
            <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-primary/15 text-primary flex items-center gap-1">
              {isPickup ? <Store className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
              {isPickup ? "Pickup" : "Delivery"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {order.delivery_address}
          </p>
          <p className="text-xs text-muted-foreground">{new Date(order.created_date).toLocaleString()}</p>
          {order.scheduled_for && (
            <p className="text-xs text-primary mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Scheduled for {new Date(order.scheduled_for).toLocaleString()}
            </p>
          )}
          {order.delivery_instructions && (
            <p className="text-xs text-muted-foreground mt-1">Drop-off: {order.delivery_instructions}</p>
          )}
        </div>

        {/* Live map */}
        <div className="relative rounded-2xl overflow-hidden border border-border mb-4 h-56">
          <div ref={mapRef} className="absolute inset-0" />
          {!order.driver_id && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
              <div className="text-center">
                <Truck className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">Waiting for a driver…</p>
              </div>
            </div>
          )}
        </div>

        {/* Driver info */}
        {order.driver_id && driver && (
          <div className="bg-card border border-border rounded-2xl p-4 mb-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-xl shrink-0">🛵</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{driver.legal_full_name || "Your driver"}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Star className="w-3 h-3 fill-primary text-primary" /> {(driver.rating || 5).toFixed(1)} · {driver.total_deliveries || 0} trips
              </p>
              <p className="text-xs text-muted-foreground truncate capitalize">
                {[driver.vehicle_make, driver.vehicle_model].filter(Boolean).join(" ") || `${driver.vehicle_type || "vehicle"}`}
                {driver.vehicle_color ? ` · ${driver.vehicle_color}` : ""}
                {driver.vehicle_year ? ` ${driver.vehicle_year}` : ""}
              </p>
              {etaLabel && <p className="text-xs text-primary mt-0.5 flex items-center gap-1"><Navigation className="w-3 h-3" /> {etaLabel}</p>}
            </div>
            <div className="flex gap-2">
              {driver.phone ? (
                <>
                  <a href={`tel:${driver.phone}`} className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center" aria-label="Call driver">
                    <Phone className="w-4 h-4" />
                  </a>
                  <a href={`sms:${driver.phone}`} className="h-10 px-4 rounded-xl bg-primary/15 text-primary text-sm font-semibold flex items-center gap-2" aria-label="Text driver">
                    <MessageCircle className="w-4 h-4" /> Text
                  </a>
                </>
              ) : (
                <span className="text-xs text-muted-foreground self-center">No phone available</span>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        {cancelled ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center text-red-400 font-medium">
            Order cancelled
          </div>
        ) : (
          <div className="relative pl-2">
            {STEPS.map((step, idx) => {
              const done = idx <= currentStep;
              const active = idx === currentStep;
              return (
                <div key={step} className="flex gap-4 pb-7 last:pb-0 relative">
                  {idx < STEPS.length - 1 && (
                    <div className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${done && idx < currentStep ? "bg-primary" : "bg-border"}`} />
                  )}
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      done ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
                    } ${active ? "ring-4 ring-primary/20" : ""}`}
                  >
                    {done ? <Check className="w-4 h-4" strokeWidth={3} /> : <span className="text-xs">{idx + 1}</span>}
                  </div>
                  <div className="pt-1">
                    <p className={`font-medium text-sm ${done ? "text-foreground" : "text-muted-foreground"}`}>
                      {isPickup && step === "picked_up" ? "Ready for Pickup" : LABELS[step]}
                    </p>
                    {active && <p className="text-xs text-primary mt-0.5">In progress...</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Items */}
        <div className="bg-card border border-border rounded-2xl p-4 mt-5">
          <p className="text-sm font-semibold mb-3">Items</p>
          <div className="space-y-2">
            {order.items?.map((i) => (
              <div key={i.menu_item_id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{i.quantity}× {i.name}</span>
                <span>${(i.price * i.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="h-px bg-border my-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>${(order.total_amount + (order.discount_amount || 0) + (order.delivery_fee || 0)).toFixed(2)}</span>
          </div>
          {(order.discount_amount || 0) > 0 && (
            <div className="flex justify-between text-sm text-primary">
              <span>Discount ({order.promo_code})</span>
              <span>−${(order.discount_amount || 0).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{isPickup ? "Pickup" : "Delivery Fee"}</span>
            <span>{isPickup ? "Free" : `$${(order.delivery_fee || 0).toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between font-bold mt-1">
            <span>Total</span>
            <span>${order.total_amount?.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}