import { describe, expect, it } from "vitest";
import { normalizeArtworkTags } from "@/lib/artwork-input";
import { slugifyLatin } from "@/lib/utils";

describe("artwork upload input", () => {
  it("creates an ASCII-only slug for a Cyrillic title", () => {
    const slug = slugifyLatin("Эльфа в лесу: ночь №2");
    expect(slug).toMatch(/^[a-z0-9-]+$/);
    expect(slug).toContain("elfa-v-lesu");
  });

  it("normalizes, deduplicates and caps user tags", () => {
    expect(normalizeArtworkTags(" Fantasy, AI art, фэнтези, fantasy , , AI art "))
      .toEqual(["Fantasy", "AI art", "фэнтези"]);
  });

  it("does not accept more than ten tags", () => {
    expect(normalizeArtworkTags("one,two,three,four,five,six,seven,eight,nine,ten,eleven"))
      .toHaveLength(10);
  });
});
