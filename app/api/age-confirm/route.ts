const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const HOST_RE = /^[a-zA-Z0-9.\-]+(:\d{1,5})?$/;

function externalOrigin(headers: Headers): string | null {
  const host = (headers.get("x-forwarded-host") ?? headers.get("host") ?? "").split(",")[0].trim();
  const proto = (headers.get("x-forwarded-proto") ?? "https").split(",")[0].trim();
  if (!host || !HOST_RE.test(host)) return null;
  return `${proto}://${host}`;
}

// POST /api/age-confirm — set the long-lived age cookie, then bounce the
// visitor back to where they were. Next.js in production rewrites Location
// headers to its own listen address (localhost behind Passenger), so instead
// of a 303 we return 200 + meta-refresh: the RELATIVE URL is resolved by the
// browser against the public origin — immune to any proxy header rewriting.
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const target = typeof form?.get("returnTo") === "string" ? String(form.get("returnTo")) : "/";
  const safeTarget = target.startsWith("/") && !target.startsWith("//") ? target : "/";
  const origin = externalOrigin(req.headers);
  const href = origin ? `${origin}${safeTarget}` : safeTarget;

  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=${escapeHtml(href)}">
<title>Подтверждение возраста…</title></head>
<body><noscript><a href="${escapeHtml(safeTarget)}">Продолжить</a></noscript></body></html>`;

  const res = new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
  const cookie = "age_confirmed=1; Path=/; Max-Age=31536000; SameSite=Lax";
  res.headers.append("set-cookie", cookie);
  return res;
}
