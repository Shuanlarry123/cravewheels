import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Send, Loader2, MessageCircle, Lock } from "lucide-react";
import { toast } from "react-hot-toast";
import { useOrderedFromRestaurant } from "@/lib/useOrderedItems";
import StarRating from "@/components/comments/StarRating";
import VerifiedComment from "@/components/comments/VerifiedComment";
import TriedItButton from "@/components/comments/TriedItButton";

/**
 * Comment section shared by menu-item videos and posts.
 * - Every user can comment.
 * - Verified badge + rating are only for users who ordered from the restaurant.
 * - Pass `postId` to target a post; pass `itemId` to target a menu item.
 */
export default function CommentSection({ itemId, itemName, restaurantId, postId }) {
  const { user } = useAuth();
  const isBuyer = useOrderedFromRestaurant(restaurantId); // null | boolean
  const isPost = !!postId;
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [posting, setPosting] = useState(false);
  const [orderInfo, setOrderInfo] = useState({});

  const load = async () => {
    try {
      const cmts = await base44.entities.Comment.filter(
        isPost ? { post_id: postId } : { menu_item_id: itemId },
        "-created_date",
        100
      );
      setComments(cmts);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.Comment.subscribe(() => load());
    return unsub;
  }, [itemId, postId]);

  // Per-author order history for this dish → "Ordered N times" badges (menu items only)
  useEffect(() => {
    if (isPost) return;
    (async () => {
      try {
        const orders = await base44.entities.Order.filter({}, "-created_date", 500);
        const map = {};
        orders.forEach((o) => {
          if (o.status === "cancelled") return;
          const person = o.created_by_id;
          if (!person) return;
          const created = o.created_date;
          (o.items || []).forEach((it) => {
            if (it?.menu_item_id !== itemId) return;
            const u = map[person] || (map[person] = { count: 0, lastDate: null });
            u.count++;
            if (!u.lastDate || new Date(created) > new Date(u.lastDate)) u.lastDate = created;
          });
        });
        setOrderInfo(map);
      } catch {
        /* ignore */
      }
    })();
  }, [itemId, isPost]);

  const submit = async () => {
    if (!user || !text.trim() || posting) return;
    setPosting(true);
    try {
      const c = await base44.entities.Comment.create({
        menu_item_id: isPost ? undefined : itemId,
        menu_item_name: isPost ? undefined : itemName,
        post_id: isPost ? postId : undefined,
        restaurant_id: restaurantId,
        author_name: user.full_name || user.email,
        comment: text.trim(),
        rating: isBuyer ? rating : 0,
        verified: !!isBuyer,
      });
      setComments((cs) => [c, ...cs]);
      setText("");
      setRating(5);
      toast.success("Comment posted");
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Comments {comments.length > 0 && `(${comments.length})`}
        </h2>
      </div>

      {!isPost && (
        <TriedItButton itemId={itemId} itemName={itemName} restaurantId={restaurantId} />
      )}

      <div className="mb-4 space-y-2">
        {isBuyer && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Your rating:</span>
            <StarRating value={rating} onChange={setRating} size={18} />
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={isBuyer ? "Share your experience..." : "Add a comment..."}
            className="flex-1 h-10 rounded-full bg-card border border-border px-4 text-sm"
          />
          <button
            onClick={submit}
            disabled={posting || !text.trim()}
            className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shrink-0 disabled:opacity-50"
          >
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        {isBuyer === false && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>
              Haven't ordered here yet? Your comment shows without a verified badge — order to get verified.
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <VerifiedComment key={c.id} comment={c} orderInfo={orderInfo} />
          ))}
        </div>
      )}
    </div>
  );
}