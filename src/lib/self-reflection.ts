export const LOCAL_REFLECTION_KEY = "chengta.selfReflectionEntries";
export const LOCAL_AI_CONVERSATION_KEY = "chengta.aiConversationEntries";

export type SelfReflectionEntry = {
  body: string;
  createdAt: string;
  day: number;
  id: string;
  sentence: string;
  touched: string;
};

export type AIConversationMessage = {
  content: string;
  role: "user" | "assistant";
};

export type AIConversationEntry = {
  createdAt: string;
  day: number;
  id: string;
  messages: AIConversationMessage[];
  title: string;
  updatedAt: string;
};

export function createReflectionEntry({
  body,
  day,
  sentence,
  touched,
}: {
  body: string;
  day: number;
  sentence: string;
  touched: string;
}): SelfReflectionEntry {
  const createdAt = new Date().toISOString();
  return {
    body: body.trim(),
    createdAt,
    day,
    id: `day-${day}-${Date.now()}`,
    sentence: sentence.trim(),
    touched: touched.trim(),
  };
}

export function summarizeReflectionEntry(entry: SelfReflectionEntry) {
  return [entry.touched, entry.body, entry.sentence].filter(Boolean).join(" · ");
}

export function buildReflectionSeedMessage(entry: SelfReflectionEntry) {
  return [
    `今天故事里戳到我的是：${entry.touched || "我还说不清楚"}`,
    `我身体里的反应是：${entry.body || "我还没感觉清楚"}`,
    `我想对自己说：${entry.sentence || "我还没有这句话"}`,
    "",
    "请你先不要分析，也不要给建议。请帮我看见：这三句话里，最有重量的是哪个词？然后一次只问我一个问题。",
  ].join("\n");
}

export function createAIConversationEntry({
  day,
  messages,
  title,
}: {
  day: number;
  messages: AIConversationMessage[];
  title?: string;
}): AIConversationEntry {
  const now = new Date().toISOString();
  return {
    createdAt: now,
    day,
    id: `ai-day-${day}-${Date.now()}`,
    messages,
    title: title || `Day ${String(day).padStart(2, "0")} AI 陪我看见`,
    updatedAt: now,
  };
}

export function summarizeAIConversation(entry: AIConversationEntry) {
  const assistant = [...entry.messages].reverse().find((message) => message.role === "assistant");
  const user = [...entry.messages].reverse().find((message) => message.role === "user");
  return (assistant?.content || user?.content || "这一天的对话还没有生成总结。").slice(0, 96);
}
