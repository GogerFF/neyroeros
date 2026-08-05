import { describe, expect, it } from "vitest";
import { artworkSearchWhere } from "@/lib/artwork-search";

describe("artworkSearchWhere", () => {
  it("includes tag names alongside artwork and translation text", () => {
    expect(artworkSearchWhere("neon")).toEqual({
      OR: expect.arrayContaining([
        { tags: { some: { tag: { name: { contains: "neon" } } } } },
      ]),
    });
  });

  it("does not add a filter for an empty query", () => {
    expect(artworkSearchWhere("")).toEqual({});
  });
});
