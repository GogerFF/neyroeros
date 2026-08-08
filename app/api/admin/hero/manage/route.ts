import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  await requireAdmin();
  const form = await request.formData();
  const id = String(form.get("id") || "");
  const op = String(form.get("op") || "");
  const video = await db.heroVideo.findUnique({ where: { id } });
  if (!video) redirect("/admin/hero?error=not-found");

  if (op === "archive") await db.heroVideo.update({ where: { id }, data: { status: "ARCHIVED" } });
  else if (op === "activate") {
    const activeCount = await db.heroVideo.count({ where: { status: "ACTIVE" } });
    if (activeCount >= 12) redirect("/admin/hero?error=active-limit");
    await db.heroVideo.update({ where: { id }, data: { status: "ACTIVE" } });
  } else if (op === "move") {
    const delta = Number(form.get("delta"));
    if (![1, -1].includes(delta)) redirect("/admin/hero?error=bad-request");
    await db.heroVideo.update({ where: { id }, data: { sortOrder: Math.max(0, video.sortOrder + delta) } });
  } else redirect("/admin/hero?error=bad-request");

  revalidatePath("/");
  revalidatePath("/admin/hero");
  redirect("/admin/hero");
}
