import { describe, expect, it } from "vitest";
import { buildShareUrls, commentSchema } from "@/lib/social";

describe("social features", () => {
  it("builds encoded share URLs for supported networks", () => {
    const urls = buildShareUrls("https://neyroeros.com/artwork/night", "Night art", "https://neyroeros.com/cover.webp");
    expect(urls.telegram).toContain("t.me/share/url");
    expect(urls.x).toContain("twitter.com/intent/tweet");
    expect(urls.pinterest).toContain("pinterest.com/pin/create/button");
    expect(urls.reddit).toContain("reddit.com/submit");
  });

  it("accepts a concise comment and rejects blank or oversized text", () => {
    expect(commentSchema.parse({ content: "Прекрасная работа!" }).content).toBe("Прекрасная работа!");
    expect(() => commentSchema.parse({ content: "   " })).toThrow();
    expect(() => commentSchema.parse({ content: "x".repeat(1001) })).toThrow();
  });
});
