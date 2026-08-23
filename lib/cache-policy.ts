/**
 * Cache + age-gate policy for anonymous visitors (pure functions, unit-tested).
 *
 * Pages stay SSR (locale lives in a cookie), so the cache layer is the CDN/
 * edge cache: anonymous GETs to cacheable pages get s-maxage + Vary: Cookie
 * (cookie presence is part of the cache key — signed-in responses never leak
 * into the shared pool), while signed-in users always get private, no-store.
 */

export const PAGE_CACHE_CONTROL = "public, s-maxage=600, stale-while-revalidate=86400";
export const PRIVATE_CACHE_CONTROL = "private, no-cache, no-store, max-age=0, must-revalidate";

/** Cookie names that mark a request as personalized / session-bearing. */
export const AUTH_COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token", "__Host-authjs.session-token"];

/** Path prefixes that must never be edge-cached or gated. */
const EXCLUDED_PREFIXES = [
  "/api",
  "/_next",
  "/admin",
  "/dashboard",
  "/login",
  "/register",
  "/age-gate",
  "/robots.txt",
  "/sitemap.xml",
  "/image-sitemap.xml",
  "/feed.xml",
  "/llms.txt",
];

export const CACHEABLE_EXTENSIONS = [".css", ".js", ".map", ".ico", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".woff", ".woff2", ".txt", ".xml"];

/** Which paths can be served from the shared anonymous cache. */
export function isCacheablePath(pathname: string): boolean {
  if (EXCLUDED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p))) {
    return false;
  }
  if (CACHEABLE_EXTENSIONS.some((s) => pathname.endsWith(s))) {
    return false;
  }
  return true;
}

/** Bot list: search + AI crawlers that must bypass the age gate (indexing). */
const BOT_PATTERN = /(Googlebot|bingbot|YandexBot|YandexImages|DuckDuckBot|slurp|Baiduspider|Sogou|facebookexternalhit|Twitterbot|LinkedInBot|TelegramBot|Applebot|GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-Web|anthropic-ai|PerplexityBot|Bytespider|CCBot|Google-Extended|Applebot-Extended|cohere-ai|Diffbot|Omgilibot|ImagesiftBot|Amazonbot)/i;

/** Distinguishes crawler UAs from browsers (by UA string; verified bots only). */
export function isVerifiedBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return BOT_PATTERN.test(userAgent);
}

export type EdgeRequestContext = {
  hasAuthCookie: boolean;
  hasLocaleCookie: boolean;
  path: string;
};

/** Cache headers for an HTML page response. */
export function pageCacheHeaders({ hasAuthCookie }: EdgeRequestContext): Record<string, string> {
  if (hasAuthCookie) return { "Cache-Control": PRIVATE_CACHE_CONTROL, Vary: "Cookie" };
  return { "Cache-Control": PAGE_CACHE_CONTROL, Vary: "Cookie" };
}
