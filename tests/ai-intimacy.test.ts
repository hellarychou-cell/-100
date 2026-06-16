import test from "node:test";
import assert from "node:assert/strict";
import { buildClientContext, buildContextPrompt } from "../src/lib/user-context.ts";
import { createGrowthProfile } from "../src/lib/growth-archive.ts";
import { createTodaySeeingCard } from "../src/lib/today-seeing-card.ts";
import { findTriggeredSister, getSisterProfile, shouldTriggerSister } from "../src/lib/sister-profiles.ts";
import { buildCollectionState } from "../src/lib/collection.ts";

test("client context keeps identity, recent writing, conversations, and repeated emotion words", () => {
  const context = buildClientContext({
    profile: {
      name: "林夏",
      age: "32",
      identity: "独立咨询顾问",
      currentIssue: "妈妈打电话以后我会很累",
      idealState: "温和但有边界",
    },
    assessment: {
      result: {
        totalScore100: 68,
        primaryMode: "讨好程序",
        recommendedDay: 7,
        dimensionScores: {
          "self-worth": { raw: 24, index: 68 },
          boundaries: { raw: 29, index: 82 },
        },
      },
    },
    currentDay: 13,
    writingEntries: [
      { day: 12, touched: "妈妈又打电话", body: "胸口紧", sentence: "我很累", createdAt: "2026-06-12T10:00:00Z" },
      { day: 13, touched: "客户催我", body: "肩膀酸", sentence: "我还是累", createdAt: "2026-06-13T10:00:00Z" },
    ],
    aiEntries: [
      {
        day: 12,
        title: "妈妈电话",
        updatedAt: "2026-06-12T11:00:00Z",
        messages: [
          { role: "user", content: "妈妈打电话，我很累。" },
          { role: "assistant", content: "我们先停在这个累。" },
        ],
      },
    ],
  });

  assert.equal(context.name, "林夏");
  assert.equal(context.currentDay, 13);
  assert.ok(context.highFrequencyEmotions.some((item) => item.word === "累"));
  assert.match(buildContextPrompt(context), /林夏/);
  assert.match(buildContextPrompt(context), /一次只问一个问题/);
});

test("growth profile summarizes writing and AI archive without calling AI", () => {
  const profile = createGrowthProfile({
    context: buildClientContext({
      profile: { name: "林夏", currentIssue: "客户关系总让我焦虑" },
      currentDay: 8,
      writingEntries: [
        { day: 6, touched: "客户临时加需求", body: "胃紧", sentence: "焦虑", createdAt: "2026-06-06T10:00:00Z" },
        { day: 7, touched: "妈妈问我赚多少钱", body: "胸闷", sentence: "累", createdAt: "2026-06-07T10:00:00Z" },
      ],
      aiEntries: [],
    }),
  });

  assert.equal(profile.name, "林夏");
  assert.ok(profile.repeatedScenes.some((scene) => scene.name === "客户关系"));
  assert.ok(profile.emotionWords.some((word) => word.word === "焦虑"));
});

test("today seeing card uses AI conversation when available and fallback copy otherwise", () => {
  const aiCard = createTodaySeeingCard({
    day: 7,
    title: "那 2 分",
    mirror: "你总觉得自己还差一点。",
    bodyNote: "胸口那一点紧。",
    aiEntry: {
      day: 7,
      title: "那 2 分",
      updatedAt: "2026-06-07T10:00:00Z",
      messages: [
        { role: "user", content: "我妈说我考 98 分也不够。" },
        { role: "assistant", content: "你在等一个永远不会来的够了。那个标准不是你的。先把手放回胸口。" },
      ],
    },
  });

  assert.match(aiCard.userExcerpt, /98 分/);
  assert.equal(aiCard.aiSeeings.length, 3);
  assert.match(aiCard.bodyAction, /胸口/);

  const fallback = createTodaySeeingCard({
    day: 1,
    title: "那句还行吧",
    mirror: "你把真实感受藏进还行。",
    bodyNote: "膻中发紧。",
  });

  assert.match(fallback.userExcerpt, /还行/);
  assert.equal(fallback.aiSeeings.length, 3);
});

test("sister trigger matches unlocked sisters and prevents same-day duplicates", () => {
  assert.equal(getSisterProfile("苏敏")?.gift.includes("G4"), true);

  const triggered = findTriggeredSister({
    message: "妈妈又打电话，我整个人很累。",
    unlockedSisters: ["杨绛", "苏敏"],
    day: 7,
    triggerLog: {},
  });

  assert.equal(triggered?.name, "苏敏");
  assert.equal(shouldTriggerSister({ day: 7, sisterName: "苏敏", triggerLog: { "7": ["苏敏"] } }), false);
});

test("collection state dedupes sister cards, keeps tool slots unique, and unlocks self card at day 100", () => {
  const state = buildCollectionState({
    completedDays: [1, 2, 7, 100],
    toolCards: [
      { file: "a", category: "1", front: { name: "A", description: "", quote: "" }, back: { type: "tool", title: "A", content: "" } },
      { file: "b", category: "1", front: { name: "B", description: "", quote: "" }, back: { type: "tool", title: "B", content: "" } },
    ],
    scheduleWomen: [
      { day: 1, name: "杨绛", field: "现代", cardType: "感恩卡", quoteSource: "苏格拉底" },
      { day: 7, name: "杨绛", field: "现代", cardType: "工具卡", quoteSource: "鲁米" },
      { day: 2, name: "上野千鹤子", field: "日本当代", cardType: "工具卡", quoteSource: "时时刻刻" },
    ],
    selfCard: { name: "林夏", identity: "温柔但有边界", sentence: "不答应也是爱。" },
  });

  assert.deepEqual(state.toolSlots.map((slot) => slot.slot), [1, 2]);
  assert.equal(new Set(state.toolSlots.map((slot) => slot.slot)).size, state.toolSlots.length);
  assert.deepEqual(state.sisterSlots.filter((slot) => slot.unlocked).map((slot) => slot.name), ["杨绛", "上野千鹤子"]);
  assert.equal(state.selfSlot.unlocked, true);
});
