import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, Store, Bike, Package, Layers, X } from "lucide-react";
import AdminLiveMap from "@/components/admin/AdminLiveMap";
import RestaurantPreview from "@/components/admin/RestaurantPreview";
import ApprovalQueue from "@/components/admin/ApprovalQueue";
import { toast } from "react-hot-toast";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showQueue, setShowQueue] = useState(false);

  const load = useCallback(async () => {
    const [r, d, o] = await Promise.all([
      base44.entities.Restaurant.list("-created_date", 200),
      base44.entities.DriverProfile.list("-created_date", 200),
      base44.entities.Order.list("-created_date", 200),
    ]);
    setRestaurants(r);
    setDrivers(d);
    setOrders(o);
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

  // poll online driver locations for live movement
  useEffect(() => {
    const id = setInterval(() => {
      base44.entities.DriverProfile.filter({ is_available: true }, "-updated_date", 100).then(setDrivers).catch(() => {});
    }, 15000);
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

  const approveDriver = async (id) => {
    setBusy(true);
    try {
      await base44.entities.DriverProfile.update(id, { is_approved: true });
      toast.success("Driver approved");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const approvedRestaurants = restaurants.filter((r) => r.is_approved);
  const onlineDrivers = drivers.filter((d) => d.is_available);
  const activeDeliveries = orders.filter((o) =>
    ["confirmed", "preparing", "picked_up"].includes(o.status) && o.driver_id
  );
  const pendingCount =
    restaurants.filter((r) => !r.is_approved).length + drivers.filter((d) => !d.is_approved).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-[100dvh] bg-background overflow-hidden">
      <div className="absolute inset-0">
        {token ? (
          <AdminLiveMap
            token={token}
            restaurants={approvedRestaurants}
            drivers={onlineDrivers}
            deliveries={activeDeliveries}
            onSelectRestaurant={setSelected}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">Loading map…</div>
        )}
      </div>

      {/* Top overlay */}
      <div className="absolute top-0 inset-x-0 z-10 p-3 bg-gradient-to-b from-background/90 to-transparent pb-8">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full bg-card/90 border border-border flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h1 className="text-base font-bold">Live Map</h1>
          <button
            onClick={() => setShowQueue(true)}
            className="ml-auto h-9 px-3 rounded-full bg-card/90 border border-border flex items-center gap-1.5 text-xs font-semibold"
          >
            <Layers className="w-4 h-4" /> Queue
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-yellow-500 text-black text-[10px] font-bold">{pendingCount}</span>
            )}
          </button>
        </div>
        <div className="flex gap-2">
          <Count icon={Store} label="Restaurants" value={approvedRestaurants.length} color="#FF6B2C" />
          <Count icon={Bike} label="Online Drivers" value={onlineDrivers.length} color="#22c55e" />
          <Count icon={Package} label="Deliveries" value={activeDeliveries.length} color="#3b82f6" />
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-card/90 border border-border rounded-xl p-2 space-y-1 text-[11px]">
        <Legend emoji="🍴" color="#FF6B2C" label="Restaurant — tap to view" />
        <Legend emoji="🛵" color="#22c55e" label="Online driver" />
        <Legend emoji="📦" color="#3b82f6" label="Active delivery" />
      </div>

      {selected && <RestaurantPreview restaurant={selected} onClose={() => setSelected(null)} />}

      {showQueue && (
        <div className="absolute inset-0 z-30 bg-black/50" onClick={() => setShowQueue(false)}>
          <div
            className="absolute bottom-0 inset-x-0 bg-background rounded-t-3xl border-t border-border max-h-[82%] overflow-y-auto no-scrollbar p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-3" />
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Approval Queue</h2>
              <button onClick={() => setShowQueue(false)} className="h-8 w-8 rounded-full bg-card border border-border flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <ApprovalQueue
              restaurants={restaurants}
              drivers={drivers}
              onApproveRestaurant={approveRestaurant}
              onApproveDriver={approveDriver}
              busy={busy}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Count({ icon: Icon, label, value, color }) {
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

function Legend({ emoji, color, label }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-4 h-4 rounded-full flex items-center justify-center text-[9px]"
        style={{ background: color }}
      >
        {emoji}
      </span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}