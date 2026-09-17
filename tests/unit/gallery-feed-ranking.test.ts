import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { rankFeedIds, type FeedCandidate } from "@/lib/gallery-feed";

const now = new Date("2026-09-17T12:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);

function candidate(over: Partial<FeedCandidate> & { id: string }): FeedCandidate {
  return {
    publishedAt: hoursAgo(2),
    viewCount: 10,
    likes: [],
    views: [],
    author: { createdAt: daysAgo(200), _count: { artworks: 40 } },
    _count: { likes: 0 },
    ...over,
  };
}

describe("feed ranking", () => {
  it("orders top by total likes, then views", () => {
    const rows = [
      candidate({ id: "low", _count: { likes: 1 }, viewCount: 999 }),
      candidate({ id: "high", _count: { likes: 50 } }),
      candidate({ id: "mid", _count: { likes: 20 } }),
    ];
    expect(rankFeedIds("top", rows, now)).toEqual(["high", "mid", "low"]);
  });

  it("keeps works older than 30 days out of trending", () => {
    const rows = [
      candidate({ id: "fresh", likes: [{ createdAt: hoursAgo(1) }, { createdAt: hoursAgo(2) }], _count: { likes: 2 } }),
      candidate({ id: "stale", publishedAt: daysAgo(45), likes: [{ createdAt: hoursAgo(1) }, { createdAt: hoursAgo(2) }, { createdAt: hoursAgo(3) }], _count: { likes: 3 } }),
    ];
    expect(rankFeedIds("trending", rows, now)).toEqual(["fresh"]);
  });

  it("ranks trending by recency-weighted activity", () => {
    const rows = [
      // same raw counts, but the likes of "recent" landed inside the last 24h
      candidate({ id: "recent", likes: [{ createdAt: hoursAgo(1) }, { createdAt: hoursAgo(2) }], _count: { likes: 2 } }),
      candidate({ id: "older", likes: [{ createdAt: hoursAgo(60) }, { createdAt: hoursAgo(61) }], _count: { likes: 2 } }),
    ];
    expect(rankFeedIds("trending", rows, now)[0]).toBe("recent");
  });

  it("drops established authors from newcomers", () => {
    const rows = [
      candidate({ id: "veteran", author: { createdAt: daysAgo(400), _count: { artworks: 60 } } }),
      candidate({ id: "rookie", author: { createdAt: daysAgo(20), _count: { artworks: 2 } } }),
    ];
    expect(rankFeedIds("newcomers", rows, now)).toEqual(["rookie"]);
  });

  it("makes discover stable within a day and capped at 48", () => {
    const rows = Array.from({ length: 60 }, (_, i) => candidate({ id: `w${i}` }));
    const first = rankFeedIds("discover", rows, now);
    const second = rankFeedIds("discover", rows, new Date("2026-09-17T23:00:00Z"));
    expect(first).toHaveLength(48);
    expect(second).toEqual(first);
  });
});

describe("feed caching", () => {
  const source = readFileSync("lib/gallery-feed.ts", "utf8");

  it("caches the ranked ids across requests", () => {
    expect(source).toContain("unstable_cache");
    expect(source).toContain("FEED_CACHE_TAG");
    expect(source).toContain('export const FEED_CACHE_TAG = "gallery-feed"');
    expect(source).toContain("revalidate: FEED_CACHE_SECONDS");
  });

  it("hydrates the cached ids with a normal query", () => {
    expect(source).toContain("id: { in: ids }");
  });
});
