"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { dayContents } from "@/lib/content";
import { dayAIPrompts } from "@/lib/ai-prompts";

type Message = { role: "user" | "assistant"; content: string };

type PageProps = { params: Promise<{ day: string }> };

export default function AIDayPage({ params }: PageProps) {
  const [dayNum, setDayNum] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [summarized, setSummarized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    params.then(({ day }) => setDayNum(Number(day)));
  }, [params]);

  const day = dayContents.find((d) => d.day === dayNum);
  const prompts = dayNum ? dayAIPrompts[dayNum] : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initialQuestion = day?.aiQuestion ?? "";

  async function send(text: string, forceMode?: "summarize") {
    if (!text.trim() || loading) return;

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
          day: dayNum,
          messages: [...messages, userMsg],
          mode,
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        if (mode === "summarize") {
          setSummarized(true);
        }
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
      <main className="viewport">
        <section className="paper-frame grid grid-rows-[54px_1fr_56px]">
          <header className="topbar !h-[54px]">
            <div className="brand">成她100</div>
            <span>Day {String(day.day).padStart(2, "0")} · AI 对话</span>
            <div className="flex items-center gap-2">
              <button
                className="action-ghost !px-3 !py-2 !text-xs"
                onClick={() => router.push(`/day/${dayNum}`)}
                type="button"
              >
                返回
              </button>
            </div>
          </header>

          <div className="border-b border-[var(--line)] bg-ink/3 px-[clamp(18px,2.4vw,28px)] py-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="pill">{prompts.method}</span>
              {!summarized && (
                <span className="sans text-xs text-[var(--muted)]">
                  输入「总结」可结束对话并保存
                </span>
              )}
            </div>
          </div>

          <section className="min-h-0 overflow-y-auto p-[clamp(18px,2.4vw,28px)]">
            <div className="mx-auto max-w-2xl">
              <div className="mb-6 grid gap-3">
                <div className="flex items-start gap-3">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-clay sans text-xs text-clay">
                    AI
                  </div>
                  <div className="thin-panel flex-1 p-4">
                    <p className="leading-[1.85] text-[#4f3429]">{initialQuestion}</p>
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
                      {msg.role === "user" ? "我" : "AI"}
                    </div>
                    <div className={`flex-1 p-4 leading-[1.85] ${
                      msg.role === "user" ? "bg-ink/5 text-right" : "thin-panel text-[#4f3429]"
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="mb-4 flex items-start gap-3">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-clay sans text-xs text-clay">
                    AI
                  </div>
                  <div className="thin-panel flex-1 p-4">
                    <p className="leading-[1.85] text-[var(--muted)]">……</p>
                  </div>
                </div>
              )}

              {summarized && (
                <div className="thin-panel mb-4 border border-clay/40 bg-clay/5 p-4 text-center">
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
            <footer className="flex items-center gap-3 border-t border-[var(--line)] px-[clamp(18px,2.4vw,28px)]">
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