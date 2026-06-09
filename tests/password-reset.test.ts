import assert from "node:assert/strict";
import test from "node:test";

import { canResetPassword, normalizeEmail } from "../src/lib/password-reset.ts";

test("normalizes recovery email before matching", () => {
  assert.equal(normalizeEmail("  User@Example.COM "), "user@example.com");
});

test("allows reset only when email and phone both match", () => {
  assert.equal(
    canResetPassword({
      inputEmail: "user@example.com",
      inputPhone: "13800009999",
      storedEmail: "user@example.com",
      storedPhone: "13800009999",
    }),
    true,
  );

  assert.equal(
    canResetPassword({
      inputEmail: "user@example.com",
      inputPhone: "13800009998",
      storedEmail: "user@example.com",
      storedPhone: "13800009999",
    }),
    false,
  );
});
