"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { LOCAL_PROFILE_KEY, LOCAL_PROGRESS_KEY, LOCAL_RESULT_KEY } from "@/lib/auth";
import { dayContents } from "@/lib/content";
import { dayAIPrompts } from "@/lib/ai-prompts";
import type { DayCompanion } from "@/lib/day-companion";
import {
  buildSisterTriggerText,
  findTriggeredSister,
  LOCAL_SISTER_TRIGGER_LOG_KEY,
  type SisterTriggerLog,
} from "@/lib/sister-profiles";
import {
  AIConversationEntry,
  buildReflectionSeedMessage,
  createAIConversationEntry,
  LOCAL_AI_CONVERSATION_KEY,
  LOCAL_REFLECTION_KEY,
  SelfReflectionEntry,
} from "@/lib/self-reflection";
import { buildClientContext } from "@/lib/user-context";
import { MobileTopBar } from "@/components/MobileTopBar";

type Message = { role: "user" | "assistant"; content: string };

export function AIDayClient({
  companion,
  dayNum,
  documentAiQuestion,
  documentTitle,
}: {
  companion?: DayCompanion | null;
  dayNum: number;
  documentAiQuestion?: string;
  documentTitle?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [summarized, setSummarized] = useState(false);
  const [reflectionSeeded, setReflectionSeeded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const day = dayContents.find((d) => d.day === dayNum);
  const prompts = dayNum ? dayAIPrompts[dayNum] : null;
  const companionLabel = companion?.label ?? "🌿 成她";
  const companionSymbol = companion?.symbol ?? "🌿";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initialQuestion = documentAiQuestion || day?.aiQuestion || "";

  useEffect(() => {
    if (!dayNum || reflectionSeeded || searchParams.get("from") !== "reflection") return;
    const entry = readLatestReflection(dayNum);
    if (!entry) return;
    setMessages([
      { role: "user", content: buildReflectionSeedMessage(entry) },
      {
        role: "assistant",
        content:
          "我看到你刚才写下来了。我们先不急着分析，也不急着解决。只看一个地方：这三句话里，最有重量的是哪个词？",
      },
    ]);
    setReflectionSeeded(true);
  }, [dayNum, reflectionSeeded, searchParams]);

  async function send(text: string, forceMode?: "summarize") {
    if (!text.trim() || loading) return;
    if (!day || !dayNum) return;

    const mode = forceMode ?? (text.includes("总结") || text === "停" ? "summarize" : "chat");

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientContext: readClientContext(dayNum),
          companion,
          day: dayNum,
          messages: [...messages, userMsg],
          mode,
        }),
      });
      const data = await res.json();
      if (data.reply) {
        const trigger = mode === "chat" ? readSisterTrigger(text, dayNum) : null;
        const reply = trigger ? `${data.reply}\n\n${trigger.text}` : data.reply;
        const assistantMsg: Message = { role: "assistant", content: reply };
        const nextMessages = [...messages, userMsg, assistantMsg];
        setMessages((prev) => [...prev, assistantMsg]);
        saveAIConversation(dayNum, nextMessages, documentTitle || day.title);
        if (trigger) saveTriggerLog(dayNum, trigger.name);
        if (mode === "summarize") {
          setSummarized(true);
        }
      } else if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "AI 服务暂时没有返回内容，请稍后再试。" },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "抱歉，AI 服务暂时连接不上，请稍后再试。" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!day || !prompts) {
    return (
      <AuthGate>
        <main className="viewport grid place-items-center">
          <p className="text-clay">加载中……</p>
        </main>
      </AuthGate>
    );
  }

  return (
    <AuthGate>
      <main className="viewport botanical-page">
        <section className="paper-frame ai-chat">
          <MobileTopBar
            rightAction={
              <button
                className="mobile-topbar__action"
                onClick={() => router.push(`/day/${dayNum}`)}
                type="button"
              >
                返回内容
              </button>
            }
            title="跨时空的对话"
          />

          <div className="ai-chat__status">
            <div className="flex flex-wrap items-center gap-3">
              <span className="pill !border-clay/40 !bg-[#fff8ed] !text-[#5b382c]">今日陪你的人：{companionLabel}</span>
              <span className="pill">{prompts.method}</span>
              {!summarized && (
                <span className="sans text-xs text-[var(--muted)]">
                  输入「总结」可结束对话并保存
                </span>
              )}
            </div>
          </div>

          <section className="ai-chat__conversation">
            <div className="mx-auto max-w-2xl">
              <div className="mb-6 grid gap-3">
                <div className="flex items-start gap-3">
                  <CompanionAvatar symbol={companionSymbol} />
                  <div className="soft-panel ai-chat__bubble ai-chat__bubble--assistant flex-1 p-4">
                    <div className="sans mb-2 text-[11px] tracking-[0.08em] text-clay">{companionLabel} · 跨时空的对话</div>
                    <p className="leading-[1.85] text-[#4f3429]">
                      {reflectionSeeded
                        ? "你已经带着刚才写下的内容进来了。AI 会基于那段书写继续陪你看见。"
                        : initialQuestion}
                    </p>
                  </div>
                </div>
              </div>

              {messages.map((msg, i) => (
                <div key={i} className="mb-4 grid gap-3">
                  <div className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${
                        msg.role === "user" ? "border-ink bg-ink text-soft" : "border-clay text-clay"
                      } sans text-xs`}
                    >
                      {msg.role === "user" ? "我" : companionSymbol}
                    </div>
                    <div className={`ai-chat__bubble flex-1 p-4 leading-[1.85] shadow-[0_10px_24px_rgba(91,56,44,.06)] ${
                      msg.role === "user" ? "border border-clay/10 bg-[#fff8ed]/76 text-right text-[#4f3429]" : "soft-panel text-[#4f3429]"
                    }`}>
                      {msg.role === "assistant" ? (
                        <div className="sans mb-2 text-left text-[11px] uppercase tracking-[0.14em] text-clay">{companionLabel}</div>
                      ) : null}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="mb-4 flex items-start gap-3">
                  <CompanionAvatar symbol={companionSymbol} />
                  <div className="soft-panel ai-chat__bubble ai-chat__bubble--assistant flex-1 p-4">
                    <div className="sans mb-2 text-[11px] uppercase tracking-[0.14em] text-clay">{companionLabel}</div>
                    <p className="leading-[1.85] text-[var(--muted)]">……</p>
                  </div>
                </div>
              )}

              {summarized && (
                <div className="soft-panel mb-4 border border-clay/40 bg-clay/5 p-4 text-center">
                  <p className="sans text-sm text-clay">
                    已生成总结，保存成功。可返回今日内容继续其他环节。
                  </p>
                  <button
                    className="action-primary mt-3"
                    onClick={() => router.push(`/day/${dayNum}`)}
                    type="button"
                  >
                    返回今日内容
                  </button>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </section>

          {!summarized && (
            <footer className="ai-chat__composer">
              <input
                className="flex-1 bg-transparent py-4 text-lg text-ink outline-none placeholder:text-[var(--muted)]"
                placeholder="写下你的第一句话……"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                disabled={loading}
              />
              <button
                className="action-primary shrink-0"
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                type="button"
              >
                发送
              </button>
            </footer>
          )}
        </section>
      </main>
    </AuthGate>
  );
}

function CompanionAvatar({ symbol }: { symbol: string }) {
  return (
    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-clay/55 bg-[#fff8ed] sans text-sm text-clay shadow-[0_4px_12px_rgba(156,96,72,.12)]">
      {symbol}
    </div>
  );
}

function saveAIConversation(day: number, messages: Message[], title: string) {
  const raw = window.localStorage.getItem(LOCAL_AI_CONVERSATION_KEY);
  let entries: AIConversationEntry[] = [];

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      entries = Array.isArray(parsed) ? parsed : [];
    } catch {
      window.localStorage.removeItem(LOCAL_AI_CONVERSATION_KEY);
    }
  }

  const existing = entries.find((entry) => entry.day === day);
  const nextEntry = existing
    ? { ...existing, messages, title, updatedAt: new Date().toISOString() }
    : createAIConversationEntry({ day, messages, title });

  window.localStorage.setItem(
    LOCAL_AI_CONVERSATION_KEY,
    JSON.stringify([nextEntry, ...entries.filter((entry) => entry.day !== day)]),
  );
}

function readLatestReflection(day: number) {
  const raw = window.localStorage.getItem(LOCAL_REFLECTION_KEY);
  if (!raw) return null;

  try {
    const entries = JSON.parse(raw) as SelfReflectionEntry[];
    return Array.isArray(entries) ? entries.find((entry) => entry.day === day) ?? null : null;
  } catch {
    window.localStorage.removeItem(LOCAL_REFLECTION_KEY);
    return null;
  }
}

function readClientContext(currentDay: number) {
  return buildClientContext({
    assessment: readJson(LOCAL_RESULT_KEY),
    currentDay,
    profile: readJson(LOCAL_PROFILE_KEY),
    writingEntries: readJson<SelfReflectionEntry[]>(LOCAL_REFLECTION_KEY) ?? [],
    aiEntries: readJson<AIConversationEntry[]>(LOCAL_AI_CONVERSATION_KEY) ?? [],
  });
}

function readSisterTrigger(message: string, day: number) {
  const triggerLog = readJson<SisterTriggerLog>(LOCAL_SISTER_TRIGGER_LOG_KEY) ?? {};
  const progress = readJson<{ completedDays?: number[] }>(LOCAL_PROGRESS_KEY);
  const completedDays = Array.isArray(progress?.completedDays) ? progress.completedDays : [];
  const unlockedSisters = getUnlockedSisters(completedDays);
  const profile = findTriggeredSister({ day, message, triggerLog, unlockedSisters });
  if (!profile) return null;
  const context = readClientContext(day);
  return {
    name: profile.name,
    text: buildSisterTriggerText(profile, context.name),
  };
}

function saveTriggerLog(day: number, sisterName: string) {
  const triggerLog = readJson<SisterTriggerLog>(LOCAL_SISTER_TRIGGER_LOG_KEY) ?? {};
  const key = String(day);
  const values = triggerLog[key] ?? [];
  if (values.includes(sisterName)) return;
  window.localStorage.setItem(LOCAL_SISTER_TRIGGER_LOG_KEY, JSON.stringify({ ...triggerLog, [key]: [...values, sisterName] }));
}

function readJson<T>(key: string): T | null {
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

function getUnlockedSisters(completedDays: number[]) {
  const dayToSister: Record<number, string> = {
    1: "杨绛",
    2: "上野千鹤子",
    3: "苏敏",
    4: "张爱玲",
    5: "杨本芬",
    6: "李娟",
    7: "李清照",
  };
  return completedDays.map((day) => dayToSister[day]).filter(Boolean);
}
