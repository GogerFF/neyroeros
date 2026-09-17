-- Hot-path indexes found by the performance audit.
--
-- ArtworkTag: the composite primary key (artworkId, tagId) cannot serve lookups by
-- tag alone, so tag pages and sitemap.xml filtered on tagId with a full scan.
-- Artwork: category listings filter by categoryId and sort by publishedAt, which
-- previously scanned the whole table.

CREATE INDEX "ArtworkTag_tagId_idx" ON "ArtworkTag"("tagId");
CREATE INDEX "Artwork_categoryId_status_publishedAt_idx" ON "Artwork"("categoryId", "status", "publishedAt");
