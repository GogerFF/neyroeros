import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("story reading layout", () => {
  const source = readFileSync(resolve("app/stories/[slug]/page.tsx"), "utf8");

  it("uses a dedicated header and reading layout", () => {
    expect(source).toContain('className="story-header"');
    expect(source).toContain('className="story-dek"');
    expect(source).toContain('className="story-content"');
  });

  it("places illustrations throughout the story instead of appending all at the end", () => {
    expect(source).toContain('const illustrationIndex');
    expect(source).toContain('story-illustration');
  });
});
