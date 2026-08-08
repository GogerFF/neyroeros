import { describe, expect, it } from "vitest";
import { detectHeroVideoType, heroDurationIsAllowed } from "@/lib/storage/hero-media";

describe("hero video validation", () => {
  it("recognizes MP4 and WebM container signatures", () => {
    expect(detectHeroVideoType(Buffer.from([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70]))).toBe("video/mp4");
    expect(detectHeroVideoType(Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x93]))).toBe("video/webm");
  });

  it("accepts videos from 6 to 12 seconds", () => {
    expect(heroDurationIsAllowed(6)).toBe(true);
    expect(heroDurationIsAllowed(12)).toBe(true);
    expect(heroDurationIsAllowed(5.9)).toBe(false);
    expect(heroDurationIsAllowed(12.1)).toBe(false);
  });
});
