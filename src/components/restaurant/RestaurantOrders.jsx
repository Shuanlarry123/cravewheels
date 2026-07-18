import React from "react";
import { MapPin } from "lucide-react";

const FLOW = {
  pending: { next: "confirmed", label: "Confirm Order" },
  confirmed: { next: "preparing", label: "Start Preparing" },
};

export default function RestaurantOrders({ orders, onAdvance, busy }) {
  const active = orders.filter((o) => ["pending", "confirmed", "preparing"].includes(o.status));

  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 px-1">
        Incoming Orders {active.length > 0 && `(${active.length})`}
      </h2>
      {active.length === 0 ? (
        <p className="text-sm text-muted-foreground px-1">No incoming orders right now.</p>
      ) : (
        <div className="space-y-2">
          {active.map((o) => (
            <div key={o.id} className="bg-card border border-border rounded-2xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary font-semibold capitalize">
                  {o.status.replace("_", " ")}
                </span>
                <span className="text-sm font-bold">${(o.total_amount || 0).toFixed(2)}</span>
              </div>
              <div className="space-y-1 mb-2">
                {(o.items || []).map((it, i) => (
                  <div key={i} className="flex justify-between text-xs text-muted-foreground">
                    <span>{it.quantity}× {it.name}</span>
                    <span>${((it.price || 0) * (it.quantity || 1)).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              {o.delivery_address && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                  <MapPin className="w-3 h-3 shrink-0" /> {o.delivery_address}
                </p>
              )}
              {FLOW[o.status] && (
                <button
                  onClick={() => onAdvance(o)}
                  disabled={busy}
                  className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
                >
                  {FLOW[o.status].label}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}