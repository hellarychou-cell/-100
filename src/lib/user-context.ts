import type { AIConversationEntry, SelfReflectionEntry } from "./self-reflection.ts";
import type { AwakeningTheaterChoice } from "./awakening-theater.ts";

export type ClientProfileInput = {
  age?: string;
  currentIssue?: string;
  idealState?: string;
  identity?: string;
  name?: string;
};

export type ClientAssessmentInput = {
  result?: {
    dimensionScores?: Record<string, { index?: number; raw?: number }>;
    primaryMode?: string;
    recommendedDay?: number;
    totalScore100?: number;
  };
} | null;

export type ClientContext = {
  age?: string;
  currentDay?: number;
  currentIssue?: string;
  highFrequencyEmotions: Array<{ count: number; word: string }>;
  identity?: string;
  idealState?: string;
  name: string;
  primaryMode?: string;
  recentAiThemes: string[];
  recentWriting: string[];
  repeatedScenes: Array<{ count: number; name: string }>;
  todayAnchor?: string;
  todayChoice?: string;
  todaySecondAnchor?: string;
  todaySecondChoice?: string;
  weakestDimensions: string[];
};

type ReflectionLike = Partial<SelfReflectionEntry> & {
  createdAt?: string;
  day?: number;
};

type AIEntryLike = Partial<AIConversationEntry> & {
  messages?: Array<{ content: string; role: "user" | "assistant" }>;
  updatedAt?: string;
};

const emotionWords = ["累", "焦虑", "烦", "委屈", "生气", "害怕", "难受", "想哭", "空", "麻木", "紧", "乱"];
const sceneKeywords: Array<{ name: string; words: string[] }> = [
  { name: "原生家庭", words: ["妈妈", "母亲", "爸爸", "父亲", "婆婆", "家里", "原生家庭"] },
  { name: "客户关系", words: ["客户", "合作", "需求", "催", "甲方"] },
  { name: "亲密关系", words: ["老公", "伴侣", "丈夫", "恋人"] },
  { name: "同辈对比", words: ["同学", "朋友", "朋友圈", "对比", "羡慕"] },
  { name: "金钱压力", words: ["钱", "收入", "赚钱", "价格", "收费"] },
  { name: "自我价值", words: ["不够好", "分数", "成绩", "评价", "标准"] },
];

export function buildClientContext({
  assessment,
  currentDay,
  profile,
  writingEntries = [],
  aiEntries = [],
  theaterChoice,
}: {
  assessment?: ClientAssessmentInput;
  currentDay?: number;
  profile?: ClientProfileInput | null;
  writingEntries?: ReflectionLike[];
  aiEntries?: AIEntryLike[];
  theaterChoice?: AwakeningTheaterChoice | null;
}): ClientContext {
  const recentWritingEntries = [...writingEntries]
    .sort((a, b) => dateValue(b.createdAt) - dateValue(a.createdAt))
    .slice(0, 7);
  const recentAiEntries = [...aiEntries]
    .sort((a, b) => dateValue(b.updatedAt) - dateValue(a.updatedAt))
    .slice(0, 3);
  const corpus = [
    profile?.currentIssue ?? "",
    ...recentWritingEntries.flatMap((entry) => [entry.touched ?? "", entry.body ?? "", entry.sentence ?? ""]),
    ...recentAiEntries.flatMap((entry) => entry.messages?.map((message) => message.content) ?? []),
  ].join("\n");

  return {
    age: profile?.age,
    currentDay,
    currentIssue: profile?.currentIssue,
    highFrequencyEmotions: countKeywordMatches(corpus, emotionWords),
    identity: profile?.identity,
    idealState: profile?.idealState,
    name: profile?.name?.trim() || "你",
    primaryMode: assessment?.result?.primaryMode,
    recentAiThemes: recentAiEntries.map((entry) => entry.title || summarizeText(entry.messages?.find((m) => m.role === "user")?.content ?? "")),
    recentWriting: recentWritingEntries.map((entry) =>
      [entry.touched, entry.body, entry.sentence].filter(Boolean).join(" · "),
    ),
    repeatedScenes: countScenes(corpus),
    todayAnchor: theaterChoice?.anchors.first,
    todayChoice: theaterChoice?.firstChoice,
    todaySecondAnchor: theaterChoice?.anchors.second,
    todaySecondChoice: theaterChoice?.secondChoice,
    weakestDimensions: getWeakestDimensions(assessment?.result?.dimensionScores),
  };
}

