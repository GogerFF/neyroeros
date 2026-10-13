import { describe, expect, it } from "vitest";
import { videoSchema } from "@/lib/seo";

const input = {
  title: "Тест",
  slug: "test-video",
  description: "описание",
  authorName: "Автор",
  datePublished: new Date("2026-01-01T00:00:00Z"),
  posterUrl: "https://neyroeros.com/poster.webp",
  contentUrl: "https://neyroeros.com/video.mp4",
};

describe("videoSchema", () => {
  it("выдаёт длительность, когда она известна", () => {
    const s = videoSchema({ ...input, durationSec: 42 }) as Record<string, unknown>;
    expect(s.duration).toBe("PT42S");
  });

  it("не выдаёт PT0S при неизвестной длительности (0)", () => {
    const s = videoSchema({ ...input, durationSec: 0 }) as Record<string, unknown>;
    expect(s.duration).toBeUndefined();
  });

  it("всегда оставляет базовые поля и взрослый флаг", () => {
    const s = videoSchema({ ...input, durationSec: 0 }) as Record<string, unknown>;
    expect(s["@type"]).toBe("VideoObject");
    expect(s.name).toBe("Тест");
    expect(s.isFamilyFriendly).toBe(false);
  });
});