import { describe, expect, it } from "vitest";
import { videoDurationIsAllowed, videoMimeFromHeader } from "@/lib/video-input";

describe("user video input", () => {
  it("accepts browser-compatible MP4 and WebM headers", () => {
    expect(videoMimeFromHeader(Buffer.from([0, 0, 0, 32, 0x66, 0x74, 0x79, 0x70]))).toBe("video/mp4");
    expect(videoMimeFromHeader(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))).toBe("video/webm");
  });

  it("limits public videos to 5 seconds through 3 minutes", () => {
    expect(videoDurationIsAllowed(5)).toBe(true);
    expect(videoDurationIsAllowed(180)).toBe(true);
    expect(videoDurationIsAllowed(181)).toBe(false);
  });
});
