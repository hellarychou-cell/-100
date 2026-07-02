import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const authFormSource = readFileSync("src/components/AuthForm.tsx", "utf8");
const authGateSource = readFileSync("src/components/AuthGate.tsx", "utf8");
const resolveLoginRouteSource = readFileSync("src/app/api/auth/resolve-login/route.ts", "utf8");

test("login forgot password link stays in the password field action row", () => {
  assert.match(authFormSource, /auth-field-action-row/);
  assert.match(authFormSource, /auth-forgot-link/);
  assert.doesNotMatch(authFormSource, /<div className="flex justify-end">\s*<Link className="text-link text-xs" href="\/auth\/forgot-password">/);
});

test("login accepts either phone or email without showing the registration phone field", () => {
  assert.match(authFormSource, /label=\{isRegister \? "邮箱" : "手机号 \/ 邮箱"\}/);
  assert.match(authFormSource, /resolve-login/);
  assert.match(authFormSource, /请输入手机号或注册邮箱/);
  assert.doesNotMatch(authFormSource, /邮箱 \/ 老用户手机号/);
  assert.doesNotMatch(authFormSource, /buildPhoneAuthIdentity\(trimmedEmail\)\.authEmail/);
});

test("phone login route signs in server-side without returning the bound email", () => {
  assert.match(resolveLoginRouteSource, /signInWithPassword/);
  assert.match(authFormSource, /setSession/);
  assert.doesNotMatch(resolveLoginRouteSource, /NextResponse\.json\(\{ email: result\.email \}\)/);
});

test("registration does not ask for a separate display name", () => {
  assert.doesNotMatch(authFormSource, /const \[displayName/);
  assert.doesNotMatch(authFormSource, /setDisplayName/);
  assert.doesNotMatch(authFormSource, /label="姓名 \/ 昵称"/);
  assert.doesNotMatch(authFormSource, /name="name"/);
  assert.doesNotMatch(authFormSource, /displayName: trimmedName/);
  assert.match(authFormSource, /请填写邮箱、手机号和密码。/);
});

test("supabase auth writes a local shadow user so WeChat session hiccups do not look like logout", () => {
  assert.match(authFormSource, /setLocalUser\(/);
  assert.match(authFormSource, /resolvedData\.session\.user/);
  assert.match(authGateSource, /fallbackLocalUser/);
  assert.doesNotMatch(authGateSource, /if \(!user\) \{\s*if \(!cancelled\) setState\(\{ status: "signed-out" \}\);\s*return;\s*\}/);
});
