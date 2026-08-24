import { describe, expect, it } from "vitest";
import { ADMIN_VIDEO_MAX_BYTES, adminVideoMimeFromHeader, adminVideoSizeIsAllowed } from "@/lib/admin-video-input";

describe("admin category video input", () => {
  it("accepts videos up to and including 50 MiB", () => {
    expect(ADMIN_VIDEO_MAX_BYTES).toBe(50 * 1024 * 1024);
    expect(adminVideoSizeIsAllowed(1)).toBe(true);
    expect(adminVideoSizeIsAllowed(ADMIN_VIDEO_MAX_BYTES)).toBe(true);
    expect(adminVideoSizeIsAllowed(ADMIN_VIDEO_MAX_BYTES + 1)).toBe(false);
    expect(adminVideoSizeIsAllowed(0)).toBe(false);
  });

  it("trusts binary signatures rather than browser MIME claims", () => {
    expect(adminVideoMimeFromHeader(Buffer.from([0, 0, 0, 32, 0x66, 0x74, 0x79, 0x70]))).toBe("video/mp4");
    expect(adminVideoMimeFromHeader(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))).toBe("video/webm");
    expect(() => adminVideoMimeFromHeader(Buffer.from("not video"))).toThrow(/MP4|WebM/);
  });
});
