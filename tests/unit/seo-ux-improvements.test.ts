import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";

const videoPage = readFileSync("app/videos/[slug]/page.tsx", "utf8");
const storyPage = readFileSync("app/stories/[slug]/page.tsx", "utf8");
const categoriesPage = readFileSync("app/categories/[slug]/page.tsx", "utf8");

describe("og previews for videos and stories", () => {
  it("video og:image carries explicit dimensions", () => {
    expect(videoPage).toContain("width: 1200");
    expect(videoPage).toContain("height: 630");
  });

  it("story og:image carries explicit dimensions", () => {
    expect(storyPage).toContain("width: 1200");
    expect(storyPage).toContain("height: 630");
  });

  it("og-default fallback image exists", () => {
    expect(existsSync("public/og-default.webp")).toBe(true);
  });
});

describe("category pagination", () => {
  it("paginates category artworks instead of loading everything", () => {
    expect(categoriesPage).toContain("searchParams");
    expect(categoriesPage).toContain("take");
    expect(categoriesPage).toContain("skip");
  });
});
