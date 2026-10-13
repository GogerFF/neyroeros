import { revalidatePath } from "next/cache";
import { requireTrustedOrigin } from "@/lib/request-origin";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { slugifyLatin } from "@/lib/utils";
import { adminVideoSizeIsAllowed } from "@/lib/admin-video-input";
import { storeAdminCategoryVideo } from "@/lib/storage/admin-category-video";

export async function POST(request: Request) {
  const originGuard = requireTrustedOrigin(request);
  if (originGuard) return originGuard;
  const admin = await requireAdmin();
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    redirect("/admin?videoError=too-large");
  }

  const file = form.get("file");
  const categoryId = String(form.get("categoryId") || "");
  const title = String(form.get("title") || "").trim();
  const description = String(form.get("description") || "").trim();
  // Duration is not entered on the upload form; store "unknown" rather than a
  // fabricated number. UI and JSON-LD hide the field when it is zero.
  const durationSec = 0;
  if (!(file instanceof File) || !adminVideoSizeIsAllowed(file.size) || title.length < 2 || title.length > 100 || description.length < 2 || description.length > 2000) {
    redirect("/admin?videoError=invalid");
  }

  const category = await db.category.findFirst({ where: { id: categoryId, isActive: true }, select: { id: true, slug: true } });
  if (!category) redirect("/admin?videoError=category");

  try {
    const stored = await storeAdminCategoryVideo(file);
    const now = new Date();
    await db.video.create({
      data: {
        authorId: admin.id,
        categoryId: category.id,
        title,
        description,
        durationSec,
        slug: `${slugifyLatin(title) || "video"}-${crypto.randomUUID().slice(0, 8)}`,
        status: "PUBLISHED",
        sourceLocale: "ru",
        submittedAt: now,
        approvedAt: now,
        publishedAt: now,
        ...stored,
      },
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "upload-failed";
    redirect(`/admin?videoError=upload&reason=${encodeURIComponent(reason)}`);
  }

  revalidatePath(`/categories/${category.slug}`);
  revalidatePath("/videos");
  revalidatePath("/admin");
  redirect("/admin?videoUploaded=1");
}
