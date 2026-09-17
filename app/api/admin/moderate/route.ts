import { revalidatePath, revalidateTag } from "next/cache";
import { requireTrustedOrigin } from "@/lib/request-origin";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { moderate } from "@/lib/services/moderation-service";
import { FEED_CACHE_TAG } from "@/lib/gallery-feed";
import { db } from "@/lib/db";

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
    revalidatePath("/admin");
    revalidateTag(FEED_CACHE_TAG, { expire: 0 });
    redirect("/admin");
  }

  if (!id || !["approve", "reject", "hide", "restore"].includes(decision)) redirect("/admin?error=bad-request");
  await moderate(id, admin.id, decision as "approve" | "reject" | "hide" | "restore", reason);
  revalidatePath("/admin");
  revalidateTag(FEED_CACHE_TAG, { expire: 0 });
  redirect("/admin");
}
