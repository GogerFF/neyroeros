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

const published = discoveryPublished;
export default async function Universe() {
  const [rawTags, rawCategories] = await Promise.all([
    db.tag.findMany({ where: { artworks: { some: { artwork: published } } }, include: { _count: { select: { artworks: { where: { artwork: published } } } } }, orderBy: { artworks: { _count: "desc" } } }),
    db.category.findMany({ where: { isActive: true, artworks: { some: published } }, include: { _count: { select: { artworks: { where: published } } } }, orderBy: { artworks: { _count: "desc" } } }),
  ]);
  const tags = rawTags.sort((a, b) => b._count.artworks - a._count.artworks || a.slug.localeCompare(b.slug));
  const categories = rawCategories.sort((a, b) => b._count.artworks - a._count.artworks || a.slug.localeCompare(b.slug));
  const schema = { "@context": "https://schema.org", "@type": "CollectionPage", name: "Neyroeros Universe", url: absoluteUrl("/universe"), description: metadata.description };
  return <section className="section universe-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}/>
    <div className="universe-intro"><span className="eyebrow">The atlas of what exists</span><h1>Universe</h1><p className="lead">Пересечения опубликованных работ, собранные из фактических тегов и категорий галереи. Никаких догадок — только следы авторов.</p><Link className="button" href="/flow?seed=universe">Войти в Flow →</Link></div>
    {!tags.length && !categories.length && <p className="empty">Пока нет тем с опубликованными работами.</p>}
    <div className="universe-section"><div className="section-title"><div><span className="eyebrow">Categories</span><h2>Орбиты</h2></div><span className="universe-count">{categories.length} категорий</span></div><div className="universe-orbits">{categories.map((c, i) => <Link className="universe-orbit" style={{ "--orbit": i } as CSSProperties} href={`/categories/${c.slug}`} key={c.id}><span className="universe-node"/><strong>{c.name}</strong><small>{c._count.artworks} {c._count.artworks === 1 ? "work" : "works"}</small></Link>)}</div></div>
    <div className="universe-section"><div className="section-title"><div><span className="eyebrow">Tags</span><h2>Constellation</h2></div><span className="universe-count">{tags.length} тегов</span></div><div className="universe-tags">{tags.map((t) => <Link className="universe-tag" href={`/tags/${t.slug}`} key={t.id}><span>#</span>{t.name}<b>{t._count.artworks}</b></Link>)}</div></div>
  </section>;
}
