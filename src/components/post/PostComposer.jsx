import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Upload, Video, Send } from "lucide-react";
import { toast } from "react-hot-toast";

/**
 * Composer for restaurant/creator video posts. Posts go to the author's
 * profile feed and surface in the For You feed.
 */
export default function PostComposer({
  authorType,
  authorId,
  authorName,
  authorAvatarUrl,
  restaurantId,
  onCreated,
}) {
  const [caption, setCaption] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbUrl, setThumbUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [thumbUploading, setThumbUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const videoRef = useRef(null);
  const thumbRef = useRef(null);

  const pickVideo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      toast.error("Video too large — max 100MB. Try a shorter clip.");
      e.target.value = "";
      return;
    }
    try {
      setUploading(true);
      const upload = base44.integrations.Core.UploadFile({ file });
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 120000)
      );
      const { file_url } = await Promise.race([upload, timeout]);
      setVideoUrl(file_url);
    } catch (err) {
      toast.error(
        err?.message === "timeout"
          ? "Upload timed out — try a shorter or smaller video"
          : "Video upload failed"
      );
    } finally {
      setUploading(false);
    }
  };

  const pickThumb = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setThumbUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setThumbUrl(file_url);
    } catch {
      toast.error("Image upload failed");
    } finally {
      setThumbUploading(false);
    }
  };

  const submit = async () => {
    if (!videoUrl || posting) return;
    setPosting(true);
    try {
      const post = await base44.entities.Post.create({
        author_type: authorType,
        author_id: authorId,
        author_name: authorName,
        author_avatar_url: authorAvatarUrl || undefined,
        restaurant_id: restaurantId || undefined,
        caption: caption.trim() || undefined,
        video_url: videoUrl,
        thumbnail_url: thumbUrl || undefined,
        views: 0,
        likes: 0,
      });
      setCaption("");
      setVideoUrl("");
      setThumbUrl("");
      toast.success("Posted to your feed");
      onCreated?.(post);
    } catch {
      toast.error("Failed to post");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <h3 className="text-sm font-semibold">Post a video</h3>
      <p className="text-xs text-muted-foreground -mt-1">
        Promos, behind-the-scenes, anything — it goes straight to the For You feed.
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => videoRef.current?.click()}
          disabled={uploading}
          className="flex-1 h-10 rounded-xl bg-background border border-border text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
          {videoUrl ? "Change video" : "Upload video"}
        </button>
        <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={pickVideo} />

        <button
          onClick={() => thumbRef.current?.click()}
          disabled={thumbUploading}
          className="h-10 px-3 rounded-xl bg-background border border-border text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {thumbUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Cover
        </button>
        <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={pickThumb} />
      </div>

      {videoUrl && (
        <div className="rounded-xl overflow-hidden bg-black max-h-48">
          <video src={videoUrl} className="w-full h-full object-cover" controls playsInline preload="metadata" />
        </div>
      )}

      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Write a caption..."
        rows={2}
        className="w-full rounded-xl bg-background border border-border px-3 py-2 text-sm"
      />

      <button
        onClick={submit}
        disabled={!videoUrl || posting}
        className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Post to feed
      </button>
    </div>
  );
}