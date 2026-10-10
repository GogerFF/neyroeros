import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { HomeAtmosphere } from "@/components/home-atmosphere";

vi.mock("next/link", () => ({ default: ({ children, ...props }: React.ComponentProps<"a">) => React.createElement("a", props, children) }));

describe("homepage editorial entrance", () => {
  it.each(["ru", "en", "zh"] as const)("renders accessible translated routes for %s", locale => {
    const html = renderToStaticMarkup(React.createElement(HomeAtmosphere, { locale }));
    expect(html).toContain('aria-labelledby="atmosphere-title"');
    expect(html.match(/aria-pressed=/g)).toHaveLength(3);
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(html).toContain('href="/universe"');
    expect(html).toContain('href="/flow?seed=atmosphere-velvet&amp;step=0"');
    expect(html).toContain('href="/trending"');
    expect(html).toContain('href="/about"');
    expect(html).toContain('aria-live="polite"');
    expect(html).not.toContain("undefined");
  });
});
