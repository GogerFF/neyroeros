import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const css = readFileSync("app/globals.css", "utf8");
const artworkPage = readFileSync("app/artwork/[slug]/page.tsx", "utf8");

describe("artwork detail grid layout", () => {
  it("keeps breadcrumbs from stealing a grid cell", () => {
    // .art-detail is a 2-column grid; a non-spanning child shifts every other item.
    const rule = css.match(/\.breadcrumbs\{[^}]*\}/)?.[0] ?? "";
    expect(rule).toContain("grid-column:1/-1");
  });

  it("renders breadcrumbs inside the artwork grid (so the span rule is load-bearing)", () => {
    const gridStart = artworkPage.indexOf('<section className="art-detail">');
    const breadcrumbs = artworkPage.indexOf('className="breadcrumbs"');
    expect(gridStart).toBeGreaterThan(-1);
    expect(breadcrumbs).toBeGreaterThan(gridStart);
  });
});

describe("adult rating declaration", () => {
  const layout = readFileSync("app/layout.tsx", "utf8");

  it("declares the rating exactly once (metadata API, not also hardcoded in <head>)", () => {
    // metadata.other.rating emits <meta name="rating" content="adult"/>
    expect(layout).toContain('rating: "adult"');
    // a second hardcoded copy produced two identical tags in production
    expect(layout).not.toContain('<meta name="rating"');
    // the RTA registration code is not part of the metadata API and must stay
    expect(layout).toContain('name="RATING"');
  });
});

describe("mobile drawer alignment", () => {
  it("starts below the compact mobile header", () => {
    const drawer = css.match(/\.mobile-drawer\{[^}]*\}/)?.[0] ?? "";
    expect(drawer).toContain("inset:60px 0 0");
    // header is compacted to 60px on mobile — the drawer offset must match it
    expect(css).toContain("header{height:60px");
  });
});

describe("long titles must not widen the page", () => {
  // Titles run to 100 characters and contain words like «фотореалистичный». Without
  // min-width:0 the aside column's min-content width set the grid track, so the page
  // scrolled sideways on a 1200px screen (reported from production).
  const asideRules = css.match(/\.art-detail aside\{[^}]*\}/g) ?? [];
  const h1Rules = css.match(/\.art-detail h1\{[^}]*\}/g) ?? [];

  it("lets the aside column shrink below its content width", () => {
    expect(asideRules.some((rule) => rule.includes("min-width:0"))).toBe(true);
  });

  it("lets a long word break inside the heading", () => {
    expect(h1Rules.some((rule) => rule.includes("overflow-wrap:anywhere"))).toBe(true);
  });

  it("does not set the detail heading at display scale any more", () => {
    const size = h1Rules.join(" ").match(/clamp\(([\d.]+)rem,[\d.]+vw,([\d.]+)rem\)/);
    expect(size).not.toBeNull();
    expect(Number(size![2])).toBeLessThanOrEqual(3.6);
  });
});
