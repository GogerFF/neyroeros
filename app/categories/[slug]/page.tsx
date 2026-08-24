import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ArtworkGrid } from "@/components/artwork-grid";
import { categoryLabel } from "@/lib/i18n";
import { getLocale, getMessages, localizeArtworks } from "@/lib/i18n-server";
import { collectionSchema } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/categories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = await db.category.findUnique({ where: { slug } });
  if (!c) return {};
  return {
    title: c.name,
    description: c.description?.slice(0, 155),
    alternates: { canonical: `/categories/${c.slug}` },
  };
}

export default async function Category({ params }: PageProps<"/categories/[slug]">) {
  const { slug } = await params;
  const [c, locale, m] = await Promise.all([
    db.category.findUnique({
      where: { slug },
      include: {
        artworks: { where: { status: "PUBLISHED", deletedAt: null }, include: { asset: true, author: true, category: true }, orderBy: { publishedAt: "desc" } },
        videos: { where: { status: "PUBLISHED", deletedAt: null }, orderBy: { publishedAt: "desc" } },
      },
    }),
    getLocale(),
    getMessages(),
  ]);
  if (!c) notFound();
  const [x, works] = [categoryLabel(c.slug, locale, c), await localizeArtworks(c.artworks, locale)];
  const schema = collectionSchema({ name: x.name, slug: c.slug, description: c.description });
  return <section className="section">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}/>
    <span className="eyebrow">{m.category}</span>
    <h1>{x.name}</h1>
    <p className="lead">{x.description}</p>
    {c.videos.length > 0 && <section className="category-videos">
      <h2>Видео в категории</h2>
      <div className="video-grid">{c.videos.map(video => <article className="video-card" key={video.id}>
        <video controls playsInline preload="metadata" poster={`/api/videos/${video.id}/poster`}><source src={`/api/videos/${video.id}/video`} type={video.mimeType}/></video>
        <div className="card-body"><h3>{video.title}</h3><p>{video.description}</p></div>
      </article>)}</div>
    </section>}
    <p className="category-hint">Откройте работу и листайте подборку стрелками ← → или кнопками на странице.</p>
    <ArtworkGrid items={works} locale={locale} m={m} categorySlug={slug}/>
  </section>;
}
