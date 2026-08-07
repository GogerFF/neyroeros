import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const artworks = await db.artwork.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    select: { id: true, slug: true, title: true, description: true, updatedAt: true },
    orderBy: { publishedAt: "desc" },
    take: 2000,
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${artworks.map((a) => `
  <url>
    <loc>https://neyroeros.com/artwork/${a.slug}</loc>
    <lastmod>${a.updatedAt.toISOString()}</lastmod>
    <image:image>
      <image:loc>https://neyroeros.com/api/images/preview/${a.id}</image:loc>
      <image:title>${escapeXml(a.title)}</image:title>
      <image:caption>${escapeXml(a.description?.slice(0, 500) ?? a.title)}</image:caption>
    </image:image>
  </url>`).join("")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600, s-maxage=7200" },
  });
}

function escapeXml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
