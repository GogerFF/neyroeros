import { describe, expect, it } from "vitest";
import { dayBucket, shouldCountArtworkView } from "@/lib/artwork-view";

describe("artwork view rules", () => {
  it("groups views into a stable UTC day bucket", () => {
    expect(dayBucket(new Date("2026-08-08T23:59:59Z"))).toBe("2026-08-08");
    expect(dayBucket(new Date("2026-08-09T00:00:00Z"))).toBe("2026-08-09");
  });

  it("does not count a creator viewing their own artwork", () => {
    expect(shouldCountArtworkView({ viewerId: "author", authorId: "author" })).toBe(false);
    expect(shouldCountArtworkView({ viewerId: "visitor", authorId: "author" })).toBe(true);
    expect(shouldCountArtworkView({ viewerId: undefined, authorId: "author" })).toBe(true);
  });
});
