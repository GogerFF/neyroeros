import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";

const detailPages = [
  "app/artwork/[slug]/page.tsx",
  "app/videos/[slug]/page.tsx",
  "app/stories/[slug]/page.tsx",
];

/**
 * A root-level loading boundary (app/loading.tsx) turns not-found into a SOFT 404.
 *
 * Verified against a production build with an empty database: with app/loading.tsx
 * present, /artwork/<unknown>, /videos/<unknown> and /stories/<unknown> answered
 * 200 and rendered the not-found page; removing it made all three answer 404 while
 * live pages stayed 200. Reason: the boundary flushes the layout shell (and the
 * 200 status with it) before the page component resolves, and a later notFound()
 * cannot change a status that has already been sent. Raising notFound() earlier
 * (in generateMetadata) does not help - measured, still 200.
 *
 * Reviewers: if a loading skeleton is wanted back, scope it to a route group that
 * excludes the detail pages; do not add it at the app root.
 */
describe("missing detail pages answer a real 404", () => {
  it("no root-level loading boundary", () => {
    expect(existsSync("app/loading.tsx")).toBe(false);
  });

  it("detail pages raise notFound() when the record is absent", () => {
    for (const file of detailPages) {
      const src = readFileSync(file, "utf8");
      expect(src).toContain("notFound()");
      expect(src).toContain("status: \"PUBLISHED\"");
    }
  });
});
