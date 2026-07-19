import React from "react";
import { MousePointerClick, ShoppingBag, DollarSign, Video } from "lucide-react";

export default function CreatorShares({ shares }) {
  if (!shares.length) {
    return (
      <p className="text-sm text-muted-foreground px-1 py-6 text-center">
        No shared dishes yet. Share menu items with your code to start earning.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {shares.map((s) => (
        <div key={s.id} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden">
            {s.video_url ? (
              <video src={s.video_url} muted className="w-full h-full object-cover" />
            ) : (
              <Video className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold line-clamp-1">{s.menu_item_name || "Untitled dish"}</p>
            <p className="text-[11px] text-muted-foreground line-clamp-1">{s.restaurant_name}</p>
            <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" /> {s.clicks || 0}</span>
              <span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3" /> {s.orders || 0}</span>
              <span className="flex items-center gap-1 text-primary font-semibold"><DollarSign className="w-3 h-3" /> {(s.earnings || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}