import React from "react";
import { PackageCheck } from "lucide-react";

export default function PickupReference({ order, restaurant }) {
  return (
    <div className="rounded-2xl bg-background border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <PackageCheck className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Pickup Reference</h3>
        <span className="ml-auto text-[11px] text-muted-foreground">Verify order at pickup</span>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted shrink-0">
          {restaurant?.logo_url ? (
            <img src={restaurant.logo_url} className="w-full h-full object-cover" alt={restaurant.name} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl">🍴</div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{restaurant?.name || order.restaurant_name}</p>
          <p className="text-xs text-muted-foreground truncate">{restaurant?.address || "Pickup address"}</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {(order.items || []).map((it, i) => (
          <div key={i} className="shrink-0 w-24 rounded-xl overflow-hidden border border-border bg-background">
            <div className="h-20 w-full bg-muted">
              {it.video_url ? (
                <video src={it.video_url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg">🍽️</div>
              )}
            </div>
            <div className="p-1.5">
              <p className="text-[11px] font-medium line-clamp-1">{it.name}</p>
              <p className="text-[10px] text-muted-foreground">×{it.quantity}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}