"use client";

import { useEffect } from "react";

export function ArtworkViewTracker({ artworkId }: { artworkId: string }) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let sent = false;

    const count = () => {
      if (sent || document.visibilityState !== "visible") return;
      sent = true;
      fetch(`/api/artworks/${artworkId}/view`, { method: "POST", credentials: "same-origin", keepalive: true }).catch(() => undefined);
    };
    const schedule = () => {
      if (document.visibilityState === "visible" && !sent) timer = setTimeout(count, 3000);
    };
    const onVisibility = () => {
      if (document.visibilityState !== "visible" && timer) clearTimeout(timer);
      else schedule();
    };

    schedule();
    document.addEventListener("visibilitychange", onVisibility);
    return () => { if (timer) clearTimeout(timer); document.removeEventListener("visibilitychange", onVisibility); };
  }, [artworkId]);

  return null;
}
