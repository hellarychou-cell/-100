import test from "node:test";
import assert from "node:assert/strict";
import { buildClientContext, buildContextPrompt } from "../src/lib/user-context.ts";
import { createGrowthProfile } from "../src/lib/growth-archive.ts";
import { createTodaySeeingCard } from "../src/lib/today-seeing-card.ts";
import { createSisterTriggerReply, findTriggeredSister, getSisterProfile, shouldTriggerSister } from "../src/lib/sister-profiles.ts";
import { buildCollectionState } from "../src/lib/collection.ts";
import { createLocalAIReply } from "../src/lib/ai-local-fallback.ts";
import { createAwakeningTheaterChoice } from "../src/lib/awakening-theater.ts";
import { getDayAIAnchor } from "../src/lib/day-ai-anchors.ts";

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
  assert.equal(getSisterProfile("苏敏")?.gift.includes("福利卡"), true);

  const triggered = findTriggeredSister({
    message: "妈妈又打电话，我整个人很累。",
    unlockedSisters: ["杨绛", "苏敏"],
    day: 7,
    triggerLog: {},
  });

  assert.equal(triggered?.name, "苏敏");
  assert.equal(shouldTriggerSister({ day: 7, sisterName: "苏敏", triggerLog: { "7": ["苏敏"] } }), false);
});

test("sister trigger reply borrows today's sister without exposing card gifts or long voice", () => {
  const reply = createSisterTriggerReply({
    sisterName: "杨绛",
    userName: "林夏",
    userTexts: ["我刚刚又说都行，其实心里有点空。", "我怕说出来别人不高兴。"],
  });

  assert.match(reply, /如果今天是杨绛在这里/);
  assert.match(reply, /林夏/);
  assert.doesNotMatch(reply, /礼物|感恩卡|工具卡|空白卡|福利卡/);
  assert.doesNotMatch(reply, /我和谁都不争|骨头最硬/);
  assert.ok(reply.split(/\n+/).filter(Boolean).length <= 3);
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

test("collection pairs a sister day with the matching unlocked tool card", () => {
  const state = buildCollectionState({
    completedDays: [2],
    toolCards: [
      {
        file: "心理学工具箱/2-关系边界与自我主权/2.1-课题分离.md",
        category: "2-关系边界与自我主权",
        front: { name: "课题分离", description: "", quote: "" },
        back: { type: "tool", title: "课题分离", content: "" },
      },
    ],
    scheduleWomen: [
      { day: 2, name: "上野千鹤子", field: "日本当代", cardType: "🎴 2.1课题分离", quoteSource: "《时时刻刻》" },
    ],
  });

  assert.equal(state.toolSlots[0].day, 2);
  assert.equal(state.toolSlots[0].unlocked, true);
  assert.equal(state.sisterSlots[0].unlocked, true);
});

test("collection only unlocks tool cards whose matched day is completed", () => {
  const state = buildCollectionState({
    completedDays: [1, 2, 3],
    toolCards: [
      {
        file: "心理学工具箱/2-关系边界与自我主权/2.1-课题分离.md",
        category: "2-关系边界与自我主权",
        front: { name: "课题分离", description: "", quote: "" },
        back: { type: "tool", title: "课题分离", content: "" },
      },
      {
        file: "心理学工具箱/1-自我价值与配得感/1.4-自我同情三步.md",
        category: "1-自我价值与配得感",
        front: { name: "自我同情三步", description: "", quote: "" },
        back: { type: "tool", title: "自我同情三步", content: "" },
      },
      {
        file: "心理学工具箱/1-自我价值与配得感/1.1-萨提亚冰山模型.md",
        category: "1-自我价值与配得感",
        front: { name: "萨提亚冰山模型", description: "", quote: "" },
        back: { type: "tool", title: "萨提亚冰山模型", content: "" },
      },
    ],
    scheduleWomen: [
      { day: 2, name: "上野千鹤子", field: "日本当代", cardType: "🎴 2.1课题分离", quoteSource: "《时时刻刻》" },
      { day: 4, name: "贾玲", field: "电影", cardType: "🎴 1.4自我同情", quoteSource: "《热辣滚烫》" },
      { day: 7, name: "杨绛", field: "现代", cardType: "🎴 1.1萨提亚冰山", quoteSource: "鲁米" },
    ],
  });

  assert.deepEqual(state.toolSlots.filter((slot) => slot.unlocked).map((slot) => slot.front.name), ["课题分离"]);
});

test("latest week sister cards have collection voice and gift copy", () => {
  const expected = [
    ["杨绛", /我和谁都不争|我们仨/],
    ["上野千鹤子", /女性主义|弱者/],
    ["李红", /先爱我自己/],
    ["贾玲", /我应该/],
    ["苏敏", /为我自己/],
    ["林青霞", /后半生[\s\S]*做我自己/],
  ] as const;

  for (const [name, voice] of expected) {
    const profile = getSisterProfile(name);
    assert.ok(profile, `${name} should have a sister profile`);
    assert.match(profile.dailyVoice, voice);
    assert.ok(profile.dailyVoice.length > 10, `${name} should have daily voice`);
    assert.ok(profile.gift.length > 6, `${name} should have a gift`);
  }
});

test("local AI fallback keeps chat responsive without MiniMax", () => {
  const reply = createLocalAIReply({
    companionLabel: "🌿 苏敏",
    mode: "chat",
    userText: "我妈又打电话，我很累。",
    userName: "林夏",
  });

  assert.match(reply, /林夏/);
  assert.match(reply, /苏敏/);
  assert.match(reply, /一次只看一个地方/);
});

test("awakening theater choices become AI prompt anchors", () => {
  const choice = createAwakeningTheaterChoice({
    day: 1,
    firstChoice: "A",
    secondChoice: "Y",
  });
  const firstAnchor = getDayAIAnchor(1, "A");
  const secondAnchor = getDayAIAnchor(1, "Y");
  const prompt = buildContextPrompt(
    buildClientContext({
      currentDay: 1,
      profile: { name: "林夏" },
      theaterChoice: choice,
    }),
  );

  assert.equal(choice.anchors.first, firstAnchor);
  assert.equal(choice.anchors.second, secondAnchor);
  assert.match(prompt, /觉醒剧场/);
  assert.match(prompt, /大家开心就好/);
  assert.match(prompt, /从没敢说出来|哪怕只对自己/);
  assert.match(prompt, /不要复述剧情/);
});

test("today seeing card can use awakening theater choice when AI conversation is absent", () => {
  const card = createTodaySeeingCard({
    bodyNote: "喉为心声出口。",
    day: 1,
    mirror: "你自己，想要什么。",
    theaterChoice: createAwakeningTheaterChoice({ day: 1, firstChoice: "C" }),
    title: "她不是不会选，是忘了自己有得选",
  });

  assert.match(card.userExcerpt, /觉醒剧场|你在这一幕/);
  assert.match(card.userExcerpt, /有消息|话题带走/);
});
