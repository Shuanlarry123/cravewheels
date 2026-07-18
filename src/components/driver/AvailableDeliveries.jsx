import React from "react";
import { Navigation, Store, MapPin, DollarSign, ArrowRight } from "lucide-react";

export default function AvailableDeliveries({ orders, restaurants, onAccept, busy }) {
  if (!orders.length) {
    return (
      <div className="rounded-2xl bg-card border border-border p-6 text-center text-sm text-muted-foreground">
        No deliveries available right now. Stay online — new orders appear here instantly.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {orders.map((o) => {
        const r = restaurants[o.restaurant_id];
        return (
          <div key={o.id} className="rounded-2xl bg-card border border-border p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <Store className="w-4 h-4 text-primary" />
                  {o.restaurant_name}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{r?.address || "Address on file"}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary font-semibold capitalize">
                {o.status}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <MapPin className="w-3.5 h-3.5" />
              <span className="line-clamp-1">{o.delivery_address || "Customer address"}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm font-bold text-primary">
                <DollarSign className="w-4 h-4" />
                {(o.delivery_fee || 2.99).toFixed(2)} earnings
              </div>
              <button
                onClick={() => onAccept(o)}
                disabled={busy}
                className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
              >
                Accept <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}