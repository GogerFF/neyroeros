import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { createCategoryAction } from "@/app/actions";
import { getLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

const text = {
  ru: { eye: "Панель куратора", title: "Модерация", decision: "Ожидают решения", queue: "В очереди", published: "Опубликовано", authors: "Авторов", author: "Автор", reason: "Комментарий или причина отказа", approve: "Одобрить и опубликовать", reject: "Отклонить", empty: "Очередь модерации пуста." },
  en: { eye: "Curator panel", title: "Moderation", decision: "Awaiting decision", queue: "Queued", published: "Published", authors: "Artists", author: "Artist", reason: "Comment or rejection reason", approve: "Approve and publish", reject: "Reject", empty: "The moderation queue is empty." },
  zh: { eye: "策展人面板", title: "审核", decision: "等待决定", queue: "队列中", published: "已发布", authors: "艺术家", author: "艺术家", reason: "评论或拒绝原因", approve: "批准并发布", reject: "拒绝", empty: "审核队列为空。" },
};

export default async function Admin({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const sp = await searchParams;
  const [pending, users, published, queue, locale, categories] = await Promise.all([
    db.artwork.findMany({ where: { status: "PENDING" }, include: { asset: true, author: true }, orderBy: { submittedAt: "asc" } }),
    db.user.count(),
    db.artwork.count({ where: { status: "PUBLISHED" } }),
    db.publicationQueueItem.count({ where: { status: "PENDING" } }),
    getLocale(),
    db.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);
  const m = text[locale as keyof typeof text] ?? text.ru;

  return <section className="section">
    <span className="eyebrow">{m.eye}</span>
    <h1>{m.title}</h1>

    <Link className="ghost" href="/admin/hero">Видео hero</Link><Link className="ghost" href="/admin/videos">Модерация видео</Link>
    <form action={createCategoryAction} className="panel category-admin-form">
      <h2>Новая категория</h2>
      <label>Название<input name="name" required minLength={2} maxLength={60} placeholder="Например: Cyber Dreams"/></label>
      <label>Описание<input name="description" maxLength={240} placeholder="Короткое описание для каталога"/></label>
      <button>Добавить категорию</button>
    </form>

    {sp.videoUploaded === "1" && <div className="empty admin-notice">Видео опубликовано в выбранной категории.</div>}
    {sp.videoError && <div className="empty admin-error">Не удалось загрузить видео: {sp.reason ? decodeURIComponent(String(sp.reason)) : sp.videoError === "too-large" ? "размер превышает 50 МБ" : "проверьте поля и формат файла"}.</div>}
    <form action="/api/admin/category-video" method="post" encType="multipart/form-data" className="panel category-admin-form">
      <h2>Прикрепить видео к категории</h2>
      <p>Видео публикуется сразу. MP4 или WebM, не более 50 МБ.</p>
      <label>Категория<select name="categoryId" required defaultValue=""><option value="" disabled>Выберите категорию</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Название<input name="title" required minLength={2} maxLength={100}/></label>
      <label>Описание<textarea name="description" required minLength={2} maxLength={2000}/></label>
      <label>Длительность, секунд<input name="durationSec" type="number" required min={1} max={3600}/></label>
      <label className="drop">Видео до 50 МБ<input name="file" type="file" accept="video/mp4,video/webm" required/></label>
      <button>Загрузить и опубликовать</button>
    </form>

    <div className="stats">
      <div><b>{pending.length}</b><span>{m.decision}</span></div>
      <div><b>{queue}</b><span>{m.queue}</span></div>
      <div><b>{published}</b><span>{m.published}</span></div>
      <div><b>{users}</b><span>{m.authors}</span></div>
    </div>

    <div className="list">
      {pending.map((a) => <article className="review" key={a.id}>
        <Link href={`/artwork/${a.slug}`}><img src={`/api/images/preview/${a.id}`} alt={a.title}/></Link>
        <div>
          <h2>{a.title}</h2>
          <p>{a.description}</p>
          <small>{m.author}: {a.author.displayName || a.author.email}</small>
          <form action="/api/admin/moderate" method="post">
            <input type="hidden" name="id" value={a.id}/>
            <textarea name="reason" placeholder={m.reason}/>
            <button name="decision" value="approve">{m.approve}</button>
            <button className="danger" name="decision" value="reject">{m.reject}</button>
          </form>
        </div>
      </article>)}
      {!pending.length && <div className="empty">{m.empty}</div>}
    </div>
  </section>;
}
