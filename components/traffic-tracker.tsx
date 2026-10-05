"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Sends one pageview per navigation. The server derives referrer, device and geo
 * from request headers, so the only thing the client supplies is the path.
 *
 * Mounted once in the root layout: Next keeps it mounted across client-side
 * navigations, and `usePathname` is what tells us the visitor moved.
 */
export function TrafficTracker() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    // StrictMode double-invokes effects in dev; the ref guard also keeps a
    // re-render from sending the same page twice.
    if (!pathname || last.current === pathname) return;
    last.current = pathname;

    const send = () => {
      if (document.visibilityState !== "visible") return;
      fetch("/api/analytics/track", {
        method: "POST",
        credentials: "same-origin",
        keepalive: true,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path: pathname }),
      }).catch(() => undefined);
    };

    // Defer so the request does not compete with the page's own data fetching.
    const timer = setTimeout(send, 1200);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}