/**
 * Доклейка водяного знака на уже загруженные работы.
 * Запуск на сервере (cPanel Terminal, venv активен):
 *   node scripts/backfill-watermark.mjs [_LIMIT]
 * Перегенерирует preview.webp и thumb.webp из original.webp (как storeImage),
 * оригиналы не трогает. Идемпотентно: повторный запуск просто переклеймит.
 * Прогресс пишет в файл, чтобы продолжить после обрыва (LIMIT = докачка партиями).
 */
import { createHash } from "node:crypto";
import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";

const db = new PrismaClient();
const ROOT = process.cwd();
const safe = (key) => {
  const full = path.join(ROOT, "storage/uploads", key);
  if (!full.startsWith(path.join(ROOT, "storage/uploads"))) throw new Error("bad key");
  return full;
};

// копия watermarkSvg (lib/watermark.ts) — скрипт самодостаточен
function watermarkSvg(width, height) {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const fontSize = Math.min(34, Math.max(15, Math.round(w / 38)));
  const padX = Math.max(10, Math.round(w * 0.025));
  const padY = Math.max(8, Math.round(h * 0.02));
  const baseline = h - padY - Math.round(fontSize * 0.28);
  return Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <text x="${w - padX}" y="${baseline}" text-anchor="end" font-family="Georgia,serif" font-style="italic" font-size="${fontSize}" fill="rgba(255,255,255,0.5)">neyroeros.com</text>
</svg>`);
}

const LIMIT = Number(process.argv[2] || 0);
const PROGRESS = path.join(ROOT, "storage", "watermark-progress.txt");

const rows = await db.artwork.findMany({
  where: { deletedAt: null, asset: { isNot: null } },
  select: { id: true, asset: { select: { storageKey: true, previewKey: true, thumbnailKey: true, width: true, height: true } } },
  orderBy: { id: "asc" },
});
console.log("всего работ с активами:", rows.length);

const done = new Set();
try { for (const l of (await readFile(PROGRESS, "utf8")).split("\n")) if (l.trim()) done.add(l.trim()); } catch {}
console.log("уже обработано (по прогресс-файлу):", done.size);

let ok = 0, fail = 0, skipped = 0;
for (const r of rows) {
  if (done.has(r.id)) { skipped++; continue; }
  if (LIMIT && ok >= LIMIT) break;
  try {
    const orig = await readFile(safe(r.asset.storageKey));
    const rotated = sharp(orig).rotate();
    const meta = await rotated.metadata();
    const w = meta.width ?? r.asset.width ?? 832;
    const h = meta.height ?? r.asset.height ?? 1152;

    const pw = Math.min(1400, w);
    const ph = Math.round(pw * h / w);
    const preview = await rotated.clone().resize({ width: pw, withoutEnlargement: true })
      .composite([{ input: watermarkSvg(pw, ph) }])
      .webp({ quality: 82 }).toBuffer();

    const tw = Math.min(600, w);
    const th = Math.round(tw * h / w);
    const thumb = await rotated.clone().resize({ width: tw, withoutEnlargement: true })
      .composite([{ input: watermarkSvg(tw, th) }])
      .webp({ quality: 78 }).toBuffer();

    // rotate-совместимость с storeImage (EXIF): применяем .rotate() до ресайза
    await mkdir(path.dirname(safe(r.asset.previewKey)), { recursive: true });
    await writeFile(safe(r.asset.previewKey), preview);
    await writeFile(safe(r.asset.thumbnailKey), thumb);
    await readFile(safe(r.asset.previewKey)); // verify write

    await writeFile(PROGRESS, r.id + "\n", { flag: "a" });
    done.add(r.id);
    ok++;
    if (ok % 25 === 0) console.log(`progress: +${ok}`);
  } catch (e) {
    fail++;
    console.log("FAIL", r.id, String(e.message).slice(0, 120));
  }
}

console.log(`OK: ${ok} | пропущено (уже было): ${skipped} | ошибок: ${fail}`);
await db.$disconnect();
