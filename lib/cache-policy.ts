/**
 * Cache + age-gate policy for page responses (pure functions, unit-tested).
 *
 * HTML is NEVER handed to an intermediary cache. The site is SSR with the locale
 * in a cookie, so a shared cache would need Vary: Cookie to stay correct — and on
 * the production host (LiteSpeed) that combination produced per-cookie-variant
 * copies of one URL: visitors were served a stale "not found" render of a page
 * that had already been published, and two requests carrying the same cookie could
 * get different bodies. Publishing has to be visible at once, so every page
 * response is no-store. Long-lived caching is left to /_next/static, whose file
 * names carry a content hash and which the middleware's matcher skips entirely.
 */

export const NO_STORE = "private, no-cache, no-store, max-age=0, must-revalidate";

/** The page policy; kept as a named export because callers and tests read it. */
export const PAGE_CACHE_CONTROL = NO_STORE;
export const PRIVATE_CACHE_CONTROL = NO_STORE;

/** Cookie names that mark a request as personalized / session-bearing. */
export const AUTH_COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token", "__Host-authjs.session-token"];

/** Path prefixes that are never age-gated and never get page cache headers. */
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

/** True for server-rendered HTML pages: everything that is not an API route, a
 *  static asset, an auth screen or one of the machine-readable endpoints. */
export function isHtmlPagePath(pathname: string): boolean {
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

/**
 * Headers for an HTML page response — identical for anonymous and signed-in
 * visitors on purpose: nothing may be stored, so there is no shared pool to leak
 * into and no cookie-varying cache key that can go stale. No Vary: Cookie either;
 * it only multiplies cache variants when nothing should be cached at all.
 */
export function pageCacheHeaders(_context: EdgeRequestContext): Record<string, string> {
  return { "Cache-Control": NO_STORE };
}
