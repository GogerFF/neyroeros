import { describe, expect, it } from "vitest";
import { categorySchema, slugifyCategory } from "@/lib/validation/category";

describe("category validation", () => {
  it("creates a URL-safe slug from a category name", () => {
    expect(slugifyCategory("Кибер мечты 18+" )).toBe("kiber-mechty-18");
  });

  it("requires a category name", () => {
    expect(() => categorySchema.parse({ name: "", description: "" })).toThrow();
  });
});
