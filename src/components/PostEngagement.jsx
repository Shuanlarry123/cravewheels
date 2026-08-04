import React, { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Send, Bookmark, Share2, UserPlus, UserCheck, X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function PostEngagement({ post, active }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const inputRef = useRef(null);

  const followTarget = post.restaurant_id
    ? { restaurant_id: post.restaurant_id, restaurant_name: post.author_name, restaurant_logo_url: "" }
    : post.author_id
    ? { creator_id: post.author_id, creator_name: post.author_name, creator_avatar_url: post.author_avatar_url || "" }
    : null;

  useEffect(() => {
    if (!active || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const [likes, cmts, saves, follows] = await Promise.all([
          base44.entities.PostLike.filter({ post_id: post.id }, "-created_date", 500),
          base44.entities.Comment.filter({ post_id: post.id }, "-created_date", 50),
          base44.entities.SavedPost.filter({ post_id: post.id, created_by_id: user.id }, "-created_date", 1),
          followTarget
            ? base44.entities.Follow.filter(
                post.restaurant_id
                  ? { restaurant_id: post.restaurant_id, created_by_id: user.id }
                  : { creator_id: post.author_id, created_by_id: user.id },
                "-created_date",
                1
              )
            : Promise.resolve([]),
        ]);
        if (cancelled) return;
        setLikeCount(likes.length);
        setLiked(likes.some((l) => l.created_by_id === user.id));
        setComments(cmts);
        setSaved(saves.length > 0);
        setFollowing(follows.length > 0);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, user, post.id]);

  const toggleLike = async () => {
    if (!user) return;
    try {
      if (liked) {
        const mine = await base44.entities.PostLike.filter({ post_id: post.id, created_by_id: user.id }, "-created_date", 1);
        if (mine[0]) await base44.entities.PostLike.delete(mine[0].id);
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      } else {
        await base44.entities.PostLike.create({ post_id: post.id, post_author_name: post.author_name });
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
        const mine = await base44.entities.SavedPost.filter({ post_id: post.id, created_by_id: user.id }, "-created_date", 1);
        if (mine[0]) await base44.entities.SavedPost.delete(mine[0].id);
        setSaved(false);
      } else {
        await base44.entities.SavedPost.create({
          post_id: post.id,
          caption: post.caption,
          video_url: post.video_url,
          thumbnail_url: post.thumbnail_url,
          author_name: post.author_name,
          author_type: post.author_type,
        });
        setSaved(true);
      }
    } catch {
      /* ignore */
    }
  };

  const toggleFollow = async () => {
    if (!user || !followTarget) return;
    try {
      if (following) {
        const mine = await base44.entities.Follow.filter(
          post.restaurant_id
            ? { restaurant_id: post.restaurant_id, created_by_id: user.id }
            : { creator_id: post.author_id, created_by_id: user.id },
          "-created_date",
          1
        );
        if (mine[0]) await base44.entities.Follow.delete(mine[0].id);
        setFollowing(false);
      } else {
        await base44.entities.Follow.create(followTarget);
        setFollowing(true);
      }
    } catch {
      /* ignore */
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    const title = `${post.author_name || "Cravewheels"} on Cravewheels`;
    let copied = false;
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
    if (navigator.share) {
      try {
        await navigator.share({ title, text: post.caption || title, url });
      } catch {
        /* dismissed */
      }
    } else if (!copied) {
      toast(`Copy this link:\n${url}`, { duration: 10000 });
    }
  };

  const submit = async () => {
    if (!user || !text.trim() || posting) return;
    setPosting(true);
    try {
      const c = await base44.entities.Comment.create({
        post_id: post.id,
        author_name: user.full_name || user.email,
        comment: text.trim(),
        rating: 0,
        verified: false,
      });
      setComments((cs) => [c, ...cs]);
      setText("");
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
        <button onClick={toggleLike} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <span className="w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
            <Heart className={cn("w-6 h-6", liked ? "fill-primary text-primary" : "text-white")} />
          </span>
          <span className="text-white text-xs font-medium">{likeCount.toLocaleString()}</span>
        </button>
        <button onClick={() => setShowComments((s) => !s)} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <span className="w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </span>
          <span className="text-white text-xs font-medium">{comments.length.toLocaleString()}</span>
        </button>
        <button onClick={toggleSave} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <span className="w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
            <Bookmark className={cn("w-6 h-6", saved ? "fill-primary text-primary" : "text-white")} />
          </span>
          <span className="text-white text-xs font-medium">Save</span>
        </button>
        <button onClick={share} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <span className="w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
            <Share2 className="w-6 h-6 text-white" />
          </span>
          <span className="text-white text-xs font-medium">Share</span>
        </button>
        {followTarget && (
          <button onClick={toggleFollow} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
            <span className={cn("w-12 h-12 rounded-full backdrop-blur flex items-center justify-center", following ? "bg-primary" : "bg-black/40")}>
              {following ? <UserCheck className="w-6 h-6 text-white" /> : <UserPlus className="w-6 h-6 text-white" />}
            </span>
            <span className="text-white text-xs font-medium">{following ? "Following" : "Follow"}</span>
          </button>
        )}
      </div>

      {showComments && (
        <div
          className="absolute inset-0 z-[60] flex flex-col justify-end bg-black/50 pb-[calc(4.5rem+env(safe-area-inset-bottom))]"
          onClick={() => setShowComments(false)}
        >
          <div className="bg-card border-t border-border rounded-t-2xl max-h-[60%] flex flex-col" onClick={(e) => e.stopPropagation()}>
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
                <p className="text-center text-sm text-muted-foreground py-6">No comments yet. Be the first to comment!</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-2.5">
                    <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {(c.author_name || "U")[0]?.toUpperCase()}
                    </span>
                    <div>
                      <p className="text-xs font-semibold">{c.author_name || "User"}</p>
                      <p className="text-sm text-muted-foreground">{c.comment}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="Add a comment..."
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