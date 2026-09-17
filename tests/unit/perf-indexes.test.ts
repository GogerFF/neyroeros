import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";

const schema = readFileSync("prisma/schema.prisma", "utf8");

describe("hot-path indexes", () => {
  it("indexes ArtworkTag by tagId (tag pages and sitemap filter on it)", () => {
    const model = schema.match(/model ArtworkTag \{[\s\S]*?\n\}/)?.[0] ?? "";
    expect(model).toContain("@@index([tagId])");
  });

  it("indexes Artwork by categoryId with the listing sort keys", () => {
    const model = schema.match(/model Artwork \{[\s\S]*?\n\}/)?.[0] ?? "";
    expect(model).toContain("@@index([categoryId, status, publishedAt])");
  });
});

describe("migration for the indexes", () => {
  const dir = "prisma/migrations/20260917000000_add_perf_indexes/migration.sql";

  it("ships a hand-written migration file", () => {
    expect(existsSync(dir)).toBe(true);
  });

  it("creates both indexes with Prisma's naming convention", () => {
    const sql = readFileSync(dir, "utf8");
    expect(sql).toContain('CREATE INDEX "ArtworkTag_tagId_idx" ON "ArtworkTag"("tagId")');
    expect(sql).toContain('CREATE INDEX "Artwork_categoryId_status_publishedAt_idx" ON "Artwork"("categoryId", "status", "publishedAt")');
  });
});
