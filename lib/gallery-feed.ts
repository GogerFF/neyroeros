import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { isNewcomerEligible, trendingScore } from "@/lib/ranking";

export type GalleryFeedKind = "top" | "trending" | "newcomers" | "discover";

/** How long a computed feed order may be reused. */
export const FEED_CACHE_SECONDS = 300;
/** Tag invalidated when something is published, so the owner sees it at once. */
export const FEED_CACHE_TAG = "gallery-feed";
const FEED_SIZE = 48;
const CANDIDATE_LIMIT = 240;

const publishedWhere = { status: "PUBLISHED" as const, deletedAt: null };

export type FeedCandidate = {
  id: string;
  publishedAt: Date | null;
  viewCount: number;
  likes: { createdAt: Date }[];
  views: { viewedAt: Date }[];
  author: { createdAt: Date; _count: { artworks: number } };
  _count: { likes: number };
};

function seededOrder(value: string, seed: number) {
  let hash = seed;
  for (let i = 0; i < value.length; i++) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  return hash;
}

/**
 * Pure ranking rules, unchanged from the original implementation but now callable
 * without a database so the ordering can actually be tested.
 */
export function rankFeedIds(kind: GalleryFeedKind, rows: FeedCandidate[], now: Date): string[] {
  const hours24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const ageHours = (publishedAt: Date | null) => Math.max(0, (now.getTime() - (publishedAt?.getTime() ?? now.getTime())) / 3_600_000);

  const prepared = rows.map((work) => {
    const likes24h = work.likes.filter((like) => like.createdAt >= hours24).length;
    const likes72h = work.likes.length;
    const views24h = work.views.filter((view) => view.viewedAt >= hours24).length;
    const views72h = work.views.length;
    return { work, score: trendingScore({ likes24h, likes72h, views24h, views72h, ageHours: ageHours(work.publishedAt) }) };
  });
  const ids = (list: { work: FeedCandidate }[]) => list.map((entry) => entry.work.id).slice(0, FEED_SIZE);

  if (kind === "top") {
    return ids(prepared.sort((a, b) =>
      b.work._count.likes - a.work._count.likes || b.work.viewCount - a.work.viewCount || +b.work.publishedAt! - +a.work.publishedAt!));
  }
  if (kind === "trending") {
    return ids(prepared
      .filter((entry) => ageHours(entry.work.publishedAt) <= 30 * 24)
      .sort((a, b) => b.score - a.score || b.work.viewCount - a.work.viewCount));
  }
  if (kind === "newcomers") {
    return ids(prepared
      .filter(({ work }) => isNewcomerEligible({
        publishedWorks: work.author._count.artworks,
        accountAgeDays: (now.getTime() - work.author.createdAt.getTime()) / 86_400_000,
      }))
      .sort((a, b) => b.score - a.score || +b.work.publishedAt! - +a.work.publishedAt!));
  }

  const dailySeed = Number(now.toISOString().slice(0, 10).replaceAll("-", ""));
  return ids(prepared.sort((a, b) => seededOrder(a.work.id, dailySeed) - seededOrder(b.work.id, dailySeed)));
}

/**
 * The expensive part: every published work with its 72-hour likes and views.
 * Previously this ran on every request to /top, /trending, /newcomers and
 * /discover; now the resulting order is cached and shared across visitors.
 */
const rankedIds = unstable_cache(
  async (kind: GalleryFeedKind) => {
    const now = new Date();
    const hours72 = new Date(now.getTime() - 72 * 60 * 60 * 1000);
    const rows = await db.artwork.findMany({
      where: publishedWhere,
      include: {
        asset: true,
        category: true,
        author: {
          select: {
            id: true, displayName: true, handle: true, createdAt: true,
            _count: { select: { artworks: { where: publishedWhere } } },
          },
        },
        _count: { select: { likes: true } },
        likes: { where: { createdAt: { gte: hours72 } }, select: { createdAt: true } },
        views: { where: { viewedAt: { gte: hours72 } }, select: { viewedAt: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: CANDIDATE_LIMIT,
    });
    return rankFeedIds(kind, rows as FeedCandidate[], now);
  },
  ["gallery-feed"],
  { revalidate: FEED_CACHE_SECONDS, tags: [FEED_CACHE_TAG] },
);

export async function getGalleryFeed(kind: GalleryFeedKind) {
  const ids = await rankedIds(kind);
  if (ids.length === 0) return [];
  const works = await db.artwork.findMany({
    where: { ...publishedWhere, id: { in: ids } },
    include: {
      asset: true,
      category: true,
      author: {
        select: {
          id: true, displayName: true, handle: true, createdAt: true,
          _count: { select: { artworks: { where: publishedWhere } } },
        },
      },
      _count: { select: { likes: true } },
    },
  });
  const byId = new Map(works.map((work) => [work.id, work]));
  return ids.map((id) => byId.get(id)).filter((work): work is NonNullable<typeof work> => Boolean(work));
}
