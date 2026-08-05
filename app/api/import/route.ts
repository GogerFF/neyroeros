import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createArtwork } from "@/lib/services/artwork-service";
import { enforceRateLimit } from "@/lib/rate-limit";

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "",
  э: "e", ю: "yu", я: "ya",
};

function slugifyLatin(value: string) {
  return value.toLowerCase().trim()
    .split("")
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join("")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 90) || "art";
}

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

  // Кириллица в slug ломает публичные URL (500 при прямом вводе) — приводим к латинице.
  const latinSlug = `${slugifyLatin(title)}-${artwork.id.slice(0, 8)}`;
  if (latinSlug !== artwork.slug) {
    await db.artwork.update({ where: { id: artwork.id }, data: { slug: latinSlug } });
  }

  const tagNames = Array.isArray(meta.tags)
    ? meta.tags.map((t) => String(t).trim().slice(0, 64)).filter(Boolean).slice(0, 20)
    : [];
  for (const name of tagNames) {
    const tag = await db.tag.upsert({
      where: { name },
      create: { name, slug: `${slugifyLatin(name) || "tag"}-${crypto.randomUUID().slice(0, 6)}` },
      update: {},
    });
    await db.artworkTag.upsert({
      where: { artworkId_tagId: { artworkId: artwork.id, tagId: tag.id } },
      create: { artworkId: artwork.id, tagId: tag.id, source: "AI" },
      update: {},
    });
  }

  return Response.json({ id: artwork.id, slug: latinSlug, status: artwork.status, tags: tagNames.length });
}

// Удаление черновика, созданного импортом (soft delete, только DRAFT).
export async function DELETE(req: Request) {
  const user = await guard();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id обязателен" }, { status: 400 });
  const artwork = await db.artwork.findFirst({ where: { id, status: "DRAFT" } });
  if (!artwork) return Response.json({ error: "Черновик не найден" }, { status: 404 });
  await db.artwork.update({ where: { id }, data: { status: "DELETED", deletedAt: new Date() } });
  return Response.json({ ok: true, id, slug: artwork.slug });
}
