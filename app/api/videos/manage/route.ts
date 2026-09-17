import { revalidatePath } from "next/cache";
import { requireTrustedOrigin } from "@/lib/request-origin";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const originGuard = requireTrustedOrigin(request);
  if (originGuard) return originGuard;
  const user = await requireUser(); const form = await request.formData(); const id = String(form.get("id") || ""); const op = String(form.get("op") || "");
  if (id === "all" && op === "submit-all") {
    const now = new Date();
    await db.video.updateMany({ where: { authorId: user.id, status: { in: ["DRAFT", "REJECTED"] } }, data: { status: "PENDING", submittedAt: now, moderationNote: null } });
    revalidatePath("/dashboard"); redirect("/dashboard?submitted=all");
  }
  const video = await db.video.findUniqueOrThrow({ where: { id } });
  if (video.authorId !== user.id) redirect("/dashboard");
  if (op === "submit" && ["DRAFT", "REJECTED"].includes(video.status)) await db.video.update({ where: { id }, data: { status: "PENDING", submittedAt: new Date(), moderationNote: null } });
  if (op === "delete" && ["DRAFT", "REJECTED"].includes(video.status)) await db.video.update({ where: { id }, data: { status: "DELETED", deletedAt: new Date() } });
  revalidatePath("/dashboard"); redirect("/dashboard");
}
