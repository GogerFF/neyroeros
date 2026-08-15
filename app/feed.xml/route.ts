import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const L = {
  ru: { title: "Neyroeros — новые AI-арты", desc: "Свежие одобренные работы, видео и истории кураторской 18+ галереи AI-искусства." },
} as const;

export async function GET() {
  const [artworks, videos, stories] = await Promise.all([
    db.artwork.findMany({
      where: { status: "PUBLISHED", deletedAt: null, publishedAt: { not: null } },
      select: { slug: true, title: true, description: true, publishedAt: true, id: true, author: { select: { displayName: true } }, category: { select: { slug: true, name: true } } },
      orderBy: { publishedAt: "desc" },
      take: 30,
    }),
    db.video.findMany({
      where: { status: "PUBLISHED", deletedAt: null, publishedAt: { not: null } },
      select: { slug: true, title: true, description: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
      take: 10,
    }),
    db.story.findMany({
      where: { status: "PUBLISHED", deletedAt: null, publishedAt: { not: null } },
      select: { slug: true, title: true, description: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
      take: 10,
    }),
  ]);

  type Item = { link: string; title: string; description: string; date: Date; image?: string; category?: string };
  const items: Item[] = [
    ...artworks.map(a => ({ link: absoluteUrl(`/artwork/${a.slug}`), title: a.title, description: a.description ?? "", date: a.publishedAt!, image: absoluteUrl(`/api/images/preview/${a.id}`), category: a.category?.name })),
    ...videos.map(v => ({ link: absoluteUrl(`/videos/${v.slug}`), title: v.title, description: v.description ?? "", date: v.publishedAt! })),
    ...stories.map(s => ({ link: absoluteUrl(`/stories/${s.slug}`), title: s.title, description: (s.description ?? "").slice(0, 600), date: s.publishedAt! })),
  ].sort((x, y) => y.date.getTime() - x.date.getTime()).slice(0, 50);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
<title>${esc(L.ru.title)}</title>
<link>https://neyroeros.com</link>
<description>${esc(L.ru.desc)}</description>
<language>ru</language>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
<atom:link href="https://neyroeros.com/feed.xml" rel="self" type="application/rss+xml"/>
${items.map(i => `
<item>
<title>${esc(i.title)}</title>
<link>${esc(i.link)}</link>
<guid isPermaLink="true">${esc(i.link)}</guid>
<pubDate>${i.date.toUTCString()}</pubDate>${i.category ? `
<category>${esc(i.category)}</category>` : ""}
<description>${esc(i.description.slice(0, 600))}</description>${i.image ? `
<enclosure url="${esc(i.image)}" type="image/webp" length="0"/>
<media:content url="${esc(i.image)}" medium="image"/>` : ""}
</item>`).join("")}
</channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=1800, s-maxage=3600" },
  });
}

function esc(str: string) {
  return str
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
