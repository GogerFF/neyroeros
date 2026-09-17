import { revalidatePath, revalidateTag } from "next/cache";
import { requireTrustedOrigin } from "@/lib/request-origin";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { moderate } from "@/lib/services/moderation-service";
import { approvalRevalidationPaths } from "@/lib/moderation-paths";
import { FEED_CACHE_TAG } from "@/lib/gallery-feed";
import { db } from "@/lib/db";

/** The work's own page renders "not found" while it is a draft, so approving has
 *  to refresh that path as well - otherwise a cached miss keeps being served. */
async function revalidateApproved(ids: string[]) {
  const works = await db.artwork.findMany({
    where: { id: { in: ids } },
    select: { slug: true, category: { select: { slug: true } } },
  });
  for (const work of works) {
    for (const path of approvalRevalidationPaths(work)) revalidatePath(path);
  }
  revalidatePath("/admin");
  revalidateTag(FEED_CACHE_TAG, { expire: 0 });
}

export async function POST(request: Request) {
  const originGuard = requireTrustedOrigin(request);
  if (originGuard) return originGuard;
  const admin = await requireAdmin();
  const form = await request.formData();
  const id = String(form.get("id") || "");
  const decision = String(form.get("decision") || "");
  const reason = String(form.get("reason") || "") || undefined;

  if (id === "all" && decision === "approve") {
    const pending = await db.artwork.findMany({ where: { status: "PENDING" }, select: { id: true } });
    for (const artwork of pending) await moderate(artwork.id, admin.id, "approve", reason);
    await revalidateApproved(pending.map((artwork) => artwork.id));
    redirect("/admin");
  }

  if (!id || !["approve", "reject", "hide", "restore"].includes(decision)) redirect("/admin?error=bad-request");
  await moderate(id, admin.id, decision as "approve" | "reject" | "hide" | "restore", reason);
  if (decision === "approve" || decision === "restore") await revalidateApproved([id]);
  else {
    revalidatePath("/admin");
    revalidateTag(FEED_CACHE_TAG, { expire: 0 });
  }
  redirect("/admin");
}
