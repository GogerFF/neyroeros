import { ADMIN_VIDEO_MAX_BYTES, adminVideoMimeFromHeader, adminVideoSizeIsAllowed } from "@/lib/admin-video-input";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

const root = path.resolve(process.env.STORAGE_ROOT || "storage/uploads");

function safe(key: string) {
  const target = path.resolve(root, key);
  if (!target.startsWith(root + path.sep)) throw new Error("Недопустимый путь");
  return target;
}

export async function storeAdminCategoryVideo(video: File) {
  if (!adminVideoSizeIsAllowed(video.size)) throw new Error(`Видео не должно превышать ${ADMIN_VIDEO_MAX_BYTES / 1024 / 1024} МБ`);
  const videoData = Buffer.from(await video.arrayBuffer());
  if (!adminVideoSizeIsAllowed(videoData.length)) throw new Error("Видео пустое или превышает 50 МБ");
  const mimeType = adminVideoMimeFromHeader(videoData);
  const base = `videos/${new Date().getUTCFullYear()}/${randomUUID()}`;
  const videoKey = `${base}/video.${mimeType === "video/mp4" ? "mp4" : "webm"}`;
  const posterKey = `${base}/poster.webp`;
  const poster = await sharp({
    create: { width: 1280, height: 720, channels: 3, background: { r: 13, g: 11, b: 18 } },
  }).webp({ quality: 82 }).toBuffer();
  await mkdir(path.dirname(safe(videoKey)), { recursive: true });
  await Promise.all([writeFile(safe(videoKey), videoData), writeFile(safe(posterKey), poster)]);
  return { videoKey, posterKey, mimeType, sizeBytes: videoData.length };
}
