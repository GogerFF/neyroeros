import { describe, expect, it } from "vitest";
import { nextPublicationSlot } from "@/lib/publication/schedule";

describe("nextPublicationSlot", () => {
  it("spaces six daily publications four hours apart", () => {
    const now = new Date("2026-08-02T05:10:00.000Z");
    expect(nextPublicationSlot(now, [], 6).toISOString()).toBe("2026-08-02T08:00:00.000Z");
  });

  it("skips occupied publication slots", () => {
    const now = new Date("2026-08-02T05:10:00.000Z");
    const occupied = [new Date("2026-08-02T08:00:00.000Z")];
    expect(nextPublicationSlot(now, occupied, 6).toISOString()).toBe("2026-08-02T12:00:00.000Z");
  });
});
