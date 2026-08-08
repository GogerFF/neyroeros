import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { enforceRateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { slugifyLatin } from "@/lib/utils";
import { validatePolicyAcknowledgement } from "@/lib/policy";
import { videoDurationIsAllowed } from "@/lib/video-input";
import { storeUserVideo } from "@/lib/storage/video-storage";

export async function POST(request: Request) {
  const user = await requireUser();
  await enforceRateLimit("VIDEO_UPLOAD", user.id, 5, 3600000);
  const form = await request.formData();
  const file = form.get("file"); const poster = form.get("poster");
  const title = String(form.get("title") || "").trim();
  const categoryId = String(form.get("categoryId") || "");
  const durationSec = Number(form.get("durationSec"));
  if (!(file instanceof File) || !(poster instanceof File) || title.length < 2 || !categoryId || !videoDurationIsAllowed(durationSec)) redirect("/dashboard/videos/new?error=invalid");
  validatePolicyAcknowledgement({ adults: form.get("adults") === "on", consensual: form.get("consensual") === "on", noDeepfake: form.get("noDeepfake") === "on" });
  const asset = await storeUserVideo(file, poster);
  await db.video.create({ data: { authorId: user.id, title, description: String(form.get("description") || "").trim() || null, sourceLocale: String(form.get("sourceLocale") || "ru"), categoryId, durationSec, slug: `${slugifyLatin(title)}-${crypto.randomUUID().slice(0, 8)}`, ...asset } });
  revalidatePath("/dashboard"); redirect("/dashboard?created=video");
}
