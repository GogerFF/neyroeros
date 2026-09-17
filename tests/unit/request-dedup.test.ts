import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

// Next calls the data loader twice per render — once in generateMetadata and again
// in the page component. Without React.cache() every detail page queries the DB
// twice with identical heavy includes.
const loaders: [string, string][] = [
  ["app/artwork/[slug]/page.tsx", "get"],
  ["app/authors/[handle]/page.tsx", "getAuthor"],
  ["app/videos/[slug]/page.tsx", "getVideo"],
  ["app/stories/[slug]/page.tsx", "getStory"],
];

describe("detail page loaders are request-deduplicated", () => {
  for (const [file, name] of loaders) {
    it(`${file} wraps ${name} in React cache()`, () => {
      const src = readFileSync(file, "utf8");
      expect(src).toMatch(/import \{[^}]*\bcache\b[^}]*\} from "react"/);
      expect(src).toMatch(new RegExp(`const ${name} = cache\\(`));
    });
  }
});
