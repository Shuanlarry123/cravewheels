import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, Video, CheckCircle2 } from "lucide-react";
import RestaurantOnboarding from "@/components/restaurant/RestaurantOnboarding";
import RestaurantProfileForm from "@/components/restaurant/RestaurantProfileForm";
import MenuItemForm from "@/components/restaurant/MenuItemForm";
import RestaurantOrders from "@/components/restaurant/RestaurantOrders";
import { toast } from "react-hot-toast";

export default function RestaurantDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

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
        setUser(u);
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-4 pt-8 pb-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
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
        <p className="text-sm text-muted-foreground mb-6">Manage your restaurant</p>

        {!restaurant.is_approved && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-3 mb-6 text-xs text-yellow-300">
            Your restaurant is pending admin approval. Customers won't see it until approved.
          </div>
        )}

        <RestaurantProfileForm restaurant={restaurant} onSaved={setRestaurant} />
        <MenuItemForm restaurant={restaurant} onCreated={() => loadMenu(restaurant.id)} />

        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 px-1">
          Menu ({menuItems.length})
        </h2>
        {menuItems.length === 0 ? (
          <p className="text-sm text-muted-foreground px-1 mb-6">No menu items yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-6">
            {menuItems.map((m) => (
              <div key={m.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="h-24 bg-muted relative">
                  {m.thumbnail_url ? (
                    <img src={m.thumbnail_url} className="w-full h-full object-cover" alt={m.name} />
                  ) : m.video_url ? (
                    <video src={m.video_url} muted className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-sm font-semibold line-clamp-1">{m.name}</p>
                  <p className="text-xs text-muted-foreground">${(m.price || 0).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <RestaurantOrders orders={orders} onAdvance={advanceOrder} busy={busy} />
      </div>
    </div>
  );
}