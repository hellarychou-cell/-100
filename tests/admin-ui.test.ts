import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const adminPageSource = readFileSync(new URL("../src/app/admin/page.tsx", import.meta.url), "utf8");
const adminDeleteRouteSource = readFileSync(new URL("../src/app/api/admin/users/[userId]/delete/route.ts", import.meta.url), "utf8");
const adminUsersRouteSource = readFileSync(new URL("../src/app/api/admin/users/route.ts", import.meta.url), "utf8");
const adminSupabaseSource = readFileSync(new URL("../src/lib/admin-supabase.ts", import.meta.url), "utf8");
const adminPauseRouteSource = readFileSync(new URL("../src/app/api/admin/users/[userId]/pause/route.ts", import.meta.url), "utf8");

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

test("admin can open the user's pre-assessment profile details", () => {
  assert.match(adminUsersRouteSource, /age, identity, current_issue, ideal_state/);
  assert.match(adminPageSource, /profileDetails/);
  assert.match(adminPageSource, /查看测评前页/);
  assert.match(adminPageSource, /测评前页内容/);
  for (const label of ["年龄", "身份/行业", "当下最想解决的问题", "理想状态"]) {
    assert.match(adminPageSource, new RegExp(label));
  }
});

test("admin actions surface failed API messages", () => {
  assert.match(adminPageSource, /actionError/);
  assert.match(adminPageSource, /throw new Error\(data\.error/);
  assert.match(adminPageSource, /admin-action-error/);
});

test("admin membership action is a 100-day buyout instead of 30-day adjustments", () => {
  assert.match(adminPageSource, /开通100天/);
  assert.match(adminPageSource, /\/api\/admin\/users\/\$\{userId\}\/activate/);
  assert.doesNotMatch(adminPageSource, /\+30天/);
  assert.doesNotMatch(adminPageSource, /-30天/);
  assert.doesNotMatch(adminPageSource, /\/extend/);
  assert.doesNotMatch(adminPageSource, /\/reduce/);
});

test("pausing AI does not create a 30-day membership record", () => {
  assert.match(adminPauseRouteSource, /请先开通100天/);
  assert.doesNotMatch(adminPauseRouteSource, /30 \* 86400000/);
  assert.doesNotMatch(adminPauseRouteSource, /\.insert\(/);
});

test("admin delete opens local confirmation before any API request", () => {
  const requestDeleteIndex = adminPageSource.indexOf("function requestDelete");
  const handleDeleteIndex = adminPageSource.indexOf("async function handleDelete");

  assert.ok(requestDeleteIndex > -1, "delete confirmation should have a local requestDelete handler");
  assert.ok(handleDeleteIndex > -1, "admin page should keep the actual async delete handler");
  assert.ok(requestDeleteIndex < handleDeleteIndex, "confirmation should be opened before the async delete path");
  assert.match(adminPageSource, /setDeleteConfirm\(userId\)/);
  assert.match(adminPageSource, /event\.stopPropagation\(\)/);
  assert.match(adminPageSource, /admin-delete-confirm/);
  const requestDeleteSource = adminPageSource.slice(
    requestDeleteIndex,
    adminPageSource.indexOf("async function handleActivate", requestDeleteIndex),
  );
  assert.doesNotMatch(
    requestDeleteSource,
    /postAdminAction|fetch\(/,
    "opening the confirmation must not wait for Supabase or any network request",
  );
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
