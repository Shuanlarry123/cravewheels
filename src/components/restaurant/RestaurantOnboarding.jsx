import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function RestaurantOnboarding({ onCreated }) {
  const [form, setForm] = useState({ name: "", cuisine_type: "", address: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name) {
      toast.error("Restaurant name is required");
      return;
    }
    setSaving(true);
    try {
      const r = await base44.entities.Restaurant.create(form);
      toast.success("Restaurant created — pending approval");
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
      <p className="text-sm text-muted-foreground mb-6">Add your details to join CraveReel.</p>
      <div className="space-y-3">
        <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Restaurant name" className="w-full h-11 rounded-xl bg-card border border-border px-3 text-sm" />
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