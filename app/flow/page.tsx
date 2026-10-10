import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { discoveryPublished, flowHref, flowOrder, normalizeFlowQuery } from "@/lib/flow";
import { absoluteUrl, serializeJsonLd } from "@/lib/seo";
import { getLocale, getMessages, localizeArtwork } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = await searchParams;
  return { title: "Flow — открыть работу", description: "Последовательное путешествие по опубликованным работам Neyroeros и их реальным тегам.", alternates: { canonical: "/flow" }, robots: { index: Object.keys(query).length === 0, follow: true } };
}

export default async function Flow({ searchParams }: Props) {
  const { seed, step } = normalizeFlowQuery(await searchParams);
  const [catalog, locale, m] = await Promise.all([
    db.artwork.findMany({ where: discoveryPublished, select: { id: true }, orderBy: { id: "asc" } }), getLocale(), getMessages(),
  ]);
  const ordered = flowOrder(catalog, seed);
  const position = ordered.length ? step % ordered.length : 0;
  const raw = ordered.length ? await db.artwork.findFirst({ where: { ...discoveryPublished, id: ordered[position].id }, include: { asset: true, author: true, category: true, tags: { include: { tag: true }, orderBy: { tag: { name: "asc" } } } } }) : null;
  if (!raw) return <section className="section flow-page"><span className="eyebrow">Flow</span><h1>Пока здесь тихо</h1><p className="lead">В потоке пока нет опубликованных работ.</p><Link className="ghost" href="/universe">Вернуться в Universe</Link></section>;
  const art = await localizeArtwork(raw, locale);
  const schema = { "@context": "https://schema.org", "@type": "CollectionPage", name: "Neyroeros Flow", url: absoluteUrl("/flow"), isFamilyFriendly: false };
  return <section className="section flow-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}/>
    <div className="flow-top"><div><span className="eyebrow">Flow · {position + 1} / {ordered.length}</span><p>Один шаг. Одна работа. Новый взгляд.</p></div><Link className="ghost" href="/universe">Universe ↗</Link></div>
    <div className="flow-stage"><figure className="flow-image"><Link href={`/artwork/${art.slug}`}><img src={`/api/images/preview/${art.id}`} width={art.asset?.width ?? 400} height={art.asset?.height ?? 500} alt={`${art.title} — ${art.author.displayName || m.anonymous}`} fetchPriority="high"/></Link><figcaption>{art.author.displayName || m.anonymous}</figcaption></figure>
      <div className="flow-info"><span className="eyebrow">Artwork</span><h1>{art.title}</h1>{art.description && <p className="lead">{art.description}</p>}<Link className="button" href={`/artwork/${art.slug}`}>Открыть оригинал ↗</Link>
        <div className="flow-dna"><h2>DNA · реальные теги</h2><p>Метки, сохранённые у этой работы. Не анализ изображения и не предполагаемые настроения.</p>{raw.tags.length ? <div className="flow-tags">{raw.tags.map(({ tag }) => <Link href={`/tags/${tag.slug}`} key={tag.id}>#{tag.name}</Link>)}</div> : <p>У работы пока нет тегов.</p>}{art.category && <Link className="flow-category" href={`/categories/${art.category.slug}`}>Категория: {art.category.name} →</Link>}</div>
      </div>
    </div>
    <nav className="flow-controls" aria-label="Навигация Flow">{step > 0 ? <Link className="ghost" data-testid="flow-back" href={flowHref(seed, step - 1)}>← Назад</Link> : <span className="ghost" aria-disabled="true">← Назад</span>}<span>seed: {seed}</span><Link className="button" data-testid="flow-next" href={flowHref(seed, step + 1)}>Дальше →</Link></nav>
  </section>;
}
