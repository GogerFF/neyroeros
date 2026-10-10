import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { discoveryPublished } from "@/lib/flow";
import Link from "next/link";
import { db } from "@/lib/db";
import { absoluteUrl, serializeJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Universe — темы и направления",
  description: "Карта тем Neyroeros: реальные теги и категории опубликованных работ.",
  alternates: { canonical: "/universe" },
};

export default async function Universe() {
  // Count published works per tag/category with a single GROUP BY each, then
  // fetch names in bulk. The previous `include: { _count: ... }` + `orderBy` by
  // that count compiled to a correlated COUNT(*) subquery per row, which blocked
  // the single Passenger worker on a populated DB and froze the whole site.
  const [tagGroups, catGroups] = await Promise.all([
    db.artworkTag.groupBy({ by: ["tagId"], where: { artwork: discoveryPublished }, _count: { _all: true } }),
    db.artwork.groupBy({ by: ["categoryId"], where: { ...discoveryPublished, categoryId: { not: null } }, _count: { _all: true } }),
  ]);

  const tagCount = new Map(tagGroups.map((g) => [g.tagId, g._count._all]));
  const catCount = new Map(catGroups.map((g) => [g.categoryId!, g._count._all]));

  const [tagRows, catRows] = await Promise.all([
    db.tag.findMany({ where: { id: { in: [...tagCount.keys()] } }, select: { id: true, name: true, slug: true } }),
    db.category.findMany({ where: { id: { in: [...catCount.keys()] }, isActive: true }, select: { id: true, name: true, slug: true } }),
  ]);

  const tags = tagRows
    .map((t) => ({ id: t.id, name: t.name, slug: t.slug, count: tagCount.get(t.id) ?? 0 }))
    .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));
  const categories = catRows
    .map((c) => ({ id: c.id, name: c.name, slug: c.slug, count: catCount.get(c.id) ?? 0 }))
    .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));

  const schema = { "@context": "https://schema.org", "@type": "CollectionPage", name: "Neyroeros Universe", url: absoluteUrl("/universe"), description: metadata.description };
  return <section className="section universe-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}/>
    <div className="universe-intro"><span className="eyebrow">The atlas of what exists</span><h1>Universe</h1><p className="lead">Пересечения опубликованных работ, собранные из фактических тегов и категорий галереи. Никаких догадок — только следы авторов.</p><Link className="button" href="/flow?seed=universe">Войти в Flow →</Link></div>
    {!tags.length && !categories.length && <p className="empty">Пока нет тем с опубликованными работами.</p>}
    <div className="universe-section"><div className="section-title"><div><span className="eyebrow">Categories</span><h2>Орбиты</h2></div><span className="universe-count">{categories.length} категорий</span></div><div className="universe-orbits">{categories.map((c, i) => <Link className="universe-orbit" style={{ "--orbit": i } as CSSProperties} href={`/categories/${c.slug}`} key={c.id}><span className="universe-node"/><strong>{c.name}</strong><small>{c.count} {c.count === 1 ? "work" : "works"}</small></Link>)}</div></div>
    <div className="universe-section"><div className="section-title"><div><span className="eyebrow">Tags</span><h2>Constellation</h2></div><span className="universe-count">{tags.length} тегов</span></div><div className="universe-tags">{tags.map((t) => <Link className="universe-tag" href={`/tags/${t.slug}`} key={t.id}><span>#</span>{t.name}<b>{t.count}</b></Link>)}</div></div>
  </section>;
}
