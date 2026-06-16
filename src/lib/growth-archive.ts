import type { ClientContext } from "./user-context.ts";

export type GrowthProfile = {
  emotionWords: Array<{ count: number; word: string }>;
  latestLoosened: string[];
  latestTouchedSentence: string;
  name: string;
  repeatedScenes: Array<{ count: number; name: string }>;
  walkedDays: number;
};

export function createGrowthProfile({ context }: { context: ClientContext }): GrowthProfile {
  return {
    emotionWords: context.highFrequencyEmotions,
    latestLoosened: inferLoosened(context),
    latestTouchedSentence: context.recentWriting[0] || context.recentAiThemes[0] || "你已经开始把自己放回第一位。",
    name: context.name,
    repeatedScenes: context.repeatedScenes,
    walkedDays: Math.max(0, (context.currentDay ?? 1) - 1),
  };
}

function inferLoosened(context: ClientContext) {
  const items: string[] = [];
  if (context.highFrequencyEmotions.some((item) => item.word === "累")) {
    items.push("我必须一直扛着");
  }
  if (context.repeatedScenes.some((item) => item.name === "原生家庭")) {
    items.push("家人的情绪都是我的责任");
  }
  if (context.repeatedScenes.some((item) => item.name === "客户关系")) {
    items.push("客户不满意就是我不够好");
  }
  return items.length ? items.slice(0, 3) : ["我需要先看见自己，而不是马上变好"];
}
