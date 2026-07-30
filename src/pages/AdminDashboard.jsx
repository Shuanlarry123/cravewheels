import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  Menu,
  LayoutDashboard,
  Globe,
  Users,
  Store,
  Bike,
  Sparkles,
  ShoppingBag,
  DollarSign,
  Layers,
  CreditCard,
  Radar,
} from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminMapSection from "@/components/admin/AdminMapSection";
import AdminDispatchMap from "@/components/admin/AdminDispatchMap";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminRestaurants from "@/components/admin/AdminRestaurants";
import AdminDrivers from "@/components/admin/AdminDrivers";
import AdminInfluencers from "@/components/admin/AdminInfluencers";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminCardRequests from "@/components/admin/AdminCardRequests";
import AdminRevenue from "@/components/admin/AdminRevenue";
import ApprovalQueue from "@/components/admin/ApprovalQueue";
import { toast } from "react-hot-toast";

export default function AdminDashboard() {
  const [section, setSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [creators, setCreators] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyOrderId, setBusyOrderId] = useState(null);

  const load = useCallback(async () => {
    const [r, d, c, o] = await Promise.all([
      base44.entities.Restaurant.list("-created_date", 200),
      base44.entities.DriverProfile.list("-created_date", 200),
      base44.entities.CreatorProfile.list("-created_date", 200),
      base44.entities.Order.list("-created_date", 200),
    ]);
    setRestaurants(r);
    setDrivers(d);
    setCreators(c);
    setOrders(o);
    try {
      const me = await base44.auth.me();
      if (me.role === "admin") setUsers(await base44.entities.User.list("-created_date", 200));
    } catch {
      /* non-admin: users unavailable */
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await load();
        const t = await base44.functions.invoke("getMapboxToken", {});
        setToken(t.data?.token || null);
      } catch {
        toast.error("Failed to load admin data");
      } finally {
        setLoading(false);
      }
    })();
    const unsub = base44.entities.Order.subscribe(load);
    return unsub;
  }, []);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const live = await base44.entities.DriverProfile.list("-updated_date", 200);
        setDrivers((prev) => {
          const byId = Object.fromEntries(prev.map((d) => [d.id, d]));
          return live.map((d) => ({ ...byId[d.id], ...d }));
        });
      } catch {
        /* ignore */
      }
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const approveRestaurant = async (id) => {
    setBusy(true);
    try {
      await base44.entities.Restaurant.update(id, { is_approved: true });
      toast.success("Restaurant approved");
      await load();
    } catch {
      toast.error("Failed to approve restaurant");
    } finally {
      setBusy(false);
    }
  };
  const approveAddressChange = async (id) => {
    setBusy(true);
    try {
      const r = restaurants.find((x) => x.id === id);
      if (!r) return;
      await base44.entities.Restaurant.update(id, {
        address: r.pending_address,
        latitude: r.pending_latitude,
        longitude: r.pending_longitude,
        pending_address: "",
        pending_latitude: null,
        pending_longitude: null,
        address_verification_status: "approved",
      });
      toast.success("Address change approved");
      await load();
    } catch {
      toast.error("Failed to approve address");
    } finally {
      setBusy(false);
    }
  };
  const rejectAddressChange = async (id) => {
    setBusy(true);
    try {
      await base44.entities.Restaurant.update(id, {
        pending_address: "",
        pending_latitude: null,
        pending_longitude: null,
        address_verification_status: "rejected",
      });
      toast.success("Address change rejected");
      await load();
    } catch {
      toast.error("Failed to reject address");
    } finally {
      setBusy(false);
    }
  };
  const approveDriver = async (id) => {
    setBusy(true);
    try {
      await base44.entities.DriverProfile.update(id, {
        is_approved: true,
        application_status: "approved",
        background_check_status: "passed",
      });
      toast.success("Driver approved");
      await load();
    } finally {
      setBusy(false);
    }
  };
  const rejectDriver = async (id) => {
    setBusy(true);
    try {
      await base44.entities.DriverProfile.update(id, {
        application_status: "rejected",
        is_approved: false,
      });
      toast.success("Driver rejected");
      await load();
    } finally {
      setBusy(false);
    }
  };
  const approveCreator = async (id) => {
    setBusy(true);
    try {
      await base44.entities.CreatorProfile.update(id, { status: "active" });
      toast.success("Influencer approved");
      await load();
    } finally {
      setBusy(false);
    }
  };
  const updateOrder = async (id, patch) => {
    setBusyOrderId(id);
    try {
      const clean = { ...patch };
      if (clean.driver_id === "") clean.driver_id = "";
      await base44.entities.Order.update(id, clean);
      toast.success("Order updated");
      await load();
    } catch {
      toast.error("Failed to update order");
    } finally {
      setBusyOrderId(null);
    }
  };
  const suspendCreator = async (id) => {
    setBusy(true);
    try {
      await base44.entities.CreatorProfile.update(id, { status: "suspended" });
      toast.success("Influencer suspended");
      await load();
    } finally {
      setBusy(false);
    }
  };
  const approveCard = async (id) => {
    setBusy(true);
    try {
      await base44.functions.invoke("manageStripeCard", { action: "approveCard", driver_id: id });
      toast.success("CraveReel card issued");
      await load();
    } catch {
      toast.error("Failed to issue card");
    } finally {
      setBusy(false);
    }
  };
  const rejectCard = async (id) => {
    setBusy(true);
    try {
      await base44.functions.invoke("manageStripeCard", { action: "rejectCard", driver_id: id });
      toast.success("Card request rejected");
      await load();
    } catch {
      toast.error("Failed to reject request");
    } finally {
      setBusy(false);
    }
  };

  const cardRequestCount = drivers.filter((d) => d.card_request_status === "requested").length;

  const pendingCount =
    restaurants.filter((r) => !r.is_approved).length +
    restaurants.filter((r) => r.address_verification_status === "pending" && r.pending_address).length +
    drivers.filter((d) => !d.is_approved).length +
    creators.filter((c) => c.status === "pending").length;

  const sections = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "map", label: "Live Map", icon: Globe },
    { id: "dispatch", label: "Dispatch", icon: Radar },
    { id: "users", label: "Users", icon: Users },
    { id: "restaurants", label: "Restaurants", icon: Store },
    { id: "drivers", label: "Drivers", icon: Bike },
    { id: "cards", label: "Card Requests", icon: CreditCard, badge: cardRequestCount || undefined },
    { id: "influencers", label: "Influencers", icon: Sparkles },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "revenue", label: "Revenue", icon: DollarSign },
    { id: "queue", label: "Approval Queue", icon: Layers, badge: pendingCount || undefined },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const data = { restaurants, drivers, creators, orders, users, token };
  const activeLabel = sections.find((s) => s.id === section)?.label;

  return (
    <div className="h-[100dvh] bg-background text-foreground flex overflow-hidden">
      <AdminSidebar
        sections={sections}
        active={section}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelect={(id) => {
          setSection(id);
          setSidebarOpen(false);
        }}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="md:hidden flex items-center gap-2 pt-[calc(env(safe-area-inset-top)+0.75rem)] px-3 pb-3 border-b border-border">
          <button
            onClick={() => setSidebarOpen(true)}
            className="h-9 w-9 rounded-xl bg-card border border-border flex items-center justify-center"
          >
            <Menu className="w-4 h-4" />
          </button>
          <span className="font-semibold">{activeLabel}</span>
        </div>

        <div className="flex-1 min-h-0">
          {section === "map" ? (
            <div className="h-full">
              <AdminMapSection data={data} />
            </div>
          ) : section === "dispatch" ? (
            <div className="h-full">
              <AdminDispatchMap data={data} />
            </div>
          ) : (
            <main className="h-full overflow-y-auto p-4 md:p-6">
              <div className="max-w-5xl mx-auto pb-[env(safe-area-inset-bottom)]">
                <h1 className="text-2xl font-bold mb-4">{activeLabel}</h1>
                {section === "overview" && <AdminOverview data={data} onGo={setSection} />}
                {section === "users" && <AdminUsers users={users} />}
                {section === "restaurants" && (
                  <AdminRestaurants
                    restaurants={restaurants}
                    orders={orders}
                    onApprove={approveRestaurant}
                    onApproveAddress={approveAddressChange}
                    onRejectAddress={rejectAddressChange}
                    busy={busy}
                  />
                )}
                {section === "drivers" && (
                  <AdminDrivers
                    drivers={drivers}
                    users={users}
                    onApprove={approveDriver}
                    onReject={rejectDriver}
                    busy={busy}
                  />
                )}
                {section === "influencers" && (
                  <AdminInfluencers
                    creators={creators}
                    onApprove={approveCreator}
                    onSuspend={suspendCreator}
                    busy={busy}
                  />
                )}
                {section === "orders" && (
                  <AdminOrders
                    orders={orders}
                    restaurants={restaurants}
                    users={users}
                    drivers={drivers}
                    onUpdate={updateOrder}
                    busyId={busyOrderId}
                  />
                )}
                {section === "revenue" && <AdminRevenue orders={orders} restaurants={restaurants} creators={creators} />}
                {section === "cards" && (
                  <AdminCardRequests
                    drivers={drivers}
                    users={users}
                    onApprove={approveCard}
                    onReject={rejectCard}
                    busy={busy}
                  />
                )}
                {section === "queue" && (
                  <ApprovalQueue
                    restaurants={restaurants}
                    drivers={drivers}
                    creators={creators}
                    onApproveRestaurant={approveRestaurant}
                    onApproveAddress={approveAddressChange}
                    onRejectAddress={rejectAddressChange}
                    onApproveDriver={approveDriver}
                    onApproveCreator={approveCreator}
                    busy={busy}
                  />
                )}
              </div>
            </main>
          )}
        </div>
      </div>
    </div>
  );
}