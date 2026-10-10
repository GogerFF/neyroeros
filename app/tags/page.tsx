import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { discoveryPublished } from "@/lib/flow";
import { breadcrumbSchema } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Теги AI-арта",
  description: "Все теги галереи нейро-искусства: стили, темы, персонажи и настроения. Коллекции AI-арта 18+ по направлениям.",
  alternates: { canonical: "/tags" },
};

export default async function TagsIndex() {
  // Same single-GROUP-BY pattern as /universe: the previous `_count` + `orderBy`
  // on the relation count compiled to a correlated COUNT(*) per tag and blocked
  // the single Passenger worker on a populated DB.
  const groups = await db.artworkTag.groupBy({
    by: ["tagId"],
    where: { artwork: discoveryPublished },
    _count: { _all: true },
  });
  const countByTag = new Map(groups.map((g) => [g.tagId, g._count._all]));
  const rows = await db.tag.findMany({ where: { id: { in: [...countByTag.keys()] } }, select: { id: true, name: true, slug: true } });
  const tags = rows
    .map((t) => ({ id: t.id, name: t.name, slug: t.slug, count: countByTag.get(t.id) ?? 0 }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const schema = breadcrumbSchema([{ name: "Главная", path: "/" }, { name: "Теги", path: "/tags" }]);
  return <section className="section">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}/>
    <span className="eyebrow">Коллекции</span>
    <h1>Теги AI-арта</h1>
    <p className="lead">Все направления галереи одним списком: стили, темы и настроения нейро-искусства. Каждый тег — отдельная коллекция с собственным индексом в поисковых системах.</p>
    <div className="tags" style={{ marginTop: "1.5rem" }}>
      {tags.map(t => <Link href={`/tags/${t.slug}`} key={t.id} className="tag-pill">
        #{t.name} <span>{t.count}</span>
      </Link>)}
    </div>
  </section>;
}
