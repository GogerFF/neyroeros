import { describe, expect, it, vi } from "vitest";
import {
  DeterministicTranslationProvider,
  OpenAICompatibleTranslationProvider,
  ensureArtworkTranslation,
  type ArtworkTranslationStore,
  type TranslationProvider,
} from "@/lib/translation";

describe("artwork metadata translation", () => {
  it("uses an existing translation without calling the provider", async () => {
    const store: ArtworkTranslationStore = {
      find: vi.fn().mockResolvedValue({ title: "Midnight", description: "A dream" }),
      save: vi.fn(),
    };
    const provider: TranslationProvider = { translate: vi.fn() };
    const result = await ensureArtworkTranslation(
      { id: "a1", title: "Полночь", description: "Сон", sourceLocale: "ru" },
      "en",
      store,
      provider,
    );
    expect(result).toEqual({ title: "Midnight", description: "A dream" });
    expect(provider.translate).not.toHaveBeenCalled();
    expect(store.save).not.toHaveBeenCalled();
  });

  it("translates and caches missing metadata", async () => {
    const store: ArtworkTranslationStore = {
      find: vi.fn().mockResolvedValue(null),
      save: vi.fn(async (_id, _locale, value) => value),
    };
    const provider: TranslationProvider = {
      translate: vi.fn().mockResolvedValue({ title: "Midnight", description: "A dream" }),
    };
    const result = await ensureArtworkTranslation(
      { id: "a1", title: "Полночь", description: "Сон", sourceLocale: "ru" },
      "en",
      store,
      provider,
    );
    expect(result.title).toBe("Midnight");
    expect(store.save).toHaveBeenCalledWith("a1", "en", result);
  });

  it("falls back to source metadata when the provider fails", async () => {
    const store: ArtworkTranslationStore = { find: vi.fn().mockResolvedValue(null), save: vi.fn() };
    const provider: TranslationProvider = { translate: vi.fn().mockRejectedValue(new Error("offline")) };
    await expect(ensureArtworkTranslation(
      { id: "a1", title: "Полночь", description: null, sourceLocale: "ru" }, "zh", store, provider,
    )).resolves.toEqual({ title: "Полночь", description: null });
    expect(store.save).not.toHaveBeenCalled();
  });

  it("provides deterministic local translations for known terms and preserves unknown text", async () => {
    const provider = new DeterministicTranslationProvider();
    await expect(provider.translate({ title: "Портрет", description: "Неон", sourceLocale: "ru", targetLocale: "en" }))
      .resolves.toEqual({ title: "Portrait", description: "Neon" });
    await expect(provider.translate({ title: "Уникальный текст", description: null, sourceLocale: "ru", targetLocale: "zh" }))
      .resolves.toEqual({ title: "Уникальный текст", description: null });
  });

  it("calls an OpenAI-compatible JSON endpoint", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"title":"Midnight","description":"A dream"}' } }] }),
    });
    const provider = new OpenAICompatibleTranslationProvider({ baseUrl: "https://ai.test/v1", apiKey: "secret", model: "model", fetcher });
    await expect(provider.translate({ title: "Полночь", description: "Сон", sourceLocale: "ru", targetLocale: "en" }))
      .resolves.toEqual({ title: "Midnight", description: "A dream" });
    expect(fetcher).toHaveBeenCalledWith("https://ai.test/v1/chat/completions", expect.objectContaining({ method: "POST" }));
  });
});
