import assert from "node:assert/strict";
import test from "node:test";

import { getDayCompanion } from "../src/lib/day-companion.ts";

test("day companion uses sister profile symbol when available", () => {
  const companion = getDayCompanion(1);

  assert.equal(companion.name, "杨绛");
  assert.equal(companion.symbol, "🌸");
  assert.equal(companion.label, "🌸 杨绛");
});

test("day companion falls back to leaf symbol for women without a profile", () => {
  const companion = getDayCompanion(8);

  assert.equal(companion.name, "屠呦呦");
  assert.equal(companion.symbol, "🌿");
  assert.equal(companion.label, "🌿 屠呦呦");
  assert.equal(companion.field, "现代");
});
