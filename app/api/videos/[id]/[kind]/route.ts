import { stat } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { readUserVideo } from "@/lib/storage/video-storage";

const root = path.resolve(process.env.STORAGE_ROOT || "storage/uploads");
function safe(key: string) { const target = path.resolve(root, key); if (!target.startsWith(root + path.sep)) throw new Error("Invalid path"); return target; }

export async function GET(request: Request, { params }: { params: Promise<{ id: string; kind: string }> }) {
  const { id, kind } = await params;
  const video = await db.video.findUnique({ where: { id }, select: { authorId: true, status: true, videoKey: true, posterKey: true, mimeType: true } });
  if (!video) return new Response("Не найдено", { status: 404 });
  const session = await auth();
  const allowed = video.status === "PUBLISHED" || session?.user.id === video.authorId || ["ADMIN", "MODERATOR"].includes(session?.user.role || "");
  if (!allowed) return new Response("Не найдено", { status: 404 });
  const key = kind === "video" ? video.videoKey : kind === "poster" ? video.posterKey : null;
  if (!key) return new Response("Не найдено", { status: 404 });
  const data = await readUserVideo(key);
  const mime = kind === "video" ? video.mimeType : "image/webp";
  const headers = { "Content-Type": mime, "Content-Length": String(data.length), "Accept-Ranges": "bytes", "Cache-Control": video.status === "PUBLISHED" ? "public, max-age=86400" : "private, no-store", "X-Content-Type-Options": "nosniff" };
  const range = request.headers.get("range");
  if (kind !== "video" || !range) return new Response(data, { headers });
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match) return new Response(data, { headers });
  const info = await stat(safe(key)); const start = Math.min(Number(match[1] || 0), info.size - 1); const end = Math.min(Number(match[2] || info.size - 1), info.size - 1);
  return new Response(data.subarray(start, end + 1), { status: 206, headers: { ...headers, "Content-Length": String(end - start + 1), "Content-Range": `bytes ${start}-${end}/${info.size}` } });
}
