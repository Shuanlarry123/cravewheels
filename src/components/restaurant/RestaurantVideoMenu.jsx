import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Star, Flame } from "lucide-react";

const CATEGORY_ORDER = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Specials",
  "Desserts",
  "Drinks",
  "Bowls",
  "Other",
];

function AutoplayVideo({ item }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio >= 0.6) el.play().catch(() => {});
          else el.pause();
        });
      },
      { threshold: [0.6] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!item.video_url) {
    return item.thumbnail_url ? (
      <img src={item.thumbnail_url} className="w-full h-full object-cover" alt={item.name} />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
    );
  }
  return (
    <video
      ref={ref}
      src={item.video_url}
      poster={item.thumbnail_url}
      muted
      loop
      playsInline
      preload="metadata"
      className="w-full h-full object-cover"
    />
  );
}

function VideoCard({ item }) {
  return (
    <Link
      to={`/item/${item.id}`}
      className="relative shrink-0 w-40 rounded-2xl overflow-hidden bg-card border border-border aspect-[3/4] block active:scale-95 transition-transform"
    >
      <AutoplayVideo item={item} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/10" />
      {item.is_featured && (
        <span className="absolute top-2 left-2 flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          <Star className="w-2.5 h-2.5 fill-current" /> Special
        </span>
      )}
      <div className="absolute bottom-0 inset-x-0 p-2.5">
        <p className="text-xs font-semibold text-white line-clamp-1">{item.name}</p>
        <p className="text-primary text-xs font-bold">${item.price.toFixed(2)}</p>
      </div>
    </Link>
  );
}

function Section({ title, subtitle, icon: Icon, items }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-sm font-bold flex items-center gap-1.5">
          {Icon && <Icon className="w-4 h-4 text-primary" />}
          {title}
        </h3>
        {subtitle && <span className="text-[11px] text-muted-foreground">{subtitle}</span>}
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {items.map((item) => (
          <VideoCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function RestaurantVideoMenu({ items }) {
  if (!items || !items.length)
    return (
      <p className="text-sm text-muted-foreground text-center py-10">
        This restaurant hasn't posted a video menu yet.
      </p>
    );

  const score = (i) => (i.views || 0) + (i.likes || 0);
  const popular = [...items].sort((a, b) => score(b) - score(a)).slice(0, 8);

  const grouped = {};
  items.forEach((i) => {
    const c = (i.category || "").trim() || "Other";
    (grouped[c] = grouped[c] || []).push(i);
  });

  const ordered = CATEGORY_ORDER.filter((c) => grouped[c]);
  const extra = Object.keys(grouped).filter((c) => !CATEGORY_ORDER.includes(c));
  const sections = [
    ...ordered.map((c) => ({ title: c, items: grouped[c] })),
    ...extra.map((c) => ({ title: c, items: grouped[c] })),
  ];

  return (
    <div className="space-y-6">
      {popular.length > 1 && (
        <Section
          title="Most Loved"
          subtitle="The combo everybody orders"
          icon={Flame}
          items={popular}
        />
      )}
      {sections.map((s) => (
        <Section key={s.title} title={s.title} items={s.items} />
      ))}
    </div>
  );
}