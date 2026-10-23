import { prunePageViews } from "@/lib/traffic";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Trims old analytics rows on a schedule instead of inside a visitor's request.
 *
 * This used to run on ~2% of page views: a DELETE that takes a write lock while
 * a user waits, at an unpredictable moment. A cron hit is the right place for it.
 *
 *   GET /api/cron/prune-analytics?secret=$CRON_SECRET
 */
export async function GET(request: Request) {
  const secret = new URL(request.url).searchParams.get("secret");
  const expected = process.env.CRON_SECRET;
  if (!expected || secret !== expected) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const removed = await prunePageViews();
  return Response.json({ ok: true, removed });
}