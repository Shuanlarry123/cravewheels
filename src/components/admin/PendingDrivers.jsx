import React from "react";
import { Bike, Check } from "lucide-react";

export default function PendingDrivers({ items, onApprove, busy }) {
  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 px-1">
        Driver Applications {items.length > 0 && `(${items.length})`}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground px-1">No pending applications.</p>
      ) : (
        <div className="space-y-2">
          {items.map((d) => (
            <div key={d.id} className="flex items-center gap-3 bg-card border border-border rounded-2xl p-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Bike className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate capitalize">{d.vehicle_type}</p>
                <p className="text-xs text-muted-foreground truncate">License: {d.license_number || "—"}</p>
              </div>
              <button
                onClick={() => onApprove(d.id)}
                disabled={busy}
                className="h-9 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Approve
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}