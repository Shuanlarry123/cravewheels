import React from "react";
import { X, Mail, Package, MapPin, Store } from "lucide-react";

export default function UserPreview({ data, onClose }) {
  if (!data) return null;
  const { user, order, restaurant } = data;

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 bg-background/95 backdrop-blur rounded-t-3xl border-t border-border max-h-[62%] overflow-y-auto no-scrollbar">
      <div className="w-10 h-1 rounded-full bg-muted mx-auto mt-2" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold truncate">{user?.full_name || user?.email || "Active customer"}</h3>
            {user?.email && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" /> {user.email}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 shrink-0 rounded-full bg-card border border-border flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {user?.role && (
          <span className="inline-flex mt-2 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[11px] font-semibold capitalize">
            {user.role}
          </span>
        )}

        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mt-4 mb-2">Active Order</h4>
        {order ? (
          <div className="bg-card border border-border rounded-2xl p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold capitalize">
                {order.status?.replace("_", " ")}
              </span>
              <span className="text-sm font-bold">${(order.total_amount || 0).toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Package className="w-3 h-3" /> {(order.items || []).length} item(s)
            </p>
            {restaurant && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Store className="w-3 h-3" /> {restaurant.name}
              </p>
            )}
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {order.delivery_address || "—"}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No active order.</p>
        )}
      </div>
    </div>
  );
}