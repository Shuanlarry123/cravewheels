import React, { useState } from "react";
import { Store, Bike, Check, MapPin, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "all", label: "All" },
  { id: "restaurant", label: "Restaurants" },
  { id: "driver", label: "Drivers" },
];

export default function ApprovalQueue({ restaurants, drivers, onApproveRestaurant, onApproveDriver, busy }) {
  const [filter, setFilter] = useState("all");

  const restItems = restaurants
    .filter((r) => !r.is_approved)
    .map((r) => ({
      type: "restaurant",
      id: r.id,
      title: r.name,
      lines: [r.cuisine_type, r.address].filter(Boolean),
      meta: r.phone,
    }));
  const driverItems = drivers
    .filter((d) => !d.is_approved)
    .map((d) => ({
      type: "driver",
      id: d.id,
      title: `${(d.vehicle_type || "vehicle").charAt(0).toUpperCase()}${(d.vehicle_type || "vehicle").slice(1)} driver`,
      lines: [`License: ${d.license_number || "—"}`],
      meta: `Rating ${(d.rating || 5).toFixed(1)}`,
    }));

  const all = [...restItems, ...driverItems];
  const counts = { all: all.length, restaurant: restItems.length, driver: driverItems.length };
  const shown = filter === "all" ? all : all.filter((i) => i.type === filter);

  const approve = (item) =>
    item.type === "restaurant" ? onApproveRestaurant(item.id) : onApproveDriver(item.id);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Approval Queue</h2>
        {counts.all > 0 && (
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/15 text-yellow-400 font-semibold">
            {counts.all} pending
          </span>
        )}
      </div>

      <div className="flex gap-1 bg-card border border-border rounded-xl p-1 mb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={cn(
              "flex-1 h-9 rounded-lg text-xs font-medium transition-colors",
              filter === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
          >
            {t.label} {counts[t.id] > 0 && `(${counts[t.id]})`}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground px-1 py-6 text-center">No applications to review.</p>
      ) : (
        <div className="space-y-2">
          {shown.map((item) => (
            <div key={`${item.type}-${item.id}`} className="bg-card border border-border rounded-2xl p-3 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                {item.type === "restaurant" ? (
                  <Store className="w-5 h-5 text-primary" />
                ) : (
                  <Bike className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{item.title}</p>
                {item.lines.map((l, i) => (
                  <p key={i} className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" /> {l}
                  </p>
                ))}
                {item.meta && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" /> {item.meta}
                  </p>
                )}
              </div>
              <button
                onClick={() => approve(item)}
                disabled={busy}
                className="h-9 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1 disabled:opacity-50 shrink-0"
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