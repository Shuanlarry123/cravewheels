import React, { useEffect, useState } from "react";
import { Heart, Bookmark, MessageCircle, Send, X, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";

export default function VideoEngagement({ item, active, onAdd }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!active || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const [likes, saves, cmts] = await Promise.all([
          base44.entities.Like.filter({ menu_item_id: item.id }, "-created_date", 500),
          base44.entities.Saved.filter({ menu_item_id: item.id, created_by_id: user.id }, "-created_date", 5),
          base44.entities.Comment.filter({ menu_item_id: item.id }, "-created_date", 50),
        ]);
        if (cancelled) return;
        setLikeCount(likes.length);
        setLiked(likes.some((l) => l.created_by_id === user.id));
        setSaved(saves.length > 0);
        setComments(cmts);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, user, item.id]);

  const toggleLike = async () => {
    if (!user) return;
    try {
      if (liked) {
        const mine = await base44.entities.Like.filter(
          { menu_item_id: item.id, created_by_id: user.id },
          "-created_date",
          1
        );
        if (mine[0]) await base44.entities.Like.delete(mine[0].id);
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      } else {
        await base44.entities.Like.create({
          menu_item_id: item.id,
          menu_item_name: item.name,
          video_url: item.video_url,
          thumbnail_url: item.thumbnail_url,
          restaurant_id: item.restaurant_id,
          restaurant_name: item.restaurant_name,
          price: item.price,
        });
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
    } catch {
      /* ignore */
    }
  };

  const toggleSave = async () => {
    if (!user) return;
    try {
      if (saved) {
        const mine = await base44.entities.Saved.filter(
          { menu_item_id: item.id, created_by_id: user.id },
          "-created_date",
          1
        );
        if (mine[0]) await base44.entities.Saved.delete(mine[0].id);
        setSaved(false);
      } else {
        await base44.entities.Saved.create({
          menu_item_id: item.id,
          menu_item_name: item.name,
          video_url: item.video_url,
          thumbnail_url: item.thumbnail_url,
          restaurant_id: item.restaurant_id,
          restaurant_name: item.restaurant_name,
          price: item.price,
        });
        setSaved(true);
      }
    } catch {
      /* ignore */
    }
  };

  const submit = async () => {
    if (!user || !text.trim()) return;
    try {
      const c = await base44.entities.Comment.create({
        menu_item_id: item.id,
        menu_item_name: item.name,
        restaurant_id: item.restaurant_id,
        author_name: user.full_name || user.email,
        comment: text.trim(),
      });
      setComments((cs) => [c, ...cs]);
      setText("");
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-4 z-20">
        <button
          onClick={() => onAdd?.(item)}
          className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </button>
        <button onClick={toggleLike} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <span className="w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
            <Heart className={cn("w-6 h-6", liked ? "fill-primary text-primary" : "text-white")} />
          </span>
          <span className="text-white text-xs font-medium">{likeCount}</span>
        </button>
        <button
          onClick={() => setShowComments((s) => !s)}
          className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
        >
          <span className="w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </span>
          <span className="text-white text-xs font-medium">{comments.length}</span>
        </button>
        <button onClick={toggleSave} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <span className="w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
            <Bookmark className={cn("w-6 h-6", saved ? "fill-primary text-primary" : "text-white")} />
          </span>
          <span className="text-white text-xs font-medium">{saved ? "Saved" : "Save"}</span>
        </button>
      </div>

      {showComments && (
        <div
          className="absolute inset-0 z-[60] flex flex-col justify-end bg-black/50 pb-16"
          onClick={() => setShowComments(false)}
        >
          <div
            className="bg-card border-t border-border rounded-t-2xl max-h-[60%] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-border">
              <span className="text-sm font-semibold">{comments.length} comments</span>
              <button onClick={() => setShowComments(false)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
              {comments.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">No comments yet. Be the first!</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {(c.author_name || "U")[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{c.author_name || "User"}</p>
                      <p className="text-sm text-muted-foreground">{c.comment}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t border-border flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Add a comment..."
                className="flex-1 h-10 rounded-full bg-background border border-border px-4 text-sm"
              />
              <button
                onClick={submit}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}