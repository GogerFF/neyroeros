import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { externalOrigin, isTrustedOrigin } from "@/lib/request-origin";

const h = (init: Record<string, string>) => new Headers(init);

describe("externalOrigin", () => {
  it("prefers the proxy-forwarded host over the internal one", () => {
    const headers = h({ host: "localhost:3000", "x-forwarded-host": "neyroeros.com", "x-forwarded-proto": "https" });
    expect(externalOrigin(headers)).toBe("https://neyroeros.com");
  });

  it("falls back to the Host header and assumes https", () => {
    expect(externalOrigin(h({ host: "neyroeros.com" }))).toBe("https://neyroeros.com");
  });

  it("takes the first entry of a comma-separated proxy chain", () => {
    const headers = h({ "x-forwarded-host": "neyroeros.com, internal", "x-forwarded-proto": "https, http" });
    expect(externalOrigin(headers)).toBe("https://neyroeros.com");
  });

  it("rejects hosts that could inject paths or credentials", () => {
    expect(externalOrigin(h({ host: "evil.com/path" }))).toBeNull();
    expect(externalOrigin(h({ host: "evil.com?x=1" }))).toBeNull();
    expect(externalOrigin(h({ host: "user@evil.com" }))).toBeNull();
    expect(externalOrigin(h({ host: "evil com" }))).toBeNull();
    expect(externalOrigin(h({}))).toBeNull();
    // CRLF can't even be constructed: the WHATWG Headers API throws on it,
    // so header injection via Host is closed by the platform itself.
    expect(() => h({ host: "a\r\nX-Injected: 1" })).toThrow();
  });
});

describe("isTrustedOrigin", () => {
  it("accepts the public origin behind Passenger (the production 403 bug)", () => {
    const headers = h({ host: "localhost:3000", "x-forwarded-host": "neyroeros.com", "x-forwarded-proto": "https" });
    expect(isTrustedOrigin(headers, "https://neyroeros.com", "http://localhost:3000/api/x")).toBe(true);
  });

  it("still accepts the origin the server sees directly (local dev / no proxy)", () => {
    const headers = h({ host: "127.0.0.1:8903" });
    expect(isTrustedOrigin(headers, "http://127.0.0.1:8903", "http://127.0.0.1:8903/api/x")).toBe(true);
  });

  it("rejects a genuine cross-site origin", () => {
    const headers = h({ host: "localhost:3000", "x-forwarded-host": "neyroeros.com", "x-forwarded-proto": "https" });
    expect(isTrustedOrigin(headers, "https://evil.example", "http://localhost:3000/api/x")).toBe(false);
  });

  it("rejects opaque and malformed origins", () => {
    const headers = h({ "x-forwarded-host": "neyroeros.com", "x-forwarded-proto": "https" });
    expect(isTrustedOrigin(headers, "null", "http://localhost:3000/api/x")).toBe(false);
    expect(isTrustedOrigin(headers, "not-a-url", "http://localhost:3000/api/x")).toBe(false);
  });

  it("allows a same-origin request that omits the Origin header", () => {
    expect(isTrustedOrigin(h({ host: "neyroeros.com" }), null, "http://localhost:3000/api/x")).toBe(true);
  });
});

describe("artwork view route", () => {
  const route = readFileSync("app/api/artworks/[id]/view/route.ts", "utf8");

  it("no longer compares the browser Origin against the internal request URL", () => {
    expect(route).not.toContain("new URL(request.url).origin");
    expect(route).toContain("isTrustedOrigin");
  });
});
