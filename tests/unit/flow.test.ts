import { describe, expect, it } from "vitest";
import { discoveryPublished, flowHref, flowOrder, normalizeFlowQuery } from "@/lib/flow";
import { serializeJsonLd } from "@/lib/seo";
import { readFileSync } from "node:fs";

describe("Flow discovery", () => {
  const items = Array.from({ length: 30 }, (_, i) => ({ id: `art-${i}` }));
  it("uses only published, non-deleted artworks", () => {
    expect(discoveryPublished).toEqual({ status: "PUBLISHED", deletedAt: null });
  });
  it("has repeatable order independent of input order and does not mutate", () => {
    const original = [...items];
    expect(flowOrder(items, "one")).toEqual(flowOrder([...items].reverse(), "one"));
    expect(items).toEqual(original);
    expect(flowOrder(items, "two")).not.toEqual(flowOrder(items, "one"));
    expect(new Set(flowOrder(items, "one").map(a => a.id)).size).toBe(items.length);
    expect(flowOrder([], "one")).toEqual([]);
  });
  it("rejects malformed and repeated query parameters", () => {
    expect(normalizeFlowQuery({ seed: ["a", "b"], step: "-1" })).toEqual({ seed: "neyroeros", step: 0 });
    expect(normalizeFlowQuery({ seed: "<script>", step: "Infinity" })).toEqual({ seed: "neyroeros", step: 0 });
    expect(normalizeFlowQuery({ seed: "replay_1", step: "12" })).toEqual({ seed: "replay_1", step: 12 });
    expect(normalizeFlowQuery({ seed: "a".repeat(65), step: "9999999999" })).toEqual({ seed: "neyroeros", step: 0 });
  });
  it("produces stable next/back URLs", () => {
    const first = flowHref("replay", 0);
    const next = flowHref("replay", 1);
    expect(first).toBe("/flow?seed=replay&step=0");
    expect(next).toBe("/flow?seed=replay&step=1");
    expect(flowHref("replay", -1)).toBe(first);
  });
  it("escapes hostile stored topic names in JSON-LD", () => {
    const schema = { name: "</script><script>alert('x')</script>&" };
    const json = serializeJsonLd(schema);
    expect(json).not.toContain("</script>");
    expect(JSON.parse(json)).toEqual(schema);
  });
  it("wires filtered counts, DNA, density and sitemap without schema changes", () => {
    const read = (p: string) => readFileSync(p, "utf8");
    const universe = read("app/universe/page.tsx");
    expect(universe).toContain("artworks: { where: { artwork: published } }");
    expect(universe).toContain("artworks: { where: published }");
    expect(universe).toContain("serializeJsonLd(schema)");
    const flow = read("app/flow/page.tsx");
    expect(flow).toContain('canonical: "/flow"');
    expect(flow).toContain("index: Object.keys(query).length === 0");
    expect(flow).toContain("raw.tags.map");
    expect(flow).toContain("serializeJsonLd(schema)");
    expect(read("components/artwork-grid.tsx")).toContain("<GalleryDensity");
    expect(read("app/sitemap.ts")).toContain("https://neyroeros.com/universe");
    expect(read("app/discovery.css")).toContain("prefers-reduced-motion:reduce");
  });
});
