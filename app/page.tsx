import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { ArtworkGrid } from "@/components/artwork-grid";
import { HomeAtmosphere } from "@/components/home-atmosphere";
import { HeroVideoSlideshow } from "@/components/hero-video-slideshow";
import { getLocale, getMessages, localizeArtworks } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [raw, activeVideos, locale, m] = await Promise.all([
    db.artwork.findMany({ where: { status: "PUBLISHED", deletedAt: null, publishedAt: { lte: new Date() } }, include: { asset: true, author: true, category: true, _count: { select: { likes: true } } }, orderBy: { publishedAt: "desc" }, take: 36 }),
    db.heroVideo.findMany({ where: { status: "ACTIVE" }, select: { id: true, title: true, durationSec: true, webmKey: true }, orderBy: { sortOrder: "asc" }, take: 12 }),
    getLocale(), getMessages(),
  ]);
  const works = await localizeArtworks(raw, locale);
  const newest = works.slice(0, 3);

  return <>
    {activeVideos.length > 0 ? <HeroVideoSlideshow videos={activeVideos} previews={newest.map(({ id, slug, title }) => ({ id, slug, title }))} m={m} locale={locale}/> : <section className="hero hero-rich">
      <div className="hero-copy"><span className="eyebrow">{m.heroEye}</span><h1>{m.heroTitle}</h1><p>{m.heroText}</p><div className="hero-actions"><Link className="button" href="/dashboard/uploads/new">{m.publish}</Link><Link className="ghost" href="/trending">{m.trendingCta}</Link></div></div>
      {newest.length > 0 && <div className="hero-preview" aria-label={m.newWorks}>{newest.map((art, index) => <Link className={`hero-preview-card hero-preview-${index}`} href={`/artwork/${art.slug}`} key={art.id}><img src={`/api/images/preview/${art.id}`} alt=""/><span>{art.title}</span></Link>)}</div>}
    </section>}
    <HomeAtmosphere locale={locale}/>
    <section className="section latest-section home-gallery"><div className="section-title latest-heading"><div><span className="eyebrow"><Sparkles size={13}/> {m.fresh}</span><h2>{m.newWorks}</h2><p>{m.latestDescription}</p></div><Link className="latest-all" href="/search">{m.all}<ArrowUpRight size={18}/></Link></div><ArtworkGrid items={works} locale={locale} m={m}/></section>
  </>;
}
