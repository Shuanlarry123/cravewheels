import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, Package, MapPin, CheckCircle2 } from "lucide-react";
import DriverLayout from "@/components/DriverLayout";

export default function DriverHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        const all = await base44.entities.Order.filter({});
        setOrders(
          all
            .filter((o) => o.driver_id === u.id)
            .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
        );
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading)
    return (
      <DriverLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
        </div>
      </DriverLayout>
    );

  return (
    <DriverLayout>
      <div className="px-4 pt-8 pb-28 min-h-screen">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold mb-1">Delivery History</h1>
        <p className="text-sm text-muted-foreground mb-6">{orders.length} trips total</p>

        {orders.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border p-6 text-center text-sm text-muted-foreground">
            No deliveries yet. Accept an order from the On Road screen to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <div key={o.id} className="bg-card border border-border rounded-2xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">{o.restaurant_name || "Restaurant"}</span>
                  <span
                    className={
                      "text-[10px] px-2 py-1 rounded-full font-semibold capitalize " +
                      (o.status === "delivered"
                        ? "bg-green-500/15 text-green-400"
                        : o.status === "cancelled"
                        ? "bg-red-500/15 text-red-400"
                        : "bg-primary/15 text-primary")
                    }
                  >
                    {o.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {new Date(o.created_date).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Package className="w-3.5 h-3.5" />
                  {(o.items || []).reduce((n, it) => n + (it.quantity || 1), 0)} items · ${(o.total_amount || 0).toFixed(2)}
                </div>
                {o.delivery_address && (
                  <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span className="line-clamp-1">{o.delivery_address}</span>
                  </div>
                )}
                {o.status === "delivered" && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Earned
                    </span>
                    <span className="text-sm font-bold text-primary">+${(o.delivery_fee || 2.99).toFixed(2)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DriverLayout>
  );
}