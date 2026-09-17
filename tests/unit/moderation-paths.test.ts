import { describe, expect, it } from "vitest";
import { approvalRevalidationPaths } from "@/lib/moderation-paths";

describe("approval revalidation", () => {
  it("refreshes the artwork's own page first", () => {
    const paths = approvalRevalidationPaths({ slug: "slushay-radio-abc123", category: { slug: "digital-art" } });
    expect(paths[0]).toBe("/artwork/slushay-radio-abc123");
  });

  it("refreshes the category page the work was placed in", () => {
    const paths = approvalRevalidationPaths({ slug: "w", category: { slug: "digital-art" } });
    expect(paths).toContain("/categories/digital-art");
  });

  it("refreshes the feeds a new work appears in", () => {
    const paths = approvalRevalidationPaths({ slug: "w", category: null });
    for (const feed of ["/", "/top", "/trending", "/newcomers", "/discover", "/categories"]) {
      expect(paths).toContain(feed);
    }
  });

  it("copes with a work that has no category", () => {
    const paths = approvalRevalidationPaths({ slug: "w", category: null });
    expect(paths.some((p) => p.startsWith("/categories/"))).toBe(false);
  });

  it("never returns duplicates", () => {
    const paths = approvalRevalidationPaths({ slug: "w", category: { slug: "digital-art" } });
    expect(new Set(paths).size).toBe(paths.length);
  });
});
