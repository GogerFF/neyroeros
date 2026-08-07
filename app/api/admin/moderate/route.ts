import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { moderate } from "@/lib/services/moderation-service";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  const form = await request.formData();
  const id = String(form.get("id") || "");
  const decision = String(form.get("decision") || "");
  const reason = String(form.get("reason") || "") || undefined;

  if (!id || !["approve", "reject", "hide", "restore"].includes(decision)) {
    redirect("/admin?error=bad-request");
  }

  await moderate(id, admin.id, decision as "approve" | "reject" | "hide" | "restore", reason);
  revalidatePath("/admin");
  redirect("/admin");
}
