import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ArtworkGrid } from "@/components/artwork-grid";
import { getLocale, getMessages, localizeArtworks } from "@/lib/i18n-server";
import { absoluteUrl, serializeJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

const getAuthor = cache(async (handle: string) => {
  return db.user.findUnique({
    where: { handle },
    select: {
      id: true, handle: true, displayName: true, bio: true, createdAt: true,
      avatar: { select: { updatedAt: true } },
      artworks: {
        where: { status: "PUBLISHED", deletedAt: null },
        include: { asset: true, author: true, category: true, _count: { select: { likes: true } } },
        orderBy: { publishedAt: "desc" },
      },
    },
  });
});

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const author = await getAuthor(handle);
  if (!author) return {};
  const name = author.displayName || `@${author.handle}`;
  const canonicalHandle = author.handle || handle;
  return {
    title: name,
    description: (author.bio || `Работы AI-художника ${name} на Neyroeros.`).slice(0, 155),
    alternates: { canonical: `/authors/${encodeURIComponent(canonicalHandle)}` },
    robots: { index: author.artworks.length > 0, follow: true },
  };
}

export default async function AuthorPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const [author, locale, m] = await Promise.all([getAuthor(handle), getLocale(), getMessages()]);
  if (!author) notFound();
  const artworks = await localizeArtworks(author.artworks, locale);
  const totalLikes = author.artworks.reduce((sum, artwork) => sum + artwork._count.likes, 0);
  const name = author.displayName || `@${author.handle}`;
  const joined = new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : locale, { month: "long", year: "numeric" }).format(author.createdAt);
  const url = absoluteUrl(`/authors/${encodeURIComponent(author.handle || handle)}`);
  const profileSchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": url,
    url,
    name,
    isFamilyFriendly: false,
    mainEntity: {
      "@type": "Person",
      "@id": `${url}#person`,
      name,
      url,
      description: author.bio?.slice(0, 155) || undefined,
    },
  };

  return <section className="section author-page">
    {author.artworks.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(profileSchema) }}/>}
    <header className="author-header">
      <div className="author-avatar">{author.avatar ? <img src={`/api/avatars/${author.id}?v=${author.avatar.updatedAt.getTime()}`} alt={`Аватар ${name}`} width={112} height={112}/> : <span>{name.slice(0, 1).toUpperCase()}</span>}</div>
      <div><span className="eyebrow">AI-художник</span><h1>{name}</h1><p className="author-handle">@{author.handle}</p>{author.bio && <p className="lead">{author.bio}</p>}<p className="author-joined">На Neyroeros с {joined}</p></div>
    </header>
    <div className="stats author-stats"><div><b>{artworks.length}</b><span>опубликованных работ</span></div><div><b>{totalLikes}</b><span>полученных лайков</span></div></div>
    <div className="section-title"><div><span className="eyebrow">Галерея автора</span><h2>Работы {name}</h2></div></div>
    {artworks.length ? <ArtworkGrid items={artworks} locale={locale} m={m}/> : <div className="empty">У автора пока нет опубликованных работ.</div>}
  </section>;
}
