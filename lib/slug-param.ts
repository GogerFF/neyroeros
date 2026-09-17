/**
 * Dynamic route segments are not guaranteed to arrive URI-decoded: behind some
 * proxies/servers a non-ASCII slug reaches the page as "%D1%86..." while the
 * database stores the plain text, so a single `findUnique({ slug })` misses and
 * the page 404s (production bug: every Cyrillic tag in sitemap.xml was dead).
 * Callers try each candidate in order: raw first (correct when already decoded),
 * then the decoded form.
 */
export function slugCandidates(raw: string): string[] {
  const candidates = [raw];
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded !== raw) candidates.push(decoded);
  } catch {
    // malformed percent sequence — keep the raw value only
  }
  return candidates;
}

/** Looks up the first candidate that resolves, returning null when none do. */
export async function firstMatch<T>(candidates: string[], lookup: (slug: string) => Promise<T | null>): Promise<T | null> {
  for (const slug of candidates) {
    const found = await lookup(slug);
    if (found) return found;
  }
  return null;
}
