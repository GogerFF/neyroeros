import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getMessages, getLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";
const statusLabels: Record<string, Record<string, string>> = { ru: { DRAFT:"Черновик",PENDING:"На модерации",REJECTED:"Отклонено",SCHEDULED:"Запланировано",PUBLISHED:"Опубликовано",HIDDEN:"Скрыто",DELETED:"Удалено" }, en: { DRAFT:"Draft",PENDING:"In review",REJECTED:"Rejected",SCHEDULED:"Scheduled",PUBLISHED:"Published",HIDDEN:"Hidden",DELETED:"Deleted" }, zh: { DRAFT:"草稿",PENDING:"审核中",REJECTED:"已拒绝",SCHEDULED:"已排期",PUBLISHED:"已发布",HIDDEN:"已隐藏",DELETED:"已删除" } };

export default async function Dashboard({ searchParams }: PageProps<"/dashboard">) {
  const user = await requireUser();
  const sp = await searchParams;
  const [works, videos, stories, m, locale] = await Promise.all([
    db.artwork.findMany({ where: { authorId: user.id, status: { not: "DELETED" } }, include: { asset: true }, orderBy: [{ status: "asc" }, { createdAt: "desc" }] }),
    db.video.findMany({ where: { authorId: user.id, status: { not: "DELETED" } }, orderBy: [{ status: "asc" }, { createdAt: "desc" }] }),
    db.story.findMany({ where: { authorId: user.id, status: { not: "DELETED" } }, include: { illustrations: { take: 1, orderBy: { sortOrder: "asc" } }, _count: { select: { illustrations: true } } }, orderBy: [{ status: "asc" }, { createdAt: "desc" }] }),
    getMessages(), getLocale(),
  ]);
  const labels = statusLabels[locale] || statusLabels.ru;
  const draftsWork = works.filter(a => ["DRAFT", "REJECTED"].includes(a.status)).length;
  const draftsVideo = videos.filter(v => ["DRAFT", "REJECTED"].includes(v.status)).length;
  return <section className="section"><div className="section-title"><div><span className="eyebrow">{m.account}</span><h1>{m.myStudio}</h1></div><div><Link className="ghost" href="/dashboard/settings">Настройки</Link><Link className="button" href="/dashboard/stories/new">Новый рассказ</Link><Link className="button" href="/dashboard/videos/new">+ Видео</Link><Link className="button" href="/dashboard/uploads/new">{m.newArtwork}</Link></div></div>
    {sp.submitted === "all" && <div className="empty admin-notice">Всё отправлено на модерацию.</div>}
    {sp.error === "bad-request" && <div className="empty admin-error">Неизвестная операция.</div>}

    <h2>Работы</h2>
    {draftsWork > 0 && <form action="/api/artworks/manage" method="post" className="bulk-actions"><input type="hidden" name="id" value="all"/><button name="op" value="submit-all">Отправить всё на модерацию ({draftsWork})</button></form>}
    <div className="list">{works.map(a=><article className="row" key={a.id}><img src={`/api/images/thumbnail/${a.id}`} alt=""/><div><b>{a.title}</b><span className={`status ${a.status.toLowerCase()}`}>{labels[a.status]}</span>{a.moderationNote&&<p>{a.moderationNote}</p>}</div><form action="/api/artworks/manage" method="post"><input type="hidden" name="id" value={a.id}/>{["DRAFT","REJECTED"].includes(a.status)&&<><Link className="ghost" href={`/dashboard/uploads/${a.id}/edit`}>{m.edit}</Link><button name="op" value="submit">{m.submit}</button><button className="danger" name="op" value="delete">{m.delete}</button></>}{a.status==="PUBLISHED"&&<Link className="ghost" href={`/artwork/${a.slug}`}>Открыть</Link>}</form></article>)}{!works.length&&<div className="empty">{m.firstArtwork}</div>}</div>

    <h2>Видео</h2>
    {draftsVideo > 0 && <form action="/api/videos/manage" method="post" className="bulk-actions"><input type="hidden" name="id" value="all"/><button name="op" value="submit-all">Отправить всё на модерацию ({draftsVideo})</button></form>}
    <div className="list">{videos.map(v=><article className="row" key={v.id}><img src={`/api/videos/${v.id}/poster`} alt="" width={120} height={68}/><div><b>{v.title}</b><span className={`status ${v.status.toLowerCase()}`}>{labels[v.status]}</span><p>{v.durationSec} сек · {(v.sizeBytes / 1024 / 1024).toFixed(1)} МБ</p>{v.moderationNote&&<p>{v.moderationNote}</p>}</div><form action="/api/videos/manage" method="post"><input type="hidden" name="id" value={v.id}/>{["DRAFT","REJECTED"].includes(v.status)&&<button name="op" value="submit">На модерацию</button>}{["DRAFT","REJECTED"].includes(v.status)&&<button className="danger" name="op" value="delete">Удалить</button>}{v.status === "PUBLISHED"&&<Link className="ghost" href={`/videos/${v.slug}`}>Открыть</Link>}</form></article>)}{!videos.length&&<div className="empty">Видео пока нет.</div>}</div>

    <h2>Рассказы</h2><div className="list">{stories.map(s=><article className="row" key={s.id}>{s.illustrations[0]?<img src={`/api/stories/images/${s.illustrations[0].id}`} alt="" width={s.illustrations[0].width} height={s.illustrations[0].height}/>:<div className="story-placeholder">✦</div>}<div><b>{s.title}</b><span className={`status ${s.status.toLowerCase()}`}>{labels[s.status]}</span><p>{s._count.illustrations} иллюстраций</p></div><form action="/api/stories/manage" method="post"><input type="hidden" name="id" value={s.id}/>{s.status==="DRAFT"&&<button name="op" value="publish">Опубликовать</button>}{s.status!=="DELETED"&&<button className="danger" name="op" value="delete">Удалить</button>}{s.status==="PUBLISHED"&&<Link className="ghost" href={`/stories/${s.slug}`}>Открыть</Link>}</form></article>)}{!stories.length&&<div className="empty">Рассказов пока нет.</div>}</div>
  </section>;
}
