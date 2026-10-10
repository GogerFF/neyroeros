export const SITE_URL = "https://neyroeros.com";

/**
 * Serialize a schema.org object for <script type="application/ld+json">.
 * </script> inside a JSON-LD string would terminate the tag early in the HTML
 * parser, so close it defensively; strip control characters the JSON spec
 * allows in strings but XML/HTML consumers choke on.
 */
export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}


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

export function videoSchema(input: { title: string; slug: string; description: string | null; authorName: string | null; datePublished: Date | null; posterUrl: string; contentUrl: string; durationSec: number }) {
  return {
    "@context": "https://schema.org", "@type": "VideoObject", name: input.title,
    description: input.description?.slice(0, 155) ?? input.title, thumbnailUrl: input.posterUrl,
    contentUrl: input.contentUrl, url: absoluteUrl(`/videos/${input.slug}`),
    duration: `PT${input.durationSec}S`, uploadDate: input.datePublished?.toISOString(),
    author: { "@type": "Person", name: input.authorName ?? "Neyroeros" }, isFamilyFriendly: false,
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
