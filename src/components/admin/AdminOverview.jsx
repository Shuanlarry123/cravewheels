import React from "react";
import { Users, Store, Bike, Sparkles, ShoppingBag, DollarSign, Clock, ChevronRight } from "lucide-react";

function Kpi({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: `${color}22` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <p className="text-2xl font-bold leading-none">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminOverview({ data, onGo }) {
  const { restaurants, drivers, creators, orders, users } = data;
  const revenue = orders
    .filter((o) => o.payment_status === "paid")
    .reduce((s, o) => s + (o.total_amount || 0), 0);
  const pending =
    restaurants.filter((r) => !r.is_approved).length +
    drivers.filter((d) => !d.is_approved).length +
    creators.filter((c) => c.status === "pending").length;

  const kpis = [
    { icon: Users, label: "Total Users", value: users.length, color: "#a855f7" },
    { icon: Store, label: "Restaurants", value: restaurants.filter((r) => r.is_approved).length, sub: `${restaurants.length} total`, color: "#FF6B2C" },
    { icon: Bike, label: "Drivers", value: drivers.filter((d) => d.is_approved).length, sub: `${drivers.filter((d) => d.is_available).length} online`, color: "#22c55e" },
    { icon: Sparkles, label: "Influencers", value: creators.filter((c) => c.status === "active").length, sub: `${creators.filter((c) => c.status === "pending").length} pending`, color: "#eab308" },
    { icon: ShoppingBag, label: "Orders", value: orders.length, color: "#3b82f6" },
    { icon: DollarSign, label: "Revenue (paid)", value: `$${revenue.toFixed(0)}`, color: "#10b981" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {kpis.map((k) => (
          <Kpi key={k.label} {...k} />
        ))}
      </div>
      <button
        onClick={() => onGo?.("queue")}
        className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl p-4 text-left active:scale-[0.99]"
      >
        <div className="w-10 h-10 rounded-xl bg-yellow-500/15 flex items-center justify-center">
          <Clock className="w-5 h-5 text-yellow-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Pending approvals</p>
          <p className="text-xs text-muted-foreground">{pending} application(s) awaiting review</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}