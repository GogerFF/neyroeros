/**
 * Paths that must be refreshed when an artwork becomes public.
 *
 * Approving a work used to revalidate only /admin, so its own page could keep
 * serving a cached "not found" (the page renders that way while the work is still
 * a draft) and the feeds could keep a stale copy. Returns a de-duplicated list,
 * most specific first.
 */
export type ApprovableArtwork = { slug: string; category: { slug: string } | null };

export function approvalRevalidationPaths(artwork: ApprovableArtwork): string[] {
  const paths = [`/artwork/${artwork.slug}`];
  if (artwork.category?.slug) paths.push(`/categories/${artwork.category.slug}`);
  paths.push("/", "/top", "/trending", "/newcomers", "/discover", "/categories");
  return [...new Set(paths)];
}
