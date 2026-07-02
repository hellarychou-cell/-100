import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const authFormSource = readFileSync("src/components/AuthForm.tsx", "utf8");

test("login forgot password link stays in the password field action row", () => {
  assert.match(authFormSource, /auth-field-action-row/);
  assert.match(authFormSource, /auth-forgot-link/);
  assert.doesNotMatch(authFormSource, /<div className="flex justify-end">\s*<Link className="text-link text-xs" href="\/auth\/forgot-password">/);
});

test("login uses email only and does not present old phone login", () => {
  assert.match(authFormSource, /label=\{isRegister \? "邮箱" : "邮箱"\}/);
  assert.doesNotMatch(authFormSource, /邮箱 \/ 老用户手机号/);
  assert.doesNotMatch(authFormSource, /buildPhoneAuthIdentity\(trimmedEmail\)\.authEmail/);
});

test("registration does not ask for a separate display name", () => {
  assert.doesNotMatch(authFormSource, /const \[displayName/);
  assert.doesNotMatch(authFormSource, /setDisplayName/);
  assert.doesNotMatch(authFormSource, /label="姓名 \/ 昵称"/);
  assert.doesNotMatch(authFormSource, /name="name"/);
  assert.doesNotMatch(authFormSource, /displayName: trimmedName/);
  assert.match(authFormSource, /请填写邮箱、手机号和密码。/);
});
