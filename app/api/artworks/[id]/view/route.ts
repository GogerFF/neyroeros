import { createHmac, randomUUID } from "node:crypto";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { dayBucket, shouldCountArtworkView } from "@/lib/artwork-view";
import { isTrustedOrigin } from "@/lib/request-origin";

const COOKIE = "ne_viewer";
const ONE_YEAR = 60 * 60 * 24 * 365;

function viewerHash(value: string) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "neyroeros-view-token";
  return createHmac("sha256", secret).update(value).digest("hex");
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Behind Passenger `request.url` is the internal listen address, so compare the
  // browser Origin against the PROXY-reported public origin instead.
  if (!isTrustedOrigin(request.headers, request.headers.get("origin"), request.url)) {
    return new Response(null, { status: 403 });
  }

  const { id } = await params;
  const [session, artwork] = await Promise.all([
    auth(),
    db.artwork.findFirst({ where: { id, status: "PUBLISHED", deletedAt: null }, select: { id: true, authorId: true } }),
  ]);
  if (!artwork || !shouldCountArtworkView({ viewerId: session?.user?.id, authorId: artwork.authorId })) return new Response(null, { status: 204 });

  const cookieHeader = request.headers.get("cookie") || "";
  const existingToken = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`))?.[1];
  const rawToken = session?.user?.id ? `account:${session.user.id}` : `guest:${existingToken || randomUUID()}`;
  const viewerKey = viewerHash(rawToken);

  let created = false;
  try {
    await db.$transaction(async (tx) => {
      await tx.artworkView.create({ data: { artworkId: artwork.id, viewerKey, dayBucket: dayBucket() } });
      await tx.artwork.update({ where: { id: artwork.id }, data: { viewCount: { increment: 1 } } });
      created = true;
    });
  } catch (error) {
    if (!(typeof error === "object" && error && "code" in error && error.code === "P2002")) throw error;
  }

  const response = new Response(null, { status: created ? 201 : 204 });
  if (!session?.user?.id && !existingToken) {
    response.headers.append("Set-Cookie", `${COOKIE}=${rawToken.slice(6)}; Path=/; Max-Age=${ONE_YEAR}; HttpOnly; Secure; SameSite=Lax`);
  }
  return response;
}
