import { revalidatePath } from "next/cache";
import { requireTrustedOrigin } from "@/lib/request-origin";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { enforceRateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const originGuard = requireTrustedOrigin(request);
  if (originGuard) return originGuard;
  const user = await requireUser(); await enforceRateLimit("VIDEO_LIKE", user.id, 60, 60000);
  const form = await request.formData(); const videoId = String(form.get("videoId") || ""); const slug = String(form.get("slug") || "");
  const where = { videoId_userId: { videoId, userId: user.id } }; const existing = await db.videoLike.findUnique({ where });
  if (existing) await db.videoLike.delete({ where }); else await db.videoLike.create({ data: { videoId, userId: user.id } });
  revalidatePath(`/videos/${slug}`); redirect(`/videos/${slug}`);
}
