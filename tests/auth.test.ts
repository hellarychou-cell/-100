import assert from "node:assert/strict";
import test from "node:test";
import { buildPhoneAuthIdentity, validateLocalRegistrationIdentity } from "../src/lib/phone-auth.ts";

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

test("local fallback blocks registering a second email with the same phone", () => {
  assert.deepEqual(
    validateLocalRegistrationIdentity(
      { id: "local-1", phone: "13900009999", email: "old@example.com", displayName: "她", isMember: false },
      { phone: "13900009999", email: "new@example.com" },
    ),
    { ok: false, message: "这个手机号已经注册过了，请直接登录。" },
  );
});

test("local fallback blocks binding the same email to another phone", () => {
  assert.deepEqual(
    validateLocalRegistrationIdentity(
      { id: "local-1", phone: "13900009999", email: "user@example.com", displayName: "她", isMember: false },
      { phone: "13800008888", email: " USER@example.com " },
    ),
    { ok: false, message: "这个邮箱已经注册过了，请直接登录。" },
  );
});
