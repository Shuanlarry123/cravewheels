import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { X, Star, MapPin, Phone, ChevronRight } from "lucide-react";

export default function RestaurantPreview({ restaurant, onClose }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!restaurant) return;
    base44.entities.MenuItem.filter({ restaurant_id: restaurant.id }, "-created_date", 20).then(setItems);
  }, [restaurant]);

  if (!restaurant) return null;

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 bg-background/95 backdrop-blur rounded-t-3xl border-t border-border max-h-[68%] overflow-y-auto no-scrollbar">
      <div className="w-10 h-1 rounded-full bg-muted mx-auto mt-2" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold truncate">{restaurant.name}</h3>
            <p className="text-xs text-muted-foreground">{restaurant.cuisine_type}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 shrink-0 rounded-full bg-card border border-border flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-primary text-primary" /> {restaurant.rating?.toFixed(1) || "—"}
          </span>
          {restaurant.address && (
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {restaurant.address}</span>
          )}
          {restaurant.phone && (
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {restaurant.phone}</span>
          )}
          {restaurant.is_live && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-semibold">LIVE</span>
          )}
        </div>

        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mt-4 mb-2">Video Menu</h4>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No menu videos uploaded.</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {items.map((it) => (
              <div key={it.id} className="shrink-0 w-28">
                <div className="h-36 rounded-xl overflow-hidden bg-muted">
                  {it.video_url ? (
                    <video src={it.video_url} muted loop autoPlay playsInline className="w-full h-full object-cover" />
                  ) : it.thumbnail_url ? (
                    <img src={it.thumbnail_url} className="w-full h-full object-cover" alt={it.name} />
                  ) : null}
                </div>
                <p className="text-xs font-semibold mt-1 line-clamp-1">{it.name}</p>
                <p className="text-[11px] text-primary font-bold">${(it.price || 0).toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}

        <Link
          to={`/restaurant/${restaurant.id}`}
          className="mt-3 w-full h-10 rounded-xl bg-primary/15 text-primary font-semibold text-sm flex items-center justify-center gap-1"
        >
          View full profile <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}