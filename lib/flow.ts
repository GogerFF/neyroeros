/** Public visibility shared by discovery queries; never include soft-deleted works. */
export const discoveryPublished = { status: "PUBLISHED" as const, deletedAt: null };

export function normalizeFlowQuery(query: Record<string, string | string[] | undefined>) {
  const seed = typeof query.seed === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(query.seed) ? query.seed : "neyroeros";
  const raw = typeof query.step === "string" && /^\d{1,9}$/.test(query.step) ? Number(query.step) : 0;
  return { seed, step: raw };
}

function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Sorting by a seed + immutable id is independent of database response order. */
export function flowOrder<T extends { id: string }>(items: T[], seed: string): T[] {
  return [...items].sort((a, b) => hash(`${seed}:${a.id}`) - hash(`${seed}:${b.id}`) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export function flowHref(seed: string, step: number) {
  return `/flow?${new URLSearchParams({ seed, step: String(Math.max(0, Math.floor(step))) })}`;
}
