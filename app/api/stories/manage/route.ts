import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const user = await requireUser();
  const form = await request.formData();
  const id = String(form.get("id") || "");
  const op = String(form.get("op") || "");

  if (!id || !["publish", "delete"].includes(op)) {
    redirect("/dashboard?error=bad-request");
  }

  const story = await db.story.findUniqueOrThrow({ where: { id } });
  if (story.authorId !== user.id && !["ADMIN", "MODERATOR"].includes(user.role)) {
    redirect("/dashboard?error=forbidden");
  }

  if (op === "publish") {
    if (story.status !== "DRAFT") redirect("/dashboard?error=already-published");
    await db.story.update({
      where: { id },
      data: { status: "PUBLISHED", publishedAt: new Date(), approvedAt: new Date() },
    });
  } else if (op === "delete") {
    await db.story.update({
      where: { id },
      data: { status: "DELETED", deletedAt: new Date() },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/stories");
  redirect("/dashboard");
}
