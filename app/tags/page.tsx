import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { breadcrumbSchema } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Теги AI-арта",
  description: "Все теги галереи нейро-искусства: стили, темы, персонажи и настроения. Коллекции AI-арта 18+ по направлениям.",
  alternates: { canonical: "/tags" },
};

export default async function TagsIndex() {
  const tags = await db.tag.findMany({
    where: { artworks: { some: { artwork: { status: "PUBLISHED", deletedAt: null } } } },
    include: { _count: { select: { artworks: true } } },
    orderBy: { artworks: { _count: "desc" } },
  });
  const schema = breadcrumbSchema([{ name: "Главная", path: "/" }, { name: "Теги", path: "/tags" }]);
  return <section className="section">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}/>
    <span className="eyebrow">Коллекции</span>
    <h1>Теги AI-арта</h1>
    <p className="lead">Все направления галереи одним списком: стили, темы и настроения нейро-искусства. Каждый тег — отдельная коллекция с собственным индексом в поисковых системах.</p>
    <div className="tags" style={{ marginTop: "1.5rem" }}>
      {tags.map(t => <Link href={`/tags/${t.slug}`} key={t.id} className="tag-pill">
        #{t.name} <span>{t._count.artworks}</span>
      </Link>)}
    </div>
  </section>;
}
