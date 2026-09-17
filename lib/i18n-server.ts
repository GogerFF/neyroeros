import { cache } from "react";
import { cookies } from "next/headers";
import { after } from "next/server";
import { db } from "@/lib/db";
import { normalizeLocale, ui, type Locale } from "@/lib/i18n";
import {
  ensureArtworkTranslation,
  localizeManyTranslations,
  needsTranslation,
  translationProviderFromEnv,
  type ArtworkTranslationStore,
  type BatchTranslationStore,
} from "@/lib/translation";

/** How many missing translations one page view may queue in the background. */
const BACKGROUND_FILL_LIMIT = 4;

export const getLocale = cache(async (): Promise<Locale> => normalizeLocale((await cookies()).get("locale")?.value));
export const getMessages = cache(async () => ui[await getLocale()]);

const store: ArtworkTranslationStore & BatchTranslationStore = {
  async find(artworkId, locale) {
    return db.artworkTranslation.findUnique({ where: { artworkId_locale: { artworkId, locale } }, select: { title: true, description: true } });
  },
  async findMany(artworkIds, locale) {
    if (artworkIds.length === 0) return new Map();
    const rows = await db.artworkTranslation.findMany({
      where: { artworkId: { in: artworkIds }, locale },
      select: { artworkId: true, title: true, description: true },
    });
    return new Map(rows.map((row) => [row.artworkId, { title: row.title, description: row.description }]));
  },
  async save(artworkId, locale, value) {
    return db.artworkTranslation.upsert({ where: { artworkId_locale: { artworkId, locale } }, create: { artworkId, locale, ...value }, update: value, select: { title: true, description: true } });
  },
};

/**
 * Translation (external HTTP by default) must never delay a response, so a miss
 * returns the original text and the cache is warmed after the response is sent.
 */
function queueBackgroundFill(items: { id: string; title: string; description: string | null; sourceLocale?: string }[], locale: Locale) {
  const pending = items.filter((item) => needsTranslation(item, locale)).slice(0, BACKGROUND_FILL_LIMIT);
  if (pending.length === 0) return;
  try {
    after(async () => {
      for (const item of pending) {
        await ensureArtworkTranslation({ ...item, sourceLocale: normalizeLocale(item.sourceLocale) }, locale, store, translationProviderFromEnv());
      }
    });
  } catch {
    // outside a request scope (tests, scripts) - nothing to schedule
  }
}

export async function localizeArtwork<T extends { id: string; title: string; description: string | null; sourceLocale?: string }>(artwork: T, locale: Locale): Promise<T> {
  if (!needsTranslation(artwork, locale)) return artwork;
  const cached = await store.find(artwork.id, locale);
  if (cached) return { ...artwork, ...cached };
  queueBackgroundFill([artwork], locale);
  return artwork;
}

export async function localizeArtworks<T extends { id: string; title: string; description: string | null; sourceLocale?: string; _count?: { likes: number } }>(items: T[], locale: Locale) {
  const localized = await localizeManyTranslations(items, locale, store);
  queueBackgroundFill(localized, locale);
  const counts = new Map(items.map((raw) => [raw.id, raw._count?.likes]));
  return localized.map((item) => ({ ...item, likeCount: counts.get(item.id) }));
}
