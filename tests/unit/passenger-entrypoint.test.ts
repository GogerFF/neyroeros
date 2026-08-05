import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Passenger entrypoint", () => {
  it("uses cPanel's dynamic PORT and starts Next in production mode", () => {
    const source = readFileSync(resolve("app.js"), "utf8");
    expect(source).toContain("process.env.PORT");
    expect(source).toContain("next({ dev: false");
    expect(source).toContain("createServer");
  });
});
