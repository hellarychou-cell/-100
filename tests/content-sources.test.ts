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
import { cleanToolMarkdownContent, getToolCards } from "../src/lib/tool-cards.ts";
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

  assert.equal(dayOne.title, "她不是不会选，是忘了自己有得选");
  assert.match(dayOne.phaseLine, /第一阶段|觉醒期/);
  assert.match(dayOne.dimensionLine, /自我价值/);
  assert.match(dayOne.cardPointLine, /自我声音失联|SV-3/);
  assert.match(dayOne.mirror, /你的目标/);
  assert.match(dayOne.story, /你叫林夏/);
  assert.match(dayOne.storyPreview, /你叫林夏/);
  assert.match(dayOne.bodyNote, /喉为心声出口/);
  assert.match(dayOne.aiQuestion, /你自己想要什么|如果下次再有人问你这个问题/);
  assert.doesNotMatch(dayOne.story, /这里接入当天完整故事|正式上线内容以 Day 文档为准/);
});

test("latest Day 1-7 document exposes awakening theater choices and interlude", async () => {
  const dayOne = await getDayDocumentContent(1);
  const dayTwo = await getDayDocumentContent(2);
  const dayFive = await getDayDocumentContent(5);

  assert.equal(dayOne.awakeningTheater.firstChoices.length, 3);
  assert.deepEqual(dayOne.awakeningTheater.firstChoices.map((choice) => choice.key), ["A", "B", "C"]);
  assert.equal(dayOne.awakeningTheater.secondChoices.length, 2);
  assert.deepEqual(dayOne.awakeningTheater.secondChoices.map((choice) => choice.key), ["X", "Y"]);
  assert.match(dayOne.awakeningTheater.branches.A, /大家开心就好/);
  assert.match(dayOne.awakeningTheater.branches.Y ?? "", /备忘录/);
  assert.match(dayOne.awakeningTheater.reveal, /你不是不会选/);
  assert.match(dayOne.awakeningTheater.interlude, /开始对话|你自己想要什么/);
  assert.ok(dayOne.extraSections.some((section) => section.title.includes("心理学小知识")));
  assert.ok(dayOne.extraSections.every((section) => !section.content.includes("整天散场尾韵")));

  assert.equal(dayTwo.awakeningTheater.firstChoices.length, 3);
  assert.deepEqual(dayTwo.awakeningTheater.firstChoices.map((choice) => choice.key), ["A", "B", "C"]);
  assert.match(dayTwo.awakeningTheater.firstChoices[0].label, /好啊/);
  assert.doesNotMatch(dayTwo.awakeningTheater.intro, /A ·/);
  assert.match(dayTwo.awakeningTheater.branches.A, /姐你最好了/);

  assert.equal(dayFive.awakeningTheater.firstChoices.length, 0);
  assert.equal(dayFive.awakeningTheater.secondChoices.length, 0);
  assert.match(dayFive.awakeningTheater.intro, /你叫顾棠|老公/);
  assert.match(dayFive.awakeningTheater.reveal, /你不是/);
});

test("day document cleaning removes internal display notes from public copy", async () => {
  const publicText = [1, 5, 6, 7]
    .map((day) => getDayDocumentContent(day))
    .map(async (content) => {
      const resolved = await content;
      return [
        resolved.mirror,
        resolved.story,
        resolved.aiQuestion,
        resolved.bodyNote,
        resolved.curtainCall,
        ...resolved.extraSections.map((section) => `${section.title}\n${section.content}`),
      ].join("\n");
    });
  const combined = (await Promise.all(publicText)).join("\n");

  assert.doesNotMatch(combined, /里程碑预告型|散场静态型|静态展示|无按钮/);
  assert.doesNotMatch(combined, /最后更新|最近更新/);
});

test("latest philosophy document exposes the five public sections", () => {
  const blocks = readRootMarkdown("成她-理念页.md");
  const headings = blocks.filter((block) => block.type === "heading").map((block) => block.text);
  const text = blocks.map((block) => block.text).join("\n");

  assert.ok(headings.includes("成她 100 · 品牌宣言（网站理念页）"));
  for (const title of ["〇 · 成她宣言", "一 · 我们看见的事", "二 · 我们相信的事", "三 · 我们做的事", "四 · 我们相信的女性力量", "五 · 100 天——写给她"]) {
    assert.ok(headings.includes(title), `missing philosophy section: ${title}`);
  }
  assert.doesNotMatch(text, /最后更新|最近更新/);
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
  assert.match(cards.find((card) => card.front.name.includes("课题分离"))?.back.content ?? "", /##\s+这张卡解决什么|###\s+/);
});

test("toolbox markdown cleaning removes editorial update notes and keeps formatting markers", () => {
  const cleaned = cleanToolMarkdownContent(`# 工具卡

## 这张卡解决什么

这里有 **重要提醒**。

最后更新：2026年6月29日
最近更新：内部备注
`);

  assert.doesNotMatch(cleaned, /最后更新|最近更新/);
  assert.match(cleaned, /## 这张卡解决什么/);
  assert.match(cleaned, /\*\*重要提醒\*\*/);
});
