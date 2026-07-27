import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, Clock, DollarSign, Package, CheckCircle2 } from "lucide-react";
import DriverLayout from "@/components/DriverLayout";

function tripMinutes(order) {
  const start = new Date(order.created_date).getTime();
  const end = new Date(order.updated_date).getTime();
  if (!start || !end || end < start) return null;
  return Math.max(1, Math.round((end - start) / 60000));
}

function fmtMin(m) {
  if (m == null) return "—";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return `${h}h ${r}m`;
}

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
            .filter((o) => o.driver_id === u.id && o.status === "delivered")
            .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date))
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

  const totalTips = orders.reduce((s, o) => s + (o.tip || 0), 0);
  const totalEarnings = orders.reduce((s, o) => s + (o.delivery_fee || 2.99) + (o.tip || 0), 0);
  const totalMin = orders.reduce((s, o) => s + (tripMinutes(o) || 0), 0);

  return (
    <DriverLayout>
      <div className="px-4 pt-8 pb-28 min-h-screen">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold mb-1">Delivery History</h1>
        <p className="text-sm text-muted-foreground mb-6">{orders.length} completed trips</p>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-card border border-border rounded-2xl p-3 flex flex-col items-center gap-1">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-lg font-bold leading-none">${totalTips.toFixed(2)}</span>
            <span className="text-[10px] text-muted-foreground">Total tips</span>
          </div>
          <div className="bg-card border border-border rounded-2xl p-3 flex flex-col items-center gap-1">
            <Package className="w-4 h-4 text-primary" />
            <span className="text-lg font-bold leading-none">{orders.length}</span>
            <span className="text-[10px] text-muted-foreground">Trips</span>
          </div>
          <div className="bg-card border border-border rounded-2xl p-3 flex flex-col items-center gap-1">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-lg font-bold leading-none">{fmtMin(totalMin)}</span>
            <span className="text-[10px] text-muted-foreground">Time on road</span>
          </div>
        </div>

        {/* Completed orders */}
        {orders.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border p-6 text-center text-sm text-muted-foreground">
            No completed deliveries yet. Finish a trip and it'll show up here.
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => {
              const mins = tripMinutes(o);
              const tip = o.tip || 0;
              const fee = o.delivery_fee || 2.99;
              return (
                <div key={o.id} className="bg-card border border-border rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold truncate">{o.restaurant_name || "Restaurant"}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Done
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {new Date(o.updated_date).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {fmtMin(mins)}
                    </span>
                    <span className="text-muted-foreground">
                      {(o.items || []).reduce((n, it) => n + (it.quantity || 1), 0)} items
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border text-sm">
                    <span className="text-muted-foreground">Earnings</span>
                    <span className="font-bold text-primary">
                      ${fee.toFixed(2)}
                      {tip > 0 && <span className="text-green-400"> + ${tip.toFixed(2)} tip</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DriverLayout>
  );
}