import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const authFormSource = readFileSync("src/components/AuthForm.tsx", "utf8");

test("login forgot password link stays in the password field action row", () => {
  assert.match(authFormSource, /auth-field-action-row/);
  assert.match(authFormSource, /auth-forgot-link/);
  assert.doesNotMatch(authFormSource, /<div className="flex justify-end">\s*<Link className="text-link text-xs" href="\/auth\/forgot-password">/);
});
