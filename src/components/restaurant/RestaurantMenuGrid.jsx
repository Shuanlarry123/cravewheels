import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Video, Trash2, Eye, EyeOff, Star } from "lucide-react";
import { toast } from "react-hot-toast";

export default function RestaurantMenuGrid({ items, onChanged }) {
  const [busyId, setBusyId] = useState(null);

  const toggle = async (m) => {
    setBusyId(m.id);
    try {
      await base44.entities.MenuItem.update(m.id, { is_available: !m.is_available });
      onChanged();
    } catch {
      toast.error("Failed to update item");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (m) => {
    setBusyId(m.id);
    try {
      await base44.entities.MenuItem.delete(m.id);
      toast.success("Item removed");
      onChanged();
    } catch {
      toast.error("Failed to remove item");
    } finally {
      setBusyId(null);
    }
  };

  const toggleFeatured = async (m) => {
    setBusyId(m.id);
    try {
      await base44.entities.MenuItem.update(m.id, { is_featured: !m.is_featured });
      onChanged();
    } catch {
      toast.error("Failed to update item");
    } finally {
      setBusyId(null);
    }
  };

  if (!items.length) {
    return (
      <p className="text-sm text-muted-foreground px-1 py-6 text-center">
        No menu items yet. Add your first video dish above.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((m) => (
        <div key={m.id} className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="h-24 bg-muted relative">
            {m.thumbnail_url ? (
              <img src={m.thumbnail_url} className="w-full h-full object-cover" alt={m.name} />
            ) : m.video_url ? (
              <video src={m.video_url} muted className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Video className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            {m.is_featured && (
              <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-current" /> Special
              </span>
            )}
            <span
              className={`absolute top-1 right-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                m.is_available ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"
              }`}
            >
              {m.is_available ? "Live" : "Hidden"}
            </span>
          </div>
          <div className="p-2">
            <p className="text-sm font-semibold line-clamp-1">{m.name}</p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-xs text-primary font-bold">${(m.price || 0).toFixed(2)}</p>
              {m.category && (
                <span className="text-[10px] text-muted-foreground">{m.category}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <button
                onClick={() => toggle(m)}
                disabled={busyId === m.id}
                className="flex-1 h-8 rounded-lg bg-background border border-border flex items-center justify-center gap-1 text-[11px] font-medium disabled:opacity-50"
              >
                {m.is_available ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {m.is_available ? "Hide" : "Show"}
              </button>
              <button
                onClick={() => toggleFeatured(m)}
                disabled={busyId === m.id}
                className="h-8 w-8 rounded-lg bg-background border border-border flex items-center justify-center disabled:opacity-50"
                title="Toggle featured"
              >
                <Star className={`w-3.5 h-3.5 ${m.is_featured ? "fill-primary text-primary" : "text-muted-foreground"}`} />
              </button>
              <button
                onClick={() => remove(m)}
                disabled={busyId === m.id}
                className="h-8 w-8 rounded-lg bg-background border border-border flex items-center justify-center text-destructive disabled:opacity-50"
                title="Remove"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}