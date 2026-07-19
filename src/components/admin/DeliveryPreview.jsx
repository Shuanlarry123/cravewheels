import React from "react";
import { X, Store, Package, MapPin, Bike, User } from "lucide-react";

export default function DeliveryPreview({ data, onClose }) {
  if (!data) return null;
  const { restaurant, driver, customer, items, total_amount, status, delivery_address, driver_id } = data;

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 bg-background/95 backdrop-blur rounded-t-3xl border-t border-border max-h-[62%] overflow-y-auto no-scrollbar">
      <div className="w-10 h-1 rounded-full bg-muted mx-auto mt-2" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold">Ongoing Delivery</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold capitalize mt-1 inline-block">
              {status?.replace("_", " ")}
            </span>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 shrink-0 rounded-full bg-card border border-border flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="bg-card border border-border rounded-xl p-2.5">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Store className="w-3 h-3" /> Restaurant
            </p>
            <p className="text-sm font-semibold mt-0.5 truncate">{restaurant?.name || "—"}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-2.5">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Bike className="w-3 h-3" /> Driver
            </p>
            <p className="text-sm font-semibold mt-0.5 truncate">
              {driver ? `${driver.vehicle_type} · ${driver.rating?.toFixed(1)}★` : driver_id ? "Assigned" : "Unassigned"}
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-3 mt-2 space-y-1.5">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Package className="w-3 h-3" /> {(items || []).length} item(s)
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {delivery_address || "—"}
          </p>
          {customer?.email && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3" /> {customer.email}
            </p>
          )}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-sm font-bold">${(total_amount || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}