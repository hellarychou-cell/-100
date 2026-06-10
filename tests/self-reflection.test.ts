import assert from "node:assert/strict";
import test from "node:test";

import {
  buildReflectionSeedMessage,
  createReflectionEntry,
  summarizeReflectionEntry,
} from "../src/lib/self-reflection.ts";

test("creates a structured self-reflection entry", () => {
  const entry = createReflectionEntry({
    body: "胸口发紧",
    day: 7,
    sentence: "我已经够好了",
    touched: "那 2 分",
  });

  assert.equal(entry.day, 7);
  assert.equal(entry.touched, "那 2 分");
  assert.ok(entry.id.startsWith("day-7-"));
});

test("summarizes reflection entry for archive cards", () => {
  const entry = createReflectionEntry({
    body: "胃里有点紧，像被抓住",
    day: 3,
    sentence: "我可以先不答应",
    touched: "我不是不会拒绝",
  });

  assert.equal(summarizeReflectionEntry(entry), "我不是不会拒绝 · 胃里有点紧，像被抓住 · 我可以先不答应");
});

test("builds an AI seed message from writing", () => {
  const entry = createReflectionEntry({
    body: "肩膀很重",
    day: 1,
    sentence: "我想把自己说回来",
    touched: "还行吧",
  });

  assert.match(buildReflectionSeedMessage(entry), /今天故事里戳到我的是：还行吧/);
  assert.match(buildReflectionSeedMessage(entry), /请你先不要分析/);
});
