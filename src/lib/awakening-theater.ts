import { getDayAIAnchor, type TheaterChoiceKey } from "./day-ai-anchors.ts";

export const LOCAL_THEATER_CHOICE_KEY = "chengta.awakeningTheaterChoices";
export const LOCAL_DAY_READING_STAGE_KEY = "chengta.dayReadingStage";
export const AWAKENING_THEATER_CHOICE_EVENT = "chengta:awakening-theater-choice";

export type AwakeningTheaterChoice = {
  anchors: {
    first: string;
    second?: string;
  };
  createdAt: string;
  day: number;
  firstChoice: TheaterChoiceKey;
  secondChoice?: TheaterChoiceKey;
  selectedLabels: {
    first: string;
    second?: string;
  };
  updatedAt: string;
};

export type AwakeningTheaterChoiceMap = Record<string, AwakeningTheaterChoice>;

export type AwakeningTheaterProgress = {
  anchorPreview: string;
  mode: "completed" | "reading";
  reflectionExpanded: boolean;
};

export type DayPageReadingStage = "content" | "reflection" | "theater";

export function createAwakeningTheaterChoice({
  createdAt,
  day,
  firstChoice,
  secondChoice,
}: {
  createdAt?: string;
  day: number;
  firstChoice: TheaterChoiceKey;
  secondChoice?: TheaterChoiceKey;
}): AwakeningTheaterChoice {
  const now = new Date().toISOString();
  return {
    anchors: {
      first: getDayAIAnchor(day, firstChoice),
      second: getDayAIAnchor(day, secondChoice),
    },
    createdAt: createdAt ?? now,
    day,
    firstChoice,
    secondChoice,
    selectedLabels: {
      first: firstChoice,
      second: secondChoice,
    },
    updatedAt: now,
  };
}

export function summarizeTheaterChoice(choice?: AwakeningTheaterChoice | null) {
  if (!choice) return "";
  const parts = [
    choice.anchors.first ? `第一选择：${choice.anchors.first}` : `第一选择：${choice.firstChoice}`,
    choice.anchors.second ? `第二选择：${choice.anchors.second}` : choice.secondChoice ? `第二选择：${choice.secondChoice}` : "",
  ].filter(Boolean);
  return `觉醒剧场里，你在这一幕选择了：${parts.join("；")}`;
}

export function getAwakeningTheaterProgress({
  choice,
  hasFirstChoices,
  hasSecondChoices,
}: {
  choice?: AwakeningTheaterChoice | null;
  hasFirstChoices: boolean;
  hasSecondChoices: boolean;
}): AwakeningTheaterProgress {
  const hasRequiredFirst = !hasFirstChoices || Boolean(choice?.firstChoice);
  const hasRequiredSecond = !hasSecondChoices || Boolean(choice?.secondChoice);
  const completed = hasRequiredFirst && hasRequiredSecond;
  const anchorParts = [choice?.anchors.first, choice?.anchors.second].filter(Boolean);

  return {
    anchorPreview: anchorParts.length > 0
      ? `今天 AI 会从你刚才的选择接住你：${anchorParts.join("；")}`
      : "今天 AI 会从你刚才的选择接住你，先不急着给答案，只陪你看见刚刚那一瞬间。",
    mode: completed ? "completed" : "reading",
    reflectionExpanded: completed,
  };
}

export function buildSelfSeeingPreview({
  choice,
  fallbackQuestion,
}: {
  choice?: AwakeningTheaterChoice | null;
  fallbackQuestion: string;
}) {
  const anchors = [choice?.anchors.first, choice?.anchors.second].filter(Boolean);
  if (!anchors.length) {
    return `${fallbackQuestion} 你可以先自己写下来；想继续深入时，再让 AI 接住这段文字，一层一层陪你看见。`;
  }

  const firstLine = choice?.firstChoice
    ? `你刚刚在觉醒剧场里选了 ${choice.firstChoice}${choice.secondChoice ? ` + ${choice.secondChoice}` : ""}。`
    : "你刚刚在觉醒剧场里停了一下。";

  return `${firstLine}如果把这不是当成剧情，而是当成你身体里的一点线索：${anchors.join("；")}。这一刻最先冒出来的念头是什么？你可以先写下来；真正的动态回应，会在跨时空对话里由 AI 接住你。`;
}

export function getDayPageReadingStage({
  aiCompleted,
  reflectionUnlocked,
  theaterCompleted,
}: {
  aiCompleted: boolean;
  reflectionUnlocked: boolean;
  theaterCompleted: boolean;
}): DayPageReadingStage {
  if (!theaterCompleted || !reflectionUnlocked) return "theater";
  return aiCompleted ? "content" : "reflection";
}

export function readAwakeningTheaterChoice(day: number) {
  if (typeof window === "undefined") return null;
  const choices = readAwakeningTheaterChoices();
  return choices[String(day)] ?? null;
}

export function readAwakeningTheaterChoices() {
  if (typeof window === "undefined") return {} as AwakeningTheaterChoiceMap;
  const raw = window.localStorage.getItem(LOCAL_THEATER_CHOICE_KEY);
  if (!raw) return {} as AwakeningTheaterChoiceMap;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as AwakeningTheaterChoiceMap)
      : {};
  } catch {
    window.localStorage.removeItem(LOCAL_THEATER_CHOICE_KEY);
    return {};
  }
}

export function saveAwakeningTheaterChoice(choice: AwakeningTheaterChoice) {
  if (typeof window === "undefined") return;
  const choices = readAwakeningTheaterChoices();
  window.localStorage.setItem(
    LOCAL_THEATER_CHOICE_KEY,
    JSON.stringify({ ...choices, [String(choice.day)]: choice }),
  );
}
