/**
 * Captures a still frame from a video File using a hidden <video> + <canvas>.
 * Returns a JPEG Blob suitable for upload as a thumbnail/poster image.
 *
 * This ensures every video post and menu item has a thumbnail_url for:
 *  - Social media link previews (og:image)
 *  - Video poster images in the app
 */
export function generateVideoThumbnail(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    const url = URL.createObjectURL(file);
    video.src = url;

    let settled = false;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
    };

    const fail = (msg) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(msg));
    };

    video.onloadedmetadata = () => {
      // Seek to 1s or 25% through — whichever is sooner — to get a meaningful frame.
      const seekTime = Math.min(1, (video.duration || 4) * 0.25);
      try {
        video.currentTime = seekTime;
      } catch {
        fail("Failed to seek video");
      }
    };

    video.onseeked = () => {
      if (settled) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 720;
        canvas.height = video.videoHeight || 1280;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (settled) return;
            settled = true;
            cleanup();
            if (blob) resolve(blob);
            else fail("Canvas produced no image");
          },
          "image/jpeg",
          0.85
        );
      } catch {
        fail("Failed to capture video frame");
      }
    };

    video.onerror = () => fail("Failed to load video for thumbnail");

    // Safety timeout — don't hang if the video won't decode
    setTimeout(() => fail("Thumbnail generation timed out"), 10000);
  });
}