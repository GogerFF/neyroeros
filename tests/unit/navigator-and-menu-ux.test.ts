import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (p: string) => readFileSync(p, "utf8");

describe("artwork navigator keyboard shortcuts", () => {
  it("ignores arrow keys while the user is typing in a form control", () => {
    // Regression: ← → inside a comment textarea used to trigger navigation
    // and silently discard the draft mid-sentence.
    const src = read("components/artwork-navigator.tsx");
    expect(src).toContain("isTypingTarget");
    expect(src).toMatch(/event\.key === "Arrow(Left|Right)"/);
    const handler = src.match(/const onKey = \(event: KeyboardEvent\) => \{[\s\S]*?\};/)?.[0] ?? "";
    expect(handler).toContain("isTypingTarget(event.target)");
    // The guard must run BEFORE any navigation, not after.
    const guardPos = handler.indexOf("isTypingTarget");
    const navPos = handler.indexOf("location.assign");
    expect(guardPos).toBeGreaterThan(-1);
    expect(navPos).toBeGreaterThan(guardPos);
  });

  it("treats contenteditable as a typing target too", () => {
    const src = read("components/artwork-navigator.tsx");
    expect(src).toContain("isContentEditable");
  });
});

describe("mobile drawer focus management", () => {
  it("moves focus into the drawer on open and back to the button on close", () => {
    const src = read("components/mobile-menu.tsx");
    expect(src).toMatch(/firstLinkRef\.current\?\.focus\(\)/);
    expect(src).toMatch(/buttonRef\.current\?\.focus\(\)/);
  });

  it("restores focus to the toggle button on Escape", () => {
    const src = read("components/mobile-menu.tsx");
    const esc = src.match(/const onKey[\s\S]*?removeEventListener[\s\S]*?;/)?.[0] ?? "";
    expect(esc).toContain("setOpen(false)");
    expect(esc).toContain("buttonRef.current?.focus()");
  });

  it("links the button to the drawer for assistive tech", () => {
    const src = read("components/mobile-menu.tsx");
    expect(src).toContain('aria-controls="mobile-drawer"');
    expect(src).toContain('id="mobile-drawer"');
    expect(src).toContain('containerRef.current?.querySelectorAll');
    expect(src).toContain('window.addEventListener("keydown", onKey, true)');
  });
});
