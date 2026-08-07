import { db } from "@/lib/db";
import { ArtworkGrid } from "@/components/artwork-grid";
import { getLocale, getMessages, localizeArtworks } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Подборки",
  description: "Коллекции и подборки работ: топ по лайкам, новинки недели, случайные открытия. Neyroeros — кураторская галерея AI-искусства 18+.",
  alternates: { canonical: "/collections" },
};

export default async function Collections() {
  const [locale, m] = await Promise.all([getLocale(), getMessages()]);

  const weekAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d; })();
  const [topRaw, newRaw, randRaw] = await Promise.all([
    db.artwork.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      include: { asset: true, author: true, category: true, _count: { select: { likes: true } } },
      orderBy: { publishedAt: "desc" },
      take: 50,
    }),
    db.artwork.findMany({
      where: { status: "PUBLISHED", deletedAt: null, publishedAt: { gte: weekAgo } },
      include: { asset: true, author: true, category: true },
      orderBy: { publishedAt: "desc" },
      take: 12,
    }),
    db.artwork.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      include: { asset: true, author: true, category: true },
      orderBy: { id: "asc" }, // CUID — effectively random order
      take: 30,
    }),
  ]);

  // Top by likes
  const topSorted = [...topRaw].sort((a, b) => b._count.likes - a._count.likes).slice(0, 12);
  // Random: take last 12 from a different order (asc id = effectively random)
  const randSorted = [...randRaw].slice(-12).reverse();

  const [top, newWorks, random] = await Promise.all([
    localizeArtworks(topSorted, locale),
    localizeArtworks(newRaw, locale),
    localizeArtworks(randSorted, locale),
  ]);

  const collections = [
    { id: "top", title: "Топ по лайкам", desc: "Самые популярные работы — выбор сообщества.", items: top },
    { id: "new", title: "Новинки недели", desc: "Свежие публикации за последние 7 дней.", items: newWorks },
    { id: "random", title: "Случайные сокровища", desc: "Каждый раз — новая подборка из свежих работ.", items: random },
  ];

  return <section className="section">
    <span className="eyebrow">Коллекции</span>
    <h1>Подборки</h1>
    <p className="lead">Тематические коллекции, которые обновляются автоматически. Заходите чаще — подборки живые.</p>
    {collections.map((col) => <div key={col.id} className="latest-section">
      <div className="latest-heading"><h2 style={{ font: "2.5rem Georgia", margin: "0 0 .5rem" }}>{col.title}</h2><p>{col.desc}</p></div>
      {col.items.length > 0
        ? <ArtworkGrid items={col.items} locale={locale} m={m}/>
        : <div className="empty">Пока нет работ для этой подборки — загляните позже.</div>}
    </div>)}
  </section>;
}
