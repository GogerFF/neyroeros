import { revalidatePath } from "next/cache";
import { requireTrustedOrigin } from "@/lib/request-origin";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createArtwork } from "@/lib/services/artwork-service";

export async function POST(request: Request) {
  const originGuard = requireTrustedOrigin(request);
  if (originGuard) return originGuard;
  const user = await requireUser();
  await enforceRateLimit("UPLOAD", user.id, 10, 3600000);

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/dashboard/uploads/new?error=file-required");
  }

  const categoryId = String(form.get("categoryId") || "");
  if (!categoryId) redirect("/dashboard/uploads/new?error=category-required");

  await createArtwork(user.id, {
    title: String(form.get("title") || ""),
    description: String(form.get("description") || ""),
    sourceLocale: String(form.get("sourceLocale") || "ru"),
    categoryId,
    tags: String(form.get("tags") || ""),
    file,
    adults: form.get("adults") === "on",
    consensual: form.get("consensual") === "on",
    noDeepfake: form.get("noDeepfake") === "on",
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/search");
  revalidatePath("/categories");
  redirect("/dashboard?created=artwork");
}
