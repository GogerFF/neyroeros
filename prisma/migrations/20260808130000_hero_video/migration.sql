CREATE TABLE "HeroVideo" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "mp4Key" TEXT NOT NULL,
  "webmKey" TEXT,
  "posterKey" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "durationSec" INTEGER NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "HeroVideo_mp4Key_key" ON "HeroVideo"("mp4Key");
CREATE UNIQUE INDEX "HeroVideo_webmKey_key" ON "HeroVideo"("webmKey");
CREATE UNIQUE INDEX "HeroVideo_posterKey_key" ON "HeroVideo"("posterKey");
CREATE INDEX "HeroVideo_status_sortOrder_idx" ON "HeroVideo"("status", "sortOrder");
