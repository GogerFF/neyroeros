import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Eye } from "lucide-react";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n-server";
import { categoryLabel } from "@/lib/i18n";
import { VideoViewTracker } from "@/components/video-view-tracker";
import { absoluteUrl, videoSchema } from "@/lib/seo";

export const dynamic = "force-dynamic";

async function getVideo(slug: string) {
  return db.video.findFirst({
    where: { slug, status: "PUBLISHED", deletedAt: null },
    include: {
      author: true,
      category: true,
      comments: { where: { deletedAt: null }, include: { author: { include: { avatar: true } } }, orderBy: { createdAt: "asc" } },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const video = await getVideo(slug);
  if (!video) return {};
  const poster = absoluteUrl(`/api/videos/${video.id}/poster`);
  return {
    title: video.title,
    description: video.description?.slice(0, 155) ?? `AI video: ${video.title}`,
    alternates: { canonical: `/videos/${video.slug}` },
    openGraph: { title: video.title, description: video.description?.slice(0, 200) ?? undefined, type: "video.other", url: absoluteUrl(`/videos/${video.slug}`), images: [{ url: poster, alt: video.title }], locale: "ru_RU" },
    twitter: { card: "summary_large_image", title: video.title, description: video.description?.slice(0, 200) ?? undefined, images: [{ url: poster, alt: video.title }] },
  };
}

export default async function VideoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [session, locale, video] = await Promise.all([auth(), getLocale(), getVideo(slug)]);
  if (!video) notFound();
  const [likes, liked] = await Promise.all([
    db.videoLike.count({ where: { videoId: video.id } }),
    session?.user.id ? db.videoLike.findUnique({ where: { videoId_userId: { videoId: video.id, userId: session.user.id } } }) : null,
  ]);
  const poster = absoluteUrl(`/api/videos/${video.id}/poster`);
  const contentUrl = absoluteUrl(`/api/videos/${video.id}/video`);
  const schema = videoSchema({ title: video.title, slug: video.slug, description: video.description, authorName: video.author.displayName, datePublished: video.publishedAt, posterUrl: poster, contentUrl, durationSec: video.durationSec });
  return <section className="video-detail">
    <VideoViewTracker videoId={video.id}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}/>
    <div className="video-player"><video controls playsInline preload="metadata" poster={`/api/videos/${video.id}/poster`}><source src={`/api/videos/${video.id}/video`} type={video.mimeType}/></video></div>
    <aside>
      <span className="eyebrow">{video.category ? categoryLabel(video.category.slug, locale, video.category).name : "AI видео"}</span>
      <h1>{video.title}</h1><p className="lead">{video.description}</p>
      <div className="social-row">{session?.user ? <form action="/api/videos/like" method="post"><input type="hidden" name="videoId" value={video.id}/><input type="hidden" name="slug" value={video.slug}/><button className={`like-button ${liked ? "liked" : ""}`}><Heart size={18} fill={liked ? "currentColor" : "none"}/>{likes}</button></form> : <Link className="like-button" href="/login"><Heart size={18}/>{likes}</Link>}<div className="view-count"><Eye size={17}/>{video.viewCount}</div></div>
      <div className="author"><b>{video.author.displayName || "Анонимный автор"}</b><span>{video.durationSec} секунд · опубликовано {new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : locale).format(video.publishedAt!)}</span></div>
      <section className="comments"><h2>Комментарии <span>{video.comments.length}</span></h2>
        {session?.user ? <form action="/api/videos/comment" method="post" className="comment-form"><input type="hidden" name="videoId" value={video.id}/><input type="hidden" name="slug" value={video.slug}/><textarea name="content" required maxLength={1000} placeholder="Напишите комментарий…"/><button>Отправить</button></form> : <p className="comment-login"><Link href="/login">Войдите</Link>, чтобы поставить лайк или оставить комментарий.</p>}
        <div className="comment-list">{video.comments.map(c=><article key={c.id} className="comment"><div className="comment-avatar">{c.author.avatar ? <img src={`/api/avatars/${c.authorId}?v=${c.author.avatar.updatedAt.getTime()}`} alt="" loading="lazy" width={38} height={38}/> : (c.author.displayName || c.author.email).slice(0,1).toUpperCase()}</div><div><b>{c.author.displayName || c.author.email}</b><time>{new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : locale,{dateStyle:"medium"}).format(c.createdAt)}</time><p>{c.content}</p></div></article>)}{!video.comments.length&&<p className="no-comments">Комментариев пока нет. Будьте первым.</p>}</div>
      </section>
    </aside>
  </section>;
}
