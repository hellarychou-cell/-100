import { NextRequest, NextResponse } from "next/server";
import type { DayCompanion } from "@/lib/day-companion";
import { dayAIPrompts } from "@/lib/ai-prompts";
import { createLocalAIReply } from "@/lib/ai-local-fallback";
import { buildContextPrompt, type ClientContext } from "@/lib/user-context";

const SUMMARIZE_PROMPT = "请帮我总结一下这段对话里我发现了什么，以及还有哪些地方值得继续探索。";

const MINIMAX_API_URL = "https://api.minimax.chat/v1/text/chatcompletion_v2";
const MINIMAX_MODEL = "MiniMax-Text-01";

type Message = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  const { clientContext, companion, day, messages, mode } = await req.json();

  if (!day || !messages) {
    return NextResponse.json({ error: "Missing day or messages" }, { status: 400 });
  }

  const dayNum = Number(day);
  const promptConfig = dayAIPrompts[dayNum];

  if (!promptConfig) {
    return NextResponse.json({ error: "No AI prompt config for this day" }, { status: 400 });
  }

  const apiKey = process.env.MINIMAX_API_KEY;
  const contextPrompt = buildContextPrompt(clientContext as ClientContext | undefined);
  const companionPrompt = buildCompanionPrompt(companion as DayCompanion | null | undefined);
  const historyMsgs: Message[] = messages.map((m: { role: string; content: string }) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
  const lastUserMsg = [...historyMsgs].reverse().find((m) => m.role === "user");

  if (!apiKey) {
    if (isLocalFallbackEnabled()) {
      return NextResponse.json({
        reply: createLocalAIReply({
          companionLabel: (companion as DayCompanion | null | undefined)?.label,
          mode,
          userName: (clientContext as ClientContext | undefined)?.name,
          userText: lastUserMsg?.content,
        }),
        source: "local-fallback",
      });
    }
    return NextResponse.json({ error: "MINIMAX_API_KEY not configured" }, { status: 500 });
  }

  // 构建请求消息
  const systemMsg = {
    role: "system" as const,
    content: [contextPrompt, companionPrompt, promptConfig.systemPrompt].filter(Boolean).join("\n\n"),
  };

  let userContent = "";
  if (mode === "summarize") {
    userContent = SUMMARIZE_PROMPT;
  } else {
    userContent = lastUserMsg?.content ?? "";
  }

  const requestMessages = [systemMsg, ...historyMsgs, { role: "user" as const, content: userContent }];

  try {
    const response = await fetch(MINIMAX_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MINIMAX_MODEL,
        messages: requestMessages,
        tokens_to_generate: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("MiniMax API error:", response.status, errorText);
      if (isLocalFallbackEnabled()) {
        return NextResponse.json({
          reply: createLocalAIReply({
            companionLabel: (companion as DayCompanion | null | undefined)?.label,
            mode,
            userName: (clientContext as ClientContext | undefined)?.name,
            userText: lastUserMsg?.content,
          }),
          source: "local-fallback",
        });
      }
      return NextResponse.json({ error: "AI service error" }, { status: 502 });
    }

    const data = await response.json();
    const reply = extractMiniMaxReply(data);
    if (!reply && isLocalFallbackEnabled()) {
      return NextResponse.json({
        reply: createLocalAIReply({
          companionLabel: (companion as DayCompanion | null | undefined)?.label,
          mode,
          userName: (clientContext as ClientContext | undefined)?.name,
          userText: lastUserMsg?.content,
        }),
        source: "local-fallback",
      });
    }
    if (!reply) {
      console.error("MiniMax returned no text", summarizeMiniMaxShape(data));
      return NextResponse.json({ error: "AI service returned empty content" }, { status: 502 });
    }

    return NextResponse.json({ reply });
  } catch (e) {
    console.error("MiniMax request failed", e);
    if (isLocalFallbackEnabled()) {
      return NextResponse.json({
        reply: createLocalAIReply({
          companionLabel: (companion as DayCompanion | null | undefined)?.label,
          mode,
          userName: (clientContext as ClientContext | undefined)?.name,
          userText: lastUserMsg?.content,
        }),
        source: "local-fallback",
      });
    }
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}

function extractMiniMaxReply(data: unknown) {
  if (!data || typeof data !== "object") return "";
  const payload = data as {
    choices?: Array<{
      message?: { content?: unknown };
      messages?: Array<{ content?: unknown; text?: unknown }>;
      text?: unknown;
      content?: unknown;
    }>;
    reply?: unknown;
    output_text?: unknown;
    text?: unknown;
  };

  const choice = payload.choices?.[0];
  const candidates = [
    choice?.message?.content,
    choice?.messages?.[0]?.content,
    choice?.messages?.[0]?.text,
    choice?.text,
    choice?.content,
    payload.reply,
    payload.output_text,
    payload.text,
  ];

  return candidates.find((item): item is string => typeof item === "string" && item.trim().length > 0)?.trim() ?? "";
}

function summarizeMiniMaxShape(data: unknown) {
  if (!data || typeof data !== "object") return "non-object";
  const payload = data as { choices?: unknown; [key: string]: unknown };
  const choice = Array.isArray(payload.choices) ? payload.choices[0] : undefined;
  return {
    keys: Object.keys(payload),
    choiceKeys: choice && typeof choice === "object" ? Object.keys(choice) : [],
  };
}

function isLocalFallbackEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.ENABLE_LOCAL_AI_FALLBACK === "true";
}

function buildCompanionPrompt(companion?: DayCompanion | null) {
  if (!companion) return "";
  return [
    "本页是一场“跨时空的对话”。",
    `当前用于陪伴用户的女性力量意象是：${companion.name}。`,
    companion.field ? `人物领域/时代：${companion.field}。` : "",
    companion.cardType ? `当天卡片类型：${companion.cardType}。` : "",
    companion.quoteSource ? `当天金句来源：${companion.quoteSource}。` : "",
    "请借由这位女性力量的气质陪用户看见自己，但不要声称你就是该真实人物本人，也不要编造真实人物未说过的事实或经历。",
    "回答仍保持成她100的风格：温柔、具体、一次只问一个问题。",
  ]
    .filter(Boolean)
    .join("\n");
}
