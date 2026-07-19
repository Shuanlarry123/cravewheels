import React from "react";
import { ShoppingBag, DollarSign, Clock, Utensils } from "lucide-react";
import moment from "moment";

export default function RestaurantStats({ orders, menuCount }) {
  const active = orders.filter((o) => ["pending", "confirmed", "preparing"].includes(o.status));
  const today = orders.filter((o) => moment(o.created_date).isSame(moment(), "day"));
  const revenue = today.reduce((s, o) => s + (o.total_amount || 0), 0);

  const cards = [
    { icon: Clock, label: "Active", value: active.length },
    { icon: ShoppingBag, label: "Today", value: today.length },
    { icon: DollarSign, label: "Revenue", value: `$${revenue.toFixed(0)}` },
    { icon: Utensils, label: "Menu", value: menuCount },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-card border border-border rounded-2xl p-3 flex flex-col items-center gap-1"
        >
          <c.icon className="w-4 h-4 text-primary" />
          <span className="text-lg font-bold leading-none">{c.value}</span>
          <span className="text-[10px] text-muted-foreground">{c.label}</span>
        </div>
      ))}
    </div>
  );
}