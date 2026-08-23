import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAMES, isCacheablePath, isVerifiedBot, pageCacheHeaders } from "@/lib/cache-policy";

/**
 * Edge middleware:
 * 1. Real age gate — anonymous non-bot visitors are redirected to /age-gate
 *    until they confirm; crawlers bypass for indexing (rating=adult in place).
 * 2. Anonymous cache — cacheable page GETs get s-maxage + Vary: Cookie;
 *    signed-in users always get private, no-store.
 */

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ua = req.headers.get("user-agent");
  const isGet = req.method === "GET";
  const hasAuthCookie = AUTH_COOKIE_NAMES.some((name) => req.cookies.has(name));
  const hasAgeConfirmed = req.cookies.get("age_confirmed")?.value === "1";
  const bot = isVerifiedBot(ua);

  // Age gate: real redirect, bots bypass for indexing.
  if (!hasAgeConfirmed && !bot && pathname !== "/age-gate" && isCacheablePath(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/age-gate";
    url.search = `?returnTo=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (!isGet || !isCacheablePath(pathname)) return NextResponse.next();

  const headers = pageCacheHeaders({
    hasAuthCookie,
    hasLocaleCookie: req.cookies.has("locale"),
    path: pathname,
  });
  const res = NextResponse.next();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === "vary") res.headers.append(key, value); // append: Next manages its own Vary for RSC; multiple Vary headers union per RFC 7231
    else res.headers.set(key, value);
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
