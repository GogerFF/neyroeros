export function normalizeArtworkTags(input: string) {
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const raw of input.split(",")) {
    const tag = raw.trim().replace(/\s+/g, " ").slice(0, 64);
    const key = tag.toLocaleLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length === 10) break;
  }

  return tags;
}
