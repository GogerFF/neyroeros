-- Add public aggregate counter; detailed entries are deduplicated per visitor and UTC day.
ALTER TABLE "Artwork" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "ArtworkView" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "artworkId" TEXT NOT NULL,
  "viewerKey" TEXT NOT NULL,
  "dayBucket" TEXT NOT NULL,
  "viewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ArtworkView_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "Artwork" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ArtworkView_artworkId_viewerKey_dayBucket_key" ON "ArtworkView"("artworkId", "viewerKey", "dayBucket");
CREATE INDEX "ArtworkView_artworkId_viewedAt_idx" ON "ArtworkView"("artworkId", "viewedAt");
