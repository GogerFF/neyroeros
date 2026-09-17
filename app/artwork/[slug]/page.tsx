import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { Heart, Eye } from "lucide-react";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { categoryLabel } from "@/lib/i18n";
import { getLocale, getMessages, localizeArtwork } from "@/lib/i18n-server";
import { ArtworkNavigator } from "@/components/artwork-navigator";
import { ShareButtons } from "@/components/share-buttons";
import { createCommentAction, toggleLikeAction } from "@/app/actions";
import { ArtworkViewTracker } from "@/components/artwork-view-tracker";
import { SubmitButton } from "@/components/submit-button";
import { absoluteUrl, artworkSchema, breadcrumbSchema } from "@/lib/seo";

const get = cache(async (slug: string) => {
  return db.artwork.findFirst({
    where: { slug, status: "PUBLISHED", deletedAt: null },
    include: { asset: true, author: true, category: true, tags: { include: { tag: true } } },
  });
});

export async function generateMetadata({ params }: PageProps<"/artwork/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const a = await get(slug);
  if (!a) return {};
  const x = await localizeArtwork(a, await getLocale());
  const imageUrl = absoluteUrl(`/api/images/og/${a.id}`);
  return {
    title: x.title,
    description: x.description?.slice(0, 155) ?? `AI art: ${x.title}`,
    alternates: { canonical: `/artwork/${a.slug}` },
    openGraph: {
      title: x.title,
      description: x.description?.slice(0, 200) ?? undefined,
      type: "article",
      url: absoluteUrl(`/artwork/${a.slug}`),
      images: [{ url: imageUrl, width: 1200, height: 630, alt: x.title }],
      locale: "ru_RU",
    },
    twitter: {
      card: "summary_large_image",
      title: x.title,
      description: x.description?.slice(0, 200) ?? undefined,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: x.title }],
    },
  };
}

