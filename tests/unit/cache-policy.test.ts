import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CACHEABLE_EXTENSIONS,
  isHtmlPagePath,
  isVerifiedBot,
  pageCacheHeaders,
  PAGE_CACHE_CONTROL,
  type EdgeRequestContext,
} from "@/lib/cache-policy";

describe("page cache policy", () => {
  const anon = { hasAuthCookie: false, hasLocaleCookie: false, path: "/" };
  const anonWithLocale = { hasAuthCookie: false, hasLocaleCookie: true, path: "/" };
  const authed = { hasAuthCookie: true, hasLocaleCookie: true, path: "/" };

  it("never lets an intermediary store anonymous HTML", () => {
    const h = pageCacheHeaders(anon);
    expect(h["Cache-Control"]).toContain("no-store");
    expect(h["Cache-Control"]).not.toContain("s-maxage");
    expect(h["Cache-Control"]).not.toContain("stale-while-revalidate");
    expect(h["Cache-Control"]).not.toContain("public");
  });

  it("does not vary the cache key by cookie (there is no shared cache to vary)", () => {
    expect(pageCacheHeaders(anon)["Vary"]).toBeUndefined();
    expect(pageCacheHeaders(authed)["Vary"]).toBeUndefined();
  });

  it("gives locale-only visitors the same no-store policy", () => {
    expect(pageCacheHeaders(anonWithLocale)["Cache-Control"]).toBe(pageCacheHeaders(anon)["Cache-Control"]);
  });

  it("keeps signed-in responses private and unstorable", () => {
    const h = pageCacheHeaders({ hasAuthCookie: true, hasLocaleCookie: true, path: "/" });
    expect(h["Cache-Control"]).toContain("private");
    expect(h["Cache-Control"]).toContain("no-store");
  });

  it("regression: the page policy must not invite shared caching again", () => {
    // LiteSpeed on the production host turned public+s-maxage+Vary: Cookie into
    // per-cookie-variant copies, so a published page kept serving a stale
    // "not found" render. Publishing must be visible immediately.
    for (const token of ["s-maxage", "stale-while-revalidate", "public"]) {
      expect(PAGE_CACHE_CONTROL).not.toContain(token);
    }
    expect(PAGE_CACHE_CONTROL).toContain("no-store");
  });
});

describe("path classification and age gate", () => {
  it("skips API, admin, dashboard and auth endpoints", () => {
    for (const path of ["/api/images/preview/x", "/admin", "/dashboard", "/login", "/register", "/_next/static/app/page.js"]) {
      expect(isHtmlPagePath(path)).toBe(false);
    }
    for (const path of ["/", "/top", "/artwork/nyu-v-lesoparke-cmskm07y", "/stories/slug-1a"]) {
      expect(isHtmlPagePath(path)).toBe(true);
    }
  });

  it("keeps static asset extensions out of the page policy", () => {
    expect(CACHEABLE_EXTENSIONS).toContain(".js");
    expect(isHtmlPagePath("/_next/static/css/app.css")).toBe(false);
  });

  it("recognizes major search/AI crawler UAs", () => {
    for (const ua of [
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Mozilla/5.0 (compatible; bingbot/2.0)",
      "GPTBot/1.0",
      "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
      "Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)",
    ]) {
      expect(isVerifiedBot(ua)).toBe(true);
    }
    for (const ua of ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120", "curl/8.0", ""]) {
      expect(isVerifiedBot(ua)).toBe(false);
    }
  });
});

describe("middleware wiring", () => {
  const src = readFileSync(resolve("middleware.ts"), "utf8");

  it("applies the page policy on HTML paths", () => {
    expect(src).toContain("pageCacheHeaders");
    expect(src).toContain("isHtmlPagePath");
  });

  it("never appends Vary: Cookie", () => {
    expect(src).not.toContain("Vary");
  });

  it("redirects age gate to /age-gate for non-bots", () => {
    expect(src).toContain("/age-gate");
    expect(src).toContain("isVerifiedBot");
  });
});

describe("age gate page", () => {
  const page = readFileSync(resolve("app/age-gate/page.tsx"), "utf8");
  const route = readFileSync(resolve("app/api/age-confirm/route.ts"), "utf8");
  const src = readFileSync(resolve("app/layout.tsx"), "utf8");

  it("sets long-lived age cookie on confirm and does not render site chrome", () => {
    expect(route).toContain("age_confirmed");
    expect(route).toContain("Max-Age=31536000");
    expect(page).toContain("/api/age-confirm");
    expect(page).toContain("returnTo");
  });

  it("age-confirm returns meta-refresh page (proxy-safe, no Location rewriting)", () => {
    expect(route).not.toContain("NextResponse.redirect");
    expect(route).toContain("http-equiv=\"refresh\"");
    expect(route).toContain("x-forwarded-host");
    // relative fallback when no proxy headers are present
    expect(route).toContain("href = origin ? `${origin}${safeTarget}` : safeTarget");
  });

  it("layout no longer ships the client-side overlay gate", () => {
    expect(src).not.toContain("AgeGate");
    expect(src).not.toContain("age-gate.css");
  });
});

describe("takedown page", () => {
  const page = readFileSync(resolve("app/takedown/page.tsx"), "utf8");

  it("mentions deepfake-likeness policy and contact email", () => {
    expect(page).toContain("sklyarenkoff@gmail.com");
    expect(page.toLowerCase()).toContain("дипфейк");
    expect(page.toLowerCase()).toContain("takedown");
  });
});

describe("display font", () => {
  const layout = readFileSync(resolve("app/layout.tsx"), "utf8");
  const css = readFileSync(resolve("app/globals.css"), "utf8");

  it("loads a Cyrillic-capable display font via next/font", () => {
    expect(layout).toContain("next/font/google");
    expect(layout).toMatch(/Cormorant|Playfair|Manrope|Unbounded/);
  });

  it("applies the display font to headings and brand", () => {
    expect(css).toContain("--font-display");
  });
});
