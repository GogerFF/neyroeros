import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { heroDurationIsAllowed, storeHeroMedia } from "@/lib/storage/hero-media";

export async function POST(request: Request) {
  await requireAdmin();
  const form = await request.formData();
  const title = String(form.get("title") || "").trim().slice(0, 100);
  const durationSec = Number(form.get("durationSec"));
  const mp4 = form.get("mp4");
  const poster = form.get("poster");
  const webm = form.get("webm");

  if (!title || !heroDurationIsAllowed(durationSec) || !(mp4 instanceof File) || !(poster instanceof File)) {
    redirect("/admin/hero?error=invalid-upload");
  }
  const activeCount = await db.heroVideo.count({ where: { status: "ACTIVE" } });
  if (activeCount >= 12) redirect("/admin/hero?error=active-limit");

  const stored = await storeHeroMedia(mp4, poster, webm instanceof File ? webm : undefined);
  const last = await db.heroVideo.aggregate({ _max: { sortOrder: true } });
  await db.heroVideo.create({ data: { title, durationSec, ...stored, sortOrder: (last._max.sortOrder ?? 0) + 1, status: "ACTIVE" } });
  revalidatePath("/");
  revalidatePath("/admin/hero");
  redirect("/admin/hero?uploaded=1");
}
