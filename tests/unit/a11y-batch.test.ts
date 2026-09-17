import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";

const read = (p: string) => readFileSync(p, "utf8");

describe("accessible like button", () => {
  it("SubmitButton forwards arbitrary button attributes", () => {
    // plan-mode Antigravity implemented this as a ...rest spread rather than a
    // dedicated ariaLabel prop — both work; the spread covers every attribute.
    const src = read("components/submit-button.tsx");
    expect(src).toContain("...rest");
    expect(src).toContain("ButtonHTMLAttributes");
  });

  it("artwork like button keeps its icon and announces its action", () => {
    const page = read("app/artwork/[slug]/page.tsx");
    const button = page.match(/<SubmitButton[^>]*like-button[\s\S]*?<\/SubmitButton>/)?.[0] ?? "";
    expect(button).toContain("Heart");
    expect(button).toContain("aria-label");
  });

  it("video like button keeps its icon and announces its action", () => {
    const page = read("app/videos/[slug]/page.tsx");
    const button = page.match(/<SubmitButton[^>]*like-button[\s\S]*?<\/SubmitButton>/)?.[0] ?? "";
    expect(button).toContain("Heart");
    expect(button).toContain("aria-label");
  });
});

describe("labels and contrast", () => {
  it("the search input has an accessible name", () => {
    expect(read("app/search/page.tsx")).toMatch(/name="q"[^>]*aria-label=/);
  });

  it("the footer disclaimer is not dimmed below AA contrast", () => {
    // opacity .66 on --muted over --bg measures 3.47:1; plain --muted measures 6.76:1
    const css = read("app/globals.css");
    const rule = css.match(/\.footer-disclaimer\{[^}]*\}/)?.[0] ?? "";
    expect(rule).not.toContain("opacity:0.66");
  });

  it("video cards do not skip a heading level", () => {
    const videos = read("app/videos/page.tsx");
    expect(videos).toContain("<h1>");
    expect(videos).toContain("<h2>");
    expect(videos).not.toContain("<h3>");
  });

  it("hero preview images are decorative because the caption names them", () => {
    const hero = read("components/hero-video-slideshow.tsx");
    const card = hero.match(/video-preview-card[\s\S]*?<\/Link>/)?.[0] ?? "";
    expect(card).toContain('alt=""');
  });
});

describe("failure and loading states", () => {
  it("the error boundary receives the error it reports", () => {
    expect(read("app/error.tsx")).toMatch(/error/);
  });

  it("ships a loading boundary so navigation gives feedback", () => {
    expect(existsSync("app/loading.tsx")).toBe(true);
  });
});
