import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [artworks, videos, stories, categories, tags] = await Promise.all([
    db.artwork.findMany({ where: { status: "PUBLISHED", deletedAt: null }, select: { slug: true, updatedAt: true }, orderBy: { publishedAt: "desc" } }),
    db.video.findMany({ where: { status: "PUBLISHED", deletedAt: null }, select: { slug: true, updatedAt: true }, orderBy: { publishedAt: "desc" } }),
    db.story.findMany({ where: { status: "PUBLISHED", deletedAt: null }, select: { slug: true, updatedAt: true }, orderBy: { publishedAt: "desc" } }),
    db.category.findMany({ where: { isActive: true }, select: { slug: true } }),
    db.tag.findMany({ where: { artworks: { some: { artwork: { status: "PUBLISHED", deletedAt: null } } } }, select: { slug: true } }),
  ]);
  return [
    { url: "https://neyroeros.com", lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: "https://neyroeros.com/about", lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: "https://neyroeros.com/rules", lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: "https://neyroeros.com/collections", lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: "https://neyroeros.com/top", lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: "https://neyroeros.com/trending", lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: "https://neyroeros.com/newcomers", lastModified: new Date(), changeFrequency: "daily", priority: 0.65 },
    { url: "https://neyroeros.com/discover", lastModified: new Date(), changeFrequency: "daily", priority: 0.65 },
    { url: "https://neyroeros.com/categories", lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: "https://neyroeros.com/tags", lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: "https://neyroeros.com/videos", lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: "https://neyroeros.com/stories", lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: "https://neyroeros.com/search", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    ...categories.map(c => ({ url: `https://neyroeros.com/categories/${c.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...tags.map(t => ({ url: `https://neyroeros.com/tags/${t.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.6 })),
    ...artworks.map(a => ({ url: `https://neyroeros.com/artwork/${a.slug}`, lastModified: a.updatedAt, changeFrequency: "weekly" as const, priority: 0.9 })),
    ...videos.map(v => ({ url: `https://neyroeros.com/videos/${v.slug}`, lastModified: v.updatedAt, changeFrequency: "weekly" as const, priority: 0.85 })),
    ...stories.map(s => ({ url: `https://neyroeros.com/stories/${s.slug}`, lastModified: s.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
