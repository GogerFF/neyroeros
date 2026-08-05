import sharp from "sharp";
import { detectImageType } from "@/lib/storage/signature";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export async function prepareAvatar(input: Buffer): Promise<{ data: Buffer; mimeType: "image/webp" }> {
  if (input.length > MAX_AVATAR_BYTES) throw new Error("Аватар не должен превышать 5 МБ");
  detectImageType(input);
  const image = sharp(input, { failOn: "error" }).rotate();
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) throw new Error("Изображение повреждено");
  const data = await image
    .resize(512, 512, { fit: "cover", position: "attention" })
    .webp({ quality: 86 })
    .toBuffer();
  return { data, mimeType: "image/webp" };
}
