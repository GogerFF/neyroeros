import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("analytics hot path", () => {
  const traffic = read("lib/traffic.ts");

  it("не считает всю историю на каждый просмотр (регрессия производительности)", () => {
    // COUNT по viewerKey выполнялся на каждый pageview и рос вместе с таблицей.
    expect(traffic).not.toMatch(/pageView\.count\(\{\s*where:\s*\{\s*viewerKey/);
    expect(traffic).toContain("const isNewViewer = !existing");
  });

  it("признак нового посетителя берётся из cookie, а не из БД", () => {
    expect(traffic).toMatch(/isNewViewer,\s*\n\s*userId/);
  });
});

describe("image hot path", () => {
  const route = read("app/api/images/[variant]/[id]/route.ts");

  it("не резолвит сессию для опубликованных картинок", () => {
    // auth() стоял до проверки статуса и вызывался на каждый из десятков запросов.
    const authPos = route.indexOf("await auth()");
    const statusCheck = route.indexOf('a.status !== "PUBLISHED"');
    expect(statusCheck).toBeGreaterThan(-1);
    expect(authPos).toBeGreaterThan(statusCheck);
  });

  it("отдаёт immutable-кэш и поддерживает 304 по ETag", () => {
    expect(route).toContain("immutable");
    expect(route).toContain("if-none-match");
    expect(route).toContain("304");
  });
});

describe("фоновые задачи вне горячего пути", () => {
  it("prune не запускается из запроса посетителя", () => {
    const track = read("app/api/analytics/track/route.ts");
    expect(track).not.toContain("prunePageViews");
    expect(track).not.toContain("Math.random");
  });

  it("prune доступен отдельным cron-роутом под секретом", () => {
    const cron = read("app/api/cron/prune-analytics/route.ts");
    expect(cron).toContain("CRON_SECRET");
    expect(cron).toContain("prunePageViews");
  });
});

describe("SQLite настроен на параллельное чтение", () => {
  const dbFile = read("lib/db.ts");

  it("включает WAL, busy_timeout и synchronous через queryRaw", () => {
    expect(dbFile).toContain("PRAGMA journal_mode=WAL");
    expect(dbFile).toContain("PRAGMA busy_timeout=5000");
    expect(dbFile).toContain("PRAGMA synchronous=NORMAL");
  });

  it("использует $queryRawUnsafe, иначе SQLite отклоняет PRAGMA с результатом", () => {
    // $executeRawUnsafe падал: "Execute returned results, which is not allowed in SQLite".
    expect(dbFile).toContain("$queryRawUnsafe(sql)");
    expect(dbFile).not.toContain("$executeRawUnsafe(sql)");
  });
});

describe("rate limit не растёт бесконечно", () => {
  const rl = read("lib/rate-limit.ts");
  it("удаляет события старше суток", () => {
    expect(rl).toContain("rateLimitEvent.deleteMany");
    expect(rl).toContain("sweepOldEvents");
  });
});