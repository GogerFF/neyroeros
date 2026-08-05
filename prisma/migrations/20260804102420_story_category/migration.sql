/*
  Warnings:

  - You are about to drop the column `coverKey` on the `Story` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Story" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT,
    "sourceLocale" TEXT NOT NULL DEFAULT 'ru',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" DATETIME,
    "approvedAt" DATETIME,
    "submittedAt" DATETIME,
    "hiddenAt" DATETIME,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Story_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Story_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Story" ("approvedAt", "authorId", "body", "createdAt", "deletedAt", "description", "hiddenAt", "id", "publishedAt", "slug", "sourceLocale", "status", "submittedAt", "title", "updatedAt") SELECT "approvedAt", "authorId", "body", "createdAt", "deletedAt", "description", "hiddenAt", "id", "publishedAt", "slug", "sourceLocale", "status", "submittedAt", "title", "updatedAt" FROM "Story";
DROP TABLE "Story";
ALTER TABLE "new_Story" RENAME TO "Story";
CREATE UNIQUE INDEX "Story_slug_key" ON "Story"("slug");
CREATE INDEX "Story_status_publishedAt_idx" ON "Story"("status", "publishedAt");
CREATE INDEX "Story_authorId_createdAt_idx" ON "Story"("authorId", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
