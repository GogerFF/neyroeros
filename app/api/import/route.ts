import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createArtwork } from "@/lib/services/artwork-service";
import { slugify } from "@/lib/utils";
import { enforceRateLimit } from "@/lib/rate-limit";

async function guard() {
  const s = await auth();
  if (!s?.user || !["ADMIN", "MODERATOR"].includes(s.user.role)) return null;
  return s.user;
}

export async function GET() {
  const user = await guard();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const categories = await db.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, description: true },
    orderBy: { name: "asc" },
  });
  return Response.json({ categories });
}

export async function POST(req: Request) {
  const user = await guard();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await enforceRateLimit("IMPORT", user.id, 200, 3600000);

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Файл обязателен" }, { status: 400 });
  }

  let meta: Record<string, unknown> = {};
  try {
    meta = JSON.parse(String(form.get("meta") || "{}"));
  } catch {
    return Response.json({ error: "meta: некорректный JSON" }, { status: 400 });
  }

  const title = String(meta.title || "").trim().slice(0, 100);
  if (!title) return Response.json({ error: "Заголовок обязателен" }, { status: 400 });
  const description = String(meta.description || "").trim().slice(0, 2000) || undefined;
  const categoryId =
    typeof meta.categoryId === "string" && meta.categoryId ? meta.categoryId : undefined;

  const artwork = await createArtwork(user.id, {
    title,
    description,
    sourceLocale: "ru",
    categoryId,
    tags: "",
    file,
    adults: true,
    consensual: true,
    noDeepfake: true,
  });

  const tagNames = Array.isArray(meta.tags)
    ? meta.tags.map((t) => String(t).trim().slice(0, 64)).filter(Boolean).slice(0, 20)
    : [];
  for (const name of tagNames) {
    const tag = await db.tag.upsert({
      where: { name },
      create: { name, slug: `${slugify(name) || "tag"}-${crypto.randomUUID().slice(0, 6)}` },
      update: {},
    });
    await db.artworkTag.upsert({
      where: { artworkId_tagId: { artworkId: artwork.id, tagId: tag.id } },
      create: { artworkId: artwork.id, tagId: tag.id, source: "AI" },
      update: {},
    });
  }

  return Response.json({ id: artwork.id, slug: artwork.slug, status: artwork.status, tags: tagNames.length });
}
