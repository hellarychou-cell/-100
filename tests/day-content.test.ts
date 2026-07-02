import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getDayDocumentContent } from "../src/lib/day-document.ts";
import { mysteryCards } from "../src/lib/mystery-cards.ts";

const dayAccessGuardSource = readFileSync("src/components/DayAccessGuard.tsx", "utf8");

test("Day 1-7 all have complete story content from the Day document", async () => {
  for (const day of [1, 2, 3, 4, 5, 6, 7]) {
    const documentContent = await getDayDocumentContent(day);

    assert.ok(documentContent.story.length > 500);
    assert.doesNotMatch(documentContent.story, /这里接入当天完整故事|正式上线内容以 Day 文档为准/);
    assert.ok(documentContent.aiMethod.title.length > 0);
    assert.ok(documentContent.aiMethod.note.length > 0);
  }
});

test("Day 1-7 all have mystery cards with front and back copy", () => {
  for (const day of [1, 2, 3, 4, 5, 6, 7]) {
    const card = mysteryCards[day];

    assert.ok(card.front.name);
    assert.ok(card.front.quote);
    assert.ok(card.back.title);
    assert.ok(card.back.content);
  }
});

test("Day 1-7 mystery cards follow the latest week document", () => {
  const expected = [
    [1, /杨绛/, /感恩卡/],
    [2, /上野千鹤子/, /课题分离/],
    [3, /李红/, /空白卡/],
    [4, /贾玲/, /自我同情/],
    [5, /苏敏/, /福利卡/],
    [6, /林青霞/, /感恩卡/],
    [7, /杨绛|钱媛/, /萨提亚|冰山/],
  ] as const;

  for (const [day, frontName, backTitle] of expected) {
    const card = mysteryCards[day];
    assert.match(card.front.name, frontName);
    assert.match(card.back.title, backTitle);
  }
});

test("day access guard can unlock the recommended assessment day before remote progress catches up", () => {
  assert.match(dayAccessGuardSource, /getRecommendedDaySnapshot/);
  assert.match(dayAccessGuardSource, /recommended_day/);
  assert.match(dayAccessGuardSource, /Math\.max\(next\.currentDay, recommendedDay\)/);
});
