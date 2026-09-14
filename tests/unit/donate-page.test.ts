import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const donatePage = readFileSync("app/donate/page.tsx", "utf8");
const layout = readFileSync("app/layout.tsx", "utf8");
const header = readFileSync("components/header.tsx", "utf8");
const i18n = readFileSync("lib/i18n.ts", "utf8");

describe("donate page", () => {
  it("shows the USDT wallet with the warning", () => {
    expect(donatePage).toContain("0x2E3ad5715c1c072C4c769a4bcbc6F806FaD0bb39");
    expect(donatePage).toContain("Tether USD");
    expect(donatePage).toContain("безвозвратно");
  });

  it("wallet address is immutable per i18n (not translatable)", () => {
    expect(donatePage.match(/0x[a-fA-F0-9]{40}/)?.[0]).toBe("0x2E3ad5715c1c072C4c769a4bcbc6F806FaD0bb39");
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
