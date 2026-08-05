import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("story creation action on Passenger", () => {
  it("revalidates instead of redirecting through localhost", () => {
    const source = readFileSync(resolve("app/actions.ts"), "utf8");
    const action = source.match(/export async function createStoryAction[\s\S]*?(?=export async function uploadAction)/)?.[0] ?? "";
    expect(action).toContain('revalidatePath("/dashboard")');
    expect(action).not.toContain('redirect("/dashboard")');
  });
});
