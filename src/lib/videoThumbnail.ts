/**
 * Capture a single frame from a video file (or URL) as a JPEG Blob.
 * Used to generate a poster/thumbnail for video uploads so they don't
 * appear as a black frame in collages.
 */
export async function captureVideoThumbnail(
  source: File | string,
  opts: { seekTo?: number; maxWidth?: number; quality?: number } = {}
): Promise<Blob | null> {
  const { seekTo = 0.5, maxWidth = 800, quality = 0.85 } = opts;

  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    let objectUrl: string | null = null;
    if (typeof source === "string") {
      video.src = source;
    } else {
      objectUrl = URL.createObjectURL(source);
      video.src = objectUrl;
    }

    const cleanup = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };

    const timeout = window.setTimeout(() => {
      cleanup();
      resolve(null);
    }, 8000);

    video.onloadedmetadata = () => {
      const duration = isFinite(video.duration) ? video.duration : 0;
      const target = duration > 0 ? Math.min(seekTo, Math.max(0.1, duration - 0.05)) : 0;
      try {
        video.currentTime = target;
      } catch {
        // Some browsers need a tiny delay
        window.setTimeout(() => { try { video.currentTime = target; } catch {} }, 50);
      }
    };

    video.onseeked = () => {
      try {
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) {
          window.clearTimeout(timeout);
          cleanup();
          resolve(null);
          return;
        }
        const scale = w > maxWidth ? maxWidth / w : 1;
        const cw = Math.round(w * scale);
        const ch = Math.round(h * scale);
        const canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          window.clearTimeout(timeout);
          cleanup();
          resolve(null);
          return;
        }
        ctx.drawImage(video, 0, 0, cw, ch);
        canvas.toBlob(
          (blob) => {
            window.clearTimeout(timeout);
            cleanup();
            resolve(blob);
          },
          "image/jpeg",
          quality
        );
      } catch {
        window.clearTimeout(timeout);
        cleanup();
        resolve(null);
      }
    };

    video.onerror = () => {
      window.clearTimeout(timeout);
      cleanup();
      resolve(null);
    };
  });
}
