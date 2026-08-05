import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { prepareAvatar } from "@/lib/storage/avatar";

describe("prepareAvatar", () => {
  it("creates a square 512px webp avatar", async () => {
    const source = await sharp({
      create: { width: 900, height: 500, channels: 3, background: "#ff00aa" },
    }).png().toBuffer();
    const result = await prepareAvatar(source);
    const metadata = await sharp(result.data).metadata();
    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBe(512);
    expect(metadata.height).toBe(512);
    expect(result.mimeType).toBe("image/webp");
  });

  it("rejects files larger than five megabytes", async () => {
    await expect(prepareAvatar(Buffer.alloc(5 * 1024 * 1024 + 1))).rejects.toThrow("5 МБ");
  });

  it("rejects non-image content", async () => {
    await expect(prepareAvatar(Buffer.from("not an image"))).rejects.toThrow();
  });
});
