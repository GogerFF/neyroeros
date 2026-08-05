import { describe, expect, it, vi } from "vitest";
import { GoogleTranslationProvider } from "@/lib/translation";

describe("GoogleTranslationProvider", () => {
  it("translates arbitrary title and description into the selected language", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [[["Moon portrait", "Лунный портрет"]]] })
      .mockResolvedValueOnce({ ok: true, json: async () => [[["A mysterious night scene", "Таинственная ночная сцена"]]] });
    const provider = new GoogleTranslationProvider(fetcher);
    await expect(provider.translate({
      title: "Лунный портрет",
      description: "Таинственная ночная сцена",
      sourceLocale: "ru",
      targetLocale: "en",
    })).resolves.toEqual({ title: "Moon portrait", description: "A mysterious night scene" });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
