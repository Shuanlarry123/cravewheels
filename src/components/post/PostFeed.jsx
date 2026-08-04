import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Video, Eye, MessageCircle, Plus, X } from "lucide-react";
import { Image } from "@/components/ui/image";
import PostComposer from "@/components/post/PostComposer";

/**
 * Grid of an author's (restaurant/creator) video posts. The owner view shows
 * a "+" button that reveals the composer; the public view (editable=false)
 * is read-only. Each tile shows views + comment counts.
 */
export default function PostFeed({
  authorType,
  authorId,
  authorName,
  authorAvatarUrl,
  restaurantId,
  title = "Feed",
  editable = true,
}) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [commentCounts, setCommentCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);

  const load = async () => {
    try {
      const [p, cmts] = await Promise.all([
        base44.entities.Post.filter({ author_type: authorType, author_id: authorId }, "-created_date", 50),
        base44.entities.Comment.filter({}, "-created_date", 500),
      ]);
      setPosts(p);
      const counts = {};
      cmts.forEach((c) => {
        if (c.post_id) counts[c.post_id] = (counts[c.post_id] || 0) + 1;
      });
      setCommentCounts(counts);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.Post.subscribe(() => load());
    const unsubC = base44.entities.Comment.subscribe(() => load());
    return () => {
      unsub();
      unsubC();
    };
  }, [authorType, authorId]);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold">{title}</h2>
          {posts.length > 0 && <span className="text-[11px] text-muted-foreground">{posts.length} posts</span>}
        </div>
        {editable && (
          <button
            onClick={() => setShowComposer((s) => !s)}
            className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-90 transition-transform"
            aria-label={showComposer ? "Close composer" : "Post a video"}
          >
            {showComposer ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" strokeWidth={2.5} />}
          </button>
        )}
      </div>

      {editable && showComposer && (
        <div className="mb-4">
          <PostComposer
            authorType={authorType}
            authorId={authorId}
            authorName={authorName}
            authorAvatarUrl={authorAvatarUrl}
            restaurantId={restaurantId}
            onCreated={() => setShowComposer(false)}
          />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="aspect-[9/16] rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center">
          <Video className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-sm font-semibold">No posts yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            {editable
              ? "Tap the + to post a video — it shows up here and in the For You feed."
              : "Posted videos show up here and in the For You feed."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {posts.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/post/${p.id}`)}
              className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black border border-border text-left active:scale-[0.98] transition-transform"
            >
              {p.thumbnail_url ? (
                <Image src={p.thumbnail_url} fittingType="fill" className="absolute inset-0 w-full h-full" />
              ) : (
                <video src={p.video_url} className="absolute inset-0 w-full h-full object-cover" muted playsInline preload="metadata" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              {p.caption && (
                <p className="absolute bottom-1.5 left-2 right-2 text-[11px] text-white font-medium line-clamp-2">
                  {p.caption}
                </p>
              )}
              <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                <span className="flex items-center gap-0.5 bg-black/50 px-1.5 py-0.5 rounded-full text-[10px] text-white">
                  <Eye className="w-2.5 h-2.5" /> {p.views || 0}
                </span>
                <span className="flex items-center gap-0.5 bg-black/50 px-1.5 py-0.5 rounded-full text-[10px] text-white">
                  <MessageCircle className="w-2.5 h-2.5" /> {commentCounts[p.id] || 0}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}