import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { localizeManyTranslations, type BatchTranslationStore } from "@/lib/translation";
import type { Locale } from "@/lib/i18n";

type Item = { id: string; title: string; description: string | null; sourceLocale?: string };

const items: Item[] = [
  { id: "a", title: "Portrait", description: "Neon", sourceLocale: "en" },
  { id: "b", title: "Fantasy", description: null, sourceLocale: "en" },
  { id: "c", title: "Портрет", description: "Неон", sourceLocale: "ru" },
];

function makeStore(hits: Record<string, { title: string; description: string | null }>) {
  const calls: { findMany: number; ids: string[][] } = { findMany: 0, ids: [] };
  const store: BatchTranslationStore = {
    async findMany(ids: string[]) {
      calls.findMany += 1;
      calls.ids.push(ids);
      return new Map(Object.entries(hits).filter(([id]) => ids.includes(id)));
    },
  };
  return { store, calls };
}

describe("batch artwork localization", () => {
  it("queries the store once for the whole page", async () => {
    const { store, calls } = makeStore({ a: { title: "Портрет", description: "Неон" } });
    await localizeManyTranslations(items, "ru", store);
    expect(calls.findMany).toBe(1);
    expect(calls.ids[0].sort()).toEqual(["a", "b"]);
  });

  it("uses a cached translation when it exists", async () => {
    const { store } = makeStore({ a: { title: "Портрет", description: "Неон" } });
    const [a] = await localizeManyTranslations(items, "ru", store);
    expect(a.title).toBe("Портрет");
    expect(a.description).toBe("Неон");
  });

  it("falls back to the original text instead of calling the provider", async () => {
    const { store } = makeStore({});
    const [, b] = await localizeManyTranslations(items, "ru", store);
    expect(b.title).toBe("Fantasy");
  });

  it("leaves items already in the target locale untouched", async () => {
    const { store, calls } = makeStore({});
    const [, , c] = await localizeManyTranslations(items, "ru", store);
    expect(c.title).toBe("Портрет");
    expect(calls.ids[0]).not.toContain("c");
  });

  it("never reaches the external provider from the list path", () => {
    const src = readFileSync("lib/translation.ts", "utf8");
    const start = src.indexOf("export async function localizeManyTranslations");
    const end = src.indexOf("export async function ensureArtworkTranslation");
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    expect(src.slice(start, end)).not.toContain(".translate(");
  });

  it("skips the store entirely when nothing needs translating", async () => {
    const { store, calls } = makeStore({});
    await localizeManyTranslations([items[2]], "ru", store);
    expect(calls.findMany).toBe(0);
  });

  it("handles an empty page without touching the store", async () => {
    const { store, calls } = makeStore({});
    expect(await localizeManyTranslations([], "ru", store)).toEqual([]);
    expect(calls.findMany).toBe(0);
  });
});

describe("detail page localization stays off the critical path", () => {
  it("never calls a provider inline for a single item", async () => {
    const source = readFileSync("lib/i18n-server.ts", "utf8");
    const deferred = source.indexOf("after(async () => {");
    const call = source.indexOf("await ensureArtworkTranslation(");
    // the provider may only be reached from a deferred callback, never awaited inline
    expect(deferred).toBeGreaterThan(-1);
    expect(call).toBeGreaterThan(deferred);
    expect(source).toContain("localizeManyTranslations");
  });
});
