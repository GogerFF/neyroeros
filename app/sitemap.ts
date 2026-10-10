import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [artworks, videos, stories, categories, tags, authors] = await Promise.all([
    db.artwork.findMany({ where: { status: "PUBLISHED", deletedAt: null }, select: { slug: true, updatedAt: true }, orderBy: { publishedAt: "desc" } }),
    db.video.findMany({ where: { status: "PUBLISHED", deletedAt: null }, select: { slug: true, updatedAt: true }, orderBy: { publishedAt: "desc" } }),
    db.story.findMany({ where: { status: "PUBLISHED", deletedAt: null }, select: { slug: true, updatedAt: true }, orderBy: { publishedAt: "desc" } }),
    db.category.findMany({ where: { isActive: true }, select: { slug: true } }),
    db.tag.findMany({ where: { artworks: { some: { artwork: { status: "PUBLISHED", deletedAt: null } } } }, select: { slug: true } }),
    // Author profiles currently display artworks only; video/story-only authors
    // would have an empty, noindexed profile and should not be advertised here.
    db.user.findMany({ where: { handle: { not: null }, artworks: { some: { status: "PUBLISHED", deletedAt: null } } }, select: { handle: true } }),
  ]);
  return [
    { url: "https://neyroeros.com", changeFrequency: "daily", priority: 1 },
    { url: "https://neyroeros.com/universe", changeFrequency: "daily", priority: 0.8 },
    { url: "https://neyroeros.com/about", changeFrequency: "monthly", priority: 0.6 },
    { url: "https://neyroeros.com/rules", changeFrequency: "monthly", priority: 0.6 },
    { url: "https://neyroeros.com/collections", changeFrequency: "daily", priority: 0.7 },
    { url: "https://neyroeros.com/top", changeFrequency: "daily", priority: 0.7 },
    { url: "https://neyroeros.com/trending", changeFrequency: "daily", priority: 0.7 },
    { url: "https://neyroeros.com/newcomers", changeFrequency: "daily", priority: 0.65 },
    { url: "https://neyroeros.com/discover", changeFrequency: "daily", priority: 0.65 },
    { url: "https://neyroeros.com/categories", changeFrequency: "weekly", priority: 0.8 },
    { url: "https://neyroeros.com/tags", changeFrequency: "weekly", priority: 0.7 },
    { url: "https://neyroeros.com/videos", changeFrequency: "daily", priority: 0.8 },
    { url: "https://neyroeros.com/stories", changeFrequency: "daily", priority: 0.8 },
    ...categories.map(c => ({ url: `https://neyroeros.com/categories/${encodeURIComponent(c.slug)}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...tags.map(t => ({ url: `https://neyroeros.com/tags/${encodeURIComponent(t.slug)}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...authors.flatMap(a => a.handle ? [{ url: `https://neyroeros.com/authors/${encodeURIComponent(a.handle)}`, changeFrequency: "weekly" as const, priority: 0.6 }] : []),
    ...artworks.map(a => ({ url: `https://neyroeros.com/artwork/${encodeURIComponent(a.slug)}`, lastModified: a.updatedAt, changeFrequency: "weekly" as const, priority: 0.9 })),
    ...videos.map(v => ({ url: `https://neyroeros.com/videos/${encodeURIComponent(v.slug)}`, lastModified: v.updatedAt, changeFrequency: "weekly" as const, priority: 0.85 })),
    ...stories.map(s => ({ url: `https://neyroeros.com/stories/${encodeURIComponent(s.slug)}`, lastModified: s.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
