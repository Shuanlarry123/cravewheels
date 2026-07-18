import React from "react";
import { Store, MapPin, Navigation, CheckCircle2, Phone } from "lucide-react";
import MapboxMap from "@/components/MapboxMap";
import PickupReference from "@/components/driver/PickupReference";

export default function CurrentDelivery({ order, restaurant, location, token, onPickup, onDeliver, busy }) {
  const pickedUp = order.status === "picked_up";
  const destLng = pickedUp ? order.longitude : restaurant?.longitude;
  const destLat = pickedUp ? order.latitude : restaurant?.latitude;
  const destLabel = pickedUp ? "Drop-off (Customer)" : "Pickup (Restaurant)";

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <div className="h-80 w-full bg-black/30">
        {token ? (
          <MapboxMap
            token={token}
            driverLng={location?.lng}
            driverLat={location?.lat}
            destLng={destLng}
            destLat={destLat}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
            Loading map...
          </div>
        )}
      </div>

      {!pickedUp && (
        <div className="px-4 pt-4">
          <PickupReference order={order} restaurant={restaurant} />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary font-semibold">
            {destLabel}
          </span>
          <span className="text-xs text-muted-foreground capitalize">{order.status.replace("_", " ")}</span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Store className="w-4 h-4 text-primary" />
            <span className="font-medium">{order.restaurant_name}</span>
            {restaurant?.phone && (
              <a href={`tel:${restaurant.phone}`} className="ml-auto text-muted-foreground">
                <Phone className="w-4 h-4" />
              </a>
            )}
          </div>
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
            <span className="text-muted-foreground">{order.delivery_address || "Customer address"}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm mb-4 pb-4 border-b border-border">
          <span className="text-muted-foreground">Your earnings</span>
          <span className="font-bold text-primary">${(order.delivery_fee || 2.99).toFixed(2)}</span>
        </div>

        {!pickedUp ? (
          <button
            onClick={onPickup}
            disabled={busy}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Navigation className="w-4 h-4" /> Mark Picked Up
          </button>
        ) : (
          <button
            onClick={onDeliver}
            disabled={busy}
            className="w-full h-12 rounded-2xl bg-green-500 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" /> Mark Delivered
          </button>
        )}
      </div>
    </div>
  );
}