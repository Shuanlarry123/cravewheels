import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ChevronLeft,
  CheckCircle2,
  LayoutDashboard,
  Utensils,
  ShoppingBag,
  Settings as SettingsIcon,
  Plus,
  Sparkles,
} from "lucide-react";
import RestaurantOnboarding from "@/components/restaurant/RestaurantOnboarding";
import RestaurantProfileForm from "@/components/restaurant/RestaurantProfileForm";
import MenuItemForm from "@/components/restaurant/MenuItemForm";
import RestaurantOrders from "@/components/restaurant/RestaurantOrders";
import RestaurantStats from "@/components/restaurant/RestaurantStats";
import RestaurantMenuGrid from "@/components/restaurant/RestaurantMenuGrid";
import RestaurantSpecials from "@/components/restaurant/RestaurantSpecials";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "menu", label: "Menu", icon: Utensils },
  { id: "specials", label: "Specials", icon: Sparkles },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "profile", label: "Profile", icon: SettingsIcon },
];

export default function RestaurantDashboard() {
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("overview");

  const loadMenu = useCallback(async (rid) => {
    setMenuItems(await base44.entities.MenuItem.filter({ restaurant_id: rid }, "-created_date", 100));
  }, []);

  const loadOrders = useCallback(async (rid) => {
    setOrders(await base44.entities.Order.filter({ restaurant_id: rid }, "-created_date", 100));
  }, []);

  useEffect(() => {
    let rid = null;
    (async () => {
      try {
        const u = await base44.auth.me();
        const mine = await base44.entities.Restaurant.filter({ created_by_id: u.id });
        const r = mine[0] || null;
        setRestaurant(r);
        if (r) {
          rid = r.id;
          await Promise.all([loadMenu(r.id), loadOrders(r.id)]);
        }
      } catch {
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
    const unsub = base44.entities.Order.subscribe(() => {
      if (rid) loadOrders(rid);
    });
    return unsub;
  }, []);

  const advanceOrder = async (order) => {
    const flow = { pending: "confirmed", confirmed: "preparing" };
    const next = flow[order.status];
    if (!next) return;
    setBusy(true);
    try {
      await base44.entities.Order.update(order.id, { status: next });
      toast.success("Order updated");
      await loadOrders(restaurant.id);
    } catch {
      toast.error("Failed to update order");
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

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground m-4">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <RestaurantOnboarding onCreated={setRestaurant} />
      </div>
    );
  }

  const recent = orders.slice(0, 5);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <div className="mx-auto max-w-md px-4 pt-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h1 className="text-2xl font-bold">{restaurant.name}</h1>
          {restaurant.is_approved ? (
            <span className="text-xs px-2 py-1 rounded-full bg-green-500/15 text-green-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Approved
            </span>
          ) : (
            <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/15 text-yellow-400 font-semibold">Pending</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-4">Manage your restaurant</p>

        {!restaurant.is_approved && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-3 mb-4 text-xs text-yellow-300">
            Your restaurant is pending admin approval. Customers won't see it until approved.
          </div>
        )}

        {/* Tab bar */}
        <div className="sticky top-0 z-20 -mx-4 px-4 pb-2 pt-1 bg-background/95 backdrop-blur">
          <div className="flex gap-1 bg-card border border-border rounded-2xl p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[11px] font-medium transition-colors",
                  tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                )}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          {tab === "overview" && (
            <div className="space-y-4">
              <RestaurantStats orders={orders} menuCount={menuItems.length} />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent Orders</h2>
                  <button onClick={() => setTab("orders")} className="text-xs text-primary font-medium">
                    View all
                  </button>
                </div>
                {recent.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders yet.</p>
                ) : (
                  <div className="space-y-2">
                    {recent.map((o) => (
                      <div key={o.id} className="bg-card border border-border rounded-2xl p-3 flex items-center justify-between">
                        <div>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold capitalize">
                            {o.status.replace("_", " ")}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">
                            {(o.items || []).length} item(s)
                          </p>
                        </div>
                        <span className="text-sm font-bold">${(o.total_amount || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setTab("menu")}
                className="w-full h-11 rounded-xl bg-primary/15 text-primary font-semibold text-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add a video menu item
              </button>
            </div>
          )}

          {tab === "menu" && (
            <div className="space-y-4">
              <MenuItemForm restaurant={restaurant} onCreated={() => loadMenu(restaurant.id)} />
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 px-1">
                  Menu ({menuItems.length})
                </h2>
                <RestaurantMenuGrid items={menuItems} onChanged={() => loadMenu(restaurant.id)} />
              </div>
            </div>
          )}

          {tab === "specials" && (
            <RestaurantSpecials items={menuItems} onChanged={() => loadMenu(restaurant.id)} />
          )}

          {tab === "orders" && (
            <RestaurantOrders orders={orders} onAdvance={advanceOrder} busy={busy} />
          )}

          {tab === "profile" && (
            <RestaurantProfileForm restaurant={restaurant} onSaved={setRestaurant} />
          )}
        </div>
      </div>
    </div>
  );
}