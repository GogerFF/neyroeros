import { beforeEach, describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

const queries = vi.hoisted(() => ({
  artwork: vi.fn(), video: vi.fn(), story: vi.fn(), category: vi.fn(), tag: vi.fn(), user: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ db: Object.fromEntries(Object.entries(queries).map(([model, findMany]) => [model, { findMany }])) }));

function canCrawl(url: string) {
  const rules = robots().rules;
  const group = Array.isArray(rules) ? rules[0] : rules;
  const list = (value: string | string[] | undefined) => value ? Array.isArray(value) ? value : [value] : [];
  const matches = (pattern: string) => new RegExp("^" + pattern.split("*").map(part => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*")).test(url);
  const allow = Math.max(-1, ...list(group.allow).filter(matches).map(p => p.replaceAll("*", "").length));
  const disallow = Math.max(-1, ...list(group.disallow).filter(matches).map(p => p.replaceAll("*", "").length));
  return allow >= disallow;
}

describe("public media crawl exceptions", () => {
  it.each([
    "/api/images/preview/a1", "/api/images/thumbnail/a1", "/api/images/og/a1", "/api/images/original/a1",
    "/api/videos/v1/video", "/api/videos/v1/poster", "/api/stories/images/i1", "/api/avatars/u1?v=123",
    "/api/hero/h1/mp4", "/api/hero/h1/webm", "/api/hero/h1/poster",
  ])("allows %s", url => expect(canCrawl(url)).toBe(true));

  it.each([
    "/api/auth/session", "/api/admin/moderate", "/api/account/profile", "/api/cron/publish",
    "/api/videos/create", "/api/videos/v1/view", "/api/videos/manage", "/api/images/download/a1",
    "/api/analytics/track", "/api/future-private-route", "/dashboard", "/admin", "/login", "/register",
  ])("keeps %s blocked", url => expect(canCrawl(url)).toBe(false));

  it("advertises both sitemap endpoints", () => {
    expect(robots().sitemap).toEqual(["https://neyroeros.com/sitemap.xml", "https://neyroeros.com/image-sitemap.xml"]);
  });
});

describe("sitemap discovery", () => {
  beforeEach(() => {
    Object.values(queries).forEach(query => query.mockReset().mockResolvedValue([]));
  });

  it("encodes every dynamic path segment and keeps source content timestamps", async () => {
    const slug = "кириллица / ?#&%";
    const updatedAt = new Date("2026-08-01T00:00:00Z");
    for (const model of ["artwork", "video", "story"] as const) queries[model].mockResolvedValue([{ slug, updatedAt }]);
    queries.category.mockResolvedValue([{ slug }]);
    queries.tag.mockResolvedValue([{ slug }]);
    queries.user.mockResolvedValue([{ handle: slug }]);
    const entries = await sitemap();
    for (const route of ["artwork", "videos", "stories", "categories", "tags", "authors"]) {
      const entry = entries.find(entry => entry.url === `https://neyroeros.com/${route}/${encodeURIComponent(slug)}`);
      expect(entry, route).toBeDefined();
      if (["artwork", "videos", "stories"].includes(route)) expect(entry?.lastModified).toBe(updatedAt);
      else expect(entry).not.toHaveProperty("lastModified");
    }
  });

  it("does not invent modification dates for static hubs", async () => {
    const entries = await sitemap();
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) expect(entry).not.toHaveProperty("lastModified");
    expect(entries.some(entry => entry.url.includes("/search"))).toBe(false);
  });

  it("selects authors with a usable handle and published, non-deleted profile artwork only", async () => {
    await sitemap();
    expect(queries.user).toHaveBeenCalledWith({
      where: { handle: { not: null }, artworks: { some: { status: "PUBLISHED", deletedAt: null } } },
      select: { handle: true },
    });
    for (const model of ["artwork", "video", "story"] as const) {
      expect(queries[model].mock.calls[0][0].where).toEqual({ status: "PUBLISHED", deletedAt: null });
    }
  });

  it("skips null and empty handles defensively", async () => {
    queries.user.mockResolvedValue([{ handle: null }, { handle: "" }, { handle: "artist" }]);
    const entries = await sitemap();
    expect(entries.filter(entry => entry.url.includes("/authors/"))).toEqual([
      { url: "https://neyroeros.com/authors/artist", changeFrequency: "weekly", priority: 0.6 },
    ]);
  });
});
