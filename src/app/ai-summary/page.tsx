"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { dayContents } from "@/lib/content";
import {
  AIConversationEntry,
  LOCAL_AI_CONVERSATION_KEY,
  LOCAL_REFLECTION_KEY,
  SelfReflectionEntry,
  summarizeAIConversation,
  summarizeReflectionEntry,
} from "@/lib/self-reflection";

type Tab = "writing" | "ai";

export default function AiSummaryPage() {
  const [tab, setTab] = useState<Tab>("writing");
  const [entries, setEntries] = useState<SelfReflectionEntry[]>([]);
  const [aiEntries, setAiEntries] = useState<AIConversationEntry[]>([]);

  useEffect(() => {
    const raw = window.localStorage.getItem(LOCAL_REFLECTION_KEY);

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setEntries(Array.isArray(parsed) ? parsed : []);
      } catch {
        window.localStorage.removeItem(LOCAL_REFLECTION_KEY);
      }
    }

    const aiRaw = window.localStorage.getItem(LOCAL_AI_CONVERSATION_KEY);
    if (!aiRaw) return;
    try {
      const parsed = JSON.parse(aiRaw);
      setAiEntries(Array.isArray(parsed) ? parsed : []);
    } catch {
      window.localStorage.removeItem(LOCAL_AI_CONVERSATION_KEY);
    }
  }, []);

  const sortedEntries = useMemo(
    () =>
      [...entries].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [entries],
  );

  const latestEntry = sortedEntries[0];

  return (
    <AuthGate>
      <main className="viewport">
        <section className="paper-frame grid grid-rows-[64px_1fr]">
          <header className="topbar">
            <div className="brand">成她100</div>
            <span>我的匣子 · 自我看见记录</span>
            <Link className="action-ghost !px-3 !py-2 !text-xs" href="/treasure">
              返回匣子
            </Link>
          </header>

          <section className="min-h-0 overflow-y-auto">
            <div className="grid gap-8 px-[clamp(18px,4vw,52px)] py-[clamp(24px,4vw,48px)] lg:grid-cols-[0.84fr_1.16fr]">
              <aside className="grid content-start gap-5">
                <div>
                  <p className="sans mb-2 text-xs uppercase tracking-[0.26em] text-clay">
                    Reflection Archive
                  </p>
                  <h1 className="max-w-[9em] text-[clamp(42px,7vw,86px)] leading-[0.9] text-ink">
                    自我看见记录。
                  </h1>
                </div>
                <p className="max-w-sm leading-[1.9] text-[var(--muted)]">
                  这里不做流水账，只留下每天真正被触动的那一句、身体给出的信号，以及 AI
                  陪你看见后的线索。
                </p>

                <div className="grid grid-cols-3 border border-[var(--line)]">
                  <Metric label="书写" value={sortedEntries.length} />
                  <Metric label="AI 对话" value={aiEntries.length} />
                  <Metric label="本周回看" value={latestEntry ? 1 : 0} />
                </div>

                {latestEntry ? (
                  <div className="thin-panel bg-clay/5 p-5">
                    <p className="sans mb-2 text-xs uppercase tracking-[0.18em] text-clay">
                      最近一次
                    </p>
                    <p className="text-lg leading-relaxed text-[#3f281f]">
                      {summarizeReflectionEntry(latestEntry)}
                    </p>
                  </div>
                ) : null}
              </aside>

              <div className="grid content-start gap-4">
                <div className="flex flex-wrap gap-2">
                  <TabButton active={tab === "writing"} onClick={() => setTab("writing")}>
                    我的书写
                  </TabButton>
                  <TabButton active={tab === "ai"} onClick={() => setTab("ai")}>
                    AI 陪我看见
                  </TabButton>
                </div>

                {tab === "writing" ? (
                  <WritingRecords entries={sortedEntries} />
                ) : (
                  <AIRecords entries={aiEntries} />
                )}
              </div>
            </div>
          </section>
        </section>
      </main>
    </AuthGate>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-r border-[var(--line)] p-4 last:border-r-0">
      <p className="sans text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-3xl text-clay">{value}</p>
    </div>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`sans border px-4 py-2 text-xs uppercase tracking-[0.16em] transition ${
        active
          ? "border-clay bg-clay text-soft"
          : "border-[var(--line)] bg-soft text-[var(--muted)] hover:border-clay/50 hover:text-clay"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function WritingRecords({ entries }: { entries: SelfReflectionEntry[] }) {
  if (!entries.length) {
    return (
      <div className="thin-panel grid min-h-[360px] place-items-center p-8 text-center">
        <div className="max-w-sm">
          <p className="text-2xl text-ink">还没有保存书写。</p>
          <p className="mt-3 leading-[1.8] text-[var(--muted)]">
            从任意一天的故事页进入「今日自我看见」，写下三句话后，它会自动收进这里。
          </p>
          <Link className="action-primary mt-5 inline-flex" href="/day/1">
            去 Day 01 写下第一条
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {entries.map((entry) => {
        const day = dayContents.find((item) => item.day === entry.day);
        return (
          <article
            className="thin-panel grid gap-4 p-5 md:grid-cols-[120px_1fr]"
            key={entry.id}
          >
            <div>
              <p className="sans text-xs uppercase tracking-[0.18em] text-clay">
                Day {String(entry.day).padStart(2, "0")}
              </p>
              <p className="mt-2 text-xl leading-tight text-ink">{day?.title ?? "今日书写"}</p>
              <p className="sans mt-2 text-[11px] text-[var(--muted)]">
                {formatDate(entry.createdAt)}
              </p>
            </div>
            <div className="grid gap-3 text-sm leading-[1.85] text-[#4f3429]">
              <RecordLine label="戳到我的" value={entry.touched} />
              <RecordLine label="身体反应" value={entry.body} />
              <RecordLine label="我想说" value={entry.sentence} />
              <div className="border-t border-[var(--line)] pt-3 text-clay">
                {summarizeReflectionEntry(entry)}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function AIRecords({ entries }: { entries: AIConversationEntry[] }) {
  if (!entries.length) {
    return (
      <div className="thin-panel grid min-h-[360px] place-items-center p-8 text-center">
        <div className="max-w-sm">
          <p className="text-2xl text-ink">还没有 AI 对话记录。</p>
          <p className="mt-3 leading-[1.8] text-[var(--muted)]">
            从每天故事页写下「今日自我看见」后，点击「让 AI 陪我看见」，对话会收进这里。
          </p>
          <Link className="action-primary mt-5 inline-flex" href="/day/1">
            去 Day 01 开始
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {entries.map((record) => (
        <article className="thin-panel grid gap-3 p-5" key={record.day}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="sans text-xs uppercase tracking-[0.18em] text-clay">
                Day {String(record.day).padStart(2, "0")}
              </p>
              <h2 className="mt-1 text-2xl text-ink">{record.title}</h2>
            </div>
            <Link className="action-ghost !px-3 !py-2 !text-xs" href={`/day/${record.day}/ai`}>
              回到对话
            </Link>
          </div>
          <p className="leading-[1.85] text-[var(--muted)]">{summarizeAIConversation(record)}</p>
        </article>
      ))}

      <div className="border border-clay/30 bg-clay/5 p-5">
        <p className="sans mb-2 text-xs uppercase tracking-[0.18em] text-clay">
          Weekly Review
        </p>
        <p className="text-xl leading-relaxed text-[#3f281f]">
          每 7 天可以把这一周的书写和 AI 对话一起交给 AI，生成一份「这一周我更看见了什么」。
        </p>
        <p className="mt-3 text-sm leading-[1.8] text-[var(--muted)]">
          后续接入真实 AI 存储后，这里会自动汇总你的书写关键词、重复出现的情绪、最常被触发的关系场景，以及下一周最适合练习的一句话。
        </p>
      </div>
    </div>
  );
}

function RecordLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="sans text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
        {label}
      </span>
      <span>{value || "还没有写下这一项。"}</span>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
