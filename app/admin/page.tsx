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

export default async function Admin() {
  await requireAdmin();
  const [pending, users, published, queue, locale] = await Promise.all([
    db.artwork.findMany({ where: { status: "PENDING" }, include: { asset: true, author: true }, orderBy: { submittedAt: "asc" } }),
    db.user.count(),
    db.artwork.count({ where: { status: "PUBLISHED" } }),
    db.publicationQueueItem.count({ where: { status: "PENDING" } }),
    getLocale(),
  ]);
  const m = text[locale as keyof typeof text] ?? text.ru;

  return <section className="section">
    <span className="eyebrow">{m.eye}</span>
    <h1>{m.title}</h1>

    <form action={createCategoryAction} className="panel category-admin-form">
      <h2>Новая категория</h2>
      <label>Название<input name="name" required minLength={2} maxLength={60} placeholder="Например: Cyber Dreams"/></label>
      <label>Описание<input name="description" maxLength={240} placeholder="Короткое описание для каталога"/></label>
      <button>Добавить категорию</button>
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
