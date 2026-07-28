import React, { useState } from "react";
import { Navigation, Store, MapPin, DollarSign, ArrowRight, ChevronDown, ChevronUp, Route, Coins } from "lucide-react";
import { haversineKm } from "@/lib/distance";

const kmToMi = (km) => (km == null ? null : km * 0.621371);

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
      {orders.map((o) => (
        <DeliveryCard key={o.id} order={o} restaurant={restaurants[o.restaurant_id]} onAccept={onAccept} busy={busy} />
      ))}
    </div>
  );
}

function DeliveryCard({ order, restaurant, onAccept, busy }) {
  const [open, setOpen] = useState(false);

  // Trip distance: restaurant -> customer
  const tripKm =
    restaurant?.latitude != null && order?.latitude != null
      ? haversineKm(restaurant.latitude, restaurant.longitude, order.latitude, order.longitude)
      : null;
  const tripMi = kmToMi(tripKm);

  const earnings = (order.delivery_fee || 2.99) + (order.tip || 0);

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Store className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">{order.restaurant_name}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{restaurant?.address || "Address on file"}</p>
        </div>
        <span className="text-[11px] px-2 py-1 rounded-full bg-primary/15 text-primary font-semibold capitalize shrink-0">
          {order.status}
        </span>
      </div>

      {/* Primary stats: miles, tip, order total */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Stat icon={<Route className="w-3.5 h-3.5" />} label="Miles" value={tripMi != null ? `${tripMi.toFixed(1)}` : "—"} />
        <Stat icon={<Coins className="w-3.5 h-3.5" />} label="Tip" value={`$${(order.tip || 0).toFixed(2)}`} />
        <Stat icon={<DollarSign className="w-3.5 h-3.5" />} label="Order" value={`$${(order.total_amount || 0).toFixed(2)}`} />
      </div>

      {/* Earnings + accept */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-bold text-primary">
          <DollarSign className="w-4 h-4" />
          {earnings.toFixed(2)} earnings
        </div>
        <button
          onClick={() => onAccept(order)}
          disabled={busy}
          className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
        >
          Accept <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Expandable: where they're going */}
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-full mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground py-1.5 border-t border-border"
      >
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {open ? "Less" : "More about this order"}
      </button>
      {open && (
        <div className="mt-2 space-y-2 pt-2">
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Deliver to</p>
              <p className="line-clamp-2">{order.delivery_address || "Customer address"}</p>
              {order.delivery_instructions && (
                <p className="mt-1 italic text-muted-foreground/80">“{order.delivery_instructions}”</p>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
            <span>{(order.items || []).length} item(s)</span>
            <span>{order.order_type === "pickup" ? "Pickup" : "Delivery"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="rounded-xl bg-background border border-border px-2 py-2 flex flex-col items-center text-center">
      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
        {icon}
        {label}
      </span>
      <span className="text-sm font-bold text-foreground mt-0.5">{value}</span>
    </div>
  );
}