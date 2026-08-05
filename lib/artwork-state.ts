import type { ArtworkStatus } from "@prisma/client";
const transitions: Record<ArtworkStatus, ArtworkStatus[]> = {
  DRAFT:["PENDING","DELETED"], PENDING:["SCHEDULED","REJECTED"], APPROVED:["SCHEDULED"],
  REJECTED:["PENDING","DELETED"], SCHEDULED:["PUBLISHED","HIDDEN"], PUBLISHED:["HIDDEN"],
  HIDDEN:["PUBLISHED"], DELETED:[],
};
export function transitionArtwork(from: ArtworkStatus, to: ArtworkStatus) {
  if (!transitions[from].includes(to)) throw new Error(`Недопустимый переход: ${from} → ${to}`);
  return to;
}
export function canEditArtwork(work: {authorId:string; status:ArtworkStatus}, userId:string) {
  return work.authorId === userId && (["DRAFT","REJECTED"] as ArtworkStatus[]).includes(work.status);
}
