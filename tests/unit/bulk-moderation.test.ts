import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const artworkRoute = readFileSync("app/api/admin/moderate/route.ts", "utf8");
const videoRoute = readFileSync("app/api/admin/videos/moderate/route.ts", "utf8");
const adminPage = readFileSync("app/admin/page.tsx", "utf8");
const videoPage = readFileSync("app/admin/videos/page.tsx", "utf8");

describe("bulk moderation controls", () => {
  it("has a bulk approve branch for artworks and videos", () => {
    expect(artworkRoute).toContain('id === "all"');
    expect(videoRoute).toContain('id === "all"');
    expect(videoRoute).toContain("updateMany");
  });

  it("exposes approve-all controls in both moderation screens", () => {
    expect(adminPage).toContain("Одобрить всё");
    expect(videoPage).toContain("Одобрить всё");
  });
});
