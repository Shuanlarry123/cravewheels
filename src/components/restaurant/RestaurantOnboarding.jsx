import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Store, Truck, Home } from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

const TYPES = [
  { value: "restaurant", label: "Restaurant", desc: "A physical dining location", icon: Store },
  { value: "food_truck", label: "Food Truck", desc: "A mobile food truck", icon: Truck },
  { value: "ghost_kitchen", label: "Ghost Kitchen", desc: "Selling from home", icon: Home },
];

export default function RestaurantOnboarding({ onCreated }) {
  const [form, setForm] = useState({ name: "", cuisine_type: "", address: "", phone: "", restaurant_type: "restaurant" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name) {
      toast.error("Restaurant name is required");
      return;
    }
    if (!form.restaurant_type) {
      toast.error("Select your business type");
      return;
    }
    setSaving(true);
    try {
      const r = await base44.entities.Restaurant.create(form);
      toast.success("Application submitted — pending approval");
      onCreated(r);
    } catch {
      toast.error("Failed to create restaurant");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 pt-10 pb-12">
      <h1 className="text-2xl font-bold mb-1">Start your restaurant</h1>
      <p className="text-sm text-muted-foreground mb-6">Add your details to join Cravewheels.</p>
      <div className="space-y-3">
        <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Restaurant name" className="w-full h-11 rounded-xl bg-card border border-border px-3 text-sm" />

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">Business type</p>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map(({ value, label, desc, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => set("restaurant_type", value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center active:scale-[0.98] transition-transform",
                  form.restaurant_type === value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card"
                )}
              >
                <Icon className={cn("w-6 h-6", form.restaurant_type === value ? "text-primary" : "text-foreground/70")} strokeWidth={2} />
                <span className={cn("text-xs font-semibold leading-tight", form.restaurant_type === value && "text-primary")}>{label}</span>
                <span className="text-[10px] text-muted-foreground leading-tight">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        <input value={form.cuisine_type} onChange={(e) => set("cuisine_type", e.target.value)} placeholder="Cuisine type" className="w-full h-11 rounded-xl bg-card border border-border px-3 text-sm" />
        <input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Address" className="w-full h-11 rounded-xl bg-card border border-border px-3 text-sm" />
        <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Phone" className="w-full h-11 rounded-xl bg-card border border-border px-3 text-sm" />
        <button onClick={submit} disabled={saving} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : "Create restaurant"}
        </button>
      </div>
    </div>
  );
}