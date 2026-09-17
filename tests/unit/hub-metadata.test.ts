import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const hubs: [string, string][] = [
  ["app/categories/page.tsx", "/categories"],
  ["app/videos/page.tsx", "/videos"],
  ["app/stories/page.tsx", "/stories"],
  ["app/search/page.tsx", "/search"],
  ["app/top/page.tsx", "/top"],
  ["app/trending/page.tsx", "/trending"],
  ["app/newcomers/page.tsx", "/newcomers"],
  ["app/discover/page.tsx", "/discover"],
];

describe("hub pages declare their own metadata", () => {
  for (const [file, path] of hubs) {
    it(`${file} declares canonical ${path}`, () => {
      expect(readFileSync(file, "utf8")).toContain(`canonical: "${path}"`);
    });
  }

  it("keeps the internal search page out of the index", () => {
    const search = readFileSync("app/search/page.tsx", "utf8");
    expect(search).toContain("index: false");
    expect(search).toContain("follow: true");
  });

  it("does not advertise the search page in the sitemap", () => {
    expect(readFileSync("app/sitemap.ts", "utf8")).not.toContain("/search");
  });
});

describe("above-the-fold images load first", () => {
  it("the artwork grid marks its first cards as high priority instead of lazy", () => {
    const grid = readFileSync("components/artwork-grid.tsx", "utf8");
    const card = readFileSync("components/artwork-card.tsx", "utf8");
    expect(grid).toContain("priority");
    expect(card).toContain("fetchPriority");
    expect(card).toMatch(/\?\s*"eager"\s*:\s*"lazy"/);
  });

  it("the main artwork image is not lazy and is flagged high priority", () => {
    const page = readFileSync("app/artwork/[slug]/page.tsx", "utf8");
    const mainImage = page.match(/<img src=\{`\/api\/images\/preview\/\$\{a\.id\}`\}[^>]*\/>/)?.[0] ?? "";
    expect(mainImage).toContain('fetchPriority="high"');
    expect(mainImage).not.toContain('loading="lazy"');
  });

  it("poster containers already reserve their aspect ratio (no CLS to fix)", () => {
    // Antigravity flagged missing width/height on video posters; the container's
    // CSS aspect-ratio already prevents layout shift, so attributes are not needed.
    const css = readFileSync("app/globals.css", "utf8");
    expect(css).toMatch(/\.video-poster\{[^}]*aspect-ratio:16\/9/);
  });
});
