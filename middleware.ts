import { NextResponse, type NextRequest } from "next/server";
import { isHtmlPagePath, isVerifiedBot, pageCacheHeaders } from "@/lib/cache-policy";

/**
 * Edge middleware:
 * 1. Real age gate — anonymous non-bot visitors are redirected to /age-gate
 *    until they confirm; crawlers bypass for indexing (rating=adult in place).
 * 2. Every HTML page response is marked no-store, so neither an intermediary nor
 *    a shared pool can serve one visitor another visitor's (or a stale) copy.
 */

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ua = req.headers.get("user-agent");
  const isGet = req.method === "GET";
  const hasAgeConfirmed = req.cookies.get("age_confirmed")?.value === "1";
  const bot = isVerifiedBot(ua);

  // Age gate: real redirect, bots bypass for indexing.
  if (!hasAgeConfirmed && !bot && pathname !== "/age-gate" && isHtmlPagePath(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/age-gate";
    url.search = `?returnTo=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (!isGet || !isHtmlPagePath(pathname)) return NextResponse.next();

  const res = NextResponse.next();
  for (const [key, value] of Object.entries(pageCacheHeaders({ hasAuthCookie: false, hasLocaleCookie: false, path: pathname }))) {
    res.headers.set(key, value);
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
