import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { deleteArtwork, submitArtwork, updateArtwork } from "@/lib/services/artwork-service";

export async function POST(request: Request) {
  const user = await requireUser();
  const form = await request.formData();
  const id = String(form.get("id") || "");
  const op = String(form.get("op") || "");
  if (!id || !["submit", "update", "delete"].includes(op)) redirect("/dashboard?error=bad-request");

  if (op === "submit") {
    await submitArtwork(user.id, id);
  } else if (op === "delete") {
    await deleteArtwork(user.id, id);
  } else {
    const title = String(form.get("title") || "").trim();
    const categoryId = String(form.get("categoryId") || "");
    if (title.length < 2 || !categoryId) redirect(`/dashboard/uploads/${id}/edit?error=invalid`);
    await updateArtwork(user.id, id, {
      title,
      description: String(form.get("description") || "").trim() || undefined,
      sourceLocale: String(form.get("sourceLocale") || "ru"),
      categoryId,
    });
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/search");
  revalidatePath("/categories");
  redirect("/dashboard");
}
