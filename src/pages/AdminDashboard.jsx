import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ChevronLeft } from "lucide-react";
import AdminStats from "@/components/admin/AdminStats";
import ApprovalQueue from "@/components/admin/ApprovalQueue";
import { toast } from "react-hot-toast";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [r, d, o] = await Promise.all([
      base44.entities.Restaurant.list("-created_date", 100),
      base44.entities.DriverProfile.list("-created_date", 100),
      base44.entities.Order.list("-created_date", 100),
    ]);
    setRestaurants(r);
    setDrivers(d);
    setOrders(o);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch {
        toast.error("Failed to load admin data");
      } finally {
        setLoading(false);
      }
    })();
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
    } catch {
      toast.error("Failed to approve driver");
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

  const pendingRestaurants = restaurants.filter((r) => !r.is_approved);
  const pendingDrivers = drivers.filter((d) => !d.is_approved);
  const revenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-4 pt-8 pb-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mb-6">Platform overview & approvals</p>

        <AdminStats restaurants={restaurants} drivers={drivers} orders={orders} revenue={revenue} />

        <ApprovalQueue
          restaurants={restaurants}
          drivers={drivers}
          onApproveRestaurant={approveRestaurant}
          onApproveDriver={approveDriver}
          busy={busy}
        />
      </div>
    </div>
  );
}