export default async function Artwork({ params, searchParams }: PageProps<"/artwork/[slug]">) {
  const { slug } = await params;
  const query = await searchParams;
  const requestedCategory = typeof query.category === "string" ? query.category : undefined;
  const session = await auth();
  const [raw, locale, m] = await Promise.all([get(slug), getLocale(), getMessages()]);
  if (!raw) notFound();

  const categorySlug = requestedCategory === raw.category?.slug ? requestedCategory : undefined;

  const siblingsQuery = {
    status: "PUBLISHED" as const,
    deletedAt: null,
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
  };
  const relatedQuery = raw.categoryId ? { categoryId: raw.categoryId } : {};
  const tagIds = raw.tags.map(t => t.tagId);

  const [a, siblings, likeCount, liked, comments, related] = await Promise.all([
    localizeArtwork(raw, locale),
    db.artwork.findMany({
      where: siblingsQuery,
      select: { id: true, slug: true, title: true },
      orderBy: { publishedAt: "desc" },
      take: 200,
    }),
    db.artworkLike.count({ where: { artworkId: raw.id } }),
    session?.user?.id ? db.artworkLike.findUnique({ where: { artworkId_userId: { artworkId: raw.id, userId: session.user.id } } }) : null,
    db.comment.findMany({
      where: { artworkId: raw.id, deletedAt: null },
      include: { author: { select: { displayName: true, email: true, avatar: { select: { updatedAt: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
    db.artwork.findMany({
      where: {
        status: "PUBLISHED", deletedAt: null, id: { not: raw.id },
        ...(tagIds.length ? { tags: { some: { tagId: { in: tagIds } } } } : relatedQuery),
      },
      select: { id: true, slug: true, title: true, asset: true, category: true, author: true },
      orderBy: { publishedAt: "desc" },
      take: 6,
    }),
  ]);

  const canonical = absoluteUrl(`/artwork/${a.slug}`);
  const imageUrl = absoluteUrl(`/api/images/preview/${a.id}`);
  const imageAlt = `${a.title} — AI artwork by ${raw.author.displayName || "Neyroeros"}`;
  const schema = [
    { ...artworkSchema({ id: raw.id, slug: a.slug, title: a.title, description: a.description, imageUrl, creatorName: raw.author.displayName, publishedAt: raw.publishedAt }), image: { "@type": "ImageObject", url: imageUrl, width: raw.asset?.width, height: raw.asset?.height, caption: a.title, description: a.description?.slice(0, 500) } },
    breadcrumbSchema([
      { name: "Главная", path: "/" },
      { name: "Категории", path: "/categories" },
      { name: a.category ? categoryLabel(a.category.slug, locale, a.category).name : "Работы", path: a.category ? `/categories/${a.category.slug}` : "/search" },
      { name: a.title, path: `/artwork/${a.slug}` },
    ]),
  ];

  return <section className="art-detail">
    <ArtworkViewTracker artworkId={raw.id}/>
    <ArtworkNavigator current={a.slug} items={siblings} categorySlug={categorySlug}/>
    <nav className="breadcrumbs" aria-label="Хлебные крошки">
      <Link href="/">Главная</Link><span>/</span><Link href="/categories">Категории</Link>{a.category && <><span>/</span><Link href={`/categories/${a.category.slug}`}>{categoryLabel(a.category.slug, locale, a.category).name}</Link></>}<span>/</span><em>{a.title}</em>
    </nav>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([...schema, { "@context": "https://schema.org", "@type": "WebPage", url: canonical, primaryImageOfPage: { "@type": "ImageObject", url: imageUrl, width: raw.asset?.width, height: raw.asset?.height } }]) }}/>
    <div className="art-image">
      <figure style={{ margin: 0 }}>
        <img src={`/api/images/preview/${a.id}`} alt={imageAlt} fetchPriority="high" width={raw.asset?.width} height={raw.asset?.height} style={{ maxWidth: "100%", height: "auto" }}/>
        <figcaption className="art-caption">{a.title} — {a.author.displayName || m.anonymous} · {a.category ? categoryLabel(a.category.slug, locale, a.category).name : m.aiArt}</figcaption>
      </figure>
      <div className="art-download"><a href={`/api/images/download/${a.id}`} className="button" download>Скачать с водяным знаком</a></div>
    </div>
    <aside>
      <span className="eyebrow">{a.category ? categoryLabel(a.category.slug, locale, a.category).name : m.aiArt}</span>
      <h1>{a.title}</h1>
      <p className="lead">{a.description}</p>
      <div className="social-row">
        {session?.user
          ? <form action={toggleLikeAction}><input type="hidden" name="artworkId" value={a.id}/><input type="hidden" name="slug" value={a.slug}/><SubmitButton className={`like-button ${liked ? "liked" : ""}`} aria-label={liked ? `Убрать лайк (всего ${likeCount})` : `Поставить лайк (всего ${likeCount})`}><Heart size={18} fill={liked ? "currentColor" : "none"}/><span aria-hidden="true">{likeCount}</span></SubmitButton></form>
          : <Link className="like-button" href="/login" aria-label={`Войти, чтобы поставить лайк (всего ${likeCount})`}><Heart size={18}/><span aria-hidden="true">{likeCount}</span></Link>}
        <div className="view-count" title="Уникальные просмотры"><Eye size={17}/>{raw.viewCount}</div>
        <ShareButtons url={canonical} title={a.title} image={imageUrl}/>
      </div>
      <div className="author"><b>{a.author.displayName || m.anonymous}</b><span>{m.published} {new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : locale).format(a.publishedAt!)}</span></div>
      <div className="tags">{a.tags.map((x) => <Link href={`/tags/${x.tag.slug}`} key={x.tagId}>#{x.tag.name}</Link>)}</div>
      <small>{m.moderated}</small>
      <section className="comments">
        <h2>Комментарии <span>{comments.length}</span></h2>
        {session?.user
          ? <form action={createCommentAction} className="comment-form"><input type="hidden" name="artworkId" value={a.id}/><input type="hidden" name="slug" value={a.slug}/><textarea name="content" required maxLength={1000} placeholder="Напишите комментарий…"/><SubmitButton pendingLabel="Отправка…">Отправить</SubmitButton></form>
          : <p className="comment-login"><Link href="/login">Войдите</Link>, чтобы поставить лайк или оставить комментарий.</p>}
        <div className="comment-list">
          {comments.map((c) => <article key={c.id} className="comment"><div className="comment-avatar">{c.author.avatar ? <img src={`/api/avatars/${c.authorId}?v=${c.author.avatar.updatedAt.getTime()}`} alt="" loading="lazy" width={38} height={38}/> : (c.author.displayName || c.author.email).slice(0, 1).toUpperCase()}</div><div><b>{c.author.displayName || c.author.email}</b><time>{new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : locale, { dateStyle: "medium" }).format(c.createdAt)}</time><p>{c.content}</p></div></article>)}
          {!comments.length && <p className="no-comments">Комментариев пока нет. Будьте первым.</p>}
        </div>
      </section>
    </aside>
    {related.length > 0 && <div className="related">
      <h2>Похожие работы</h2>
      <div className="masonry">{related.map((r) => <article className="card" key={r.id}><Link href={`/artwork/${r.slug}`}><img src={`/api/images/thumbnail/${r.id}`} alt={`${r.title} — AI artwork`} loading="lazy" width={r.asset?.width} height={r.asset?.height}/><div className="card-body"><span>{r.category ? categoryLabel(r.category.slug, locale, r.category).name : m.aiArt}</span><h3>{r.title}</h3><p>{r.author.displayName || m.anonymous}</p></div></Link></article>)}</div>
    </div>}
  </section>;
}
