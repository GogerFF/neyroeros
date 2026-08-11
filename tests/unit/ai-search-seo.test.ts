import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("AI-search SEO surface", () => {
  const sitemap = readFileSync(resolve("app/sitemap.ts"), "utf8");
  const videoPage = readFileSync(resolve("app/videos/[slug]/page.tsx"), "utf8");
  const llms = readFileSync(resolve("app/llms.txt/route.ts"), "utf8");

  it("indexes editorial and discovery hubs", () => {
    for (const path of ["/about", "/rules", "/collections", "/top", "/trending", "/newcomers", "/discover"]) {
      expect(sitemap).toContain(path);
    }
  });

  it("publishes video metadata and VideoObject JSON-LD", () => {
    expect(videoPage).toContain("generateMetadata");
    expect(videoPage).toContain("videoSchema");
    expect(videoPage).toContain("alternates: { canonical");
  });

  it("offers a concise, crawlable llms.txt map", () => {
    expect(llms).toContain("text/plain");
    expect(llms).toContain("Neyroeros");
    expect(llms).toContain("/sitemap.xml");
  });
});
