import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { slugCandidates } from "@/lib/slug-param";

describe("slugCandidates", () => {
  it("returns the raw value first for plain ASCII slugs", () => {
    expect(slugCandidates("digital-art-1448bd")).toEqual(["digital-art-1448bd"]);
  });

  it("adds the decoded form when the parameter arrives percent-encoded", () => {
    const encoded = "%D1%86%D0%B8%D1%84%D1%80%D0%BE%D0%B2%D0%B0%D1%8F-%D0%B6%D0%B8%D0%B2%D0%BE%D0%BF%D0%B8%D1%81%D1%8C-db5908";
    expect(slugCandidates(encoded)).toEqual([encoded, "цифровая-живопись-db5908"]);
  });

  it("does not duplicate a value that is already decoded", () => {
    expect(slugCandidates("цифровая-живопись-db5908")).toEqual(["цифровая-живопись-db5908"]);
  });

  it("survives malformed percent sequences instead of throwing", () => {
    expect(slugCandidates("bad%zz-slug")).toEqual(["bad%zz-slug"]);
  });
});

describe("tag page slug resolution", () => {
  const page = readFileSync("app/tags/[slug]/page.tsx", "utf8");

  it("resolves the tag through slugCandidates rather than a single raw lookup", () => {
    expect(page).toContain("slugCandidates");
    expect(page).not.toContain("db.tag.findUnique({ where: { slug } }");
  });
});
