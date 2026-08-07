import { db } from "@/lib/db";
import { categoryLabel } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const expected = process.env.CRON_SECRET;

  if (!expected || secret !== expected) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find a random published artwork
  const count = await db.artwork.count({ where: { status: "PUBLISHED", deletedAt: null } });
  if (count === 0) return Response.json({ error: "No artworks" }, { status: 404 });

  const skip = Math.floor(Math.random() * count);
  const artwork = await db.artwork.findFirst({
    where: { status: "PUBLISHED", deletedAt: null },
    include: { author: true, category: true, asset: true },
    orderBy: { publishedAt: "desc" },
    skip,
  });

  if (!artwork) return Response.json({ error: "Not found" }, { status: 404 });

  const imageUrl = absoluteUrl(`/api/images/preview/${artwork.id}`);
  const pageUrl = absoluteUrl(`/artwork/${artwork.slug}`);
  const catName = artwork.category
    ? categoryLabel(artwork.category.slug, "ru", artwork.category).name
    : "AI Art";

  return Response.json({
    title: artwork.title,
    description: artwork.description?.slice(0, 300),
    author: artwork.author.displayName ?? "Neyroeros",
    category: catName,
    imageUrl,
    pageUrl,
    text: formatTelegramPost(artwork.title, artwork.description, catName, pageUrl),
  });
}

function formatTelegramPost(title: string, description: string | null, category: string, url: string) {
  const desc = description?.slice(0, 200).replace(/https?:\/\/\S+/g, "") || "";
  return `🎨 *${title}*\\\n\\#${category.replace(/\s+/g, "")} \\#AIArt \\#Neyroeros\\\n\\\n${desc}\\...\\\n\\\n[Смотреть на neyroeros\\.com](${url})`;
}
