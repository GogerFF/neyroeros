-- CreateTable
CREATE TABLE "ArtworkTranslation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "artworkId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ArtworkTranslation_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "Artwork" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Artwork" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sourceLocale" TEXT NOT NULL DEFAULT 'ru',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isNsfw" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" TEXT,
    "moderationNote" TEXT,
    "submittedAt" DATETIME,
    "approvedAt" DATETIME,
    "publishedAt" DATETIME,
    "hiddenAt" DATETIME,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Artwork_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Artwork_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Artwork" ("approvedAt", "authorId", "categoryId", "createdAt", "deletedAt", "description", "hiddenAt", "id", "isNsfw", "moderationNote", "publishedAt", "slug", "status", "submittedAt", "title", "updatedAt") SELECT "approvedAt", "authorId", "categoryId", "createdAt", "deletedAt", "description", "hiddenAt", "id", "isNsfw", "moderationNote", "publishedAt", "slug", "status", "submittedAt", "title", "updatedAt" FROM "Artwork";
DROP TABLE "Artwork";
ALTER TABLE "new_Artwork" RENAME TO "Artwork";
CREATE UNIQUE INDEX "Artwork_slug_key" ON "Artwork"("slug");
CREATE INDEX "Artwork_status_publishedAt_idx" ON "Artwork"("status", "publishedAt");
CREATE INDEX "Artwork_authorId_createdAt_idx" ON "Artwork"("authorId", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ArtworkTranslation_locale_idx" ON "ArtworkTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "ArtworkTranslation_artworkId_locale_key" ON "ArtworkTranslation"("artworkId", "locale");
