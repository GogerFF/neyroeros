import { db } from "@/lib/db";
import { readHeroMedia } from "@/lib/storage/hero-media";

export async function GET(_: Request, { params }: { params: Promise<{ id: string; kind: string }> }) {
  const { id, kind } = await params;
  const video = await db.heroVideo.findFirst({ where: { id, status: "ACTIVE" } });
  if (!video) return new Response("Не найдено", { status: 404 });
  const map = {
    mp4: { key: video.mp4Key, type: "video/mp4" },
    webm: video.webmKey ? { key: video.webmKey, type: "video/webm" } : null,
    poster: { key: video.posterKey, type: "image/webp" },
  } as const;
  const source = map[kind as keyof typeof map];
  if (!source) return new Response("Не найдено", { status: 404 });
  return new Response(await readHeroMedia(source.key), { headers: { "Content-Type": source.type, "Cache-Control": "public, max-age=86400", "X-Content-Type-Options": "nosniff" } });
}
