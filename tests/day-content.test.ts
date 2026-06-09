import assert from "node:assert/strict";
import test from "node:test";

import { getDayDocumentContent } from "../src/lib/day-document.ts";
import { mysteryCards } from "../src/lib/mystery-cards.ts";

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

test("Day 7 mystery card is the Satir iceberg tool card", () => {
  const card = mysteryCards[7];

  assert.match(card.front.name, /杨绛|钱媛/);
  assert.match(card.back.title, /萨提亚|冰山/);
  assert.match(card.back.content, /行为|感受|期待|渴望/);
});
