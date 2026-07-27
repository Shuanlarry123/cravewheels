import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Star, Video, Plus, Check, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";

export default function RestaurantSpecials({ items, onChanged }) {
  const [busyId, setBusyId] = useState(null);
  const specials = items.filter((m) => m.is_featured);
  const others = items.filter((m) => !m.is_featured);

  const toggle = async (m) => {
    setBusyId(m.id);
    try {
      await base44.entities.MenuItem.update(m.id, { is_featured: !m.is_featured });
      toast.success(m.is_featured ? "Removed from specials" : "Added to today's specials");
      onChanged();
    } catch {
      toast.error("Failed to update special");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-primary/10 border border-primary/30 rounded-2xl p-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <p className="text-xs text-primary/90">
          {specials.length ? `${specials.length} active daily special${specials.length > 1 ? "s" : ""}` : "No active specials — promote a dish to feature it in the feed today."}
        </p>
      </div>

      {/* Active specials */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 px-1">
          Today's Specials
        </h2>
        {specials.length === 0 ? (
          <p className="text-sm text-muted-foreground px-1 py-6 text-center">No dishes promoted yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {specials.map((m) => (
              <div key={m.id} className="bg-card border border-primary/40 rounded-2xl overflow-hidden">
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
                  <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-current" /> Special
                  </span>
                </div>
                <div className="p-2">
                  <p className="text-sm font-semibold line-clamp-1">{m.name}</p>
                  <p className="text-xs text-primary font-bold">${(m.price || 0).toFixed(2)}</p>
                  <button
                    onClick={() => toggle(m)}
                    disabled={busyId === m.id}
                    className="w-full mt-2 h-8 rounded-lg bg-background border border-border text-[11px] font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <Star className="w-3.5 h-3.5 fill-primary text-primary" /> Remove special
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Promote others */}
      {others.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 px-1">
            Promote a dish
          </h2>
          <div className="space-y-2">
            {others.map((m) => (
              <div key={m.id} className="bg-card border border-border rounded-2xl p-2 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden shrink-0">
                  {m.thumbnail_url ? (
                    <img src={m.thumbnail_url} className="w-full h-full object-cover" alt={m.name} />
                  ) : m.video_url ? (
                    <video src={m.video_url} muted className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold line-clamp-1">{m.name}</p>
                  <p className="text-xs text-muted-foreground">${(m.price || 0).toFixed(2)} · {m.category || "Other"}</p>
                </div>
                <button
                  onClick={() => toggle(m)}
                  disabled={busyId === m.id}
                  className="shrink-0 h-9 px-3 rounded-xl bg-primary/15 text-primary text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" /> Promote
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}