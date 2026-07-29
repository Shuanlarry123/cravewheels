import React, { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Send, X, Plus, Loader2, Share2, Link2, Copy, Check, ShieldCheck, Lock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useOrderedItems } from "@/lib/useOrderedItems";
import StarRating from "@/components/comments/StarRating";
import VerifiedComment from "@/components/comments/VerifiedComment";
import TriedItButton from "@/components/comments/TriedItButton";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function VideoEngagement({ item, active, onAdd }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);
  const orderedIds = useOrderedItems();
  const canComment = !!orderedIds?.has(item.id);
  const [rating, setRating] = useState(5);
  const shareUrl = `${window.location.origin}/item/${item.id}`;
  const shareData = {
    title: `${item.name} — ${item.restaurant_name} · CraveReel`,
    text: `Check out ${item.name} from ${item.restaurant_name} on CraveReel!`,
    url: shareUrl,
  };

  useEffect(() => {
    if (!active || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const [likes, cmts] = await Promise.all([
          base44.entities.Like.filter({ menu_item_id: item.id }, "-created_date", 500),
          base44.entities.Comment.filter({ menu_item_id: item.id }, "-created_date", 50),
        ]);
        if (cancelled) return;
        setLikeCount(likes.length);
        setLiked(likes.some((l) => l.created_by_id === user.id));
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

  const copyLink = async () => {
    const copyLegacy = () => {
      try {
        const ta = document.createElement("textarea");
        ta.value = shareUrl;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return ok;
      } catch {
        return false;
      }
    };
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else if (copyLegacy()) {
        // copied via legacy path
      } else {
        toast.error("Select the link above to copy it manually");
        return;
      }
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Select the link above to copy it manually");
    }
  };

  const nativeShare = async () => {
    try {
      if (navigator.share) await navigator.share(shareData);
    } catch (e) {
      if (e?.name !== "AbortError") toast.error("Sharing not available — copy the link instead");
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        if (e?.name !== "AbortError") setShowShare(true);
      }
    } else {
      setShowShare(true);
    }
  };

  const submit = async () => {
    if (!user || !text.trim() || posting) return;
    if (!canComment) {
      toast.error("Only customers who ordered this dish can comment");
      return;
    }
    setPosting(true);
    try {
      const c = await base44.entities.Comment.create({
        menu_item_id: item.id,
        menu_item_name: item.name,
        restaurant_id: item.restaurant_id,
        author_name: user.full_name || user.email,
        comment: text.trim(),
        rating,
        verified: true,
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

        <TriedItButton itemId={item.id} itemName={item.name} restaurantId={item.restaurant_id} />

        <button onClick={share} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <span className="w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
            <Share2 className="w-6 h-6 text-white" />
          </span>
          <span className="text-white text-xs font-medium">Share</span>
        </button>
      </div>

      {showShare && (
        <div
          className="absolute inset-0 z-[60] flex flex-col justify-end bg-black/60"
          onClick={() => setShowShare(false)}
        >
          <div
            className="bg-card border-t border-border rounded-t-2xl p-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Share this dish</span>
              <button onClick={() => setShowShare(false)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            {typeof navigator !== "undefined" && navigator.share && (
              <button
                onClick={nativeShare}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <Share2 className="w-4 h-4" /> Share via apps
              </button>
            )}
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Dish link</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  className="flex-1 h-11 rounded-xl bg-background border border-border px-3 text-sm min-w-0"
                />
                <button
                  onClick={copyLink}
                  className={cn(
                    "h-11 px-4 rounded-xl text-sm font-semibold flex items-center gap-1.5 shrink-0 active:scale-95 transition-transform",
                    copied ? "bg-green-600 text-white" : "bg-primary text-primary-foreground"
                  )}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
                <Link2 className="w-3 h-3" />
                Tap the link to select it, then long-press to copy on mobile.
              </p>
            </div>
          </div>
        </div>
      )}

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
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" /> Verified comments
              </span>
              <button onClick={() => setShowComments(false)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
              {comments.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">
                  No verified comments yet. Order this dish to be the first!
                </p>
              ) : (
                comments.map((c) => <VerifiedComment key={c.id} comment={c} />)
              )}
            </div>
            {canComment ? (
              <div className="p-3 border-t border-border space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">Your rating:</span>
                  <StarRating value={rating} onChange={setRating} size={16} />
                </div>
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    placeholder="Share your experience..."
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
            ) : (
              <div className="p-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Only customers who ordered this dish can comment.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}