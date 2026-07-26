import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
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
        <Link to={`/restaurant/${item.restaurant_id}`} className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-white/90">@{item.restaurant_name}</span>
        </Link>
        <h2 className="text-white text-xl font-bold leading-tight drop-shadow">{item.name}</h2>
        <p className="text-white/80 text-sm mt-1 line-clamp-2">{item.description}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-primary font-bold text-lg">${item.price.toFixed(2)}</span>
          {distanceKm != null && (
            <span className="flex items-center gap-1 text-white/80 text-xs">
              <MapPin className="w-3.5 h-3.5" /> {distanceKm.toFixed(1)} km · {etaMin} min
            </span>
          )}
        </div>
      </div>
    </section>
  );
}