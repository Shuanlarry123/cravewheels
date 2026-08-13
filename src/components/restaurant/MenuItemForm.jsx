import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { uploadFileWithProgress } from "@/lib/uploadVideo";
import { generateVideoThumbnail } from "@/lib/generateThumbnail";
import { Loader2, Plus, ChevronDown } from "lucide-react";
import { toast } from "react-hot-toast";
import SelectSheet from "@/components/SelectSheet";
import ModifierGroupsEditor from "@/components/restaurant/ModifierGroupsEditor";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Breakfast", "Lunch", "Dinner", "Specials", "Desserts", "Drinks", "Bowls", "Other"];

export default function MenuItemForm({ restaurant, onCreated }) {
  const [form, setForm] = useState({ name: "", description: "", price: "", category: "", thumbnail_url: "" });
  const [video, setVideo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [modifierGroups, setModifierGroups] = useState([]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name || !video) {
      toast.error("Name and video are required");
      return;
    }
    setSaving(true);
    try {
      setProgress(0);
      const { file_url } = await uploadFileWithProgress(video, setProgress);

      // Auto-generate a thumbnail from the video if none was provided manually
      let thumbnailUrl = form.thumbnail_url;
      if (!thumbnailUrl) {
        try {
          const thumbBlob = await generateVideoThumbnail(video);
          const { file_url: thumbFileUrl } = await base44.integrations.Core.UploadFile({
            file: new File([thumbBlob], "thumbnail.jpg", { type: "image/jpeg" }),
          });
          thumbnailUrl = thumbFileUrl;
        } catch {
          /* thumbnail generation failed — not critical */
        }
      }

      await base44.entities.MenuItem.create({
        name: form.name,
        description: form.description,
        price: Number(form.price) || 0,
        category: form.category,
        thumbnail_url: thumbnailUrl,
        video_url: file_url,
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.name,
        is_available: true,
        modifier_groups: modifierGroups
          .filter((g) => g.title.trim() && (g.options || []).some((o) => o.name.trim()))
          .map((g) => ({
            title: g.title.trim(),
            type: g.type || "single",
            required: !!g.required,
            options: (g.options || [])
              .filter((o) => o.name.trim())
              .map((o) => ({ name: o.name.trim(), price: Number(o.price) || 0, default: !!o.default })),
          })),
      });
      toast.success("Menu item added");
      setForm({ name: "", description: "", price: "", category: "", thumbnail_url: "" });
      setVideo(null);
      setModifierGroups([]);
      setProgress(0);
      onCreated();
    } catch (err) {
      toast.error(
        err?.message === "timeout"
          ? "Upload timed out — try a shorter or smaller video"
          : "Failed to add item"
      );
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
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f && f.size > 100 * 1024 * 1024) {
                toast.error("Video too large — max 100MB. Try a shorter clip.");
                e.target.value = "";
                return;
              }
              setVideo(f || null);
            }}
            className="w-full text-xs text-muted-foreground file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary/15 file:text-primary file:text-xs file:font-semibold"
          />
        </label>
        <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Dish name" className={inputCls} />
        <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Description" rows={2} className="w-full rounded-xl bg-background border border-border p-3 text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <input value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="Price ($)" type="number" inputMode="decimal" className={inputCls} />
          <button
            type="button"
            onClick={() => setCategoryOpen(true)}
            className={cn(inputCls, "text-left flex items-center justify-between", !form.category && "text-muted-foreground")}
          >
            <span>{form.category || "Select category…"}</span>
            <ChevronDown className="w-4 h-4 opacity-50" />
          </button>
        </div>
        <SelectSheet
          open={categoryOpen}
          onOpenChange={setCategoryOpen}
          value={form.category}
          onChange={(v) => set("category", v)}
          options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          placeholder="Select category…"
          title="Category"
        />
        <input value={form.thumbnail_url} onChange={(e) => set("thumbnail_url", e.target.value)} placeholder="Thumbnail URL (optional)" className={inputCls} />
        <div className="pt-1">
          <p className="text-xs text-muted-foreground mb-2">Customizations (sauces, toppings, sizes…)</p>
          <ModifierGroupsEditor value={modifierGroups} onChange={setModifierGroups} />
        </div>
        <button onClick={submit} disabled={saving} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> {progress > 0 ? `Uploading ${progress}%` : "Uploading..."}</> : <><Plus className="w-4 h-4" /> Add to menu</>}
        </button>
      </div>
    </div>
  );
}