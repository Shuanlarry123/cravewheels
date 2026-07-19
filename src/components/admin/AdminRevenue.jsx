import React from "react";
import { DollarSign, Bike, Sparkles, Store } from "lucide-react";

export default function AdminRevenue({ orders, restaurants, creators }) {
  const paid = orders.filter((o) => o.payment_status === "paid");
  const gmv = paid.reduce((s, o) => s + (o.total_amount || 0), 0);
  const deliveryFees = paid.reduce((s, o) => s + (o.delivery_fee || 0), 0);
  const commissions = paid.reduce((s, o) => s + (o.commission_amount || 0), 0);
  const driverEarnings = orders
    .filter((o) => o.status === "delivered")
    .reduce((s, o) => s + (o.delivery_fee || 0), 0);
  const creatorPending = creators.reduce((s, c) => s + (c.pending_earnings || 0), 0);
  const payouts = Math.max(0, gmv - deliveryFees - commissions);

  const byId = {};
  paid.forEach((o) => {
    const id = o.restaurant_id;
    byId[id] = byId[id] || { count: 0, rev: 0, comm: 0 };
    byId[id].count++;
    byId[id].rev += o.total_amount || 0;
    byId[id].comm += o.commission_amount || 0;
  });
  const restById = Object.fromEntries(restaurants.map((r) => [r.id, r]));

  const cards = [
    { icon: DollarSign, label: "Gross Volume", value: `$${gmv.toFixed(0)}`, color: "#10b981" },
    { icon: Store, label: "Restaurant Payouts", value: `$${payouts.toFixed(0)}`, color: "#FF6B2C" },
    { icon: Bike, label: "Driver Earnings", value: `$${driverEarnings.toFixed(0)}`, color: "#22c55e" },
    { icon: Sparkles, label: "Creator Commissions", value: `$${commissions.toFixed(0)}`, color: "#eab308" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-2xl p-4">
            <c.icon className="w-4 h-4 mb-2" style={{ color: c.color }} />
            <p className="text-xl font-bold">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      {creatorPending > 0 && (
        <p className="text-xs text-muted-foreground">Pending creator payouts: ${creatorPending.toFixed(0)}</p>
      )}

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">By Restaurant</h2>
        <div className="space-y-2">
          {Object.entries(byId).map(([id, s]) => (
            <div key={id} className="bg-card border border-border rounded-2xl p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{restById[id]?.name || "—"}</p>
                <p className="text-xs text-muted-foreground">{s.count} paid orders</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">${s.rev.toFixed(0)}</p>
                <p className="text-[11px] text-muted-foreground">comm ${s.comm.toFixed(0)}</p>
              </div>
            </div>
          ))}
          {Object.keys(byId).length === 0 && (
            <p className="text-sm text-muted-foreground">No paid orders yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}