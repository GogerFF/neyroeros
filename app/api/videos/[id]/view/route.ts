import { createHmac, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { dayBucket } from "@/lib/artwork-view";

const COOKIE = "neyroeros_video_viewer";
const secret = process.env.AUTH_SECRET || "video-view-secret";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const session = await auth(); const store = await cookies();
  let visitor = store.get(COOKIE)?.value; if (!visitor) { visitor = randomUUID(); store.set(COOKIE, visitor, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 31, path: "/" }); }
  const video = await db.video.findFirst({ where: { id, status: "PUBLISHED", deletedAt: null }, select: { authorId: true } });
  if (!video || session?.user.id === video.authorId) return Response.json({ counted: false });
  const viewerKey = createHmac("sha256", secret).update(session?.user.id || visitor).digest("hex");
  try { await db.$transaction([db.videoView.create({ data: { videoId: id, viewerKey, dayBucket: dayBucket() } }), db.video.update({ where: { id }, data: { viewCount: { increment: 1 } } })]); return Response.json({ counted: true }); } catch { return Response.json({ counted: false }); }
}
