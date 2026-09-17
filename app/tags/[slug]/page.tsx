import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ArtworkGrid } from "@/components/artwork-grid";
import { breadcrumbSchema, collectionSchema } from "@/lib/seo";
import { getLocale, getMessages, localizeArtworks } from "@/lib/i18n-server";
import { firstMatch, slugCandidates } from "@/lib/slug-param";
import { tagPageText } from "@/lib/tag-page-text";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

const publishedArtwork = { status: "PUBLISHED" as const, deletedAt: null };
const tagSelect = {
  id: true, name: true, slug: true,
  _count: { select: { artworks: { where: { artwork: publishedArtwork } } } },
} as const;

async function getTag(slug: string) {
  return firstMatch(slugCandidates(slug), (candidate) =>
    db.tag.findUnique({ where: { slug: candidate }, select: { id: true, name: true, slug: true, _count: { select: { artworks: { where: { artwork: publishedArtwork } } } } } }));
}

/**
 * Tags that co-occur with this one on published works, busiest first, topped up
 * with generally busy tags so a thin tag still gets a useful way out of the page.
 */
async function getRelatedTags(tagId: string, take: number) {
  const coOccurring = await db.tag.findMany({
    where: { NOT: { id: tagId }, artworks: { some: { artwork: { ...publishedArtwork, tags: { some: { tagId } } } } } },
    select: tagSelect,
    orderBy: { artworks: { _count: "desc" } },
    take,
  });
  if (coOccurring.length >= take) return coOccurring;
  const filler = await db.tag.findMany({
    where: { NOT: { id: tagId }, artworks: { some: { artwork: publishedArtwork } } },
    select: tagSelect,
    orderBy: { artworks: { _count: "desc" } },
    take: take - coOccurring.length,
  });
  return [...coOccurring, ...filler.filter((f) => !coOccurring.some((c) => c.id === f.id))];
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTag(slug);
  if (!t) return {};
  const related = await getRelatedTags(t.id, 4);
  const { title, description } = tagPageText({
    name: t.name,
    publishedWorks: t._count.artworks,
    relatedNames: related.map((r) => r.name),
  });
  return { title, description, alternates: { canonical: `/tags/${t.slug}` } };
}

export default async function TagPage({ params }: Params) {
  const { slug } = await params;
  const [t, locale, m] = await Promise.all([getTag(slug), getLocale(), getMessages()]);
  if (!t) notFound();

  const artworks = await db.artwork.findMany({
    where: { ...publishedArtwork, tags: { some: { tag: { slug: t.slug } } } },
    include: { asset: true, author: true, category: true },
    orderBy: { publishedAt: "desc" },
    take: 120,
  });
  const works = await localizeArtworks(artworks, locale);
  const crossLinks = await getRelatedTags(t.id, 16);

  // Works reachable through the neighbouring tags: this is what a one-work tag page
  // needs in order to stop being an empty dead end for a visitor or a crawler.
  const neighbourTagIds = crossLinks.slice(0, 8).map((c) => c.id);
  const seen = new Set(artworks.map((a) => a.id));
  const adjacent = neighbourTagIds.length
    ? await db.artwork.findMany({
        where: { ...publishedArtwork, id: { notIn: [...seen] }, tags: { some: { tagId: { in: neighbourTagIds } } } },
        include: { asset: true, author: true, category: true, _count: { select: { likes: true } } },
        orderBy: { publishedAt: "desc" },
        take: 12,
      })
    : [];
  const adjacentWorks = await localizeArtworks(adjacent, locale);

  const pageText = tagPageText({
    name: t.name,
    publishedWorks: t._count.artworks,
    relatedNames: crossLinks.slice(0, 4).map((c) => c.name),
  });

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
    <p className="lead">{pageText.description}</p>
    <ArtworkGrid items={works} locale={locale} m={m}/>
    {crossLinks.length > 0 && <nav className="tag-cross" aria-label="Похожие теги">
      <h2>Похожие теги</h2>
      <div className="tags">
        {crossLinks.map(c => <Link href={`/tags/${c.slug}`} key={c.id} className="tag-pill">
          #{c.name} <span>{c._count.artworks}</span>
        </Link>)}
      </div>
    </nav>}
    {adjacentWorks.length > 0 && <div className="section">
      <h2>Похожие работы по близким тегам</h2>
      <p className="category-hint">Подборка из смежных направлений — чтобы из узкого тега было куда идти дальше.</p>
      <ArtworkGrid items={adjacentWorks} locale={locale} m={m}/>
    </div>}
  </section>;
}
