import React, { useEffect, useRef, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { getUserLocation, haversineKm } from "@/lib/distance";
import DriverLayout from "@/components/DriverLayout";
import DriverOnboarding from "@/components/driver/DriverOnboarding";
import AvailableDeliveries from "@/components/driver/AvailableDeliveries";
import ActiveDeliveryCard from "@/components/driver/ActiveDeliveryCard";
import DriverStats from "@/components/driver/DriverStats";
import DriverStatsOverview from "@/components/driver/DriverStatsOverview";
import DirectionsBanner from "@/components/driver/DirectionsBanner";
import StepsList from "@/components/driver/StepsList";
import OpenInMaps from "@/components/driver/OpenInMaps";
import CollapsibleSheet from "@/components/driver/CollapsibleSheet";
import MapboxMap from "@/components/MapboxMap";
import { buildStops } from "@/lib/routeOptimizer";
import StopList from "@/components/driver/StopList";
import PickupProof from "@/components/driver/PickupProof";
import DeliveryProof from "@/components/driver/DeliveryProof";
import { Loader2, ChevronDown, ChevronUp, Route as RouteIcon, LocateFixed, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceNav } from "@/lib/useVoiceNav";
import { toast } from "react-hot-toast";

export default function DriverDashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState({});
  const [location, setLocation] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [showSteps, setShowSteps] = useState(false);
  const [sheetView, setSheetView] = useState("orders");
  const [proof, setProof] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const mapRef = useRef(null);

  const loadProfile = useCallback(async (u) => {
    const profs = await base44.entities.DriverProfile.filter({});
    const mine = profs.find((p) => p.created_by_id === u.id);
    setProfile(mine || null);
    return mine || null;
  }, []);

  const loadOrders = useCallback(async (u) => {
    const all = await base44.entities.Order.filter({});
    const mine = all.filter((o) => o.driver_id === u.id && ["confirmed", "preparing", "picked_up"].includes(o.status));
    const available = all.filter((o) => !o.driver_id && ["confirmed", "preparing"].includes(o.status));
    setOrders([...mine, ...available]);

    const restIds = [...new Set(all.map((o) => o.restaurant_id).filter(Boolean))];
    if (restIds.length) {
      const rests = await Promise.all(restIds.map((id) => base44.entities.Restaurant.get(id).catch(() => null)));
      const map = {};
      rests.forEach((r, i) => {
        if (r) map[restIds[i]] = r;
      });
      setRestaurants(map);
    }
  }, []);

  useEffect(() => {
    let u;
    (async () => {
      try {
        u = await base44.auth.me();
        setUser(u);
        await loadProfile(u);
        await loadOrders(u);
        const t = await base44.functions.invoke("getMapboxToken", {});
        setToken(t.data?.token || null);
        getUserLocation().then(setLocation);
      } catch {
        toast.error("Failed to load driver dashboard");
      } finally {
        setLoading(false);
      }
    })();
    const unsub = base44.entities.Order.subscribe(() => {
      if (u) loadOrders(u);
    });
    return unsub;
  }, []);

  // Instant in-app alert when a new delivery is assigned — routes the driver to the dispatch map
  useEffect(() => {
    if (!user?.id) return;
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.type !== "create") return;
      const n = event.data;
      if (!n || n.user_id !== user.id || n.type !== "order_assigned") return;
      toast(
        (t) => (
          <div className="flex items-center gap-3 pr-1">
            <div className="min-w-0">
              <p className="text-sm font-semibold">New delivery assigned</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
            </div>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                mapRef.current?.follow();
              }}
              className="ml-auto shrink-0 text-xs font-semibold text-primary px-2 py-1.5 rounded-lg bg-primary/15"
            >
              Open map
            </button>
          </div>
        ),
        { duration: 8000 }
      );
    });
    return unsub;
  }, [user?.id]);

  // Real-time GPS tracking — continuous fixes for the driver's own map, with
  // throttled DB writes so customers see near-real-time movement on tracking.
  const lastPersistRef = useRef(0);
  useEffect(() => {
    if (!profile) return;
    if (!navigator.geolocation?.watchPosition) {
      const id = setInterval(() => getUserLocation().then(setLocation), 10000);
      return () => clearInterval(id);
    }
    const watch = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        const now = Date.now();
        if (now - lastPersistRef.current >= 6000) {
          lastPersistRef.current = now;
          base44.entities.DriverProfile
            .update(profile.id, { latitude: loc.lat, longitude: loc.lng })
            .catch(() => {});
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [profile?.id]);

  const acceptOrder = async (order) => {
    if (!profile?.is_approved) {
      toast.error("Your account is pending approval");
      return;
    }
    setBusy(true);
    try {
      const pickup_code = String(Math.floor(1000 + Math.random() * 9000));
      const delivery_pin = String(Math.floor(1000 + Math.random() * 9000));
      await base44.entities.Order.update(order.id, {
        driver_id: user.id,
        status: "preparing",
        pickup_code,
        delivery_pin,
      });
      toast.success("Delivery accepted");
      await loadOrders(user);
    } catch {
      toast.error("Failed to accept delivery");
    } finally {
      setBusy(false);
    }
  };

  const confirmPickup = async (order, code) => {
    if (code !== order.pickup_code) {
      toast.error("Incorrect pickup code");
      return;
    }
    setBusy(true);
    try {
      await base44.functions.invoke("notifyOrderStatus", { order_id: order.id, status: "picked_up" });
      await base44.entities.Order.update(order.id, {
        pickup_confirmed: true,
        pickup_confirmed_at: new Date().toISOString(),
      });
      toast.success("Pickup confirmed");
      setProof(null);
      await loadOrders(user);
    } catch {
      toast.error("Failed to confirm pickup");
    } finally {
      setBusy(false);
    }
  };

  const confirmDelivery = async (order, pin, photoUrl) => {
    if (pin !== order.delivery_pin) {
      toast.error("Incorrect delivery PIN");
      return;
    }
    setBusy(true);
    try {
      await base44.functions.invoke("notifyOrderStatus", { order_id: order.id, status: "delivered" });
      await base44.entities.Order.update(order.id, {
        delivery_proof_url: photoUrl || null,
        delivered_at: new Date().toISOString(),
      });
      await base44.entities.DriverProfile.update(profile.id, {
        total_deliveries: (profile.total_deliveries || 0) + 1,
        total_earnings: (profile.total_earnings || 0) + (order.delivery_fee || 2.99),
      });
      setProfile((p) => ({
        ...p,
        total_deliveries: (p.total_deliveries || 0) + 1,
        total_earnings: (p.total_earnings || 0) + (order.delivery_fee || 2.99),
      }));
      toast.success("Delivery complete!");
      setRouteInfo(null);
      setShowSteps(false);
      setProof(null);
      await loadOrders(user);
    } catch {
      toast.error("Failed to complete delivery");
    } finally {
      setBusy(false);
    }
  };

  const activeOrders = orders.filter(
    (o) => user && o.driver_id === user.id && ["confirmed", "preparing", "picked_up"].includes(o.status)
  );
  const inDelivery = activeOrders.length > 0;
  useVoiceNav({ routeInfo, enabled: voiceEnabled && inDelivery });
  const stops = location ? buildStops(location.lat, location.lng, activeOrders, restaurants) : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <DriverLayout>
        <DriverOnboarding userId={user?.id} onCreated={(p) => setProfile(p)} />
      </DriverLayout>
    );
  }

  const currentStop = stops[0] || null;
  const currentRestaurant = currentStop ? restaurants[currentStop.order.restaurant_id] : null;

  const NEARBY_MI = 15;
  const rawAvailable = orders.filter((o) => !o.driver_id && ["confirmed", "preparing"].includes(o.status));
  const available = rawAvailable
    .map((o) => {
      const r = restaurants[o.restaurant_id];
      const radiusMi = r?.delivery_radius_km ? r.delivery_radius_km * 0.621371 : NEARBY_MI;
      const km =
        location && r?.latitude != null ? haversineKm(location.lat, location.lng, r.latitude, r.longitude) : null;
      const mi = km == null ? null : km * 0.621371;
      return { order: o, mi, inArea: mi == null ? true : mi <= radiusMi };
    })
    .filter((e) => e.inArea)
    .sort((a, b) => (a.mi == null ? 1 : b.mi == null ? -1 : a.mi - b.mi))
    .map((e) => e.order);

  return (
    <DriverLayout>
      <div className="relative w-full h-[calc(100dvh-4rem)] overflow-hidden">
        {/* Full-screen map */}
        <div className="absolute inset-0">
          {token ? (
            <MapboxMap
              ref={mapRef}
              token={token}
              driverLng={location?.lng}
              driverLat={location?.lat}
              stops={stops}
              onRouteInfo={setRouteInfo}
              follow={inDelivery}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}
          <button
            onClick={() => mapRef.current?.recenter()}
            className="absolute right-3 bottom-28 z-10 w-10 h-10 rounded-full bg-card/95 backdrop-blur border border-border shadow-lg flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Recenter map"
          >
            <LocateFixed className="w-5 h-5 text-primary" />
          </button>
          <button
            onClick={() => setVoiceEnabled((v) => !v)}
            className={`absolute right-3 bottom-40 z-10 w-10 h-10 rounded-full backdrop-blur border shadow-lg flex items-center justify-center active:scale-95 transition-transform ${
              voiceEnabled
                ? "bg-primary/20 border-primary/40 text-primary"
                : "bg-card/95 border-border text-muted-foreground"
            }`}
            aria-label={voiceEnabled ? "Mute voice navigation" : "Enable voice navigation"}
          >
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        {/* Top floating stats + directions banner */}
        <div className="absolute top-0 inset-x-0 p-3 z-10 bg-gradient-to-b from-background/85 to-transparent pb-8 space-y-2">
          <DriverStats statsOnly profile={profile} />
          {inDelivery && stops.length > 0 && <DirectionsBanner routeInfo={routeInfo} />}
        </div>

        {/* Collapsible bottom sheet — drag the handle down to reveal the full map */}
        <CollapsibleSheet defaultSnap={1}>
          {inDelivery ? (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Route · {stops.length} stop{stops.length !== 1 ? "s" : ""}
              </h2>
              <StopList stops={stops} activeIndex={0} restaurants={restaurants} />
              {currentStop && (
                <div className="mt-3">
                  <ActiveDeliveryCard
                    order={currentStop.order}
                    restaurant={currentRestaurant}
                    onPickup={() => setProof({ type: "pickup", order: currentStop.order })}
                    onDeliver={() => setProof({ type: "dropoff", order: currentStop.order })}
                    busy={busy}
                  />
                </div>
              )}
              {routeInfo?.steps?.length > 0 && (
                <>
                  <button
                    onClick={() => setShowSteps((s) => !s)}
                    className="w-full mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-primary py-2"
                  >
                    <RouteIcon className="w-3.5 h-3.5" />
                    {showSteps ? "Hide" : "Turn-by-turn"} steps ({routeInfo.steps.length})
                    {showSteps ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  {showSteps && (
                    <div className="mt-1 bg-card border border-border rounded-2xl px-3">
                      <StepsList steps={routeInfo.steps} />
                    </div>
                  )}
                  <OpenInMaps
                    lat={currentStop?.lat}
                    lng={currentStop?.lng}
                    label={currentStop?.type === "pickup" ? "restaurant" : "customer"}
                  />
                </>
              )}
            </>
          ) : (
            <>
              <div className="flex gap-1 bg-card border border-border rounded-xl p-1 mb-3">
                <button
                  onClick={() => setSheetView("orders")}
                  className={cn(
                    "flex-1 h-9 rounded-lg text-xs font-semibold transition-colors",
                    sheetView === "orders" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  )}
                >
                  Orders {available.length > 0 && `(${available.length})`}
                </button>
                <button
                  onClick={() => setSheetView("stats")}
                  className={cn(
                    "flex-1 h-9 rounded-lg text-xs font-semibold transition-colors",
                    sheetView === "stats" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  )}
                >
                  My Stats
                </button>
              </div>
              {sheetView === "stats" ? (
                <DriverStatsOverview profile={profile} user={user} />
              ) : (
                <>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    Oncoming Orders {available.length > 0 && `(${available.length})`}
                  </h2>
                  <AvailableDeliveries orders={available} restaurants={restaurants} onAccept={acceptOrder} busy={busy} />
                </>
              )}
            </>
          )}
        </CollapsibleSheet>

        {proof?.type === "pickup" && (
          <PickupProof order={proof.order} onClose={() => setProof(null)} onConfirm={confirmPickup} busy={busy} />
        )}
        {proof?.type === "dropoff" && (
          <DeliveryProof order={proof.order} onClose={() => setProof(null)} onConfirm={confirmDelivery} busy={busy} />
        )}
      </div>
    </DriverLayout>
  );
}