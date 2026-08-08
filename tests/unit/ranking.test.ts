import { describe, expect, it } from "vitest";
import { isNewcomerEligible, trendingScore } from "@/lib/ranking";

describe("gallery ranking rules", () => {
  it("ranks recent engagement above an equally liked but old work", () => {
    const hot = trendingScore({ likes24h: 3, likes72h: 5, views24h: 20, views72h: 40, ageHours: 12 });
    const old = trendingScore({ likes24h: 0, likes72h: 0, views24h: 0, views72h: 0, ageHours: 300 });
    expect(hot).toBeGreaterThan(old);
  });

  it("defines newcomer work as a recent creator with at most three published works", () => {
    expect(isNewcomerEligible({ publishedWorks: 3, accountAgeDays: 30 })).toBe(true);
    expect(isNewcomerEligible({ publishedWorks: 4, accountAgeDays: 30 })).toBe(false);
    expect(isNewcomerEligible({ publishedWorks: 1, accountAgeDays: 31 })).toBe(false);
  });
});
