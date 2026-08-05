import Link from "next/link";
import type { Locale, Messages } from "@/lib/i18n";
import { categoryLabel } from "@/lib/i18n";

type A = { id:string; slug:string; title:string; description:string|null; author:{displayName:string|null}; category:{name:string;slug:string}|null; asset:{width:number;height:number}|null };
export function ArtworkCard({ art, locale, m, categorySlug }: { art:A; locale:Locale; m:Messages; categorySlug?:string }) {
  const href = categorySlug ? `/artwork/${art.slug}?category=${categorySlug}` : `/artwork/${art.slug}`;
  return <article className="card"><Link href={href}><img src={`/api/images/thumbnail/${art.id}`} alt={art.title} loading="lazy" style={{aspectRatio:`${art.asset?.width||4}/${art.asset?.height||5}`}}/><div className="card-body"><span>{art.category?categoryLabel(art.category.slug,locale,art.category).name:m.aiArt}</span><h3>{art.title}</h3><p>{art.author.displayName||m.anonymous}</p></div></Link></article>;
}
