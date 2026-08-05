import { describe, expect, it } from "vitest";
import { canEditArtwork, transitionArtwork } from "@/lib/artwork-state";

describe("artwork state", () => {
  it("only allows editing own drafts and rejected works", () => {
    expect(canEditArtwork({ authorId:"u1", status:"DRAFT" }, "u1")).toBe(true);
    expect(canEditArtwork({ authorId:"u1", status:"PENDING" }, "u1")).toBe(false);
    expect(canEditArtwork({ authorId:"u1", status:"DRAFT" }, "u2")).toBe(false);
  });
  it("rejects invalid direct publication", () => {
    expect(() => transitionArtwork("DRAFT", "PUBLISHED")).toThrow(/переход/i);
  });
  it("supports moderation and publication lifecycle", () => {
    expect(transitionArtwork("DRAFT", "PENDING")).toBe("PENDING");
    expect(transitionArtwork("PENDING", "SCHEDULED")).toBe("SCHEDULED");
    expect(transitionArtwork("SCHEDULED", "PUBLISHED")).toBe("PUBLISHED");
  });
});
