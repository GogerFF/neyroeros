import { describe, expect, it } from "vitest";
import { detectImageType } from "@/lib/storage/signature";

describe("image signature", () => {
  it("detects JPEG, PNG and WebP by bytes", () => {
    expect(detectImageType(Buffer.from([0xff,0xd8,0xff,0x00]))).toBe("image/jpeg");
    expect(detectImageType(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))).toBe("image/png");
    expect(detectImageType(Buffer.from("RIFF1234WEBP"))).toBe("image/webp");
  });
  it("rejects unknown signatures", () => expect(() => detectImageType(Buffer.from("fake"))).toThrow(/формат/i));
});
