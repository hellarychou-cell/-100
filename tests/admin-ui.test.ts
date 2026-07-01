import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const adminPageSource = readFileSync(new URL("../src/app/admin/page.tsx", import.meta.url), "utf8");
const adminDeleteRouteSource = readFileSync(new URL("../src/app/api/admin/users/[userId]/delete/route.ts", import.meta.url), "utf8");
const adminUsersRouteSource = readFileSync(new URL("../src/app/api/admin/users/route.ts", import.meta.url), "utf8");
const adminSupabaseSource = readFileSync(new URL("../src/lib/admin-supabase.ts", import.meta.url), "utf8");

test("admin user list has search and a scrollable overview", () => {
  assert.match(adminPageSource, /placeholder="搜索姓名、手机号、测评状态或 Day"/);
  assert.match(adminPageSource, /admin-user-list/);
  assert.match(adminPageSource, /admin-user-list__scroll/);
  assert.doesNotMatch(adminPageSource, /admin-user-rail/);
});

test("admin overview rows expand into one operation card", () => {
  assert.match(adminPageSource, /selectedUserId/);
  assert.match(adminPageSource, /setSelectedUserId/);
  assert.match(adminPageSource, /AdminUserActionCard/);
});

test("admin report action links to the selected user's assessment report", () => {
  assert.match(adminPageSource, /href=\{`\/admin\/users\/\$\{user\.id\}`\}/);
  assert.match(adminPageSource, /查看测评报告/);
});

test("admin actions surface failed API messages", () => {
  assert.match(adminPageSource, /actionError/);
  assert.match(adminPageSource, /throw new Error\(data\.error/);
  assert.match(adminPageSource, /admin-action-error/);
});

test("admin page removes fake content management shortcuts", () => {
  assert.doesNotMatch(adminPageSource, /<ContentLink/);
  assert.doesNotMatch(adminPageSource, /function ContentLink/);
  assert.doesNotMatch(adminPageSource, /Day 内容/);
  assert.doesNotMatch(adminPageSource, /测评题库/);
  assert.doesNotMatch(adminPageSource, /神秘卡/);
});

test("admin APIs explain missing local Supabase service configuration", () => {
  const combined = `${adminUsersRouteSource}\n${adminDeleteRouteSource}`;

  assert.match(combined, /createAdminSupabaseClient/);
  assert.match(adminSupabaseSource, /ADMIN_SUPABASE_CONFIG_ERROR/);
  assert.match(adminSupabaseSource, /本地预览/);
  assert.match(adminSupabaseSource, /\.env\.local/);
  assert.doesNotMatch(combined, /Server misconfigured/);
});
