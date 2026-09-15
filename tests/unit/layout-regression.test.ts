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

describe("mobile drawer alignment", () => {
  it("starts below the compact mobile header", () => {
    const drawer = css.match(/\.mobile-drawer\{[^}]*\}/)?.[0] ?? "";
    expect(drawer).toContain("inset:60px 0 0");
    // header is compacted to 60px on mobile — the drawer offset must match it
    expect(css).toContain("header{height:60px");
  });
});
