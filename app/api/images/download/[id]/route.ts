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

  const filename = `${(a.title || "artwork").slice(0, 40).replace(/[^a-zA-Z0-9а-яА-ЯёЁ_-]/g, "_")}.webp`;

  return new Response(buffer, {
    headers: {
      "Content-Type": "image/webp",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
