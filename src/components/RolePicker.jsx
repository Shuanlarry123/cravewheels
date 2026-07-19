import React from "react";
import { ShoppingBag, Bike, Store, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { id: "browsing", label: "Browsing", desc: "Discover & order food", icon: ShoppingBag },
  { id: "driver", label: "Driver", desc: "Deliver orders & earn", icon: Bike },
  { id: "restaurant", label: "Restaurant", desc: "Manage your menu", icon: Store },
  { id: "creator", label: "Influencer", desc: "Share & earn commission", icon: Sparkles },
];

export default function RolePicker({ value, onChange }) {
  return (
    <div className="mb-5">
      <p className="text-sm font-medium mb-2">I'm signing in as a…</p>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((o) => {
          const active = value === o.id;
          return (
            <button
              type="button"
              key={o.id}
              onClick={() => onChange(o.id)}
              className={cn(
                "flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-colors",
                active ? "border-primary bg-primary/10" : "border-border bg-card"
              )}
            >
              <o.icon className={cn("w-5 h-5", active ? "text-primary" : "text-muted-foreground")} />
              <span className="text-sm font-semibold">{o.label}</span>
              <span className="text-[11px] text-muted-foreground leading-tight">{o.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}