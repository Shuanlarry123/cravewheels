import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useOrderedFromRestaurant } from "@/lib/useOrderedItems";
import { Star, Loader2, Send, BadgeCheck, Lock, Video, Upload, X } from "lucide-react";
import { toast } from "react-hot-toast";
import StarRating from "@/components/comments/StarRating";

/**
 * Buyer-only reviews section for a restaurant profile.
 * - Only customers who have ordered from this restaurant can post a review
 *   (rating + text, optional video). Every review is from a verified buyer.
 * - All users can read the reviews.
 */
export default function RestaurantReviews({ restaurantId, restaurantName }) {
  const { user } = useAuth();
  const isBuyer = useOrderedFromRestaurant(restaurantId); // null | boolean
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [posting, setPosting] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    try {
      const r = await base44.entities.Review.filter({ restaurant_id: restaurantId }, "-created_date", 100);
      setReviews(r);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.Review.subscribe(() => load());
    return unsub;
  }, [restaurantId]);

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length
    : null;

  const pickVideo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setVideoUrl(file_url);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!user || !text.trim() || posting) return;
    if (!isBuyer) {
      toast.error("Only customers who ordered here can review");
      return;
    }
    setPosting(true);
    try {
      const rv = await base44.entities.Review.create({
        restaurant_id: restaurantId,
        restaurant_name: restaurantName,
        author_name: user.full_name || user.email,
        rating,
        comment: text.trim(),
        video_url: videoUrl || undefined,
      });
      setReviews((rs) => [rv, ...rs]);
      setText("");
      setRating(5);
      setVideoUrl("");
      toast.success("Review posted");
    } catch {
      toast.error("Failed to post review");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold">Reviews</h2>
        {reviews.length > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Star className="w-3 h-3 fill-primary text-primary" />
            {avg ? avg.toFixed(1) : "—"} · {reviews.length} reviews
          </span>
        )}
      </div>

      {isBuyer === false ? (
        <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border rounded-2xl px-3 py-3">
          <Lock className="w-4 h-4 shrink-0" />
          <span>Only customers who have ordered from {restaurantName || "this restaurant"} can leave a review.</span>
        </div>
      ) : (
        <div className="mb-4 space-y-3 bg-card border border-border rounded-2xl p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Your rating:</span>
            <StarRating value={rating} onChange={setRating} size={20} />
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your experience..."
            rows={3}
            className="w-full rounded-2xl bg-background border border-border px-3 py-2 text-sm"
          />
          <div className="flex items-center gap-2">
            {videoUrl ? (
              <span className="flex items-center gap-1 text-xs text-primary">
                <Video className="w-3.5 h-3.5" /> Video attached
                <button onClick={() => setVideoUrl("")} className="ml-0.5 text-muted-foreground">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ) : (
              <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Add video
                <input type="file" accept="video/*" className="hidden" onChange={pickVideo} disabled={uploading} />
              </label>
            )}
            <button
              onClick={submit}
              disabled={posting || uploading || !text.trim()}
              className="ml-auto flex items-center gap-1 h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
            >
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Post
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center">
          <Star className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-sm font-semibold">No reviews yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            {isBuyer ? "Be the first to review this restaurant." : "Order from here to leave the first review."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((rv) => (
            <div key={rv.id} className="rounded-2xl bg-card border border-border p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {(rv.author_name || "U")[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold truncate">{rv.author_name || "Customer"}</p>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary">
                      <BadgeCheck className="w-3.5 h-3.5" /> Verified Buyer
                    </span>
                  </div>
                  <StarRating value={rv.rating || 5} size={12} className="mt-0.5" />
                </div>
              </div>
              {rv.video_url && (
                <div className="mt-2 rounded-xl overflow-hidden bg-black">
                  <video
                    src={rv.video_url}
                    className="w-full max-h-64 object-cover"
                    controls
                    playsInline
                    preload="metadata"
                  />
                </div>
              )}
              {rv.comment && <p className="text-sm text-muted-foreground mt-2 break-words">{rv.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}