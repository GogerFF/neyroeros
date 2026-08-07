import { db } from "@/lib/db";
import { auth } from "@/auth";
import { readStored } from "@/lib/storage/local-storage";
import sharp from "sharp";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await db.artwork.findUnique({ where: { id }, include: { asset: true } });
  if (!a?.asset || a.status !== "PUBLISHED") return new Response("Не найдено", { status: 404 });

  const buffer = await sharp(await readStored(a.asset.previewKey))
    .composite([{
      input: await createWatermarkSvg(),
      gravity: "south",
    }])
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

async function createWatermarkSvg() {
  const svg = `<svg width="900" height="80" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)"/>
    <text x="50%" y="58%" text-anchor="middle" font-family="Georgia,serif" font-size="28" fill="rgba(255,255,255,0.82)" font-style="italic">neyroeros.com</text>
  </svg>`;
  return Buffer.from(svg);
}
