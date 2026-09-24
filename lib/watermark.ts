/**
 * Subtle corner watermark: "neyroeros.com" in the bottom-right, scaled to the
 * image so it stays legible on a 600px thumb and unobtrusive on a 1400px preview.
 *
 * The returned SVG canvas matches the target image size, so sharp's composite
 * never fails with "must have same dimensions or smaller" (the old download
 * route used a fixed 900px plate and 500-ed on 832px previews).
 */
export function watermarkSvg(width: number, height: number): Buffer {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  // ~2.6% of width keeps it small; clamp so it neither vanishes nor dominates.
  const fontSize = Math.min(34, Math.max(15, Math.round(w / 38)));
  const padX = Math.max(10, Math.round(w * 0.025));
  const padY = Math.max(8, Math.round(h * 0.02));
  const baseline = h - padY - Math.round(fontSize * 0.28);
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <text x="${w - padX}" y="${baseline}" text-anchor="end" font-family="Georgia,serif" font-style="italic" font-size="${fontSize}" fill="rgba(255,255,255,0.5)">neyroeros.com</text>
</svg>`;
  return Buffer.from(svg);
}
