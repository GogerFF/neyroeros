"use client";
import { useEffect } from "react";
export function VideoViewTracker({ videoId }: { videoId: string }) {
  useEffect(() => { const t = setTimeout(() => { fetch(`/api/videos/${videoId}/view`, { method: "POST", credentials: "same-origin" }).catch(() => {}); }, 3000); return () => clearTimeout(t); }, [videoId]);
  return null;
}
