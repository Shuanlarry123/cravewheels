import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MessageCircle, Play } from "lucide-react";
import { Image } from "@/components/ui/image";

/**
 * Full-screen feed card for a Post (restaurant/creator video). Shown in the
 * For You feed interleaved with menu-item videos. Tapping "Comments" opens the
 * post detail page where anyone can comment.
 */
export default function PostVideoCard({ post, active, muted, lite }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const navigate = useNavigate();

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

  useEffect(() => {
    if (!lite || !playing) return;
    if (!active) setPlaying(false);
  }, [active, lite, playing]);

  const open = () => navigate(`/post/${post.id}`);

  const AuthorChip = () =>
    post.restaurant_id ? (
      <Link
        to={`/restaurant/${post.restaurant_id}`}
        className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full pl-1 pr-3 py-1 border border-white/15"
      >
        <span className="w-5 h-5 rounded-full bg-primary/80 flex items-center justify-center text-[10px] font-bold text-white">
          {(post.author_name || "R")[0]?.toUpperCase()}
        </span>
        <span className="text-xs font-semibold text-white">{post.author_name}</span>
      </Link>
    ) : (
      <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full pl-1 pr-3 py-1 border border-white/15">
        <span className="w-5 h-5 rounded-full bg-primary/80 flex items-center justify-center text-[10px] font-bold text-white">
          {(post.author_name || "C")[0]?.toUpperCase()}
        </span>
        <span className="text-xs font-semibold text-white">{post.author_name}</span>
        {post.author_type === "creator" && (
          <span className="text-[9px] font-bold text-primary bg-primary/20 px-1.5 py-0.5 rounded-full">Creator</span>
        )}
      </span>
    );

  return (
    <section className="relative h-[100dvh] w-full bg-black flex items-center justify-center snap-start overflow-hidden">
      {lite ? (
        playing ? (
          <video
            ref={videoRef}
            src={post.video_url}
            poster={post.thumbnail_url}
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
            {post.thumbnail_url ? (
              <Image src={post.thumbnail_url} fittingType="fill" className="absolute inset-0 w-full h-full" />
            ) : (
              <div className="absolute inset-0 bg-card" />
            )}
            <div className="absolute inset-0 bg-black/20" />
            <span className="relative z-10 w-16 h-16 rounded-full bg-black/55 backdrop-blur flex items-center justify-center ring-1 ring-white/30">
              <Play className="w-7 h-7 text-white fill-white translate-x-0.5" />
            </span>
          </button>
        )
      ) : (
        <video
          ref={videoRef}
          src={post.video_url}
          poster={post.thumbnail_url}
          loop
          muted={muted}
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40 pointer-events-none" />

      <div className="absolute left-0 right-0 bottom-24 px-4 pb-2 z-20">
        <div className="mb-3">
          <AuthorChip />
        </div>
        {post.caption && (
          <p className="text-white text-base font-semibold leading-snug drop-shadow mb-3 line-clamp-3">
            {post.caption}
          </p>
        )}
        <button
          onClick={open}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-white/15 backdrop-blur text-white text-sm font-semibold border border-white/20 active:scale-95 transition-transform"
        >
          <MessageCircle className="w-4 h-4" /> Comments
        </button>
      </div>
    </section>
  );
}