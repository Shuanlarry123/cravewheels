import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getUserLocation } from "@/lib/distance";
import DriverOnboarding from "@/components/driver/DriverOnboarding";
import DriverStats from "@/components/driver/DriverStats";
import AvailableDeliveries from "@/components/driver/AvailableDeliveries";
import CurrentDelivery from "@/components/driver/CurrentDelivery";
import { toast } from "react-hot-toast";

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState({});
  const [location, setLocation] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadProfile = useCallback(async (u) => {
    const profs = await base44.entities.DriverProfile.filter({});
    const mine = profs.find((p) => p.created_by_id === u.id);
    setProfile(mine || null);
    return mine || null;
  }, []);

  const loadOrders = useCallback(async (u) => {
    const all = await base44.entities.Order.filter({});
    const mine = all.find(
      (o) => o.driver_id === u.id && ["confirmed", "preparing", "picked_up"].includes(o.status)
    );
    const available = all.filter(
      (o) => !o.driver_id && ["confirmed", "preparing"].includes(o.status)
    );
    setOrders(mine ? [mine, ...available] : available);

    const restIds = [...new Set(all.map((o) => o.restaurant_id).filter(Boolean))];
    if (restIds.length) {
      const rests = await Promise.all(restIds.map((id) => base44.entities.Restaurant.get(id).catch(() => null)));
      const map = {};
      rests.forEach((r, i) => { if (r) map[restIds[i]] = r; });
      setRestaurants(map);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
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
      if (user) loadOrders(user);
    });
    return unsub;
  }, []);

  // refresh location periodically while online
  useEffect(() => {
    if (!profile?.is_available) return;
    const id = setInterval(() => getUserLocation().then(setLocation), 15000);
    return () => clearInterval(id);
  }, [profile?.is_available]);

  const toggleOnline = async () => {
    setBusy(true);
    try {
      const updated = await base44.entities.DriverProfile.update(profile.id, {
        is_available: !profile.is_available,
      });
      setProfile({ ...profile, ...updated });
      if (!profile.is_available) getUserLocation().then(setLocation);
      toast.success(updated.is_available ? "You are now online" : "You are now offline");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setBusy(false);
    }
  };

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
      await base44.entities.Order.update(order.id, { status: "picked_up" });
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
      await base44.entities.Order.update(order.id, { status: "delivered" });
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
      await loadOrders(user);
    } catch {
      toast.error("Failed to complete delivery");
    } finally {
      setBusy(false);
    }
  };

  const goCustomer = async () => {
    try {
      await base44.auth.updateMe({ role: "customer" });
      navigate("/");
    } catch {
      navigate("/");
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
      <div className="min-h-screen bg-background text-foreground">
        <DriverOnboarding userId={user?.id} onCreated={loadProfile.bind(null, user)} />
        <button
          onClick={goCustomer}
          className="fixed top-4 left-4 h-9 px-3 rounded-xl bg-card border border-border text-xs font-medium text-muted-foreground"
        >
          ← Back to Customer
        </button>
      </div>
    );
  }

  const myOrder = orders.find(
    (o) => o.driver_id === user.id && ["confirmed", "preparing", "picked_up"].includes(o.status)
  );
  const available = orders.filter((o) => !o.driver_id && ["confirmed", "preparing"].includes(o.status));
  const myRestaurant = myOrder ? restaurants[myOrder.restaurant_id] : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md min-h-screen px-4 pt-8 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Driver</h1>
            <p className="text-sm text-muted-foreground capitalize">
              {profile.vehicle_type} · {user?.full_name || "Driver"}
            </p>
          </div>
          <button
            onClick={goCustomer}
            className="h-9 px-3 rounded-xl bg-card border border-border text-xs font-medium text-muted-foreground"
          >
            Customer mode
          </button>
        </div>

        <div className="mb-6">
          <DriverStats profile={profile} onToggleOnline={toggleOnline} />
        </div>

        {myOrder ? (
          <div className="mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 px-1">
              Current Delivery
            </h2>
            <CurrentDelivery
              order={myOrder}
              restaurant={myRestaurant}
              location={location}
              token={token}
              onPickup={() => markPickedUp(myOrder)}
              onDeliver={() => markDelivered(myOrder)}
              busy={busy}
            />
          </div>
        ) : (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 px-1">
              Available Deliveries
            </h2>
            <AvailableDeliveries orders={available} restaurants={restaurants} onAccept={acceptOrder} busy={busy} />
          </div>
        )}
      </div>
    </div>
  );
}