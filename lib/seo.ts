export const SITE_URL = "https://neyroeros.com";

export function absoluteUrl(path: string) {
  return path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function artworkSchema(input: {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string;
  creatorName: string | null;
  publishedAt: Date | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    "@id": absoluteUrl(`/artwork/${input.slug}`),
    name: input.title,
    description: input.description?.slice(0, 155) ?? undefined,
    image: input.imageUrl,
    creator: { "@type": "Person", name: input.creatorName ?? "Neyroeros" },
    isFamilyFriendly: false,
    datePublished: input.publishedAt?.toISOString().slice(0, 10),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: { "@id": absoluteUrl(item.path), name: item.name },
    })),
  };
}

export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Neyroeros",
    url: SITE_URL,
    description: "Кураторская галерея AI-искусства для взрослых. Работы, категории и рассказы.",
    inLanguage: "ru",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function storySchema(input: {
  title: string;
  slug: string;
  description: string | null;
  authorName: string | null;
  datePublished: Date | null;
  imageUrl?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description?.slice(0, 155) ?? undefined,
    image: input.imageUrl,
    author: { "@type": "Person", name: input.authorName ?? "Neyroeros" },
    datePublished: input.datePublished?.toISOString().slice(0, 10),
    isFamilyFriendly: false,
  };
}

export function collectionSchema(input: { name: string; slug: string; description: string | null }) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    url: absoluteUrl(`/categories/${input.slug}`),
    description: input.description?.slice(0, 155) ?? undefined,
    inLanguage: "ru",
  };
}
