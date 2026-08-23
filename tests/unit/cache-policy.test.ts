import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CACHEABLE_EXTENSIONS,
  isCacheablePath,
  isVerifiedBot,
  pageCacheHeaders,
  type EdgeRequestContext,
} from "@/lib/cache-policy";

describe("cache policy", () => {
  const anon = { hasAuthCookie: false, hasLocaleCookie: false, path: "/" };
  const anonWithLocale = { hasAuthCookie: false, hasLocaleCookie: true, path: "/" };
  const authed = { hasAuthCookie: true, hasLocaleCookie: true, path: "/" };

  it("gives anonymous visitors CDN-cacheable headers with Vary: Cookie", () => {
    const h = pageCacheHeaders(anon);
    expect(h["Cache-Control"]).toContain("s-maxage=");
    expect(h["Cache-Control"]).toContain("stale-while-revalidate");
    expect(h["Vary"]).toContain("Cookie");
  });

  it("anonymizes locale-only users too (cache key includes Cookie via Vary)", () => {
    expect(pageCacheHeaders(anonWithLocale)["Cache-Control"]).toContain("s-maxage=");
  });

  it("never shares cache for signed-in users", () => task_no_shared_cache());
function task_no_shared_cache() {
  const h = pageCacheHeaders({ hasAuthCookie: true, hasLocaleCookie: true, path: "/" });
  if (!h["Cache-Control"].includes("private") || !h["Cache-Control"].includes("no-store") || !h["Vary"].includes("Cookie")) {
    throw new Error("signed-in responses must be private+no-store and Vary: Cookie");
  }
}

  it("skips API, admin, dashboard and auth endpoints", () => {
    for (const path of ["/api/images/preview/x", "/admin", "/dashboard", "/login", "/register", "/_next/static/app/page.js"]) {
      expect(isCacheablePath(path)).toBe(false);
    }
    for (const path of ["/", "/top", "/artwork/nyu-v-lesoparke-cmskm07y", "/stories/slug-1a"]) {
      expect(isCacheablePath(path)).toBe(true);
    }
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

  it("applies page cache policy on cacheable paths", () => {
    expect(src).toContain("pageCacheHeaders");
    expect(src).toContain("isCacheablePath");
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
    expect(route).toContain("maxAge: 31536000");
    expect(page).toContain("/api/age-confirm");
    expect(page).toContain("returnTo");
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
