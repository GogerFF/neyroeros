import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("static information page localization", () => {
  it("localizes About and Rules through the active locale", () => {
    const about = readFileSync(resolve("app/about/page.tsx"), "utf8");
    const rules = readFileSync(resolve("app/rules/page.tsx"), "utf8");
    expect(about).toContain("getLocale");
    expect(rules).toContain("getLocale");
    expect(about).toContain("en:");
    expect(rules).toContain("zh:");
  });
});
