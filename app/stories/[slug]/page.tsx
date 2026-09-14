import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { absoluteUrl, storySchema } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const story = await db.story.findFirst({
    where: { slug, status: "PUBLISHED", deletedAt: null },
    include: { illustrations: { take: 1, orderBy: { sortOrder: "asc" } }, author: true },
  });
  if (!story) return {};
  const imageUrl = story.illustrations[0] ? absoluteUrl(`/api/stories/images/${story.illustrations[0].id}`) : undefined;
  return {
    title: story.title,
    description: story.description?.slice(0, 155) ?? story.body.slice(0, 155),
    alternates: { canonical: `/stories/${story.slug}` },
    openGraph: {
      title: story.title,
      description: story.description?.slice(0, 200) ?? undefined,
      type: "article",
      url: absoluteUrl(`/stories/${story.slug}`),
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: story.title }] : [{ url: absoluteUrl("/og-default.webp"), width: 1200, height: 630, alt: story.title }],
      locale: "ru_RU",
    },
    twitter: {
      card: "summary_large_image",
      title: story.title,
      description: story.description?.slice(0, 200) ?? undefined,
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: story.title }] : [{ url: absoluteUrl("/og-default.webp"), width: 1200, height: 630, alt: story.title }],
    },
  };
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const story = await db.story.findFirst({
    where: { slug, status: "PUBLISHED", deletedAt: null },
    include: { author: true, illustrations: { orderBy: { sortOrder: "asc" } } },
  });
  if (!story) notFound();

  const [likeCount, liked, comments] = await Promise.all([
    db.storyLike.count({ where: { storyId: story.id } }),
    session?.user?.id ? db.storyLike.findUnique({ where: { storyId_userId: { storyId: story.id, userId: session.user.id } } }) : null,
    db.storyComment.findMany({
      where: { storyId: story.id, deletedAt: null },
      include: { author: { select: { displayName: true, email: true, avatar: { select: { updatedAt: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const paragraphs = story.body.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const illustrationIndex = (paragraphIndex: number) => {
    if (!story.illustrations.length || !paragraphs.length) return -1;
    const index = Math.floor(((paragraphIndex + 1) * story.illustrations.length) / (paragraphs.length + 1));
    return Math.min(index, story.illustrations.length - 1);
  };
  const usedIllustrations = new Set<number>();

  const schema = storySchema({
    title: story.title,
    slug: story.slug,
    description: story.description,
    authorName: story.author.displayName,
    datePublished: story.publishedAt,
    imageUrl: story.illustrations[0] ? absoluteUrl(`/api/stories/images/${story.illustrations[0].id}`) : undefined,
  });

  return <article className="story-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}/>
    <header className="story-header">
      <span className="eyebrow">История · {story.author.displayName || "Автор"}</span>
      <h1>{story.title}</h1>
      {story.description && <p className="story-dek">{story.description}</p>}
      <div className="story-rule"/>
    </header>
    <div className="story-content">
      {paragraphs.map((paragraph, index) => {
        const imageIndex = illustrationIndex(index);
        const illustration = imageIndex >= 0 && !usedIllustrations.has(imageIndex) ? story.illustrations[imageIndex] : null;
        if (illustration) usedIllustrations.add(imageIndex);
        return <section className="story-section" key={index}>
          <p>{paragraph}</p>
          {illustration && <figure className="story-illustration">
            <img src={`/api/stories/images/${illustration.id}`} alt={`${story.title} — иллюстрация ${imageIndex + 1}: AI-generated artwork`} loading="lazy" width={illustration.width} height={illustration.height}/>
            <figcaption>{story.title} — иллюстрация {imageIndex + 1}</figcaption>
          </figure>}
        </section>;
      })}
      {story.illustrations.map((illustration, index) => !usedIllustrations.has(index) && <figure className="story-illustration" key={illustration.id}>
        <img src={`/api/stories/images/${illustration.id}`} alt={`${story.title} — иллюстрация ${index + 1}: AI-generated artwork`} loading="lazy" width={illustration.width} height={illustration.height}/>
        <figcaption>{story.title} — иллюстрация {index + 1}</figcaption>
      </figure>)}
    </div>
    <div className="story-social">
      {session?.user
        ? <form action="/api/stories/like" method="post"><input type="hidden" name="storyId" value={story.id}/><input type="hidden" name="slug" value={story.slug}/><button className={`like-button ${liked ? "liked" : ""}`}><Heart size={18} fill={liked ? "currentColor" : "none"} />{likeCount}</button></form>
        : <Link className="like-button" href="/login"><Heart size={18}/>{likeCount}</Link>}
    </div>
    <section className="comments">
      <h2>Комментарии <span>{comments.length}</span></h2>
      {session?.user
        ? <form action="/api/stories/comment" method="post" className="comment-form"><input type="hidden" name="storyId" value={story.id}/><input type="hidden" name="slug" value={story.slug}/><textarea name="content" required maxLength={1000} placeholder="Напишите комментарий…"/><button>Отправить</button></form>
        : <p className="comment-login"><Link href="/login">Войдите</Link>, чтобы поставить лайк или оставить комментарий.</p>}
      <div className="comment-list">
        {comments.map((c) => <article key={c.id} className="comment"><div className="comment-avatar">{c.author.avatar ? <img src={`/api/avatars/${c.authorId}?v=${c.author.avatar.updatedAt.getTime()}`} alt="" loading="lazy" width={38} height={38}/> : (c.author.displayName || c.author.email).slice(0, 1).toUpperCase()}</div><div><b>{c.author.displayName || c.author.email}</b><time>{new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" }).format(c.createdAt)}</time><p>{c.content}</p></div></article>)}
        {!comments.length && <p className="no-comments">Комментариев пока нет. Будьте первым.</p>}
      </div>
    </section>
  </article>;
}
