import { NextRequest, NextResponse } from "next/server";
import { dayAIPrompts, SUMMARIZE_PROMPT } from "@/lib/ai-prompts";

const MINIMAX_API_URL = "https://api.minimax.chat/v1/text/chatcompletion_v2";
const MINIMAX_MODEL = "MiniMax-Text-01";

type Message = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  const { day, messages, mode } = await req.json();

  if (!day || !messages) {
    return NextResponse.json({ error: "Missing day or messages" }, { status: 400 });
  }

  const dayNum = Number(day);
  const promptConfig = dayAIPrompts[dayNum];

  if (!promptConfig) {
    return NextResponse.json({ error: "No AI prompt config for this day" }, { status: 400 });
  }

  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "MINIMAX_API_KEY not configured" }, { status: 500 });
  }

  // 构建请求消息
  const systemMsg = { role: "system" as const, content: promptConfig.systemPrompt };
  const historyMsgs: Message[] = messages.map((m: { role: string; content: string }) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  let userContent = "";
  if (mode === "summarize") {
    userContent = SUMMARIZE_PROMPT;
  } else {
    const lastUserMsg = [...historyMsgs].reverse().find((m) => m.role === "user");
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
      return NextResponse.json({ error: "AI service error" }, { status: 502 });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.messages?.[0]?.content ?? "";

    return NextResponse.json({ reply });
  } catch (e) {
    console.error("MiniMax request failed", e);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}