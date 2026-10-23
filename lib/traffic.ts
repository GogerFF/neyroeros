import { db } from "@/lib/db";
import { classifyBrowser, classifyDevice, classifyOs, classifyPath, classifyReferrer, countryFromHeaders, isBotUserAgent } from "@/lib/analytics";
import { dayBucket } from "@/lib/artwork-view";
import { isVerifiedBot } from "@/lib/cache-policy";
import { createHmac, randomUUID } from "node:crypto";

/** Raw pageview per visitor x path x day, so a refresh does not inflate counts. */
const ONE_YEAR = 60 * 60 * 24 * 365;
const ANALYTICS_COOKIE = "ne_analytics";

function viewerHash(value: string) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "neyroeros-view-token";
  return createHmac("sha256", secret).update(value).digest("hex");
}

/**
 * Record a pageview. Returns true when a row was written.
 *
 * Bots are recorded too but flagged, because "how many crawlers hit us" is a real
 * signal for an SEO-driven site - the panel just keeps them out of the human
 * headline numbers.
 */
export async function recordPageView({
  request,
  path,
  userId,
}: {
  request: Request;
  path: string;
  userId?: string;
}): Promise<{ recorded: boolean; cookie?: string }> {
  const ua = request.headers.get("user-agent") || "";
  const bot = isBotUserAgent(ua) || isVerifiedBot(ua);

  const cookieHeader = request.headers.get("cookie") || "";
  const existing = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ANALYTICS_COOKIE}=([^;]+)`))?.[1];
  const raw = userId ? `account:${userId}` : `guest:${existing || randomUUID()}`;

  const ref = classifyReferrer(request.headers.get("referer"));
  const device = classifyDevice(ua);

  // Whether a viewer is new is decided by the cookie, not by a COUNT over the
  // whole history: that COUNT ran on every single page view and grew linearly
  // with the table, which is exactly the kind of per-request work that made the
  // site feel slow.
  const isNewViewer = !existing;
  const viewerKey = viewerHash(raw);

  await db.pageView.create({
    data: {
      path: path.slice(0, 300),
      pathKind: classifyPath(path),
      viewerKey,
      channel: ref.channel,
      source: ref.source.slice(0, 120),
      device,
      os: classifyOs(ua),
      browser: classifyBrowser(ua),
      country: countryFromHeaders(request.headers),
      isBot: bot,
      isNewViewer,
      userId: userId ?? null,
      dayBucket: dayBucket(),
    },
  }).catch(() => undefined);

  const setCookie = !userId && !existing ? `${ANALYTICS_COOKIE}=${raw.slice(6)}; Path=/; Max-Age=${ONE_YEAR}; HttpOnly; Secure; SameSite=Lax` : undefined;
  return { recorded: true, cookie: setCookie };
}

const RANGES = { 7: 7, 30: 30, 90: 90 } as const;
export type RangeDays = keyof typeof RANGES;

function since(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}

/**
 * Everything the admin panel renders, in one pass over a date range.
 *
 * Bots are excluded from all human-facing numbers; the bot count is returned
 * separately instead of being silently dropped, so the totals add up honestly.
 */
export async function getTrafficStats(days: RangeDays = 30) {
  const from = since(RANGES[days]);
  const prevFrom = since(RANGES[days] * 2);
  const where = { dayBucket: { gte: from } };
  const human = { ...where, isBot: false };

  const [total, previousTotal, bots, rows, byKind, byChannel, bySource, byDevice, byOs, byBrowser, byCountry, topPaths] =
    await Promise.all([
      db.pageView.count({ where: human }),
      db.pageView.count({ where: { dayBucket: { gte: prevFrom, lt: from }, isBot: false } }),
      db.pageView.count({ where: { ...where, isBot: true } }),

      // Per-day series: raw rows are fetched once and bucketed in JS. On a day of
      // tens of thousands of views this stays one query instead of N.
      db.pageView.findMany({ where: human, select: { dayBucket: true, viewerKey: true, createdAt: true, isNewViewer: true } }),
      db.pageView.groupBy({ by: ["pathKind"], where: human, _count: { _all: true }, orderBy: { _count: { pathKind: "desc" } } }),
      db.pageView.groupBy({ by: ["channel"], where: human, _count: { _all: true }, orderBy: { _count: { channel: "desc" } } }),
      db.pageView.groupBy({ by: ["source"], where: human, _count: { _all: true }, orderBy: { _count: { source: "desc" } }, take: 12 }),
      db.pageView.groupBy({ by: ["device"], where: human, _count: { _all: true }, orderBy: { _count: { device: "desc" } } }),
      db.pageView.groupBy({ by: ["os"], where: human, _count: { _all: true }, orderBy: { _count: { os: "desc" } }, take: 6 }),
      db.pageView.groupBy({ by: ["browser"], where: human, _count: { _all: true }, orderBy: { _count: { browser: "desc" } }, take: 6 }),
      db.pageView.groupBy({ by: ["country"], where: { ...human, country: { not: "" } }, _count: { _all: true }, orderBy: { _count: { country: "desc" } }, take: 10 }),
      db.pageView.groupBy({ by: ["path"], where: human, _count: { _all: true }, orderBy: { _count: { path: "desc" } }, take: 15 }),
    ]);

  // New-vs-returning is counted in *visitors*, not views: a groupBy would report
  // view counts, which reads as "124 returning visitors" when it is really 124
  // views by returning visitors. Reduce the already-fetched rows instead.
  const newViewers = new Set<string>();
  const returningViewers = new Set<string>();
  for (const r of rows) (r.isNewViewer ? newViewers : returningViewers).add(r.viewerKey);

  // Unique visitors cannot be grouped by a Prisma groupBy key without pulling
  // every key into memory, so the per-day rows are reduced here.
  const unique = new Set(rows.map((r) => r.viewerKey));
  const daily = new Map<string, { views: number; uniques: Set<string> }>();
  for (const r of rows) {
    const b = daily.get(r.dayBucket) || { views: 0, uniques: new Set<string>() };
    b.views += 1;
    b.uniques.add(r.viewerKey);
    daily.set(r.dayBucket, b);
  }
  const series = [...daily.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, v]) => ({ day, views: v.views, uniques: v.uniques.size }));

  const map = <T extends Record<string, unknown>>(g: T[], key: keyof T) => g.map((r) => ({ label: String(r[key]), value: (r._count as { _all: number })._all }));

  // topPaths keeps the raw path: the panel links to it, so the label cannot be
  // reduced to the generic {label, value} shape the other breakdowns use.
  const paths = topPaths.map((r) => ({ path: String(r.path), value: (r._count as { _all: number })._all }));

  return {
    days,
    totalViews: total,
    previousViews: previousTotal,
    delta: previousTotal > 0 ? Math.round(((total - previousTotal) / previousTotal) * 100) : null,
    uniqueVisitors: unique.size,
    botViews: bots,
    newViewers: newViewers.size,
    returningViewers: returningViewers.size,
    series,
    byKind: map(byKind, "pathKind"),
    byChannel: map(byChannel, "channel"),
    bySource: map(bySource, "source"),
    byDevice: map(byDevice, "device"),
    byOs: map(byOs, "os"),
    byBrowser: map(byBrowser, "browser"),
    byCountry: map(byCountry, "country"),
    topPaths: paths,
  };
}

/**
 * Drop raw rows past the retention window. Bots go after 30 days, humans after 180,
 * so the table cannot grow without bound on shared hosting while keeping enough
 * history for a seasonal comparison.
 */
export async function prunePageViews() {
  const now = new Date();
  const humanCut = new Date(now.getTime() - 180 * 86400000);
  const botCut = new Date(now.getTime() - 30 * 86400000);
  const [humans, bots] = await Promise.all([
    db.pageView.deleteMany({ where: { isBot: false, createdAt: { lt: humanCut } } }),
    db.pageView.deleteMany({ where: { isBot: true, createdAt: { lt: botCut } } }),
  ]);
  return { humans: humans.count, bots: bots.count };
}