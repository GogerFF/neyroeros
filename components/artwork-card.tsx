import Link from "next/link";
import type { Locale, Messages } from "@/lib/i18n";
import { categoryLabel } from "@/lib/i18n";

type A = { id:string; slug:string; title:string; description:string|null; author:{displayName:string|null;handle?:string|null}; category:{name:string;slug:string}|null; asset:{width:number;height:number}|null };
export function ArtworkCard({ art, locale, m, categorySlug }: { art:A; locale:Locale; m:Messages; categorySlug?:string }) {
  const href = categorySlug ? `/artwork/${art.slug}?category=${categorySlug}` : `/artwork/${art.slug}`;
  const authorName = art.author.displayName || m.anonymous;
  const alt = `${art.title} — AI artwork${art.author.displayName ? ` by ${art.author.displayName}` : ""}`;
  return <article className="card">
    <Link href={href}><img src={`/api/images/thumbnail/${art.id}`} alt={alt} loading="lazy" width={art.asset?.width ?? 400} height={art.asset?.height ?? 500} style={{ aspectRatio: `${art.asset?.width || 4}/${art.asset?.height || 5}` }}/></Link>
    <div className="card-body"><span>{art.category ? categoryLabel(art.category.slug, locale, art.category).name : m.aiArt}</span><h3><Link href={href}>{art.title}</Link></h3><p>{art.author.handle ? <Link href={`/authors/${art.author.handle}`}>@{art.author.handle}</Link> : authorName}</p></div>
  </article>;
}
