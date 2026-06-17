import assert from "node:assert/strict";
import test from "node:test";

import {
  getScheduleDays,
  parseScheduleMarkdown,
} from "../src/lib/schedule.ts";
import {
  getBodyStationEntries,
  getBodyStationIndex,
} from "../src/lib/body-station.ts";
import { getDayDocumentContent } from "../src/lib/day-document.ts";
import { getToolCards } from "../src/lib/tool-cards.ts";
import { readRootMarkdown } from "../src/lib/markdown.ts";

test("schedule parser returns 100 unique days from the latest root schedule", () => {
  const days = getScheduleDays();

  assert.equal(days.length, 100);
  assert.deepEqual(
    days.map((day) => day.day),
    Array.from({ length: 100 }, (_, index) => index + 1),
  );
  assert.equal(days[0].title, `那句"还行吧"`);
  assert.match(days[0].bodyNote, /膻中/);
  assert.match(days[0].mysteryCard, /感恩卡/);
  assert.equal(days[24].title, "觉醒期毕业 · 金钱卡点深度测评");
});

test("schedule parser deduplicates days by keeping the later row", () => {
  const days = parseScheduleMarkdown(`
| Day | 每天主题 | 维度 | 镜子 | 身体小语 | AI 对话 | 轮换板块 | 神秘卡 |
|---|---|---|---|---|---|---|---|
| 1 | 旧标题 | 自我价值 | A | 旧小语 | 旧AI | 旧板块 | 旧卡 |
| 1 | 新标题 | 关系边界 | B | 新小语 | 新AI | 新板块 | 新卡 |
`);

  assert.equal(days.length, 1);
  assert.equal(days[0].title, "新标题");
  assert.equal(days[0].bodyNote, "新小语");
});

test("latest Day 1-7 document drives full day copy", async () => {
  const dayOne = await getDayDocumentContent(1);

  assert.equal(dayOne.title, `那句"还行吧"`);
  assert.match(dayOne.phaseLine, /第一阶段/);
  assert.match(dayOne.dimensionLine, /自我价值/);
  assert.match(dayOne.cardPointLine, /自我声音失联/);
  assert.match(dayOne.mirror, /有些选择/);
  assert.match(dayOne.story, /人生第一个 60 万的项目/);
  assert.match(dayOne.storyPreview, /还行吧/);
  assert.match(dayOne.bodyNote, /喉为心声出口/);
  assert.match(dayOne.aiQuestion, /真正想说的.*是什么/);
  assert.doesNotMatch(dayOne.story, /这里接入当天完整故事|正式上线内容以 Day 文档为准/);
});

test("latest philosophy document exposes all seven public sections", () => {
  const blocks = readRootMarkdown("成她-理念页.md");
  const headings = blocks.filter((block) => block.type === "heading").map((block) => block.text);

  assert.ok(headings.includes("关于恬馨"));
  for (const title of ["一", "二 · 我是谁", "三 · 我看见的事", "四 · 我做的事", "五 · 我相信的事", "六 · 写给她", "七"]) {
    assert.ok(headings.includes(title), `missing philosophy section: ${title}`);
  }
});

test("body station exposes seven full entries and locked placeholders through day 100", () => {
  const entries = getBodyStationEntries();
  const index = getBodyStationIndex();

  assert.equal(entries.length, 7);
  assert.match(entries[0].title, /喉为心声/);
  assert.ok(entries[0].sections.some((section) => section.title.includes("溯源")));
  assert.equal(index.length, 100);
  assert.equal(index[0].status, "ready");
  assert.equal(index[7].status, "locked");
  assert.match(index[7].title, /Day 8|推腹法/);
});

test("toolbox parser exposes twenty five non-index tool cards", () => {
  const cards = getToolCards();

  assert.equal(cards.length, 25);
  assert.ok(cards.some((card) => card.front.name.includes("萨提亚冰山")));
  assert.ok(cards.some((card) => card.front.name.includes("金钱家族脚本")));
  assert.ok(cards.every((card) => card.back.content.length > 120));
});
