import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Plus, Play } from "lucide-react";
import VideoEngagement from "@/components/VideoEngagement";
import { Image } from "@/components/ui/image";

export default function VideoCard({ item, distanceKm, etaMin, onAdd, active, muted, lite }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  // Full-video (non-lite) autoplay behavior
  useEffect(() => {
    if (lite) return;
    const v = videoRef.current;
    if (!v) return;
    if (active) {
      v.currentTime = 0;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [active, lite]);

  // In lite mode, stop the video when the card scrolls away
  useEffect(() => {
    if (!lite || !playing) return;
    if (!active) setPlaying(false);
  }, [active, lite, playing]);

  return (
    <section className="relative h-[100dvh] w-full bg-black flex items-center justify-center snap-start overflow-hidden">
      {lite ? (
        playing ? (
          <video
            ref={videoRef}
            src={item.video_url}
            poster={item.thumbnail_url}
            loop
            muted={muted}
            playsInline
            autoPlay
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="absolute inset-0 w-full h-full flex items-center justify-center"
            aria-label="Play video"
          >
            {item.thumbnail_url ? (
              <Image
                src={item.thumbnail_url}
                fittingType="fill"
                className="absolute inset-0 w-full h-full"
              />
            ) : (
              <div className="absolute inset-0 bg-card" />
            )}
            <div className="absolute inset-0 bg-black/20" />
            <span className="relative z-10 w-16 h-16 rounded-full bg-black/55 backdrop-blur flex items-center justify-center ring-1 ring-white/30 active:scale-95 transition-transform">
              <Play className="w-7 h-7 text-white fill-white translate-x-0.5" />
            </span>
          </button>
        )
      ) : (
        <video
          ref={videoRef}
          src={item.video_url}
          poster={item.thumbnail_url}
          loop
          muted={muted}
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40 pointer-events-none" />

      <VideoEngagement item={item} active={active} onAdd={onAdd} />

      {/* Bottom info */}
      <div className="absolute left-0 right-0 bottom-24 px-4 pb-2 z-20">
        <div className="flex items-center gap-2 mb-3">
          <Link
            to={`/restaurant/${item.restaurant_id}`}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full pl-1 pr-3 py-1 border border-white/15"
          >
            <span className="w-5 h-5 rounded-full bg-primary/80 flex items-center justify-center text-[10px] font-bold text-white">
              {(item.restaurant_name || "R")[0]?.toUpperCase()}
            </span>
            <span className="text-xs font-semibold text-white">{item.restaurant_name}</span>
          </Link>
          <button
            onClick={() => onAdd?.(item)}
            className="shrink-0 h-10 pl-2 pr-3.5 rounded-full bg-gradient-to-br from-primary to-orange-500 text-white font-bold text-sm flex items-center gap-2 active:scale-95 transition-transform shadow-[0_8px_24px_-6px_rgba(255,107,44,0.65)] ring-1 ring-white/25"
          >
            <span className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center">
              <Plus className="w-3.5 h-3.5" strokeWidth={3} />
            </span>
            ${item.price.toFixed(2)}
          </button>
        </div>
        <h2 className="text-white text-2xl font-extrabold leading-tight drop-shadow-lg">{item.name}</h2>
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