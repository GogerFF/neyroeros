import { describe, expect, it } from "vitest";
import {
  absoluteUrl,
  artworkSchema,
  breadcrumbSchema,
  webSiteSchema,
  storySchema,
  collectionSchema,
} from "@/lib/seo";

describe("seo helpers", () => {
  it("builds absolute URLs from the site base", () => {
    expect(absoluteUrl("/artwork/slug-1")).toBe("https://neyroeros.com/artwork/slug-1");
    expect(absoluteUrl("artwork/slug-1")).toBe("https://neyroeros.com/artwork/slug-1");
  });

  it("generates VisualArtwork JSON-LD with image and creator", () => {
    const schema = artworkSchema({
      id: "a1",
      slug: "test-art",
      title: "Test Art",
      description: "A beautiful piece",
      imageUrl: "https://neyroeros.com/api/images/preview/a1",
      creatorName: "Куратор",
      publishedAt: new Date("2026-08-01T00:00:00Z"),
    });
    expect(schema["@type"]).toBe("VisualArtwork");
    expect(schema["@id"]).toBe("https://neyroeros.com/artwork/test-art");
    expect(schema.name).toBe("Test Art");
    expect(schema.creator).toMatchObject({ "@type": "Person", name: "Куратор" });
    expect(schema.image).toContain("/api/images/preview/a1");
    expect(schema.datePublished).toBe("2026-08-01");
  });

  it("generates BreadcrumbList JSON-LD", () => {
    const schema = breadcrumbSchema([
      { name: "Главная", path: "/" },
      { name: "Категории", path: "/categories" },
      { name: "Фэнтези", path: "/categories/fantasy" },
    ]);
    expect(schema["@type"]).toBe("BreadcrumbList");
    expect(schema.itemListElement).toHaveLength(3);
    expect(schema.itemListElement[2].item.name).toBe("Фэнтези");
    expect(schema.itemListElement[2].item["@id"]).toBe("https://neyroeros.com/categories/fantasy");
  });

  it("generates WebSite JSON-LD with search action", () => {
    const schema = webSiteSchema();
    expect(schema["@type"]).toBe("WebSite");
    expect(schema.url).toBe("https://neyroeros.com");
    expect(schema.potentialAction.target).toContain("/search?q=");
  });

  it("generates Article JSON-LD for stories", () => {
    const schema = storySchema({
      title: "My Story",
      slug: "my-story",
      description: "A long tale",
      authorName: "Куратор",
      datePublished: new Date("2026-08-02T00:00:00Z"),
      imageUrl: "https://neyroeros.com/api/stories/images/img1",
    });
    expect(schema["@type"]).toBe("Article");
    expect(schema.headline).toBe("My Story");
    expect(schema.author).toMatchObject({ "@type": "Person", name: "Куратор" });
  });

  it("generates CollectionPage JSON-LD for categories", () => {
    const schema = collectionSchema({ name: "Фэнтези", slug: "fantasy", description: "Мифы и вселенные" });
    expect(schema["@type"]).toBe("CollectionPage");
    expect(schema.name).toBe("Фэнтези");
    expect(schema.url).toBe("https://neyroeros.com/categories/fantasy");
  });
});
