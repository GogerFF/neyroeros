import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const origin = readFileSync("lib/request-origin.ts", "utf8");

const guarded = [
  "app/api/account/profile/route.ts",
  "app/api/artworks/create/route.ts",
  "app/api/artworks/manage/route.ts",
  "app/api/stories/create/route.ts",
  "app/api/stories/comment/route.ts",
  "app/api/stories/like/route.ts",
  "app/api/stories/manage/route.ts",
  "app/api/videos/create/route.ts",
  "app/api/videos/comment/route.ts",
  "app/api/videos/like/route.ts",
  "app/api/videos/manage/route.ts",
  "app/api/admin/moderate/route.ts",
  "app/api/admin/videos/moderate/route.ts",
  "app/api/admin/hero/manage/route.ts",
  "app/api/admin/category-video/route.ts",
];

describe("origin guard helper", () => {
  it("exposes a guard that returns a 403 response or null", () => {
    expect(origin).toContain("requireTrustedOrigin");
    expect(origin).toContain("status: 403");
  });
});

describe("state-changing handlers reject cross-site posts", () => {
  for (const file of guarded) {
    it(`${file} guards its POST`, () => {
      const src = readFileSync(file, "utf8");
      expect(src).toContain("requireTrustedOrigin");
    });
  }

  it("leaves the age gate and the cron endpoint alone", () => {
    // age-confirm must never 403 a first-time visitor; cron authenticates by token
    expect(readFileSync("app/api/age-confirm/route.ts", "utf8")).not.toContain("requireTrustedOrigin");
    expect(readFileSync("app/api/cron/publish/route.ts", "utf8")).not.toContain("requireTrustedOrigin");
  });
});

describe("view counters resist inflation", () => {
  for (const file of ["app/api/artworks/[id]/view/route.ts", "app/api/videos/[id]/view/route.ts"]) {
    it(`${file} rate-limits by client address`, () => {
      const src = readFileSync(file, "utf8");
      expect(src).toContain("enforceRateLimit");
      expect(src).toContain("x-forwarded-for");
    });
  }
});
