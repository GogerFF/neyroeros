import { auth } from "@/auth";
import { isTrustedOrigin } from "@/lib/request-origin";
import { recordPageView } from "@/lib/traffic";
import { isHtmlPagePath } from "@/lib/cache-policy";

export const dynamic = "force-dynamic";

/**
 * Records one pageview. The client sends only the path - everything else
 * (referrer, user agent, geo) is read from the request headers here, so a
 * tampered client cannot inflate or forge the panel's numbers.
 */
export async function POST(request: Request) {
  if (!isTrustedOrigin(request.headers, request.headers.get("origin"), request.url)) {
    return new Response(null, { status: 403 });
  }

  let path = "/";
  try {
    const body = await request.json();
    const raw = typeof body?.path === "string" ? body.path : "/";
    // Only real site pages count, and never the admin/cabinet internals.
    const clean = raw.split("?")[0].split("#")[0];
    path = clean.startsWith("/") && !clean.includes("..") && isHtmlPagePath(clean) ? clean : "/";
    if (path.startsWith("/admin") || path.startsWith("/dashboard")) path = "/";
  } catch {
    return new Response(null, { status: 400 });
  }

  const session = await auth();
  const { cookie } = await recordPageView({ request, path, userId: session?.user?.id });

  const res = new Response(null, { status: 204 });
  if (cookie) res.headers.append("Set-Cookie", cookie);
  return res;
}