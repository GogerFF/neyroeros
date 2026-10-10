import { ArtworkCard } from "./artwork-card";
import { GalleryDensity } from "./gallery-density";
import type { Locale, Messages } from "@/lib/i18n";
type A = Parameters<typeof ArtworkCard>[0]["art"];
export function ArtworkGrid({ items, locale, m, categorySlug }: { items:A[]; locale:Locale; m:Messages; categorySlug?:string }) {
  if (!items.length) return <div className="empty">{m.empty}</div>;
  return <GalleryDensity locale={locale}><div className="masonry">{items.map((a, i) => <ArtworkCard key={a.id} art={a} locale={locale} m={m} categorySlug={categorySlug} priority={i < 4}/>)}</div></GalleryDensity>;
}
