import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  await requireAdmin();
  const form = await request.formData();
  const id = String(form.get("id") || "");
  const decision = String(form.get("decision") || "");
  const reason = String(form.get("reason") || "").trim() || null;

  if (id === "all" && decision === "approve") {
    const now = new Date();
    await db.video.updateMany({ where: { status: "PENDING" }, data: { status: "PUBLISHED", approvedAt: now, publishedAt: now, moderationNote: reason } });
    revalidatePath("/"); revalidatePath("/videos"); revalidatePath("/admin/videos");
    redirect("/admin/videos");
  }

  const video = await db.video.findUniqueOrThrow({ where: { id } });
  if (video.status !== "PENDING") redirect("/admin/videos");
  if (decision === "approve") await db.video.update({ where: { id }, data: { status: "PUBLISHED", approvedAt: new Date(), publishedAt: new Date(), moderationNote: reason } });
  else if (decision === "reject") await db.video.update({ where: { id }, data: { status: "REJECTED", moderationNote: reason } });
  else redirect("/admin/videos");
  revalidatePath("/"); revalidatePath("/videos"); revalidatePath("/admin/videos"); redirect("/admin/videos");
}
