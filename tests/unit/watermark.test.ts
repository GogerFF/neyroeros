import { describe, expect, it } from "vitest";
import { watermarkSvg } from "@/lib/watermark";

describe("watermark svg", () => {
  it("canvas matches the target image size (sharp composite requirement)", () => {
    for (const [w, h] of [[832, 1152], [1400, 900], [600, 800], [100, 100]] as const) {
      const svg = watermarkSvg(w, h).toString();
      expect(svg).toContain(`width="${w}"`);
      expect(svg).toContain(`height="${h}"`);
    }
  });

  it("font size scales with width but stays clamped", () => {
    const small = watermarkSvg(300, 400).toString().match(/font-size="(\d+)"/)![1];
    const medium = watermarkSvg(832, 1152).toString().match(/font-size="(\d+)"/)![1];
    const big = watermarkSvg(1400, 900).toString().match(/font-size="(\d+)"/)![1];
    expect(Number(small)).toBeGreaterThanOrEqual(15);
    expect(Number(big)).toBeLessThanOrEqual(34);
    expect(Number(small)).toBeLessThan(Number(medium));
    expect(Number(medium)).toBeLessThanOrEqual(Number(big));
  });

  it("is anchored to the bottom-right with subtle opacity", () => {
    const svg = watermarkSvg(832, 1152).toString();
    expect(svg).toContain('text-anchor="end"');
    expect(svg).toContain("rgba(255,255,255,0.5)");
    expect(svg).toContain("neyroeros.com");
  });

  it("keeps the mark inside the canvas even for tiny images", () => {
    const svg = watermarkSvg(50, 50).toString();
    const x = Number(svg.match(/x="(\d+)"/)![1]);
    const y = Number(svg.match(/y="(\d+)"/)![1]);
    expect(x).toBeLessThanOrEqual(50);
    expect(y).toBeLessThanOrEqual(50);
    expect(y).toBeGreaterThan(0);
  });
});
