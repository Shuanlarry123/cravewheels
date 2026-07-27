import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Send, MessageCircle, Loader2 } from "lucide-react";

export default function CommentSection({ itemId, itemName, restaurantId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
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
    if (!user || !text.trim()) return;
    setPosting(true);
    try {
      const c = await base44.entities.Comment.create({
        menu_item_id: itemId,
        menu_item_name: itemName,
        restaurant_id: restaurantId,
        author_name: user.full_name || user.email,
        comment: text.trim(),
      });
      setComments((cs) => [c, ...cs]);
      setText("");
    } catch {
      /* ignore */
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

      <div className="flex gap-2 mb-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Add a comment..."
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

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6">
          No comments yet. Be the first!
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {(c.author_name || "U")[0]?.toUpperCase()}
              </div>
              <div className="flex-1 bg-card border border-border rounded-2xl rounded-tl-sm px-3 py-2">
                <p className="text-xs font-semibold">{c.author_name || "User"}</p>
                <p className="text-sm text-muted-foreground mt-0.5 break-words">{c.comment}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}