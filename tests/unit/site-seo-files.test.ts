import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("site-wide SEO files", () => {
  const robots = readFileSync(resolve("app/robots.ts"), "utf8");
  const sitemap = readFileSync(resolve("app/sitemap.ts"), "utf8");

  it("exposes a robots.ts with a sitemap reference", () => {
    expect(robots).toContain("sitemap:");
    expect(robots).toContain('allow: "/"');
    expect(robots).toContain("https://neyroeros.com/sitemap.xml");
  });

  it("exposes a sitemap.ts that lists artworks, stories and categories", () => {
    expect(sitemap).toContain("sitemap");
    expect(sitemap).toContain("artwork.findMany");
    expect(sitemap).toContain("story.findMany");
    expect(sitemap).toContain("category.findMany");
    expect(sitemap).toContain("lastModified");
    expect(sitemap).toContain("changeFrequency");
    expect(sitemap).toContain("priority");
  });
});
