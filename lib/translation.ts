import { normalizeLocale, type Locale } from "@/lib/i18n";

export type MetadataInput = { title: string; description: string | null; sourceLocale: Locale };
export type TranslationInput = MetadataInput & { targetLocale: Locale };
export type TranslatedMetadata = { title: string; description: string | null };
export interface TranslationProvider { translate(input: TranslationInput): Promise<TranslatedMetadata> }
export interface ArtworkTranslationStore {
  find(artworkId: string, locale: Locale): Promise<TranslatedMetadata | null>;
  save(artworkId: string, locale: Locale, value: TranslatedMetadata): Promise<TranslatedMetadata>;
}

/** Store that can resolve a whole page of artworks in one query. */
export interface BatchTranslationStore {
  findMany(artworkIds: string[], locale: Locale): Promise<Map<string, TranslatedMetadata>>;
}

const words: Record<Locale, Record<string, string>> = {
  ru: { Portrait: "Портрет", Neon: "Неон", Fantasy: "Фэнтези", Abstract: "Абстракция", Cyberpunk: "Киберпанк" },
  en: { "Портрет": "Portrait", "Неон": "Neon", "Фэнтези": "Fantasy", "Абстракция": "Abstract", "Киберпанк": "Cyberpunk" },
  zh: { "Портрет": "肖像", "Неон": "霓虹", "Фэнтези": "奇幻", "Абстракция": "抽象", "Киберпанк": "赛博朋克" },
};

export class DeterministicTranslationProvider implements TranslationProvider {
  async translate(input: TranslationInput): Promise<TranslatedMetadata> {
    const translate = (value: string) => words[input.targetLocale][value] ?? value;
    return { title: translate(input.title), description: input.description ? translate(input.description) : null };
  }
}

type Fetcher = (input: string, init?: RequestInit) => Promise<{ ok: boolean; status?: number; json(): Promise<unknown> }>;

export class GoogleTranslationProvider implements TranslationProvider {
  constructor(private fetcher: Fetcher = fetch) {}

  private async translateText(text: string, sourceLocale: Locale, targetLocale: Locale): Promise<string> {
    const source = sourceLocale === "zh" ? "zh-CN" : sourceLocale;
    const target = targetLocale === "zh" ? "zh-CN" : targetLocale;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await this.fetcher(url);
    if (!response.ok) throw new Error(`Google translation failed (${response.status ?? "unknown"})`);
    const data = await response.json() as unknown;
    if (!Array.isArray(data) || !Array.isArray(data[0])) throw new Error("Invalid Google translation response");
    const translated = data[0]
      .map((part: unknown) => Array.isArray(part) && typeof part[0] === "string" ? part[0] : "")
      .join("");
    if (!translated) throw new Error("Empty Google translation response");
    return translated;
  }

  async translate(input: TranslationInput): Promise<TranslatedMetadata> {
    const [title, description] = await Promise.all([
      this.translateText(input.title, input.sourceLocale, input.targetLocale),
      input.description ? this.translateText(input.description, input.sourceLocale, input.targetLocale) : Promise.resolve(null),
    ]);
    return { title, description };
  }
}

export class OpenAICompatibleTranslationProvider implements TranslationProvider {
  constructor(private options: { baseUrl: string; apiKey?: string; model: string; fetcher?: Fetcher }) {}
  async translate(input: TranslationInput): Promise<TranslatedMetadata> {
    const response = await (this.options.fetcher ?? fetch)(`${this.options.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(this.options.apiKey ? { authorization: `Bearer ${this.options.apiKey}` } : {}) },
      body: JSON.stringify({
        model: this.options.model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Translate artwork metadata faithfully. Return only JSON with title and description. Preserve names and artistic tone." },
          { role: "user", content: JSON.stringify(input) },
        ],
      }),
    });
    if (!response.ok) throw new Error(`Translation request failed (${response.status ?? "unknown"})`);
    const data = await response.json() as { choices?: { message?: { content?: string } }[] };
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "") as TranslatedMetadata;
    if (!parsed.title || (parsed.description !== null && typeof parsed.description !== "string")) throw new Error("Invalid translation response");
    return parsed;
  }
}

export function translationProviderFromEnv(): TranslationProvider {
  if (process.env.TRANSLATION_API_URL) return new OpenAICompatibleTranslationProvider({
    baseUrl: process.env.TRANSLATION_API_URL,
    apiKey: process.env.TRANSLATION_API_KEY,
    model: process.env.TRANSLATION_MODEL ?? "gpt-4o-mini",
  });
  if (process.env.TRANSLATION_PROVIDER === "local") return new DeterministicTranslationProvider();
  return new GoogleTranslationProvider();
}

/** True when the item's own text is not already in the requested language. */
export function needsTranslation(item: { sourceLocale?: string }, targetLocale: Locale): boolean {
  return normalizeLocale(item.sourceLocale) !== targetLocale;
}

/**
 * Localizes a whole page of artworks with a single store query.
 *
 * Deliberately does NOT call the translation provider. A grid of 48 artworks in a
 * locale mismatch used to fire up to two external HTTP requests per card *inside*
 * the server render; here a miss simply falls back to the original text.
 */
export async function localizeManyTranslations<
  T extends { id: string; title: string; description: string | null; sourceLocale?: string },
>(
  items: T[],
  targetLocale: Locale,
  store: BatchTranslationStore,
): Promise<T[]> {
  if (items.length === 0) return [];
  const pending = items.filter((item) => needsTranslation(item, targetLocale));
  if (pending.length === 0) return items;
  const cached = await store.findMany(pending.map((item) => item.id), targetLocale);
  if (cached.size === 0) return items;
  return items.map((item) => {
    const hit = cached.get(item.id);
    return hit ? { ...item, ...hit } : item;
  });
}

export async function ensureArtworkTranslation(
  artwork: { id: string } & MetadataInput,
  targetLocale: Locale,
  store: ArtworkTranslationStore,
  provider: TranslationProvider,
): Promise<TranslatedMetadata> {
  if (targetLocale === artwork.sourceLocale) return { title: artwork.title, description: artwork.description };
  const cached = await store.find(artwork.id, targetLocale);
  if (cached) return cached;
  try {
    const translated = await provider.translate({ ...artwork, targetLocale });
    return await store.save(artwork.id, targetLocale, translated);
  } catch (error) {
    console.warn("Artwork translation failed", artwork.id, targetLocale, error);
    return { title: artwork.title, description: artwork.description };
  }
}
