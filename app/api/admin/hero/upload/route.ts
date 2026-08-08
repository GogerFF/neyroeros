import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { heroDurationIsAllowed, storeHeroMedia } from "@/lib/storage/hero-media";

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) redirect("/login");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    redirect("/admin/hero?error=upload-too-large");
  }

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

  try {
    const stored = await storeHeroMedia(mp4, poster, webm instanceof File ? webm : undefined);
    const last = await db.heroVideo.aggregate({ _max: { sortOrder: true } });
    await db.heroVideo.create({ data: { title, durationSec, ...stored, sortOrder: (last._max.sortOrder ?? 0) + 1, status: "ACTIVE" } });
  } catch (e: any) {
    redirect(`/admin/hero?error=upload-failed&reason=${encodeURIComponent(e?.message || "unknown")}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/hero");
  redirect("/admin/hero?uploaded=1");
}
