import React from "react";
import { Store, MapPin, Navigation, CheckCircle2, Phone } from "lucide-react";
import PickupReference from "@/components/driver/PickupReference";

export default function ActiveDeliveryCard({ order, restaurant, onPickup, onDeliver, busy }) {
  const pickedUp = order.status === "picked_up";

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary font-semibold">
          {pickedUp ? "Drop-off (Customer)" : "Pickup (Restaurant)"}
        </span>
        <span className="text-xs text-muted-foreground capitalize">{order.status.replace("_", " ")}</span>
      </div>

      <PickupReference order={order} restaurant={restaurant} />

      <div className="space-y-1.5 mb-3 mt-3 text-sm">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-primary" />
          <span className="font-medium">{order.restaurant_name}</span>
          {restaurant?.phone && (
            <a href={`tel:${restaurant.phone}`} className="ml-auto text-muted-foreground">
              <Phone className="w-4 h-4" />
            </a>
          )}
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
          <span className="text-muted-foreground">{order.delivery_address || "Customer address"}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm mb-3 pb-3 border-b border-border">
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
  );
}