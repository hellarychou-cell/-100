import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const adminPageSource = readFileSync(new URL("../src/app/admin/page.tsx", import.meta.url), "utf8");

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
