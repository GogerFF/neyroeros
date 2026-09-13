import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const dashboard = readFileSync("app/dashboard/page.tsx", "utf8");
const artworkRoute = readFileSync("app/api/artworks/manage/route.ts", "utf8");
const videoRoute = readFileSync("app/api/videos/manage/route.ts", "utf8");

describe("studio bulk submit", () => {
  it("supports bulk submit-all for artworks and videos", () => {
    expect(artworkRoute).toContain('op === "submit-all"');
    expect(dashboard).toContain('value="all"');
    expect(videoRoute).toContain('id === "all"');
    expect(videoRoute).toContain("updateMany");
  });

  it("shows bulk submit controls scoped to the author's items", () => {
    expect(dashboard).toContain("Отправить всё на модерацию");
    expect(dashboard.match(/Отправить всё на модерацию/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("lists artworks (the main upload flow) before videos and stories", () => {
    const works = dashboard.indexOf("<h2>Работы</h2>");
    const videos = dashboard.indexOf("<h2>Видео</h2>");
    const stories = dashboard.indexOf("<h2>Рассказы</h2>");
    expect(works).toBeGreaterThan(-1);
    expect(works).toBeLessThan(videos);
    expect(videos).toBeLessThan(stories);
  });
});
