import { describe, expect, it } from "vitest";
import { registerSchema } from "@/lib/validation/auth";

describe("registerSchema", () => {
  it("accepts a strong normalized email registration", () => {
    const result = registerSchema.parse({ email: " ART@Example.COM ", password: "Strong!123", displayName: "Арт" });
    expect(result.email).toBe("art@example.com");
  });
  it("rejects weak passwords", () => {
    expect(registerSchema.safeParse({ email: "a@b.ru", password: "password", displayName: "A" }).success).toBe(false);
  });
});
