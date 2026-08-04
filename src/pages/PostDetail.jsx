import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Eye } from "lucide-react";
import CommentSection from "@/components/CommentSection";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const p = await base44.entities.Post.get(id);
        setPost(p);
        base44.entities.Post.update(id, { views: (p.views || 0) + 1 }).catch(() => {});
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading)
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  if (!post) return <div className="p-8 text-center text-muted-foreground">Post not found.</div>;

  return (
    <div className="min-h-[100dvh] bg-background pb-32">
      <div className="relative w-full aspect-[9/14] bg-black max-h-[70vh]">
        <video
          ref={videoRef}
          src={post.video_url}
          poster={post.thumbnail_url}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 -mt-6 relative z-10">
        <div className="flex items-center gap-3 bg-card border border-border rounded-2xl p-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
            {(post.author_name || "U")[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{post.author_name}</p>
            <p className="text-xs text-muted-foreground capitalize">{post.author_type}</p>
          </div>
          {post.restaurant_id && (
            <Link to={`/restaurant/${post.restaurant_id}`} className="text-xs text-primary font-medium">
              View restaurant
            </Link>
          )}
        </div>

        {post.caption && <p className="text-base leading-relaxed mb-3">{post.caption}</p>}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> {post.views || 0} views
          </span>
        </div>

        <CommentSection postId={post.id} restaurantId={post.restaurant_id} />
      </div>
    </div>
  );
}