import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AuthorPage, { generateMetadata } from "@/app/authors/[handle]/page";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), notFound: vi.fn(() => { throw new Error("NOT_FOUND"); }) }));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: mocks.findUnique } } }));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("@/lib/i18n-server", () => ({
  getLocale: async () => "ru", getMessages: async () => ({}), localizeArtworks: async (items: unknown) => items,
}));
vi.mock("@/components/artwork-grid", () => ({ ArtworkGrid: () => null }));

const params = Promise.resolve({ handle: "artist" });
const author = (artworks: unknown[] = []) => ({
  id: "u1", handle: "artist", displayName: "Artist", bio: "Profile biography",
  createdAt: new Date("2026-08-01T00:00:00Z"), avatar: null, artworks,
});
const publishedWork = { _count: { likes: 2 } };

describe("author profile SEO", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("noindexes empty profiles but allows link following", async () => {
    mocks.findUnique.mockResolvedValue(author());
    expect(await generateMetadata({ params })).toMatchObject({
      robots: { index: false, follow: true }, alternates: { canonical: "/authors/artist" },
    });
  });

  it("indexes profiles with published artwork and truncates the description", async () => {
    mocks.findUnique.mockResolvedValue({ ...author([publishedWork]), bio: "b".repeat(500), handle: "имя ?#" });
    expect(await generateMetadata({ params })).toMatchObject({
      description: "b".repeat(155), robots: { index: true, follow: true },
      alternates: { canonical: `/authors/${encodeURIComponent("имя ?#")}` },
    });
    expect(mocks.findUnique.mock.calls[0][0].select.artworks.where).toEqual({ status: "PUBLISHED", deletedAt: null });
  });

  it("uses the handle fallback without inventing credentials", async () => {
    mocks.findUnique.mockResolvedValue({ ...author([publishedWork]), displayName: null, bio: null });
    expect(await generateMetadata({ params })).toMatchObject({ title: "@artist", description: "Работы AI-художника @artist на Neyroeros." });
  });

  it("returns no metadata and keeps notFound behavior for absent authors", async () => {
    mocks.findUnique.mockResolvedValue(null);
    expect(await generateMetadata({ params })).toEqual({});
    await expect(AuthorPage({ params })).rejects.toThrow("NOT_FOUND");
  });

  it("renders safely serialized ProfilePage JSON-LD for the visible author", async () => {
    const displayName = '</script><script>alert("name")</script>';
    const bio = "Bio <unsafe> & \u2028 \u2029";
    mocks.findUnique.mockResolvedValue({ ...author([publishedWork]), displayName, bio, handle: "имя ?#" });
    const html = renderToStaticMarkup(await AuthorPage({ params }));
    const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    expect(scripts).toHaveLength(1);
    expect(scripts[0][1]).not.toContain("<");
    expect(scripts[0][1]).not.toContain("</script>");
    const schema = JSON.parse(scripts[0][1]);
    const url = `https://neyroeros.com/authors/${encodeURIComponent("имя ?#")}`;
    expect(schema).toMatchObject({
      "@context": "https://schema.org", "@type": "ProfilePage", url, isFamilyFriendly: false,
      mainEntity: { "@type": "Person", "@id": `${url}#person`, name: displayName, url, description: bio },
    });
    expect(schema.mainEntity).not.toHaveProperty("sameAs");
    expect(schema.mainEntity).not.toHaveProperty("jobTitle");
  });

  it("does not emit an indexable profile schema for empty profiles", async () => {
    mocks.findUnique.mockResolvedValue(author());
    expect(renderToStaticMarkup(await AuthorPage({ params }))).not.toContain('type="application/ld+json"');
  });
});
