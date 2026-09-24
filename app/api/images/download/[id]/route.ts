import { db } from "@/lib/db";
import { readStored } from "@/lib/storage/local-storage";
import { watermarkSvg } from "@/lib/watermark";
import sharp from "sharp";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await db.artwork.findUnique({ where: { id }, include: { asset: true } });
  if (!a?.asset || a.status !== "PUBLISHED") return new Response("Не найдено", { status: 404 });

  // The old fixed 900px watermark plate crashed sharp on narrower previews
  // ("composite must have same dimensions or smaller") and the route 500-ed.
  // The SVG canvas now matches the source image exactly.
  const source = await readStored(a.asset.previewKey);
  const meta = await sharp(source).metadata();
  const width = meta.width ?? 1400;
  const height = meta.height ?? Math.round((width * 3) / 2);

  const buffer = await sharp(source)
    .composite([{ input: watermarkSvg(width, height) }])
    .webp({ quality: 90 })
    .toBuffer();

  // HTTP headers are ByteStrings (latin1) — Cyrillic in `filename` throws
  // "Cannot convert argument to a ByteString" and 500s the route.
  // ASCII-safe transliteration for filename, RFC 5987 filename* for the real name.
  const MAP: Record<string, string> = { а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya" };
  const asciiName = (a.title || "artwork").slice(0, 40)
    .replace(/[а-яё]/g, (c) => MAP[c] ?? c)
    .replace(/[А-ЯЁ]/g, (c) => (MAP[c.toLowerCase()] ?? c).toUpperCase())
    .replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `${asciiName || "artwork"}.webp`;
  const filenameUtf8 = encodeURIComponent(`${(a.title || "artwork").slice(0, 40).replace(/["\\]/g, "_")}.webp`);

  return new Response(buffer, {
    headers: {
      "Content-Type": "image/webp",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${filenameUtf8}`,
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
