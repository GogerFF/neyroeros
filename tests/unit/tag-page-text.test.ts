import { describe, expect, it } from "vitest";
import { TAG_THIN_THRESHOLD, tagPageText } from "@/lib/tag-page-text";

const related = ["ню", "пин-ап", "цифровая живопись", "фотореализм", "ретро-плакат"];

describe("tag page text", () => {
  it("treats a single-work tag as thin", () => {
    const { title, description } = tagPageText({ name: "nud", publishedWorks: 1, relatedNames: related });
    expect(title).toContain("похожие направления");
    expect(description).toContain("одна работа");
    expect(TAG_THIN_THRESHOLD).toBeGreaterThan(1);
  });

  it("names the neighbouring directions so a thin page is not empty prose", () => {
    const { description } = tagPageText({ name: "nud", publishedWorks: 2, relatedNames: related });
    expect(description).toContain("#ню");
    expect(description).toContain("#пин-ап");
    expect(description).toContain("2 работы");
  });

  it("caps the named neighbours at four", () => {
    const { description } = tagPageText({ name: "nud", publishedWorks: 1, relatedNames: related });
    expect(description).not.toContain("#ретро-плакат");
  });

  it("states the count plainly once a tag is a real catalogue", () => {
    const { title, description } = tagPageText({ name: "ню", publishedWorks: 40, relatedNames: related });
    expect(title).toBe("#ню — 40 работ");
    expect(description).toContain("40 работ");
    expect(description).not.toContain("похожие темы");
  });

  it("does not leave a dangling sentence when there are no neighbours", () => {
    const { description } = tagPageText({ name: "nud", publishedWorks: 1, relatedNames: [] });
    expect(description).not.toContain("Близкие направления");
    expect(description.endsWith("AI-арта.")).toBe(true);
  });

  it("ignores empty neighbour names", () => {
    const { description } = tagPageText({ name: "nud", publishedWorks: 1, relatedNames: ["", "ню", ""] });
    expect(description).toContain("#ню");
    expect(description).not.toContain("#,");
  });
});
