import { describe, expect, it } from "vitest";
import { normalizeHandle, profileSchema } from "@/lib/profile-input";

describe("public author profile input", () => {
  it("normalizes a human handle into a stable ASCII URL segment", () => {
    expect(normalizeHandle("  Night Queen_Art! ")).toBe("night-queen-art");
  });

  it("accepts a valid handle and short biography", () => {
    expect(profileSchema.safeParse({ handle: "night-queen", bio: "AI artist" }).success).toBe(true);
  });

  it("rejects reserved and too-short handles", () => {
    expect(profileSchema.safeParse({ handle: "admin", bio: "" }).success).toBe(false);
    expect(profileSchema.safeParse({ handle: "ab", bio: "" }).success).toBe(false);
  });
});
