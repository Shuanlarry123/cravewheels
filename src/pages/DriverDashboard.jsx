import React, { useEffect, useRef, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { getUserLocation, haversineKm } from "@/lib/distance";
import DriverLayout from "@/components/DriverLayout";
import DriverOnboarding from "@/components/driver/DriverOnboarding";
import DispatchQueue from "@/components/driver/DispatchQueue";
import ActiveDeliveryCard from "@/components/driver/ActiveDeliveryCard";
import DriverStats from "@/components/driver/DriverStats";
import DriverStatsOverview from "@/components/driver/DriverStatsOverview";
import DirectionsBanner from "@/components/driver/DirectionsBanner";
import StepsList from "@/components/driver/StepsList";
import OpenInMaps from "@/components/driver/OpenInMaps";
import CollapsibleSheet from "@/components/driver/CollapsibleSheet";
import DriverNavMap from "@/components/driver/DriverNavMap";
import { buildStops, buildStopsOptimized } from "@/lib/routeOptimizer";
import StopList from "@/components/driver/StopList";
import BatchPickupList from "@/components/driver/BatchPickupList";
import DeliveryProof from "@/components/driver/DeliveryProof";
import RideRequestCard from "@/components/driver/RideRequestCard";
import { Loader2, ChevronDown, ChevronUp, Route as RouteIcon, Volume2, VolumeX } from "lucide-react";
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
  const [progress, setProgress] = useState(null);
  const [showSteps, setShowSteps] = useState(false);
  const [sheetView, setSheetView] = useState("orders");
  const [proof, setProof] = useState(null);
  const [rideRequest, setRideRequest] = useState(null);
  const [previewOrder, setPreviewOrder] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const mapRef = useRef(null);
  const offRouteSinceRef = useRef(null);
  const offRouteLoggedRef = useRef(null);
  const lastOffRouteOidRef = useRef(null);
  const activeOrders = orders.filter(
    (o) => user && o.driver_id === user.id && ["confirmed", "preparing", "picked_up"].includes(o.status)
  );
  const inDelivery = activeOrders.length > 0;

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
        const notifs = await base44.entities.Notification.filter({ read: false });
        const mineReqs = notifs.filter((n) => n.user_id === u.id && n.type === "ride_request");
        if (mineReqs.length) {
          setPendingRequests(mineReqs);
          setRideRequest((cur) => cur || mineReqs[mineReqs.length - 1]);
        }
        const t = await base44.functions.invoke("getMapboxToken", {});
        setToken(t.data?.token || null);
        getUserLocation().then(setLocation);
      } catch {
        toast.error("Failed to load driver dashboard");
      } finally {
        setLoading(false);
      }
    })();
    const unsub = base44.entities.Order.subscribe((event) => {
      if (u) loadOrders(u);
      const o = event.data;
      if (o && o.driver_id && o.driver_id !== u?.id) {
        setPendingRequests((prev) => prev.filter((r) => r.order_id !== o.id));
        setRideRequest((cur) => (cur && cur.order_id === o.id ? null : cur));
      }
    });
    return unsub;
  }, []);

  // Instant in-app alert when a new delivery is assigned — routes the driver to the dispatch map
  useEffect(() => {
    if (!user?.id) return;
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.type !== "create") return;
      const n = event.data;
      if (!n || n.user_id !== user.id) return;
      if (n.type === "ride_request") {
        setPendingRequests((prev) => (prev.some((r) => r.id === n.id) ? prev : [...prev, n]));
        setRideRequest((cur) => cur || n);
        return;
      }
      if (n.type !== "order_assigned") return;
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
          const payload = { latitude: loc.lat, longitude: loc.lng, last_heartbeat: new Date().toISOString() };
          const queueLoc = () => {
            try {
              localStorage.setItem("crave_loc_queue", JSON.stringify({ lat: loc.lat, lng: loc.lng }));
            } catch {}
          };
          if (!navigator.onLine) queueLoc();
          else base44.entities.DriverProfile.update(profile.id, payload).catch(queueLoc);
        }
      },
      () => {},
      inDelivery
        ? { enableHighAccuracy: true, maximumAge: 1500, timeout: 8000 }
        : { enableHighAccuracy: false, maximumAge: 15000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [profile?.id, inDelivery]);

  // Bootstrap idle state for online drivers created before the dispatch state machine
  useEffect(() => {
    if (!profile?.id || !profile.is_available) return;
    if (!profile.availability_status) {
      base44.entities.DriverProfile.update(profile.id, { availability_status: "online_idle" }).catch(() => {});
      setProfile((p) => (p ? { ...p, availability_status: "online_idle" } : p));
    }
  }, [profile?.id, profile?.is_available, profile?.availability_status]);

  // Heartbeat: ops reassigns drivers whose last_heartbeat goes stale
  useEffect(() => {
    if (!profile?.id || !profile.is_available) return;
    const tick = () =>
      base44.entities.DriverProfile.update(profile.id, { last_heartbeat: new Date().toISOString() }).catch(() => {});
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, [profile?.id, profile?.is_available]);

  // Graceful degradation: flush queued location pings once connectivity returns,
  // so a brief drop never freezes the rider's view or strands an active trip.
  const flushQueue = useCallback(() => {
    if (!profile?.id || !navigator.onLine) return;
    try {
      const raw = localStorage.getItem("crave_loc_queue");
      if (!raw) return;
      const { lat, lng } = JSON.parse(raw);
      base44.entities.DriverProfile
        .update(profile.id, { latitude: lat, longitude: lng, last_heartbeat: new Date().toISOString() })
        .then(() => localStorage.removeItem("crave_loc_queue"))
        .catch(() => {});
    } catch {}
  }, [profile?.id]);

  useEffect(() => {
    flushQueue();
    const onOnline = () => flushQueue();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [flushQueue]);

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
        state_changed_at: new Date().toISOString(),
      });
      setPreviewOrder(null);
      toast.success(activeOrders.length ? "Added to your trip" : "Delivery accepted");
      await loadOrders(user);
    } catch {
      toast.error("Failed to accept delivery");
    } finally {
      setBusy(false);
    }
  };

  const dismissActive = () => setRideRequest(null);

  const declineRequest = (notifId) => {
    if (notifId) base44.entities.Notification.update(notifId, { read: true }).catch(() => {});
    setPendingRequests((prev) => prev.filter((r) => r.id !== notifId));
    setRideRequest(null);
  };

  const handleRideAccepted = (order) => {
    toast.success("Ride accepted");
    setPendingRequests((prev) => {
      const match = prev.find((r) => r.order_id === order.id);
      if (match) base44.entities.Notification.update(match.id, { read: true }).catch(() => {});
      return prev.filter((r) => r.order_id !== order.id);
    });
    setRideRequest(null);
    loadOrders(user);
    setProfile((p) => (p ? { ...p, availability_status: "en_route" } : p));
  };

  const sendSOS = async () => {
    try {
      const active = activeOrders[0];
      await base44.entities.DispatchEvent.create({
        order_id: active?.id || null,
        actor_id: user.id,
        from_state: active?.status || "idle",
        to_state: "sos",
        detail: "Driver SOS / panic signal triggered",
        severity: "urgent",
      });
      toast.error("SOS sent to dispatch");
      try { navigator.vibrate?.([400, 200, 400, 200, 400]); } catch {}
    } catch {
      toast.error("Failed to send SOS");
    }
  };

  const driverCancel = async (order) => {
    if (!confirm("Release this ride? It will be re-dispatched to another driver.")) return;
    setBusy(true);
    try {
      await base44.functions.invoke("reassignRide", { order_id: order.id, reason: "driver_cancelled" });
      toast.success("Ride released");
      await loadOrders(user);
    } catch {
      toast.error("Failed to release ride");
    } finally {
      setBusy(false);
    }
  };

  // Off-route deviation: sustained >250m off the route line alerts ops (once per trip)
  const onDeviation = (distM) => {
    const oid = currentStop?.order?.id;
    if (!oid || !user?.id) return;
    if (lastOffRouteOidRef.current !== oid) {
      lastOffRouteOidRef.current = oid;
      offRouteSinceRef.current = null;
      offRouteLoggedRef.current = null;
    }
    if (offRouteLoggedRef.current === oid) return;
    if (!offRouteSinceRef.current) offRouteSinceRef.current = Date.now();
    if (Date.now() - offRouteSinceRef.current >= 8000) {
      offRouteLoggedRef.current = oid;
      base44.entities.DispatchEvent.create({
        order_id: oid, actor_id: user.id, from_state: "in_trip", to_state: "off_route",
        detail: `Driver deviated ~${distM}m off route`, severity: "warning",
      }).catch(() => {});
      toast("You're off route — dispatch notified");
    }
  };

  const confirmPickup = async (order) => {
    setBusy(true);
    try {
      await base44.functions.invoke("notifyOrderStatus", { order_id: order.id, status: "picked_up" });
      await base44.entities.Order.update(order.id, {
        pickup_confirmed: true,
        pickup_confirmed_at: new Date().toISOString(),
      });
      if (profile?.id) {
        base44.entities.DriverProfile.update(profile.id, { availability_status: "in_trip" }).catch(() => {});
        base44.entities.DispatchEvent.create({
          order_id: order.id, actor_id: user.id, from_state: "en_route", to_state: "in_trip",
          detail: "Pickup confirmed", severity: "info",
        }).catch(() => {});
      }
      setProfile((p) => (p ? { ...p, availability_status: "in_trip" } : p));
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
        availability_status: "online_idle",
      });
      base44.entities.DispatchEvent.create({
        order_id: order.id, actor_id: user.id, from_state: "in_trip", to_state: "completed",
        detail: "Delivery complete", severity: "info",
      }).catch(() => {});
      setProfile((p) => ({
        ...p,
        total_deliveries: (p.total_deliveries || 0) + 1,
        total_earnings: (p.total_earnings || 0) + (order.delivery_fee || 2.99),
        availability_status: "online_idle",
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

  useVoiceNav({ routeInfo: progress, enabled: voiceEnabled && inDelivery });
  const [stops, setStops] = useState([]);
  const activeKey = activeOrders.map((o) => `${o.id}:${o.status}:${o.pickup_confirmed ? 1 : 0}`).join("|");
  useEffect(() => {
    if (!location || !activeOrders.length) {
      setStops([]);
      return;
    }
    let alive = true;
    // Immediate haversine-based order so the UI never waits on the matrix call.
    setStops(buildStops(location.lat, location.lng, activeOrders, restaurants));
    if (token) {
      buildStopsOptimized(location.lat, location.lng, activeOrders, restaurants, token)
        .then((opt) => {
          if (alive && opt) setStops(opt);
        })
        .catch(() => {});
    }
    return () => {
      alive = false;
    };
  }, [location?.lat, location?.lng, activeKey, restaurants, token]);

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

  const activeRestaurantId = activeOrders[0]?.restaurant_id;
  const hasPendingPickup = activeOrders.some((o) => !o.pickup_confirmed && o.status !== "picked_up");
  const batchableOrders =
    hasPendingPickup && activeRestaurantId ? available.filter((o) => o.restaurant_id === activeRestaurantId) : [];

  const previewStops = (() => {
    if (!previewOrder || !location) return [];
    const rest = restaurants[previewOrder.restaurant_id];
    if (!rest || rest.latitude == null || rest.longitude == null) return [];
    const s = [
      { type: "pickup", order: previewOrder, lat: rest.latitude, lng: rest.longitude, label: rest.name || "Pickup" },
    ];
    if (previewOrder.latitude != null && previewOrder.longitude != null) {
      s.push({
        type: "dropoff",
        order: previewOrder,
        lat: previewOrder.latitude,
        lng: previewOrder.longitude,
        label: previewOrder.delivery_address || "Customer",
      });
    }
    return s;
  })();
  const mapStops = inDelivery ? stops : previewStops;

  return (
    <DriverLayout>
      <div className="relative w-full h-[calc(100dvh-4rem)] overflow-hidden">
        {/* Full-screen map */}
        <div className="absolute inset-0">
          {token ? (
            <DriverNavMap
              ref={mapRef}
              token={token}
              driverLng={location?.lng}
              driverLat={location?.lat}
              stops={mapStops}
              onRouteInfo={setRouteInfo}
              onProgress={setProgress}
              onDeviation={onDeviation}
              follow={inDelivery}
              preview={!inDelivery && !!previewOrder}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}
          <div className="absolute right-3 top-[calc(env(safe-area-inset-top)+8.5rem)] z-10 flex flex-col gap-2">
            <button
              onClick={sendSOS}
              className="w-10 h-10 rounded-full bg-red-600/90 border border-red-300/40 shadow-lg flex items-center justify-center active:scale-95 transition-transform backdrop-blur"
              aria-label="SOS panic"
            >
              <span className="text-white font-bold text-[10px]">SOS</span>
            </button>
            <button
              onClick={() => setVoiceEnabled((v) => !v)}
              className={`w-10 h-10 rounded-full backdrop-blur border shadow-lg flex items-center justify-center active:scale-95 transition-transform ${
                voiceEnabled
                  ? "bg-primary/20 border-primary/40 text-primary"
                  : "bg-card/95 border-border text-muted-foreground"
              }`}
              aria-label={voiceEnabled ? "Mute voice navigation" : "Enable voice navigation"}
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Top floating stats + directions banner */}
        <div className="absolute top-0 inset-x-0 pt-[calc(env(safe-area-inset-top)+0.75rem)] px-3 pb-8 z-10 bg-gradient-to-b from-background/70 to-transparent space-y-2">
          <DriverStats statsOnly profile={profile} />
          {inDelivery && stops.length > 0 && <DirectionsBanner routeInfo={progress || routeInfo} />}
        </div>

        {/* Collapsible bottom sheet — drag the handle down to reveal the full map */}
        <CollapsibleSheet defaultSnap={1}>
          {inDelivery ? (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                <span>Route · {stops.length} stop{stops.length !== 1 ? "s" : ""}</span>
                {activeOrders.length > 1 && (
                  <span className="normal-case text-primary bg-primary/15 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                    {activeOrders.length} batched
                  </span>
                )}
              </h2>
              <StopList stops={stops} activeIndex={0} restaurants={restaurants} />
              {batchableOrders.length > 0 && (
                <BatchPickupList
                  orders={batchableOrders}
                  restaurantName={currentRestaurant?.name || activeOrders[0]?.restaurant_name}
                  onAdd={acceptOrder}
                  busy={busy}
                />
              )}
              {currentStop && (
                <div className="mt-3">
                  <ActiveDeliveryCard
                    order={currentStop.order}
                    restaurant={currentRestaurant}
                    onPickup={() => confirmPickup(currentStop.order)}
                    onDeliver={() => setProof({ type: "dropoff", order: currentStop.order })}
                    busy={busy}
                  />
                  <button
                    onClick={() => driverCancel(currentStop.order)}
                    disabled={busy}
                    className="mt-2 w-full text-xs font-semibold text-destructive py-2 border border-destructive/30 rounded-xl"
                  >
                    Can't complete this ride
                  </button>
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
                    Dispatch Queue {available.length > 0 && `(${available.length})`}
                  </h2>
                  <DispatchQueue
                    orders={available}
                    restaurants={restaurants}
                    location={location}
                    onAccept={acceptOrder}
                    onPreview={(o) => setPreviewOrder((cur) => (cur?.id === o.id ? null : o))}
                    selectedId={previewOrder?.id}
                    busy={busy}
                  />
                </>
              )}
            </>
          )}
        </CollapsibleSheet>

        {proof?.type === "dropoff" && (
          <DeliveryProof order={proof.order} onClose={() => setProof(null)} onConfirm={confirmDelivery} busy={busy} />
        )}
        {!rideRequest && pendingRequests.length > 0 && (
          <button
            onClick={() => setRideRequest(pendingRequests[pendingRequests.length - 1])}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-primary text-primary-foreground pl-2 pr-4 py-2 rounded-full shadow-lg active:scale-95 transition-transform"
          >
            <span className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs font-bold">
              {pendingRequests.length}
            </span>
            <span className="text-sm font-semibold">
              Open ride request{pendingRequests.length > 1 ? "s" : ""}
            </span>
          </button>
        )}
        {rideRequest && (
          <RideRequestCard
            request={rideRequest}
            driverLocation={location}
            onAccepted={handleRideAccepted}
            onClose={dismissActive}
            onDecline={declineRequest}
          />
        )}
      </div>
    </DriverLayout>
  );
}