export function buildContextPrompt(context?: ClientContext | null) {
  if (!context) return "";

  const weakestDimensions = context.weakestDimensions ?? [];
  const repeatedScenes = context.repeatedScenes ?? [];
  const highFrequencyEmotions = context.highFrequencyEmotions ?? [];
  const recentWriting = context.recentWriting ?? [];
  const recentAiThemes = context.recentAiThemes ?? [];
  const hasTheaterAnchor = Boolean(context.todayAnchor || context.todaySecondAnchor);

  const lines = [
    "【你认识她的背景】",
    `称呼她：${context.name || "你"}`,
    context.age ? `年龄/阶段：${context.age}` : "",
    context.identity ? `身份：${context.identity}` : "",
    context.currentIssue ? `她当下最想解决的问题：${context.currentIssue}` : "",
    context.idealState ? `她想走向的状态：${context.idealState}` : "",
    context.primaryMode ? `测评主模式：${context.primaryMode}` : "",
    weakestDimensions.length ? `目前最需要看见的维度：${weakestDimensions.join("、")}` : "",
    context.currentDay ? `当前进度：Day ${context.currentDay}` : "",
    repeatedScenes.length
      ? `最近反复出现的场景：${repeatedScenes.map((item) => `${item.name}${item.count}次`).join("、")}`
      : "",
    highFrequencyEmotions.length
      ? `最近高频情绪词：${highFrequencyEmotions.map((item) => `${item.word}${item.count}次`).join("、")}`
      : "",
    recentWriting.length ? `最近书写：${recentWriting.join(" / ")}` : "",
    recentAiThemes.length ? `最近对话主题：${recentAiThemes.join(" / ")}` : "",
    hasTheaterAnchor
      ? [
          "【觉醒剧场接话锚点】",
          context.todayChoice ? `用户刚刚在觉醒剧场里的第一选择：${context.todayChoice}` : "",
          context.todayAnchor ? `第一选择后的状态：${context.todayAnchor}` : "",
          context.todaySecondChoice ? `用户夜里一个人时的第二选择：${context.todaySecondChoice}` : "",
          context.todaySecondAnchor ? `第二选择后的状态：${context.todaySecondAnchor}` : "",
          "你的第一句话要直接接住她此刻的状态，不要复述剧情，不要评价选项对错，直接问出她没说出口的问题。",
        ].filter(Boolean).join("\n")
      : "",
    "",
    "【亲密化回应规则】",
    "你要像一个认识她、记得她近况的陪伴者。可以温柔引用她最近反复出现的词，但不要显得像数据报告。",
    "一次只问一个问题。不要说教，不要急着给建议，不要用鸡汤句。",
    "优先用短句、具体身体感受、具体场景来回应。",
  ];

  return lines.filter(Boolean).join("\n");
}

function countKeywordMatches(text: string, words: string[]) {
  return words
    .map((word) => ({ word, count: (text.match(new RegExp(escapeRegExp(word), "gu")) ?? []).length }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word, "zh-CN"));
}

function countScenes(text: string) {
  return sceneKeywords
    .map((scene) => ({
      name: scene.name,
      count: scene.words.reduce((sum, word) => sum + (text.match(new RegExp(escapeRegExp(word), "gu")) ?? []).length, 0),
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"));
}

function getWeakestDimensions(scores?: Record<string, { index?: number }>) {
  if (!scores) return [];
  return Object.entries(scores)
    .filter(([, score]) => typeof score.index === "number")
    .sort((a, b) => Number(b[1].index) - Number(a[1].index))
    .slice(0, 2)
    .map(([id]) => dimensionName(id));
}

function dimensionName(id: string) {
  const names: Record<string, string> = {
    "self-worth": "自我价值",
    boundaries: "关系边界",
    "decision-trust": "决策自主",
    "emotional-stability": "情绪自主",
    "action-flow": "行动通道",
    "wealth-container": "财富容器",
  };
  return names[id] ?? id;
}

function summarizeText(value: string) {
  return value.replace(/\s+/g, " ").slice(0, 24);
}

function dateValue(value?: string) {
  return value ? new Date(value).getTime() || 0 : 0;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
