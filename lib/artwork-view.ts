export function dayBucket(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function shouldCountArtworkView({ viewerId, authorId }: { viewerId?: string; authorId: string }) {
  return !viewerId || viewerId !== authorId;
}
