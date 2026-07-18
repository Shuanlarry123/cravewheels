import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function RestaurantProfileForm({ restaurant, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...restaurant });
  }, [restaurant]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const data = {
        ...form,
        delivery_fee: Number(form.delivery_fee) || 0,
        delivery_radius_km: Number(form.delivery_radius_km) || 0,
      };
      const updated = await base44.entities.Restaurant.update(restaurant.id, data);
      toast.success("Profile updated");
      onSaved(updated);
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full h-11 rounded-xl bg-background border border-border px-3 text-sm";

  return (
    <div className="bg-card border border-border rounded-2xl p-4 mb-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Profile Info</h2>
      <div className="space-y-3">
        <input value={form.name || ""} onChange={(e) => set("name", e.target.value)} placeholder="Name" className={inputCls} />
        <textarea value={form.description || ""} onChange={(e) => set("description", e.target.value)} placeholder="Description" rows={2} className="w-full rounded-xl bg-background border border-border p-3 text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <input value={form.cuisine_type || ""} onChange={(e) => set("cuisine_type", e.target.value)} placeholder="Cuisine" className={inputCls} />
          <input value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} placeholder="Phone" className={inputCls} />
        </div>
        <input value={form.address || ""} onChange={(e) => set("address", e.target.value)} placeholder="Address" className={inputCls} />
        <input value={form.logo_url || ""} onChange={(e) => set("logo_url", e.target.value)} placeholder="Logo URL" className={inputCls} />
        <input value={form.cover_url || ""} onChange={(e) => set("cover_url", e.target.value)} placeholder="Cover URL" className={inputCls} />
        <div className="grid grid-cols-2 gap-2">
          <input value={form.delivery_fee || ""} onChange={(e) => set("delivery_fee", e.target.value)} placeholder="Delivery fee ($)" type="number" className={inputCls} />
          <input value={form.delivery_radius_km || ""} onChange={(e) => set("delivery_radius_km", e.target.value)} placeholder="Radius (km)" type="number" className={inputCls} />
        </div>
        <button onClick={save} disabled={saving} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save profile"}
        </button>
      </div>
    </div>
  );
}