import { describe, expect, it } from "vitest";
import { changeEmailSchema, changePasswordSchema } from "@/lib/validation/account";

describe("account settings validation", () => {
  it("normalizes a new email and requires the current password", () => {
    expect(changeEmailSchema.parse({ email: " New@Example.COM ", currentPassword: "secret" })).toEqual({
      email: "new@example.com",
      currentPassword: "secret",
    });
  });

  it("rejects a password confirmation mismatch", () => {
    expect(changePasswordSchema.safeParse({
      currentPassword: "old-password",
      newPassword: "StrongPass1!",
      confirmPassword: "StrongPass2!",
    }).success).toBe(false);
  });

  it("accepts a strong matching password", () => {
    expect(changePasswordSchema.safeParse({
      currentPassword: "old-password",
      newPassword: "StrongPass1!",
      confirmPassword: "StrongPass1!",
    }).success).toBe(true);
  });
});
