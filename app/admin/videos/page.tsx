import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export default async function VideoModeration() {
  await requireAdmin(); const pending = await db.video.findMany({ where: { status: "PENDING" }, include: { author: true, category: true }, orderBy: { submittedAt: "asc" } });
  return <section className="section"><div className="section-title"><div><span className="eyebrow">Панель куратора</span><h1>Модерация видео</h1></div><Link className="ghost" href="/admin">← Изображения</Link></div><div className="list">{pending.length > 0 && <form action="/api/admin/videos/moderate" method="post" className="bulk-actions"><input type="hidden" name="id" value="all"/><button name="decision" value="approve">Одобрить всё ({pending.length})</button></form>}{pending.map(v=><article className="review" key={v.id}><video controls preload="metadata" poster={`/api/videos/${v.id}/poster`}><source src={`/api/videos/${v.id}/video`} type={v.mimeType}/></video><div><h2>{v.title}</h2><p>{v.description}</p><small>{v.author.displayName || v.author.email} · {v.durationSec} секунд · {(v.sizeBytes/1024/1024).toFixed(1)} МБ</small><form action="/api/admin/videos/moderate" method="post"><input type="hidden" name="id" value={v.id}/><textarea name="reason" placeholder="Комментарий или причина отказа"/><button name="decision" value="approve">Одобрить и опубликовать</button><button className="danger" name="decision" value="reject">Отклонить</button></form></div></article>)}{!pending.length&&<div className="empty">Очередь видео пуста.</div>}</div></section>;
}
