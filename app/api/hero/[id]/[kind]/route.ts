import { db } from "@/lib/db";
import { readHeroMedia } from "@/lib/storage/hero-media";
import { stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.env.STORAGE_ROOT || "storage/uploads");

function safe(key: string) {
  const target = path.resolve(root, key);
  if (!target.startsWith(root + path.sep)) throw new Error("Invalid path");
  return target;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string; kind: string }> }) {
  const { id, kind } = await params;
  const hero = await db.heroVideo.findUnique({ where: { id }, select: { mp4Key: true, webmKey: true, posterKey: true } });
  if (!hero) return new Response(null, { status: 404 });

  const key = kind === "mp4" ? hero.mp4Key : kind === "webm" ? hero.webmKey : kind === "poster" ? hero.posterKey : null;
  if (!key) return new Response(null, { status: 404 });

  const filePath = safe(key);
  const [data, info] = await Promise.all([readHeroMedia(key), stat(filePath)]);
  const mime = kind === "mp4" ? "video/mp4" : kind === "webm" ? "video/webm" : "image/webp";
  return new Response(data, { headers: { "Content-Type": mime, "Content-Length": String(info.size), "Accept-Ranges": "bytes", "Cache-Control": "public, max-age=86400" } });
}
