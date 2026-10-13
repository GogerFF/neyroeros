import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { detectImageType } from "@/lib/storage/signature";
import { videoMimeFromHeader } from "@/lib/video-input";

const root = path.resolve(process.env.STORAGE_ROOT || "storage/uploads");
const MAX_VIDEO_BYTES = 30 * 1024 * 1024;
const MAX_POSTER_BYTES = 5 * 1024 * 1024;

function safe(key: string) {
  const target = path.resolve(root, key);
  if (!target.startsWith(root + path.sep)) throw new Error("Недопустимый путь");
  return target;
}

export async function storeUserVideo(video: File, poster?: File) {
  const videoData = Buffer.from(await video.arrayBuffer());
  if (videoData.length > MAX_VIDEO_BYTES) throw new Error("Видео не должно превышать 30 МБ");
  const mimeType = videoMimeFromHeader(videoData);

  let posterData: Buffer;
  if (poster) {
    posterData = Buffer.from(await poster.arrayBuffer());
    if (posterData.length > MAX_POSTER_BYTES) throw new Error("Poster не должен превышать 5 МБ");
    detectImageType(posterData);
    const metadata = await sharp(posterData).metadata();
    if (!metadata.width || !metadata.height) throw new Error("Poster-изображение повреждено");
  } else {
    // A video upload must not require a second file. Until ffmpeg extraction is
    // introduced, use a valid neutral poster so the existing Video contract stays intact.
    posterData = await sharp({
      create: { width: 1280, height: 720, channels: 3, background: { r: 13, g: 11, b: 18 } },
    }).webp({ quality: 82 }).toBuffer();
  }

  const base = `videos/${new Date().getUTCFullYear()}/${randomUUID()}`;
  const extension = mimeType === "video/mp4" ? "mp4" : "webm";
  const videoKey = `${base}/video.${extension}`;
  const posterKey = `${base}/poster.webp`;
  await mkdir(path.dirname(safe(videoKey)), { recursive: true });
  await Promise.all([
    writeFile(safe(videoKey), videoData),
    writeFile(safe(posterKey), await sharp(posterData).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 84 }).toBuffer()),
  ]);
  return { videoKey, posterKey, mimeType, sizeBytes: videoData.length };
}

export const readUserVideo = (key: string) => readFile(safe(key));
