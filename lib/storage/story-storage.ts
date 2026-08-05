import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

const root = path.resolve(process.env.STORAGE_ROOT || "storage/uploads");
function safe(key: string) {
  const target = path.resolve(root, key);
  if (!target.startsWith(root + path.sep)) throw new Error("Недопустимый путь");
  return target;
}

export async function storeStoryIllustration(data: Buffer) {
  if (data.length > 15 * 1024 * 1024) throw new Error("Иллюстрация больше 15 МБ");
  const meta = await sharp(data).metadata();
  if (!meta.width || !meta.height) throw new Error("Иллюстрация повреждена");
  const base = `stories/${new Date().getUTCFullYear()}/${randomUUID()}`;
  const storageKey = `${base}/original.webp`;
  const previewKey = `${base}/preview.webp`;
  await mkdir(path.dirname(safe(storageKey)), { recursive: true });
  await Promise.all([
    writeFile(safe(storageKey), await sharp(data).rotate().webp({ quality: 92 }).toBuffer()),
    writeFile(safe(previewKey), await sharp(data).rotate().resize({ width: 1400, withoutEnlargement: true }).webp({ quality: 84 }).toBuffer()),
  ]);
  return { storageKey, previewKey, width: meta.width, height: meta.height };
}

export const readStoryImage = (key: string) => readFile(safe(key));
