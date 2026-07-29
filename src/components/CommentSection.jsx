import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Send, Loader2, ShieldCheck, Lock } from "lucide-react";
import { toast } from "react-hot-toast";
import { useOrderedItems } from "@/lib/useOrderedItems";
import StarRating from "@/components/comments/StarRating";
import VerifiedComment from "@/components/comments/VerifiedComment";

export default function CommentSection({ itemId, itemName, restaurantId }) {
  const { user } = useAuth();
  const orderedIds = useOrderedItems();
  const canComment = !!orderedIds?.has(itemId);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [posting, setPosting] = useState(false);

  const load = async () => {
    try {
      const cmts = await base44.entities.Comment.filter({ menu_item_id: itemId }, "-created_date", 100);
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
  }, [itemId]);

  const submit = async () => {
    if (!user || !text.trim() || posting) return;
    if (!canComment) {
      toast.error("Only customers who ordered this dish can comment");
      return;
    }
    setPosting(true);
    try {
      const c = await base44.entities.Comment.create({
        menu_item_id: itemId,
        menu_item_name: itemName,
        restaurant_id: restaurantId,
        author_name: user.full_name || user.email,
        comment: text.trim(),
        rating,
        verified: true,
      });
      setComments((cs) => [c, ...cs]);
      setText("");
      setRating(5);
      toast.success("Comment sent");
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Verified comments {comments.length > 0 && `(${comments.length})`}
        </h2>
      </div>

      {canComment ? (
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Your rating:</span>
            <StarRating value={rating} onChange={setRating} size={18} />
          </div>
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Share your experience..."
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
        </div>
      ) : (
        <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border rounded-2xl px-3 py-2.5">
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span>Only customers who ordered this dish through CraveWheels can comment.</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6">
          No verified comments yet. Order this dish to be the first!
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <VerifiedComment key={c.id} comment={c} />
          ))}
        </div>
      )}
    </div>
  );
}