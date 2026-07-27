import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { getUserLocation } from "@/lib/distance";
import DriverLayout from "@/components/DriverLayout";
import DriverOnboarding from "@/components/driver/DriverOnboarding";
import AvailableDeliveries from "@/components/driver/AvailableDeliveries";
import ActiveDeliveryCard from "@/components/driver/ActiveDeliveryCard";
import DriverStats from "@/components/driver/DriverStats";
import DriverStatsOverview from "@/components/driver/DriverStatsOverview";
import DirectionsBanner from "@/components/driver/DirectionsBanner";
import StepsList from "@/components/driver/StepsList";
import MapboxMap from "@/components/MapboxMap";
import { Loader2, ChevronDown, ChevronUp, Route as RouteIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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

  const loadProfile = useCallback(async (u) => {
    const profs = await base44.entities.DriverProfile.filter({});
    const mine = profs.find((p) => p.created_by_id === u.id);
    setProfile(mine || null);
    return mine || null;
  }, []);

  const loadOrders = useCallback(async (u) => {
    const all = await base44.entities.Order.filter({});
    const mine = all.find((o) => o.driver_id === u.id && ["confirmed", "preparing", "picked_up"].includes(o.status));
    const available = all.filter((o) => !o.driver_id && ["confirmed", "preparing"].includes(o.status));
    setOrders(mine ? [mine, ...available] : available);

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

  useEffect(() => {
    if (!profile?.is_available) return;
    const id = setInterval(() => getUserLocation().then(setLocation), 15000);
    return () => clearInterval(id);
  }, [profile?.is_available]);

  const acceptOrder = async (order) => {
    if (!profile?.is_approved) {
      toast.error("Your account is pending approval");
      return;
    }
    setBusy(true);
    try {
      await base44.entities.Order.update(order.id, { driver_id: user.id, status: "preparing" });
      toast.success("Delivery accepted");
      await loadOrders(user);
    } catch {
      toast.error("Failed to accept delivery");
    } finally {
      setBusy(false);
    }
  };

  const markPickedUp = async (order) => {
    setBusy(true);
    try {
      await base44.functions.invoke("notifyOrderStatus", { order_id: order.id, status: "picked_up" });
      toast.success("Marked as picked up");
      await loadOrders(user);
    } catch {
      toast.error("Failed to update order");
    } finally {
      setBusy(false);
    }
  };

  const markDelivered = async (order) => {
    setBusy(true);
    try {
      await base44.functions.invoke("notifyOrderStatus", { order_id: order.id, status: "delivered" });
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
      await loadOrders(user);
    } catch {
      toast.error("Failed to complete delivery");
    } finally {
      setBusy(false);
    }
  };

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

  const myOrder = orders.find(
    (o) => o.driver_id === user.id && ["confirmed", "preparing", "picked_up"].includes(o.status)
  );
  const available = orders.filter((o) => !o.driver_id && ["confirmed", "preparing"].includes(o.status));
  const myRestaurant = myOrder ? restaurants[myOrder.restaurant_id] : null;
  const pickedUp = myOrder?.status === "picked_up";
  const destLng = myOrder ? (pickedUp ? myOrder.longitude : myRestaurant?.longitude) : undefined;
  const destLat = myOrder ? (pickedUp ? myOrder.latitude : myRestaurant?.latitude) : undefined;

  return (
    <DriverLayout>
      <div className="relative w-full h-[calc(100dvh-4rem)] overflow-hidden">
        {/* Full-screen map */}
        <div className="absolute inset-0">
          {token ? (
            <MapboxMap
              token={token}
              driverLng={location?.lng}
              driverLat={location?.lat}
              destLng={destLng}
              destLat={destLat}
              onRouteInfo={setRouteInfo}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}
        </div>

        {/* Top floating stats + directions banner */}
        <div className="absolute top-0 inset-x-0 p-3 z-10 bg-gradient-to-b from-background/85 to-transparent pb-8 space-y-2">
          <DriverStats statsOnly profile={profile} />
          {myOrder && destLng != null && <DirectionsBanner routeInfo={routeInfo} />}
        </div>

        {/* Bottom sheet with oncoming orders / active delivery */}
        <div className="absolute bottom-0 inset-x-0 z-10 bg-background rounded-t-3xl border-t border-border max-h-[55%] overflow-y-auto no-scrollbar">
          <div className="w-10 h-1 rounded-full bg-muted mx-auto mt-2 mb-1" />
          <div className="p-4 pt-1">
            {myOrder ? (
              <>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Active Delivery
                </h2>
                <ActiveDeliveryCard
                  order={myOrder}
                  restaurant={myRestaurant}
                  onPickup={() => markPickedUp(myOrder)}
                  onDeliver={() => markDelivered(myOrder)}
                  busy={busy}
                />
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
          </div>
        </div>
      </div>
    </DriverLayout>
  );
}