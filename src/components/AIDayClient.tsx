"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { LOCAL_PROFILE_KEY, LOCAL_PROGRESS_KEY, LOCAL_RESULT_KEY } from "@/lib/auth";
import { dayContents } from "@/lib/content";
import { dayAIPrompts } from "@/lib/ai-prompts";
import type { DayCompanion } from "@/lib/day-companion";
import {
  findTriggeredSister,
  getSisterProfile,
  LOCAL_SISTER_TRIGGER_LOG_KEY,
  sisterProfiles,
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
import { requiresMembershipForDay } from "@/lib/progress";

type Message = { role: "user" | "assistant"; content: string; createdAt?: string; kind?: "sister-trigger" };

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
  const [summaryNotice, setSummaryNotice] = useState("");
  const [reflectionSeeded, setReflectionSeeded] = useState(false);
  const [userName, setUserName] = useState("你");
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const day = dayContents.find((d) => d.day === dayNum) ?? {
    aiQuestion: "今天先写下一句最真实的话，我会陪你慢慢看见。",
    day: dayNum,
    title: `Day ${dayNum}`,
  };
  const prompts = dayAIPrompts[dayNum] ?? {
    description: "内容上线前，先用一句真实的话和自己保持连接。",
    id: "socratic" as const,
    method: "温柔自我看见",
    name: "温柔自我看见",
    systemPrompt: "请用温柔、简短的方式陪伴用户自我看见。每次只问一个问题，不急着给建议。",
  };
  const companionLabel = companion?.label ?? "🌿 成她";
  const companionName = (companion?.name ?? companionLabel.replace(/^[^\u4e00-\u9fa5A-Za-z]+/, "").trim()) || "成她";
  const companionSymbol = companion?.symbol ?? "🌿";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const profile = readJson<{ name?: string }>(LOCAL_PROFILE_KEY);
    setUserName(profile?.name?.trim() || "你");
  }, []);

  const initialQuestion = documentAiQuestion || day?.aiQuestion || "";

  useEffect(() => {
    if (!dayNum || reflectionSeeded || searchParams.get("from") !== "reflection") return;
    const entry = readLatestReflection(dayNum);
    if (!entry) return;
    setMessages([
      { role: "user", content: buildReflectionSeedMessage(entry), createdAt: new Date().toISOString() },
      {
        role: "assistant",
        content:
          "我看到你刚才写下来了。我们先不急着分析，也不急着解决。只看一个地方：这三句话里，最有重量的是哪个词？",
        createdAt: new Date().toISOString(),
      },
    ]);
    setReflectionSeeded(true);
  }, [dayNum, reflectionSeeded, searchParams]);

  async function send(text: string, forceMode?: "summarize") {
    if (!text.trim() || loading) return;
    if (!day || !dayNum) return;

    const mode = forceMode ?? (text.includes("总结") || text === "停" ? "summarize" : "chat");
    if (mode === "summarize" && messages.filter((message) => message.role === "user").length < 5) {
      setSummaryNotice("今日还没有跟我聊完五句哦。");
      return;
    }

    setSummaryNotice("");
    const userMsg: Message = { role: "user", content: text, createdAt: new Date().toISOString() };
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
        const nextUserCount = [...messages, userMsg].filter((message) => message.role === "user").length;
        const trigger = mode === "chat" && nextUserCount >= 5
          ? readSisterTrigger(text, dayNum, companion?.name)
          : null;
        const assistantMsg: Message = { role: "assistant", content: data.reply, createdAt: new Date().toISOString() };
        const triggerMsg: Message | null = trigger
          ? { role: "assistant", content: trigger.text, createdAt: new Date().toISOString(), kind: "sister-trigger" }
          : null;
        const nextMessages = triggerMsg ? [...messages, userMsg, assistantMsg, triggerMsg] : [...messages, userMsg, assistantMsg];
        setMessages((prev) => triggerMsg ? [...prev, assistantMsg, triggerMsg] : [...prev, assistantMsg]);
        saveAIConversation(dayNum, nextMessages, documentTitle || day.title);
        if (trigger) saveTriggerLog(dayNum, trigger.name);
        if (mode === "summarize") {
          setSummarized(true);
          setSummaryNotice("");
        }
      } else if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "AI 服务暂时没有返回内容，请稍后再试。", createdAt: new Date().toISOString() },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "抱歉，AI 服务暂时连接不上，请稍后再试。", createdAt: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 100) {
    return (
      <AuthGate requireMember={requiresMembershipForDay(dayNum)}>
        <main className="viewport grid place-items-center">
          <p className="text-clay">加载中……</p>
        </main>
      </AuthGate>
    );
  }

  return (
    <AuthGate requireMember={requiresMembershipForDay(dayNum)}>
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
            <div className="ai-chat__method-row">
              <span className="pill">{prompts.method}</span>
              {!summarized && (
                <span className="ai-chat__input-hint">可以先写一句最真实的话</span>
              )}
            </div>
          </div>

          <section className="ai-chat__conversation">
            <div className="mx-auto max-w-2xl">
              <header className="ai-chat__companion-header">
                <div className="ai-chat__companion-title">
                  <span aria-hidden>{companionSymbol}</span>
                  <h2>{companionName}</h2>
                </div>
                <div className="ai-chat__traits"><span>深度对话</span><span>安全空间</span><span>温柔支持</span></div>
              </header>

              <div className="mb-6 grid gap-3">
                <div className="flex items-start gap-3">
                  <CompanionAvatar symbol={companionSymbol} />
                  <div className="soft-panel ai-chat__bubble ai-chat__bubble--assistant flex-1 p-4">
                    <p className="leading-[1.85] text-[#4f3429]">
                      {reflectionSeeded
                        ? `${userName}，你已经带着刚才写下的内容进来了。我们先不急着分析，也不急着解决，只一起看见。`
                        : `${userName}，${initialQuestion}`}
                    </p>
                  </div>
                </div>
              </div>

              {messages.map((msg, i) => (
                <div key={i} className="mb-4 grid gap-3">
                  {msg.kind === "sister-trigger" ? (
                    <SisterTriggerNotice content={msg.content} />
                  ) : (
                  <div className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${
                        msg.role === "user" ? "ai-chat__user-avatar border-clay" : "border-clay text-clay"
                      } sans text-xs`}
                    >
                      {msg.role === "user" ? "✿" : companionSymbol}
                    </div>
                    <div className={`ai-chat__bubble flex-1 p-4 leading-[1.85] shadow-[0_10px_24px_rgba(91,56,44,.06)] ${
                      msg.role === "user" ? "border border-clay/10 bg-[#fff8ed]/76 text-right text-[#4f3429]" : "soft-panel text-[#4f3429]"
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <div className={`ai-chat__message-meta ${msg.role === "user" ? "is-user" : ""}`}>
                        <span>{formatChatTime(msg.createdAt)}</span>
                        {msg.role === "user" ? <span>✓ 已读</span> : null}
                      </div>
                    </div>
                  </div>
                  )}
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
                <div className="ai-chat__summary-card">
                  <p>
                    已生成总结，保存成功。<br />可返回今日内容继续其他环节。
                  </p>
                  <button
                    className="action-primary mt-3"
                    onClick={() => router.push(`/day/${dayNum}`)}
                    type="button"
                  >
                    返回今日内容 ♡
                  </button>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </section>

          {!summarized && (
            <footer className="ai-chat__composer">
              <div className="ai-chat__inputbar">
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
              </div>
              <button
                className="ai-chat__summarize"
                disabled={loading}
                onClick={() => send("总结", "summarize")}
                type="button"
              >
                总结并保存到成长档案
              </button>
              <p className="ai-chat__summary-hint">生成本次对话摘要，帮你更好地看见自己</p>
              {summaryNotice ? <span>{summaryNotice}</span> : null}
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

function SisterTriggerNotice({ content }: { content: string }) {
  const parsed = parseSisterTrigger(content);
  return (
    <div className="ai-chat__sister-trigger">
      <div className="ai-chat__sister-trigger-title"><i />姐妹触发<i /></div>
      <p className="ai-chat__sister-trigger-intro">你今天的话，让我想到了——</p>
      {parsed ? (
        <>
          <div className="ai-chat__sister-trigger-voice">
            <strong>{parsed.symbol} {parsed.name}</strong>
            <p>{parsed.dailyVoice}</p>
            {parsed.gift ? <small>礼物：{parsed.gift}</small> : null}
          </div>
          <p className="ai-chat__sister-trigger-to">致 {parsed.to}</p>
        </>
      ) : (
        <p className="ai-chat__sister-trigger-voice">{content}</p>
      )}
    </div>
  );
}

function parseSisterTrigger(content: string) {
  try {
    const parsed = JSON.parse(content) as {
      dailyVoice?: string;
      gift?: string;
      name?: string;
      symbol?: string;
      to?: string;
    };
    if (!parsed.name || !parsed.dailyVoice) return null;
    return {
      dailyVoice: parsed.dailyVoice,
      gift: parsed.gift ?? "",
      name: parsed.name,
      symbol: parsed.symbol ?? "🌿",
      to: parsed.to || "你",
    };
  } catch {
    const profile = sisterProfiles.find((item) => content.includes(item.name));
    if (!profile) return null;
    const to = content.match(/致\s*([^\s，。]+)/)?.[1] ?? "你";
    return {
      dailyVoice: profile.dailyVoice,
      gift: profile.gift,
      name: profile.name,
      symbol: profile.symbol,
      to,
    };
  }
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

function readSisterTrigger(message: string, day: number, forceName?: string) {
  const triggerLog = readJson<SisterTriggerLog>(LOCAL_SISTER_TRIGGER_LOG_KEY) ?? {};
  const progress = readJson<{ completedDays?: number[] }>(LOCAL_PROGRESS_KEY);
  const completedDays = Array.isArray(progress?.completedDays) ? progress.completedDays : [];
  const unlockedSisters = getUnlockedSisters(completedDays);
  const forcedProfile = forceName ? getSisterProfile(forceName) : null;
  const forcedCanTrigger = forcedProfile && !(triggerLog[String(day)] ?? []).includes(forcedProfile.name);
  const profile = forcedCanTrigger
    ? forcedProfile
    : findTriggeredSister({ day, message, triggerLog, unlockedSisters });
  if (!profile) return null;
  const context = readClientContext(day);
  return {
    name: profile.name,
    text: JSON.stringify({
      dailyVoice: profile.dailyVoice,
      gift: profile.gift,
      name: profile.name,
      symbol: profile.symbol,
      to: context.name,
    }),
  };
}

function saveTriggerLog(day: number, sisterName: string) {
  const triggerLog = readJson<SisterTriggerLog>(LOCAL_SISTER_TRIGGER_LOG_KEY) ?? {};
  const key = String(day);
  const values = triggerLog[key] ?? [];
  if (values.includes(sisterName)) return;
  window.localStorage.setItem(LOCAL_SISTER_TRIGGER_LOG_KEY, JSON.stringify({ ...triggerLog, [key]: [...values, sisterName] }));
}

function formatChatTime(value?: string) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
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
