import { revalidatePath } from "next/cache";
import { requireTrustedOrigin } from "@/lib/request-origin";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { enforceRateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { commentSchema } from "@/lib/social";

export async function POST(request: Request) {
  const originGuard = requireTrustedOrigin(request);
  if (originGuard) return originGuard;
  const user = await requireUser();
  await enforceRateLimit("COMMENT", user.id, 12, 3600000);

  const form = await request.formData();
  const storyId = String(form.get("storyId") || "");
  const slug = String(form.get("slug") || "");
  const parsed = commentSchema.safeParse({ content: form.get("content") });
  if (!parsed.success) redirect(`/stories/${slug}`);

  const story = await db.story.findFirst({
    where: { id: storyId, status: "PUBLISHED", deletedAt: null },
    select: { id: true },
  });
  if (!story) redirect("/stories");

  await db.storyComment.create({
    data: { storyId, authorId: user.id, content: parsed.data.content },
  });

  revalidatePath(`/stories/${slug}`);
  redirect(`/stories/${slug}`);
}
