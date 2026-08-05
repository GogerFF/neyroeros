import { cache } from "react";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { normalizeLocale, ui, type Locale } from "@/lib/i18n";
import { ensureArtworkTranslation, translationProviderFromEnv, type ArtworkTranslationStore } from "@/lib/translation";

export const getLocale = cache(async (): Promise<Locale> => normalizeLocale((await cookies()).get("locale")?.value));
export const getMessages = cache(async () => ui[await getLocale()]);
const store: ArtworkTranslationStore = {
  async find(artworkId, locale) { return db.artworkTranslation.findUnique({ where: { artworkId_locale: { artworkId, locale } }, select: { title: true, description: true } }); },
  async save(artworkId, locale, value) { return db.artworkTranslation.upsert({ where: { artworkId_locale: { artworkId, locale } }, create: { artworkId, locale, ...value }, update: value, select: { title: true, description: true } }); },
};
export async function localizeArtwork<T extends {id:string;title:string;description:string|null;sourceLocale?:string}>(artwork:T,locale:Locale):Promise<T>{
  const translated=await ensureArtworkTranslation({...artwork,sourceLocale:normalizeLocale(artwork.sourceLocale)},locale,store,translationProviderFromEnv());
  return {...artwork,...translated};
}
export async function localizeArtworks<T extends {id:string;title:string;description:string|null;sourceLocale?:string}>(items:T[],locale:Locale){return Promise.all(items.map(x=>localizeArtwork(x,locale)))}
