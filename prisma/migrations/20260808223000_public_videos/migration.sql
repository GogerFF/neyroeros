CREATE TABLE "Video" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "sourceLocale" TEXT NOT NULL DEFAULT 'ru',
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "categoryId" TEXT,
  "moderationNote" TEXT,
  "submittedAt" DATETIME,
  "approvedAt" DATETIME,
  "publishedAt" DATETIME,
  "hiddenAt" DATETIME,
  "deletedAt" DATETIME,
  "videoKey" TEXT NOT NULL,
  "posterKey" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "durationSec" INTEGER NOT NULL,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Video_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Video_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Video_slug_key" ON "Video"("slug");
CREATE UNIQUE INDEX "Video_videoKey_key" ON "Video"("videoKey");
CREATE UNIQUE INDEX "Video_posterKey_key" ON "Video"("posterKey");
CREATE INDEX "Video_status_publishedAt_idx" ON "Video"("status", "publishedAt");
CREATE INDEX "Video_authorId_createdAt_idx" ON "Video"("authorId", "createdAt");
CREATE INDEX "Video_categoryId_publishedAt_idx" ON "Video"("categoryId", "publishedAt");
CREATE TABLE "VideoLike" (
  "videoId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("videoId", "userId"),
  CONSTRAINT "VideoLike_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "VideoLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "VideoLike_videoId_idx" ON "VideoLike"("videoId");
CREATE TABLE "VideoComment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "videoId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "deletedAt" DATETIME,
  CONSTRAINT "VideoComment_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "VideoComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "VideoComment_videoId_createdAt_idx" ON "VideoComment"("videoId", "createdAt");
CREATE TABLE "VideoView" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "videoId" TEXT NOT NULL,
  "viewerKey" TEXT NOT NULL,
  "dayBucket" TEXT NOT NULL,
  "viewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VideoView_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "VideoView_videoId_viewerKey_dayBucket_key" ON "VideoView"("videoId", "viewerKey", "dayBucket");
CREATE INDEX "VideoView_videoId_viewedAt_idx" ON "VideoView"("videoId", "viewedAt");
