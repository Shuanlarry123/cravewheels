import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus } from "lucide-react";
import { toast } from "react-hot-toast";

export default function MenuItemForm({ restaurant, onCreated }) {
  const [form, setForm] = useState({ name: "", description: "", price: "", category: "", thumbnail_url: "" });
  const [video, setVideo] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name || !video) {
      toast.error("Name and video are required");
      return;
    }
    setSaving(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: video });
      await base44.entities.MenuItem.create({
        name: form.name,
        description: form.description,
        price: Number(form.price) || 0,
        category: form.category,
        thumbnail_url: form.thumbnail_url,
        video_url: file_url,
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.name,
        is_available: true,
      });
      toast.success("Menu item added");
      setForm({ name: "", description: "", price: "", category: "", thumbnail_url: "" });
      setVideo(null);
      onCreated();
    } catch {
      toast.error("Failed to add item");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full h-11 rounded-xl bg-background border border-border px-3 text-sm";

  return (
    <div className="bg-card border border-border rounded-2xl p-4 mb-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Add Menu Video</h2>
      <div className="space-y-3">
        <label className="block">
          <span className="text-xs text-muted-foreground">Dish video</span>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideo(e.target.files?.[0] || null)}
            className="w-full text-xs text-muted-foreground file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary/15 file:text-primary file:text-xs file:font-semibold"
          />
        </label>
        <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Dish name" className={inputCls} />
        <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Description" rows={2} className="w-full rounded-xl bg-background border border-border p-3 text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <input value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="Price ($)" type="number" inputMode="decimal" className={inputCls} />
          <input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Category" className={inputCls} />
        </div>
        <input value={form.thumbnail_url} onChange={(e) => set("thumbnail_url", e.target.value)} placeholder="Thumbnail URL (optional)" className={inputCls} />
        <button onClick={submit} disabled={saving} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Plus className="w-4 h-4" /> Add to menu</>}
        </button>
      </div>
    </div>
  );
}