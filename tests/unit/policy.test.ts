import { describe, expect, it } from "vitest";
import { validatePolicyAcknowledgement } from "@/lib/policy";

describe("content policy", () => {
  it("requires every safety acknowledgement", () => {
    expect(() => validatePolicyAcknowledgement({ adults:true, consensual:true, noDeepfake:false })).toThrow(/дипфейк/i);
  });
  it("allows content only after all acknowledgements", () => {
    expect(validatePolicyAcknowledgement({ adults:true, consensual:true, noDeepfake:true })).toBe(true);
  });
});
