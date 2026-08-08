import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HeroAdmin() {
  await requireAdmin();
  const videos = await db.heroVideo.findMany({ orderBy: [{ status: "asc" }, { sortOrder: "asc" }] });
  return <section className="section"><div className="section-title"><div><span className="eyebrow">Главная страница</span><h1>Видео hero</h1><p className="lead">До 12 активных клипов. MP4 обязателен, WebM — дополнительный. Длительность каждого: 6–12 секунд.</p></div><Link className="ghost" href="/admin">← Модерация</Link></div>
    <form action="/api/admin/hero/upload" method="post" encType="multipart/form-data" className="panel hero-admin-form"><h2>Добавить клип</h2><label>Название<input name="title" required maxLength={100}/></label><label>Длительность, сек<input name="durationSec" type="number" min="6" max="12" step="1" required/></label><label>MP4 (до 50 МБ)<input name="mp4" type="file" accept="video/mp4" required/></label><label>WebM — необязательно<input name="webm" type="file" accept="video/webm"/></label><label>Poster JPG/PNG/WebP<input name="poster" type="file" accept="image/jpeg,image/png,image/webp" required/></label><button>Загрузить и активировать</button></form>
    <div className="list">{videos.map((video)=><article className="row" key={video.id}><img src={`/api/hero/${video.id}/poster`} alt="" width={120} height={68}/><div><b>{video.title}</b><span className={`status ${video.status.toLowerCase()}`}>{video.status}</span><p>{video.durationSec} сек · {(video.sizeBytes/1024/1024).toFixed(1)} МБ · позиция {video.sortOrder}</p></div><form action="/api/admin/hero/manage" method="post"><input type="hidden" name="id" value={video.id}/>{video.status!=="ACTIVE"&&<button name="op" value="activate">Активировать</button>}{video.status==="ACTIVE"&&<><button name="op" value="move"><input type="hidden" name="delta" value="-1"/>↑</button><button name="op" value="move"><input type="hidden" name="delta" value="1"/>↓</button></>}<button className="danger" name="op" value="archive">Архивировать</button></form></article>)}{!videos.length&&<div className="empty">Клипов ещё нет. Пока главная использует текущую изображенческую композицию.</div>}</div>
  </section>;
}
