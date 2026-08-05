import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("story publishing workflow", () => {
  const source = readFileSync(resolve("app/actions.ts"), "utf8");

  it("has an action that turns a draft story into a published story for an admin", () => {
    expect(source).toContain('export async function storyAction');
    expect(source).toContain('status:"PUBLISHED"');
    expect(source).toContain('publishedAt:new Date()');
  });

  it("does not redirect Story actions through localhost Passenger", () => {
    const action = source.match(/export async function storyAction[\s\S]*?(?=export async function uploadAction)/)?.[0] ?? "";
    expect(action).toContain('revalidatePath("/dashboard")');
    expect(action).not.toContain('redirect("/dashboard")');
  });
});
