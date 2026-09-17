import { revalidatePath } from "next/cache";
import { requireTrustedOrigin } from "@/lib/request-origin";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { enforceRateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const originGuard = requireTrustedOrigin(request);
  if (originGuard) return originGuard;
  const user = await requireUser();
  await enforceRateLimit("LIKE", user.id, 60, 60000);

  const form = await request.formData();
  const storyId = String(form.get("storyId") || "");
  const slug = String(form.get("slug") || "");
  if (!storyId) redirect("/stories");

  const story = await db.story.findFirst({
    where: { id: storyId, status: "PUBLISHED", deletedAt: null },
    select: { id: true },
  });
  if (!story) redirect("/stories");

  const where = { storyId_userId: { storyId, userId: user.id } };
  const existing = await db.storyLike.findUnique({ where });
  if (existing) await db.storyLike.delete({ where });
  else await db.storyLike.create({ data: { storyId, userId: user.id } });

  revalidatePath(`/stories/${slug}`);
  redirect(`/stories/${slug}`);
}
