import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ArtworkGrid } from "@/components/artwork-grid";
import { breadcrumbSchema, collectionSchema } from "@/lib/seo";
import { getLocale, getMessages, localizeArtworks } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

async function getTag(slug: string) {
  return db.tag.findUnique({ where: { slug }, include: { _count: { select: { artworks: true } } } });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTag(slug);
  if (!t) return {};
  const count = t._count.artworks;
  return {
    title: `#${t.name}`,
    description: `Галерея AI-арта по тегу «${t.name}» — ${count} работ. Портреты, фэнтези, киберпанк и другие направления нейро-искусства 18+.`,
    alternates: { canonical: `/tags/${t.slug}` },
  };
}

export default async function TagPage({ params }: Params) {
  const { slug } = await params;
  const [t, locale, m] = await Promise.all([getTag(slug), getLocale(), getMessages()]);
  if (!t) notFound();
  const artworks = await db.artwork.findMany({
    where: { status: "PUBLISHED", deletedAt: null, tags: { some: { tag: { slug: t.slug } } } },
    include: { asset: true, author: true, category: true },
    orderBy: { publishedAt: "desc" },
    take: 120,
  });
  const works = await localizeArtworks(artworks, locale);
  const related = await db.tag.findMany({
    where: {
      NOT: { id: t.id },
      artworks: { some: { artwork: { status: "PUBLISHED", deletedAt: null, tags: { some: { tagId: t.id } } } } },
    },
    include: { _count: { select: { artworks: true } } },
    orderBy: { artworks: { _count: "desc" } },
    take: 16,
  });
  const fallback = related.length >= 6 ? [] : await db.tag.findMany({
    where: { NOT: { id: t.id }, artworks: { some: { artwork: { status: "PUBLISHED", deletedAt: null } } } },
    include: { _count: { select: { artworks: true } } },
    orderBy: { artworks: { _count: "desc" } },
    take: 16 - related.length,
  });
  const crossLinks = [...related, ...fallback.filter(f => !related.some(r => r.id === f.id))];
  const schema = [
    collectionSchema({ name: `#${t.name}`, slug: `tags/${t.slug}`, description: `AI-арт по тегу ${t.name}` }),
    breadcrumbSchema([
      { name: "Главная", path: "/" },
      { name: "Теги", path: "/tags" },
      { name: `#${t.name}`, path: `/tags/${t.slug}` },
    ]),
  ];
  return <section className="section">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}/>
    <span className="eyebrow">{m.category}</span>
    <h1>#{t.name}</h1>
    <p className="lead">Коллекция из {t._count.artworks} работ по тегу «{t.name}». Кураторская галерея нейро-искусства: портреты, фэнтези-миры, киберпанк-сцены и стилистические эксперименты.</p>
    <p className="category-hint">Откройте работу и листайте подборку стрелками ← → или кнопками на странице.</p>
    <ArtworkGrid items={works} locale={locale} m={m}/>
    {crossLinks.length > 0 && <nav className="tag-cross" aria-label="Похожие теги">
      <h2>Похожие теги</h2>
      <div className="tags">
        {crossLinks.map(c => <Link href={`/tags/${c.slug}`} key={c.id} className="tag-pill">
          #{c.name} <span>{c._count.artworks}</span>
        </Link>)}
      </div>
    </nav>}
  </section>;
}
