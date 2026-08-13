import React, { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Send, X, Plus, Loader2, Share2, Bookmark } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { getShareOrigin } from "@/lib/shareOrigin";
import { useOrderedItems } from "@/lib/useOrderedItems";
import StarRating from "@/components/comments/StarRating";
import VerifiedComment from "@/components/comments/VerifiedComment";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function VideoEngagement({ item, active, onAdd, ordersCount, orderInfoByUser }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const inputRef = useRef(null);
  const orderedIds = useOrderedItems();
  const canComment = !!orderedIds?.has(item.id);
  const [rating, setRating] = useState(5);

  useEffect(() => {
    if (!active || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const [likes, cmts, saves] = await Promise.all([
          base44.entities.Like.filter({ menu_item_id: item.id }, "-created_date", 500),
          base44.entities.Comment.filter({ menu_item_id: item.id }, "-created_date", 50),
          base44.entities.Saved.filter({ menu_item_id: item.id, created_by_id: user.id }, "-created_date", 1),
        ]);
        if (cancelled) return;
        setLikeCount(likes.length);
        setLiked(likes.some((l) => l.created_by_id === user.id));
        setComments(cmts);
        setSaved(saves.length > 0);
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

  const share = async () => {
    const url = `${getShareOrigin()}/functions/ogPreview?type=item&id=${item.id}`;
    const title = `${item.name} — ${item.restaurant_name || "Cravewheels"}`;
    let copied = false;

    // Always copy the link to the clipboard first (works as a standalone convenience
    // and as a safety net if the native share sheet is unavailable or blocked).
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        copied = true;
      }
    } catch {
      copied = false;
    }
    if (!copied) {
      try {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        copied = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        copied = false;
      }
    }
    if (copied) toast.success("Link copied — paste anywhere to share");

    // Then open the native share sheet if the browser supports it
    if (navigator.share) {
      try {
        await navigator.share({ title, text: item.description || title, url });
      } catch {
        /* user dismissed — link already copied */
      }
    } else if (!copied) {
      toast(`Copy this link:\n${url}`, { duration: 10000 });
    }
  };

  const toggleSave = async () => {
    if (!user) return;
    try {
      if (saved) {
        const mine = await base44.entities.Saved.filter({ menu_item_id: item.id, created_by_id: user.id }, "-created_date", 1);
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
    if (!user || !text.trim() || posting) return;
    setPosting(true);
    try {
      const c = await base44.entities.Comment.create({
        menu_item_id: item.id,
        menu_item_name: item.name,
        restaurant_id: item.restaurant_id,
        author_name: user.full_name || user.email,
        comment: text.trim(),
        rating: canComment ? rating : 0,
        verified: canComment,
      });
      setComments((cs) => [c, ...cs]);
      setText("");
      setRating(5);
      inputRef.current?.blur();
      toast.success("Comment sent");
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setPosting(false);
    }
  };

  return (
    <>
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-4 z-30">
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
          <span className="text-white text-xs font-medium">{likeCount.toLocaleString()}</span>
        </button>
        <button
          onClick={() => setShowComments((s) => !s)}
          className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
        >
          <span className="w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </span>
          <span className="text-white text-xs font-medium">{comments.length.toLocaleString()}</span>
        </button>
        <button onClick={share} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <span className="w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
            <Share2 className="w-6 h-6 text-white" />
          </span>
          <span className="text-white text-xs font-medium">Share</span>
        </button>
        <button onClick={toggleSave} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <span className="w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
            <Bookmark className={cn("w-6 h-6", saved ? "fill-primary text-primary" : "text-white")} />
          </span>
          <span className="text-white text-xs font-medium">Save</span>
        </button>
      </div>

      {showComments && (
        <div
          className="absolute inset-0 z-[60] flex flex-col justify-end bg-black/50 pb-[calc(4.5rem+env(safe-area-inset-bottom))]"
          onClick={() => setShowComments(false)}
        >
          <div
            className="bg-card border-t border-border rounded-t-2xl max-h-[60%] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-border">
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-primary" /> Comments
              </span>
              <button onClick={() => setShowComments(false)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
              {comments.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((c) => <VerifiedComment key={c.id} comment={c} orderInfo={orderInfoByUser} />)
              )}
            </div>
            <div className="p-3 border-t border-border space-y-2">
              {canComment && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">Your rating:</span>
                  <StarRating value={rating} onChange={setRating} size={16} />
                </div>
              )}
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder={canComment ? "Share your experience..." : "Add a comment..."}
                  className="flex-1 h-10 rounded-full bg-background border border-border px-4 text-sm"
                />
                <button
                  onClick={submit}
                  disabled={posting || !text.trim()}
                  className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shrink-0 disabled:opacity-50"
                >
                  {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}