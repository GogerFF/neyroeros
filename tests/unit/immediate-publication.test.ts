import { describe, expect, it } from "vitest";
import { publishImmediately } from "@/lib/services/publication-service";

describe("publishImmediately", () => {
  it("is exported for moderation to publish approved work without a queue delay", () => {
    expect(typeof publishImmediately).toBe("function");
  });
});
