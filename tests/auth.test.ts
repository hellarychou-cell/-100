import assert from "node:assert/strict";
import test from "node:test";
import { buildPhoneAuthIdentity } from "../src/lib/phone-auth.ts";

test("builds a stable internal email from a Chinese phone number", () => {
  assert.deepEqual(buildPhoneAuthIdentity("139 0000 9999"), {
    authEmail: "phone-8613900009999@example.com",
    storedPhone: "13900009999",
  });
});

test("normalizes +86 phone input to the same internal email", () => {
  assert.deepEqual(buildPhoneAuthIdentity("+86 139-0000-9999"), {
    authEmail: "phone-8613900009999@example.com",
    storedPhone: "13900009999",
  });
});

test("rejects empty phone input before auth submission", () => {
  assert.throws(() => buildPhoneAuthIdentity("   "), /手机号/);
});
