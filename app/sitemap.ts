import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [artworks, stories, categories] = await Promise.all([
    db.artwork.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      select: { slug: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
    }),
    db.story.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      select: { slug: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
    }),
    db.category.findMany({ where: { isActive: true }, select: { slug: true } }),
  ]);

  return [
    { url: "https://neyroeros.com", lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: "https://neyroeros.com/categories", lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: "https://neyroeros.com/stories", lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: "https://neyroeros.com/search", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    ...categories.map((c) => ({
      url: `https://neyroeros.com/categories/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...artworks.map((a) => ({
      url: `https://neyroeros.com/artwork/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...stories.map((s) => ({
      url: `https://neyroeros.com/stories/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
