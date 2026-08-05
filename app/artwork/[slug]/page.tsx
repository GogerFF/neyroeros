import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { categoryLabel } from "@/lib/i18n";
import { getLocale, getMessages, localizeArtwork } from "@/lib/i18n-server";
import { ArtworkNavigator } from "@/components/artwork-navigator";
import { ShareButtons } from "@/components/share-buttons";
import { createCommentAction, toggleLikeAction } from "@/app/actions";
import { absoluteUrl, artworkSchema, breadcrumbSchema } from "@/lib/seo";

async function get(slug: string) {
  return db.artwork.findFirst({
    where: { slug, status: "PUBLISHED", deletedAt: null },
    include: { asset: true, author: true, category: true, tags: { include: { tag: true } } },
  });
}

export async function generateMetadata({ params }: PageProps<"/artwork/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const a = await get(slug);
  if (!a) return { title: "Neyroeros" };
  const x = await localizeArtwork(a, await getLocale());
  return {
    title: x.title,
    description: x.description?.slice(0, 155),
    alternates: { canonical: `/artwork/${a.slug}` },
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
      where: { status: "PUBLISHED", deletedAt: null, id: { not: raw.id }, ...relatedQuery },
      select: { id: true, slug: true, title: true, asset: true, category: true, author: true },
      orderBy: { publishedAt: "desc" },
      take: 6,
    }),
  ]);

  const canonical = absoluteUrl(`/artwork/${a.slug}`);
  const imageUrl = absoluteUrl(`/api/images/preview/${a.id}`);
  const schema = [
    artworkSchema({ id: raw.id, slug: a.slug, title: a.title, description: a.description, imageUrl, creatorName: raw.author.displayName, publishedAt: raw.publishedAt }),
    breadcrumbSchema([
      { name: "Главная", path: "/" },
      { name: "Категории", path: "/categories" },
      { name: a.category ? categoryLabel(a.category.slug, locale, a.category).name : "Работы", path: a.category ? `/categories/${a.category.slug}` : "/search" },
      { name: a.title, path: `/artwork/${a.slug}` },
    ]),
  ];

  return <section className="art-detail">
    <ArtworkNavigator current={a.slug} items={siblings} categorySlug={categorySlug}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}/>
    <div className="art-image"><img src={`/api/images/preview/${a.id}`} alt={a.title}/></div>
    <aside>
      <span className="eyebrow">{a.category ? categoryLabel(a.category.slug, locale, a.category).name : m.aiArt}</span>
      <h1>{a.title}</h1>
      <p className="lead">{a.description}</p>
      <div className="social-row">
        {session?.user
          ? <form action={toggleLikeAction}><input type="hidden" name="artworkId" value={a.id}/><input type="hidden" name="slug" value={a.slug}/><button className={`like-button ${liked ? "liked" : ""}`}><Heart size={18} fill={liked ? "currentColor" : "none"}/>{likeCount}</button></form>
          : <Link className="like-button" href="/login"><Heart size={18}/>{likeCount}</Link>}
        <ShareButtons url={canonical} title={a.title} image={imageUrl}/>
      </div>
      <div className="author"><b>{a.author.displayName || m.anonymous}</b><span>{m.published} {new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : locale).format(a.publishedAt!)}</span></div>
      <div className="tags">{a.tags.map((x) => <Link href={`/search?q=${encodeURIComponent(x.tag.name)}`} key={x.tagId}>#{x.tag.name}</Link>)}</div>
      <small>{m.moderated}</small>
      <section className="comments">
        <h2>Комментарии <span>{comments.length}</span></h2>
        {session?.user
          ? <form action={createCommentAction} className="comment-form"><input type="hidden" name="artworkId" value={a.id}/><input type="hidden" name="slug" value={a.slug}/><textarea name="content" required maxLength={1000} placeholder="Напишите комментарий…"/><button>Отправить</button></form>
          : <p className="comment-login"><Link href="/login">Войдите</Link>, чтобы поставить лайк или оставить комментарий.</p>}
        <div className="comment-list">
          {comments.map((c) => <article key={c.id} className="comment"><div className="comment-avatar">{c.author.avatar ? <img src={`/api/avatars/${c.authorId}?v=${c.author.avatar.updatedAt.getTime()}`} alt=""/> : (c.author.displayName || c.author.email).slice(0, 1).toUpperCase()}</div><div><b>{c.author.displayName || c.author.email}</b><time>{new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : locale, { dateStyle: "medium" }).format(c.createdAt)}</time><p>{c.content}</p></div></article>)}
          {!comments.length && <p className="no-comments">Комментариев пока нет. Будьте первым.</p>}
        </div>
      </section>
    </aside>
    {related.length > 0 && <div className="related">
      <h2>Похожие работы</h2>
      <div className="masonry">{related.map((r) => <article className="card" key={r.id}><Link href={`/artwork/${r.slug}`}><img src={`/api/images/thumbnail/${r.id}`} alt={r.title} loading="lazy"/><div className="card-body"><span>{r.category ? categoryLabel(r.category.slug, locale, r.category).name : m.aiArt}</span><h3>{r.title}</h3><p>{r.author.displayName || m.anonymous}</p></div></Link></article>)}</div>
    </div>}
  </section>;
}
