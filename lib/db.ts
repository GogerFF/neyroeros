import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const db = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

/**
 * SQLite defaults to `journal_mode=delete`, where every write takes an exclusive
 * lock that blocks all readers until it commits. This app writes on nearly every
 * page view (pageview analytics, artwork views, rate-limit events) while pages and
 * images read concurrently, so the default mode serializes the whole site behind
 * the writes. WAL lets readers proceed during a write.
 *
 * PRAGMA statements that return a row (journal_mode does) must go through
 * $queryRawUnsafe - $executeRawUnsafe rejects any statement that yields results,
 * which silently aborted the whole tuning chain before.
 *
 * Applied once per process. Failures are logged but never fatal: a locked or
 * read-only database must not stop the app from starting.
 */
const tuning = (async () => {
  const pragmas = [
    "PRAGMA journal_mode=WAL",
    "PRAGMA busy_timeout=5000",
    "PRAGMA synchronous=NORMAL",
  ];
  for (const sql of pragmas) {
    try {
      await db.$queryRawUnsafe(sql);
    } catch (error) {
      console.error(`[db] ${sql} failed:`, error instanceof Error ? error.message : error);
    }
  }
})();

/** Await before scripts that measure write throughput; request paths need not. */
export const dbReady = tuning;