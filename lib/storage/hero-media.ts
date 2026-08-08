import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { detectImageType } from "@/lib/storage/signature";

const root = path.resolve(process.env.STORAGE_ROOT || "storage/uploads");
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

function safe(key: string) {
  const target = path.resolve(root, key);
  if (!target.startsWith(root + path.sep)) throw new Error("Недопустимый путь");
  return target;
}

export function detectHeroVideoType(data: Buffer): "video/mp4" | "video/webm" {
  if (data.length >= 8 && data.toString("ascii", 4, 8) === "ftyp") return "video/mp4";
  if (data.length >= 4 && data.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return "video/webm";
  throw new Error("Поддерживаются только MP4 и WebM видео");
}

export function heroDurationIsAllowed(durationSec: number) {
  return Number.isFinite(durationSec) && durationSec >= 6 && durationSec <= 12;
}

export async function storeHeroMedia(video: File, poster: File, webm?: File) {
  const videoData = Buffer.from(await video.arrayBuffer());
  if (videoData.length > MAX_VIDEO_BYTES) throw new Error("Видео больше 50 МБ");
  const videoMime = detectHeroVideoType(videoData);
  if (videoMime !== "video/mp4") throw new Error("Основной клип должен быть в MP4");

  const posterData = Buffer.from(await poster.arrayBuffer());
  detectImageType(posterData);
  const posterMeta = await sharp(posterData).metadata();
  if (!posterMeta.width || !posterMeta.height) throw new Error("Poster-изображение повреждено");

  let webmData: Buffer | undefined;
  if (webm && webm.size > 0) {
    webmData = Buffer.from(await webm.arrayBuffer());
    if (webmData.length > MAX_VIDEO_BYTES) throw new Error("WebM больше 50 МБ");
    if (detectHeroVideoType(webmData) !== "video/webm") throw new Error("Дополнительный файл должен быть WebM");
  }

  const base = `hero/${new Date().getUTCFullYear()}/${randomUUID()}`;
  const mp4Key = `${base}/clip.mp4`;
  const webmKey = webmData ? `${base}/clip.webm` : null;
  const posterKey = `${base}/poster.webp`;
  await mkdir(path.dirname(safe(mp4Key)), { recursive: true });
  await Promise.all([
    writeFile(safe(mp4Key), videoData),
    writeFile(safe(posterKey), await sharp(posterData).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 84 }).toBuffer()),
    ...(webmData && webmKey ? [writeFile(safe(webmKey), webmData)] : []),
  ]);
  return { mp4Key, webmKey, posterKey, sizeBytes: videoData.length, posterWidth: posterMeta.width, posterHeight: posterMeta.height };
}

export const readHeroMedia = (key: string) => readFile(safe(key));
