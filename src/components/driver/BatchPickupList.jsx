import React from "react";
import { Plus, Package } from "lucide-react";

/**
 * Shows available orders from the same restaurant as the driver's current
 * pickup, so they can be added to the trip and collected in one stop.
 */
export default function BatchPickupList({ orders, restaurantName, onAdd, busy }) {
  if (!orders?.length) return null;
  return (
    <div className="mt-3 rounded-2xl border border-primary/30 bg-primary/5 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Package className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold">Batch from {restaurantName}</p>
        <span className="ml-auto text-xs text-muted-foreground">{orders.length} more ready</span>
      </div>
      <div className="space-y-2">
        {orders.map((o) => (
          <div key={o.id} className="flex items-center gap-2 bg-card border border-border rounded-xl p-2.5">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{o.delivery_address || "Customer"}</p>
              <p className="text-[11px] text-muted-foreground">
                {(o.items || []).length} item{(o.items || []).length !== 1 ? "s" : ""} · ${(o.total_amount || 0).toFixed(2)}
              </p>
            </div>
            <button
              onClick={() => onAdd(o)}
              disabled={busy}
              className="shrink-0 flex items-center gap-1 text-xs font-semibold text-primary px-3 h-8 rounded-lg bg-primary/15 active:scale-95 transition-transform disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}