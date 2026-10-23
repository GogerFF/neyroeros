import { db } from "@/lib/db";
import { readStored } from "@/lib/storage/local-storage";
import { auth } from "@/auth";
import sharp from "sharp";

/**
 * Image delivery is the hottest path on the site: a listing page references
 * dozens of these, and each one used to resolve the session and hit the database
 * before reading the file. Published images are public, so the expensive privacy
 * check is now only done when the artwork is NOT published.
 */
export async function GET(request: Request, { params }: RouteContext<"/api/images/[variant]/[id]">) {
  const { variant, id } = await params;
  const a = await db.artwork.findUnique({ where: { id }, include: { asset: true } });
  if (!a?.asset) return new Response("Не найдено", { status: 404 });

  // Only unpublished work needs a session lookup and an ownership/role check.
  if (a.status !== "PUBLISHED") {
    const s = await auth();
    const priv = s?.user.id === a.authorId || ["ADMIN", "MODERATOR"].includes(s?.user.role || "");
    if (!priv) return new Response("Не найдено", { status: 404 });
  }

  const key =
    variant === "original" ? a.asset.storageKey
    : variant === "preview" ? a.asset.previewKey
    : variant === "thumbnail" ? a.asset.thumbnailKey
    : variant === "og" ? a.asset.previewKey
    : null;
  if (!key) return new Response("Не найдено", { status: 404 });

  // Published images are immutable: the bytes are written once at upload and the
  // key never changes. Strong caching keeps them out of the request path entirely
  // on repeat views instead of re-reading from disk every time.
  const cacheControl = a.status === "PUBLISHED"
    ? "public, max-age=31536000, immutable"
    : "private, no-store";
  const headers = {
    "content-type": "image/webp",
    "cache-control": cacheControl,
    "x-content-type-options": "nosniff",
  };

  // Conditional request: an ETag on the asset identity means a browser that
  // already has this image gets a 304 with no body and no disk read.
  const etag = `"${a.asset.sha256.slice(0, 32)}-${variant}"`;
  if (a.status === "PUBLISHED" && request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: { ...headers, etag } });
  }

  if (variant === "og") {
    const buf = await readStored(key);
    const out = await sharp(buf, { limitInputPixels: false })
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 86 })
      .toBuffer();
    return new Response(out, { headers: { ...headers, etag } });
  }

  return new Response(await readStored(key), { headers: { ...headers, etag } });
}