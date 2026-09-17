import { revalidatePath } from "next/cache";
import { requireTrustedOrigin } from "@/lib/request-origin";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createStory } from "@/lib/services/story-service";

export async function POST(request: Request) {
  const originGuard = requireTrustedOrigin(request);
  if (originGuard) return originGuard;
  const user = await requireUser();
  await enforceRateLimit("STORY", user.id, 5, 3600000);

  const form = await request.formData();
  const files = form.getAll("illustrations").filter(
    (x): x is File => x instanceof File && x.size > 0
  );

  await createStory({
    authorId: user.id,
    title: String(form.get("title") || ""),
    body: String(form.get("body") || ""),
    description: String(form.get("description") || "") || undefined,
    sourceLocale: String(form.get("sourceLocale") || "ru"),
    illustrations: files,
  });

  revalidatePath("/dashboard");
  revalidatePath("/stories");
  redirect("/dashboard");
}
