import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { DONATE_WALLET, DONATE_TEXT } from "@/lib/donate";

const donatePage = readFileSync("app/donate/page.tsx", "utf8");
const layout = readFileSync("app/layout.tsx", "utf8");
const header = readFileSync("components/header.tsx", "utf8");
const i18n = readFileSync("lib/i18n.ts", "utf8");

// Next.js App Router only allows a fixed set of exports from page files.
// Exporting anything else breaks the generated route type validator during
// `next build` (but NOT during a plain `tsc --noEmit`, which reuses stale .next/types).
const ALLOWED_PAGE_EXPORTS = new Set(["default", "metadata", "generateMetadata", "viewport", "generateViewport", "dynamic", "dynamicParams", "revalidate", "fetchCache", "runtime", "preferredRegion", "maxDuration", "config", "generateStaticParams", "unstable_instant", "experimental_ppr", "sitemap", "robots"]);

describe("donate page", () => {
  it("shows the USDT wallet with the warning", () => {
    expect(donatePage).toContain("DONATE_WALLET");
    expect(DONATE_WALLET).toBe("0x2E3ad5715c1c072C4c769a4bcbc6F806FaD0bb39");
    expect(DONATE_TEXT.ru.warning).toContain("Tether USD");
    expect(DONATE_TEXT.ru.warning).toContain("безвозвратно");
  });

  it("keeps the wallet in a module, not as a page export", () => {
    const exports = [...donatePage.matchAll(/export\s+(?:async\s+)?(?:const|function|let|var)\s+(\w+)/g)].map(m => m[1]);
    const illegal = exports.filter(name => !ALLOWED_PAGE_EXPORTS.has(name));
    expect(illegal).toEqual([]);
  });

  it("every locale carries the full donation copy", () => {
    for (const locale of ["ru", "en", "zh"] as const) {
      expect(DONATE_TEXT[locale].warning.length).toBeGreaterThan(20);
      expect(DONATE_TEXT[locale].tokenValue).toContain("USDT");
    }
  });

  it("linked from footer and mobile drawer", () => {
    expect(layout).toContain("/donate");
    expect(header).toContain("/donate");
    expect(i18n.match(/donate:"/g)?.length).toBe(3);
  });

  it("metadata + canonical", () => {
    expect(donatePage).toContain("generateMetadata");
    expect(donatePage).toContain('canonical: "/donate"');
  });
});
