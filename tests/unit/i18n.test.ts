import { describe, expect, it } from "vitest";
import { normalizeLocale, ui } from "@/lib/i18n";

describe("i18n", () => {
  it("supports Russian, English and Simplified Chinese", () => {
    expect(normalizeLocale("ru")).toBe("ru");
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("zh-CN")).toBe("zh");
  });

  it("falls back to Russian for unsupported locales", () => {
    expect(normalizeLocale("de")).toBe("ru");
  });

  it("contains translated navigation labels", () => {
    expect(ui.en.categories).toBe("Categories");
    expect(ui.zh.categories).toBe("分类");
  });
});
