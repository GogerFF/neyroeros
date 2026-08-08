import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { profileSchema } from "@/lib/profile-input";

export async function POST(request: Request) {
  const user = await requireUser();
  const form = await request.formData();
  const parsed = profileSchema.safeParse({ handle: String(form.get("handle") || ""), bio: String(form.get("bio") || "") });
  if (!parsed.success) redirect("/dashboard/settings?profile=invalid");

  const existing = await db.user.findFirst({ where: { handle: parsed.data.handle, id: { not: user.id } }, select: { id: true } });
  if (existing) redirect("/dashboard/settings?profile=taken");

  await db.user.update({ where: { id: user.id }, data: parsed.data });
  revalidatePath("/dashboard/settings");
  revalidatePath(`/authors/${parsed.data.handle}`);
  redirect("/dashboard/settings?profile=saved");
}
