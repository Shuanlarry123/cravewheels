import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Star, Heart, Play } from "lucide-react";

export default function RestaurantCraves({ restaurantId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await base44.entities.Review.filter({ restaurant_id: restaurantId }, "-created_date", 50);
        setReviews(r);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, [restaurantId]);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold">Crave</h2>
        {reviews.length > 0 && (
          <span className="text-[11px] text-muted-foreground">{reviews.length} craves</span>
        )}
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-40 h-52 rounded-2xl bg-card border border-border animate-pulse shrink-0" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center">
          <Heart className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-sm font-semibold">No craves yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Order from here and share your crave to be featured.
          </p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
          {reviews.map((rv) => (
            <div
              key={rv.id}
              className="w-40 shrink-0 rounded-2xl overflow-hidden bg-card border border-border"
            >
              <div className="relative h-44 bg-black">
                {rv.video_url ? (
                  <video
                    src={rv.video_url}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => e.currentTarget.pause()}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Play className="w-6 h-6" />
                  </div>
                )}
                <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-black/60 px-1.5 py-0.5 rounded-full">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`w-2.5 h-2.5 ${
                        n <= (rv.rating || 5) ? "fill-primary text-primary" : "text-white/40"
                      }`}
                    />
                  ))}
                </div>
              </div>
              {rv.comment && (
                <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 p-2.5">
                  {rv.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}