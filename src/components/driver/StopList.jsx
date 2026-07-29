import React from "react";
import { Store, MapPin, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Ordered list of the driver's stops for the active route. The active (next)
 * stop is highlighted; completed stops are dimmed with a check.
 */
export default function StopList({ stops, activeIndex = 0, restaurants }) {
  if (!stops?.length) return null;
  return (
    <div className="space-y-2">
      {stops.map((s, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        const isPickup = s.type === "pickup";
        const order = s.order;
        return (
          <div
            key={order.id + s.type}
            className={cn(
              "flex items-center gap-3 rounded-2xl border p-3 transition-colors",
              active ? "border-primary bg-primary/10" : "border-border bg-card",
              done && "opacity-60"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                isPickup ? "bg-primary/20 text-primary" : "bg-green-500/20 text-green-400"
              )}
            >
              {done ? <CheckCircle2 className="w-4 h-4" /> : <span>{i + 1}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {isPickup ? (
                  <Store className="w-3.5 h-3.5 text-primary shrink-0" />
                ) : (
                  <MapPin className="w-3.5 h-3.5 text-green-400 shrink-0" />
                )}
                <p className="text-sm font-semibold truncate">
                  {isPickup ? order.restaurant_name : order.delivery_address || "Customer"}
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground capitalize">
                {isPickup ? "Pickup" : "Drop-off"} · {order.status.replace("_", " ")}
              </p>
            </div>
            {active && (
              <span className="text-[10px] font-bold text-primary bg-primary/15 px-2 py-1 rounded-full shrink-0">
                NEXT
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}