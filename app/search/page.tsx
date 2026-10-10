import type { Metadata } from "next";
import { db } from "@/lib/db";
import Link from "next/link";
import { ArtworkGrid } from "@/components/artwork-grid";
import { getLocale, getMessages, localizeArtworks } from "@/lib/i18n-server";
import { artworkSearchWhere } from "@/lib/artwork-search";

export const metadata: Metadata = {
  title: "Поиск по галерее",
  alternates: { canonical: "/search" },
  robots: { index: false, follow: true },
};
export const dynamic = "force-dynamic";

async function getPopularTags() {
  const groups = await db.artworkTag.groupBy({
    by: ["tagId"],
    where: { artwork: { status: "PUBLISHED", deletedAt: null } },
    _count: { _all: true },
    orderBy: { _count: { tagId: "desc" } },
    take: 12,
  });
  if (!groups.length) return [];
  const rows = await db.tag.findMany({
    where: { id: { in: groups.map((g) => g.tagId) } },
    select: { id: true, name: true, slug: true },
  });
  const byId = new Map(rows.map((tag) => [tag.id, tag]));
  return groups.map((group) => byId.get(group.tagId)).filter((tag): tag is { id: string; name: string; slug: string } => Boolean(tag));
}

export default async function Search({ searchParams }: PageProps<"/search">) {
  const { q = "" } = await searchParams;
  const query = String(q).trim().slice(0, 100);
  const [raw, locale, m, popularTags] = await Promise.all([
    db.artwork.findMany({
      where: { status: "PUBLISHED", deletedAt: null, ...artworkSearchWhere(query) },
      include: { asset: true, author: true, category: true },
      orderBy: { publishedAt: "desc" },
      take: 50,
    }),
    getLocale(),
    getMessages(),
    query ? null : getPopularTags(),
  ]);
  const works = await localizeArtworks(raw, locale);
  return <section className="section">
    <span className="eyebrow">{m.find}</span><h1>{m.search}</h1>
    <form className="search"><label htmlFor="search-input" className="sr-only">{m.search}</label><input id="search-input" name="q" defaultValue={query} placeholder={m.searchPlaceholder} aria-label={m.searchPlaceholder}/><button>{m.searchButton}</button></form>
    <p>{query && `${m.found}: ${works.length}`}</p>
    {!query && popularTags && popularTags.length > 0 && <div className="search-suggestions"><p className="category-hint">Популярные теги:</p><div className="tag-cloud">{popularTags.map((t) => <Link className="tag-pill" href={`/tags/${t.slug}`} key={t.id}>#{t.name}</Link>)}</div></div>}
    <ArtworkGrid items={works} locale={locale} m={m}/>
  </section>;
}
