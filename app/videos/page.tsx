import Link from "next/link";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n-server";
import { categoryLabel } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export default async function Videos() {
  const [videos, locale] = await Promise.all([db.video.findMany({ where: { status: "PUBLISHED", deletedAt: null }, include: { author: true, category: true }, orderBy: { publishedAt: "desc" }, take: 48 }), getLocale()]);
  return <section className="section"><div className="section-title"><div><span className="eyebrow">AI Motion</span><h1>Видео</h1><p className="lead">Видео, созданные авторами сообщества. Только после ручной модерации.</p></div><Link className="button" href="/dashboard/videos/new">Загрузить видео</Link></div><div className="video-grid">{videos.map(v=><article className="video-card" key={v.id}><Link href={`/videos/${v.slug}`}><div className="video-poster"><img src={`/api/videos/${v.id}/poster`} alt={v.title}/><span>{v.durationSec} сек</span></div><div className="card-body"><small>{v.category ? categoryLabel(v.category.slug,locale,v.category).name : "AI видео"}</small><h3>{v.title}</h3><p>{v.author.displayName || "Анонимный автор"} · {v.viewCount} просмотров</p></div></Link></article>)}{!videos.length&&<div className="empty">Видео пока нет. Будьте первым автором.</div>}</div></section>;
}
