const HOST_RE = /^[a-zA-Z0-9.\-]+(:\d{1,5})?$/;

/**
 * The origin the visitor actually sees. Behind a proxy (Passenger, nginx) the URL
 * Next.js reports is the INTERNAL listen address (http://localhost:3000), so any
 * comparison against `new URL(request.url).origin` fails for real browsers.
 */
export function externalOrigin(headers: Headers): string | null {
  const host = (headers.get("x-forwarded-host") ?? headers.get("host") ?? "").split(",")[0].trim();
  const proto = (headers.get("x-forwarded-proto") ?? "https").split(",")[0].trim();
  if (!host || !HOST_RE.test(host)) return null;
  return `${proto}://${host}`;
}

/**
 * CSRF-style check for POST handlers: the browser-supplied Origin must be either the
 * public origin (proxy headers) or the origin the server sees directly (dev / no proxy).
 * A missing Origin is allowed — same-origin fetches may omit it; opaque origins are not.
 */
export function isTrustedOrigin(headers: Headers, origin: string | null, internalUrl?: string): boolean {
  if (!origin) return true;
  if (origin === "null") return false;

  const external = externalOrigin(headers);
  if (external && origin === external) return true;

  if (internalUrl) {
    try {
      if (origin === new URL(internalUrl).origin) return true;
    } catch {
      return false;
    }
  }
  return false;
}
