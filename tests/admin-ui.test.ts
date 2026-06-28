import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const adminPageSource = readFileSync(new URL("../src/app/admin/page.tsx", import.meta.url), "utf8");

test("admin user list has search and horizontal browsing controls", () => {
  assert.match(adminPageSource, /placeholder="搜索姓名、手机号、测评状态或 Day"/);
  assert.match(adminPageSource, /admin-user-rail/);
  assert.match(adminPageSource, /admin-user-card/);
});

test("admin report action links to the selected user's assessment report", () => {
  assert.match(adminPageSource, /href=\{`\/admin\/users\/\$\{user\.id\}`\}/);
  assert.match(adminPageSource, /查看测评报告/);
});
