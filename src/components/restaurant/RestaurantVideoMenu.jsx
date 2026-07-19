import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";

export default function RestaurantVideoMenu({ items }) {
  const videoRefs = useRef({});
  const [activeId, setActiveId] = useState(items[0]?.id || null);

  useEffect(() => {
    const els = Object.values(videoRefs.current).filter(Boolean);
    if (!els.length) return;
    const ios = els.map((el) => {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting && e.intersectionRatio >= 0.55) {
              setActiveId(e.target.dataset.id);
            }
          });
        },
        { threshold: [0.55] }
      );
      io.observe(el);
      return io;
    });
    return () => ios.forEach((o) => o.disconnect());
  }, [items]);

  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([id, el]) => {
      if (!el) return;
      if (id === activeId) el.play().catch(() => {});
      else el.pause();
    });
  }, [activeId]);

  if (!items.length)
    return (
      <p className="text-sm text-muted-foreground text-center py-10">
        This restaurant hasn't posted a video menu yet.
      </p>
    );

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <Link
            key={item.id}
            to={`/item/${item.id}`}
            className="relative block w-full rounded-3xl overflow-hidden bg-card border border-border aspect-[4/5] active:scale-[0.99] transition-transform"
          >
            {item.video_url ? (
              <video
                ref={(el) => {
                  videoRefs.current[item.id] = el;
                }}
                data-id={item.id}
                src={item.video_url}
                poster={item.thumbnail_url}
                muted
                loop
                playsInline
                preload="metadata"
                className="w-full h-full object-cover"
              />
            ) : item.thumbnail_url ? (
              <img src={item.thumbnail_url} className="w-full h-full object-cover" alt={item.name} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/15" />

            {item.is_featured && (
              <span className="absolute top-3 left-3 flex items-center gap-1 bg-primary text-primary-foreground text-[11px] font-bold px-2 py-1 rounded-full">
                <Star className="w-3 h-3 fill-current" /> Special
              </span>
            )}

            <span className="absolute top-3 right-3 flex items-center gap-1 bg-black/55 text-white text-[10px] font-medium px-2 py-1 rounded-full backdrop-blur">
              <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-primary animate-pulse" : "bg-white/40"}`} />
              {active ? "playing" : "video"}
            </span>

            <div className="absolute bottom-0 inset-x-0 p-4">
              <p className="text-base font-bold text-white leading-tight line-clamp-1">{item.name}</p>
              {item.description && (
                <p className="text-xs text-white/70 line-clamp-2 mt-0.5">{item.description}</p>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="text-primary font-bold">${item.price.toFixed(2)}</span>
                <span className="bg-white text-black text-xs font-semibold px-3 py-1.5 rounded-full">
                  View dish
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}