import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { enforceRateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { commentSchema } from "@/lib/social";

export async function POST(request: Request) {
  const user = await requireUser(); await enforceRateLimit("VIDEO_COMMENT", user.id, 12, 3600000);
  const form = await request.formData(); const videoId = String(form.get("videoId") || ""); const slug = String(form.get("slug") || ""); const parsed = commentSchema.safeParse({ content: form.get("content") });
  if (!parsed.success) redirect(`/videos/${slug}`);
  const video = await db.video.findFirst({ where: { id: videoId, status: "PUBLISHED", deletedAt: null }, select: { id: true } }); if (!video) redirect("/videos");
  await db.videoComment.create({ data: { videoId, authorId: user.id, content: parsed.data.content } }); revalidatePath(`/videos/${slug}`); redirect(`/videos/${slug}`);
}
