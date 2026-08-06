import React from "react";
import { Store, MapPin, Navigation, Check, Package } from "lucide-react";
import { haversineKm } from "@/lib/distance";

/**
 * Dispatch queue: lists available delivery requests with route preview stats
 * (distance to pickup, pickup→dropoff distance, earnings). Tapping a card
 * previews its route on the map; the Accept button claims the ride.
 */
export default function DispatchQueue({ orders, restaurants, location, onAccept, onPreview, selectedId, busy }) {
  if (!orders?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No delivery requests right now.</p>
        <p className="text-xs mt-0.5">New orders will appear here as they come in.</p>
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      {orders.map((o) => {
        const rest = restaurants[o.restaurant_id];
        const toPickupMi =
          location && rest?.latitude != null ? haversineKm(location.lat, location.lng, rest.latitude, rest.longitude) * 0.621371 : null;
        const toDropoffMi =
          location && o.latitude != null && rest?.latitude != null
            ? haversineKm(rest.latitude, rest.longitude, o.latitude, o.longitude) * 0.621371
            : null;
        const itemCount = (o.items || []).reduce((n, i) => n + (i.quantity || 1), 0);
        const selected = o.id === selectedId;
        return (
          <div
            key={o.id}
            onClick={() => onPreview?.(o)}
            className={`rounded-2xl border p-3 cursor-pointer transition-colors active:scale-[0.99] ${
              selected ? "border-primary bg-primary/5" : "border-border bg-card"
            }`}
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{o.restaurant_name || rest?.name || "Restaurant"}</p>
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 shrink-0" /> {o.delivery_address || "Customer address"}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-primary">${(o.delivery_fee || 2.99).toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">earnings</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Navigation className="w-3 h-3" /> {toPickupMi != null ? `${toPickupMi.toFixed(1)} mi to pickup` : "—"}
              </span>
              <span className="flex items-center gap-1">
                <Store className="w-3 h-3" /> {toDropoffMi != null ? `${toDropoffMi.toFixed(1)} mi to dropoff` : "—"}
              </span>
              <span className="ml-auto">{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
            </div>
            {selected && (
              <p className="text-[11px] text-primary mt-2 flex items-center gap-1">
                <Navigation className="w-3 h-3" /> Route shown on map
              </p>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAccept(o);
              }}
              disabled={busy}
              className="mt-2.5 w-full h-9 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> Accept delivery
            </button>
          </div>
        );
      })}
    </div>
  );
}