import { db } from "@/lib/db";
import { isNewcomerEligible, trendingScore } from "@/lib/ranking";

export type GalleryFeedKind = "top" | "trending" | "newcomers" | "discover";

const publishedWhere = { status: "PUBLISHED" as const, deletedAt: null };

export async function getGalleryFeed(kind: GalleryFeedKind) {
  const now = new Date();
  const hours24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const hours72 = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  const works = await db.artwork.findMany({
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
    take: 240,
  });

  const ageHours = (publishedAt: Date | null) => Math.max(0, (now.getTime() - (publishedAt?.getTime() ?? now.getTime())) / 3_600_000);
  const prepared = works.map((work) => {
    const likes24h = work.likes.filter((like) => like.createdAt >= hours24).length;
    const likes72h = work.likes.length;
    const views24h = work.views.filter((view) => view.viewedAt >= hours24).length;
    const views72h = work.views.length;
    return { work, score: trendingScore({ likes24h, likes72h, views24h, views72h, ageHours: ageHours(work.publishedAt) }) };
  });

  if (kind === "top") return prepared.sort((a, b) => b.work._count.likes - a.work._count.likes || b.work.viewCount - a.work.viewCount || +b.work.publishedAt! - +a.work.publishedAt!).map((x) => x.work).slice(0, 48);
  if (kind === "trending") return prepared.filter((x) => ageHours(x.work.publishedAt) <= 30 * 24).sort((a, b) => b.score - a.score || b.work.viewCount - a.work.viewCount).map((x) => x.work).slice(0, 48);
  if (kind === "newcomers") return prepared.filter(({ work }) => isNewcomerEligible({ publishedWorks: work.author._count.artworks, accountAgeDays: (now.getTime() - work.author.createdAt.getTime()) / 86_400_000 })).sort((a, b) => b.score - a.score || +b.work.publishedAt! - +a.work.publishedAt!).map((x) => x.work).slice(0, 48);

  const dailySeed = Number(now.toISOString().slice(0, 10).replaceAll("-", ""));
  return prepared.sort((a, b) => seededOrder(a.work.id, dailySeed) - seededOrder(b.work.id, dailySeed)).map((x) => x.work).slice(0, 48);
}

function seededOrder(value: string, seed: number) {
  let hash = seed;
  for (let i = 0; i < value.length; i++) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  return hash;
}
