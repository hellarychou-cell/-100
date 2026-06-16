import type { AIConversationEntry } from "./self-reflection.ts";

export const LOCAL_TODAY_SEEING_KEY = "chengta.todaySeeingCards";

export type TodaySeeingCard = {
  aiSeeings: string[];
  bodyAction: string;
  createdAt: string;
  day: number;
  title: string;
  userExcerpt: string;
};

export function createTodaySeeingCard({
  aiEntry,
  bodyNote,
  day,
  mirror,
  title,
}: {
  aiEntry?: Pick<AIConversationEntry, "messages"> | null;
  bodyNote: string;
  day: number;
  mirror: string;
  title: string;
}): TodaySeeingCard {
  const userMessage = [...(aiEntry?.messages ?? [])].reverse().find((message) => message.role === "user")?.content ?? "";
  const assistantMessage = [...(aiEntry?.messages ?? [])].reverse().find((message) => message.role === "assistant")?.content ?? "";
  const source = assistantMessage || [mirror, bodyNote].filter(Boolean).join("。");

  return {
    aiSeeings: extractSeeings(source, mirror),
    bodyAction: inferBodyAction(source, bodyNote),
    createdAt: new Date().toISOString(),
    day,
    title,
    userExcerpt: cleanExcerpt(userMessage || mirror || bodyNote || "今天我愿意先看见自己。"),
  };
}

function extractSeeings(source: string, fallback: string) {
  const chunks = source
    .split(/[。！？\n]/u)
    .map((item) => item.trim().replace(/^[-\d.、\s]+/u, ""))
    .filter((item) => item.length >= 3)
    .slice(0, 3);
  const defaults = [
    fallback || "你已经把那个声音看见了",
    "它不一定是你的真实声音",
    "今天先不用急着变好",
  ];
  return [...chunks, ...defaults].slice(0, 3);
}

function inferBodyAction(source: string, bodyNote: string) {
  if (/胸口|膻中/u.test(source + bodyNote)) return "把手轻轻放在胸口，慢慢呼三口气。";
  if (/肩|背/u.test(source + bodyNote)) return "把肩膀向后绕三圈，告诉身体：我先松一点。";
  if (/胃|腹/u.test(source + bodyNote)) return "把手放在腹部，问问它：你现在最想让我知道什么？";
  return "今晚睡前留一分钟，对自己说：我今天已经看见了一点点。";
}

function cleanExcerpt(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 72);
}
