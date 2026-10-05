-- Traffic analytics for the admin panel.
--
-- One row per pageview (visitor x path x day). No IP addresses and no raw user
-- agents are stored: the viewer is a rotating HMAC of a cookie, exactly like
-- ArtworkView, so the panel can count unique visitors and new-vs-returning
-- without holding personal data.
--
-- Written as hand-rolled SQL (no `migrate dev`, per project rules) and kept
-- additive + idempotent so it is safe to apply on the live SQLite database.

CREATE TABLE IF NOT EXISTS "PageView" (
    "id"          TEXT    NOT NULL PRIMARY KEY,
    "path"        TEXT    NOT NULL,
    "pathKind"    TEXT    NOT NULL,
    "viewerKey"   TEXT    NOT NULL,
    "channel"     TEXT    NOT NULL,
    "source"      TEXT    NOT NULL,
    "device"      TEXT    NOT NULL,
    "os"          TEXT    NOT NULL,
    "browser"     TEXT    NOT NULL,
    "country"     TEXT    NOT NULL DEFAULT '',
    "isBot"       INTEGER NOT NULL DEFAULT 0,
    "isNewViewer" INTEGER NOT NULL DEFAULT 0,
    "userId"      TEXT,
    "dayBucket"   TEXT    NOT NULL,
    "createdAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- The admin panel groups by day first and filters bots out of the headline numbers.
CREATE INDEX IF NOT EXISTS "PageView_dayBucket_createdAt_idx" ON "PageView"("dayBucket", "createdAt");
-- Unique-visitor counting scans the day range grouped by viewer, so viewerKey needs its own index.
CREATE INDEX IF NOT EXISTS "PageView_viewerKey_idx" ON "PageView"("viewerKey");
-- Source/channel breakdowns and "top paths" read by pathKind or channel over a date range.
CREATE INDEX IF NOT EXISTS "PageView_channel_dayBucket_idx" ON "PageView"("channel", "dayBucket");
CREATE INDEX IF NOT EXISTS "PageView_pathKind_dayBucket_idx" ON "PageView"("pathKind", "dayBucket");

-- Keep the table from growing without bound on shared hosting: raw rows are only
-- interesting for a rolling window, so anything older is dropped. Bots are the
-- bulk of the traffic and are dropped sooner.
CREATE INDEX IF NOT EXISTS "PageView_isBot_createdAt_idx" ON "PageView"("isBot", "createdAt");