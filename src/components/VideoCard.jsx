import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { MapPin, Plus } from "lucide-react";
import VideoEngagement from "@/components/VideoEngagement";

export default function VideoCard({ item, distanceKm, etaMin, onAdd, active, muted }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) {
      v.currentTime = 0;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [active]);

  return (
    <section className="relative h-[100dvh] w-full bg-black flex items-center justify-center snap-start overflow-hidden">
      <video
        ref={videoRef}
        src={item.video_url}
        poster={item.thumbnail_url}
        loop
        muted={muted}
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40 pointer-events-none" />

      <VideoEngagement item={item} active={active} onAdd={onAdd} />

      {/* Bottom info */}
      <div className="absolute left-0 right-0 bottom-24 px-4 pb-2 z-20">
        <Link
          to={`/restaurant/${item.restaurant_id}`}
          className="inline-flex items-center gap-2 mb-3 bg-white/10 backdrop-blur-md rounded-full pl-1 pr-3 py-1 border border-white/15"
        >
          <span className="w-5 h-5 rounded-full bg-primary/80 flex items-center justify-center text-[10px] font-bold text-white">
            {(item.restaurant_name || "R")[0]?.toUpperCase()}
          </span>
          <span className="text-xs font-semibold text-white">{item.restaurant_name}</span>
        </Link>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-white text-2xl font-extrabold leading-tight drop-shadow-lg flex-1">{item.name}</h2>
          <button
            onClick={() => onAdd?.(item)}
            className="shrink-0 h-11 pl-2 pr-3.5 rounded-full bg-gradient-to-br from-primary to-orange-500 text-white font-bold text-sm flex items-center gap-2 active:scale-95 transition-transform shadow-[0_8px_24px_-6px_rgba(255,107,44,0.65)] ring-1 ring-white/25"
          >
            <span className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center">
              <Plus className="w-4 h-4" strokeWidth={3} />
            </span>
            ${item.price.toFixed(2)}
          </button>
        </div>
        <p className="text-white/85 text-sm mt-2 line-clamp-2 drop-shadow">{item.description}</p>
        {distanceKm != null && (
          <div className="mt-2 inline-flex items-center gap-1.5 bg-black/35 backdrop-blur-md text-white/90 text-xs font-medium rounded-full px-2.5 py-1 border border-white/10">
            <MapPin className="w-3.5 h-3.5 text-primary" /> {distanceKm.toFixed(1)} km · {etaMin} min away
          </div>
        )}
      </div>
    </section>
  );
}