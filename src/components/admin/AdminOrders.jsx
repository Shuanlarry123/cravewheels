import React, { useState } from "react";
import { cn } from "@/lib/utils";

const FILTERS = ["all", "pending", "confirmed", "preparing", "picked_up", "delivered", "cancelled"];
const STATUS_CLS = {
  pending: "bg-muted text-muted-foreground",
  confirmed: "bg-blue-500/15 text-blue-400",
  preparing: "bg-yellow-500/15 text-yellow-400",
  picked_up: "bg-purple-500/15 text-purple-400",
  delivered: "bg-green-500/15 text-green-400",
  cancelled: "bg-red-500/15 text-red-400",
};

export default function AdminOrders({ orders, restaurants, users }) {
  const [f, setF] = useState("all");
  const restById = Object.fromEntries(restaurants.map((r) => [r.id, r]));
  const userById = Object.fromEntries(users.map((u) => [u.id, u]));
  const list = f === "all" ? orders : orders.filter((o) => o.status === f);

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto no-scrollbar mb-3">
        {FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setF(s)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap",
              f === s ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
            )}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {list.map((o) => (
          <div key={o.id} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
            <span
              className={cn("text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize shrink-0", STATUS_CLS[o.status])}
            >
              {o.status?.replace("_", " ")}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{restById[o.restaurant_id]?.name || "—"}</p>
              <p className="text-xs text-muted-foreground truncate">
                {(o.items || []).length} item(s) · {userById[o.created_by_id]?.email || "—"}
              </p>
            </div>
            <span className="text-sm font-bold shrink-0">${(o.total_amount || 0).toFixed(2)}</span>
          </div>
        ))}
        {list.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No orders.</p>}
      </div>
    </div>
  );
}