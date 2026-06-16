"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { LOCAL_PROFILE_KEY, LOCAL_RESULT_KEY } from "@/lib/auth";
import { dayContents } from "@/lib/content";
import { createGrowthProfile } from "@/lib/growth-archive";
import {
  AIConversationEntry,
  LOCAL_AI_CONVERSATION_KEY,
  LOCAL_REFLECTION_KEY,
  SelfReflectionEntry,
  summarizeAIConversation,
  summarizeReflectionEntry,
} from "@/lib/self-reflection";
import { buildClientContext } from "@/lib/user-context";

type Tab = "writing" | "ai" | "profile";

export function GrowthArchiveClient() {
  const [tab, setTab] = useState<Tab>("writing");
  const [entries, setEntries] = useState<SelfReflectionEntry[]>([]);
  const [aiEntries, setAiEntries] = useState<AIConversationEntry[]>([]);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [assessment, setAssessment] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    setEntries(readLocalArray<SelfReflectionEntry>(LOCAL_REFLECTION_KEY));
    setAiEntries(readLocalArray<AIConversationEntry>(LOCAL_AI_CONVERSATION_KEY));
    setProfile(readJson(LOCAL_PROFILE_KEY));
    setAssessment(readJson(LOCAL_RESULT_KEY));
  }, []);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [entries],
  );
  const sortedAiEntries = useMemo(
    () => [...aiEntries].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [aiEntries],
  );
  const context = useMemo(
    () =>
      buildClientContext({
        assessment,
        currentDay: Math.max(1, ...entries.map((entry) => entry.day), ...aiEntries.map((entry) => entry.day)),
        profile,
        writingEntries: sortedEntries,
        aiEntries: sortedAiEntries,
      }),
    [aiEntries, assessment, entries, profile, sortedAiEntries, sortedEntries],
  );
  const growthProfile = useMemo(() => createGrowthProfile({ context }), [context]);
  const latestEntry = sortedEntries[0];
  const totalArchiveCount = sortedEntries.length + sortedAiEntries.length;

  return (
    <AuthGate>
      <main className="viewport">
        <section className="paper-frame grid grid-rows-[64px_1fr]">
          <header className="topbar">
            <div className="brand">成她100</div>
            <span>我的匣子 · 成长档案</span>
            <Link className="action-ghost !px-3 !py-2 !text-xs" href="/treasure">
              返回匣子
            </Link>
          </header>

          <section className="min-h-0 overflow-y-auto">
            <div className="grid gap-8 px-[clamp(18px,4vw,52px)] py-[clamp(24px,4vw,48px)] lg:grid-cols-[0.84fr_1.16fr]">
              <aside className="grid content-start gap-5">
                <div>
                  <p className="sans mb-2 text-xs uppercase tracking-[0.26em] text-clay">Growth Archive</p>
                  <h1 className="max-w-[8em] text-[clamp(42px,7vw,86px)] leading-[0.9] text-ink">
                    成长档案。
                  </h1>
                </div>
                <p className="max-w-sm leading-[1.9] text-[var(--muted)]">
                  这里不做流水账。它只帮你把反复出现的场景、身体给出的信号，以及 AI
                  陪你看见后的线索，慢慢收起来。
                </p>

                <div className="grid grid-cols-3 border border-[var(--line)]">
                  <Metric label="书写" value={sortedEntries.length} />
                  <Metric label="AI 对话" value={sortedAiEntries.length} />
                  <Metric label="已留下" value={totalArchiveCount} />
                </div>

                {latestEntry ? (
                  <div className="thin-panel bg-clay/5 p-5">
                    <p className="sans mb-2 text-xs uppercase tracking-[0.18em] text-clay">最近一次</p>
                    <p className="text-lg leading-relaxed text-[#3f281f]">{summarizeReflectionEntry(latestEntry)}</p>
                  </div>
                ) : null}
              </aside>

              <div className="grid content-start gap-4">
                <div className="flex flex-wrap gap-2">
                  <TabButton active={tab === "writing"} onClick={() => setTab("writing")}>我的书写</TabButton>
                  <TabButton active={tab === "ai"} onClick={() => setTab("ai")}>AI 陪我看见</TabButton>
                  <TabButton active={tab === "profile"} onClick={() => setTab("profile")}>成长画像</TabButton>
                </div>

                {tab === "writing" ? <WritingRecords entries={sortedEntries} /> : null}
                {tab === "ai" ? <AIRecords entries={sortedAiEntries} /> : null}
                {tab === "profile" ? <GrowthProfilePanel profile={growthProfile} /> : null}
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

function TabButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      className={`sans border px-4 py-2 text-xs uppercase tracking-[0.16em] transition ${
        active ? "border-clay bg-clay text-soft" : "border-[var(--line)] bg-soft text-[var(--muted)] hover:border-clay/50 hover:text-clay"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function WritingRecords({ entries }: { entries: SelfReflectionEntry[] }) {
  if (!entries.length) return <EmptyArchive title="还没有保存书写。" href="/day/1" action="去 Day 01 写下第一条" />;
  return (
    <div className="grid gap-3">
      {entries.map((entry) => {
        const day = dayContents.find((item) => item.day === entry.day);
        return (
          <article className="thin-panel grid gap-4 p-5 md:grid-cols-[120px_1fr]" key={entry.id}>
            <div>
              <p className="sans text-xs uppercase tracking-[0.18em] text-clay">Day {String(entry.day).padStart(2, "0")}</p>
              <p className="mt-2 text-xl leading-tight text-ink">{day?.title ?? "今日书写"}</p>
              <p className="sans mt-2 text-[11px] text-[var(--muted)]">{formatDate(entry.createdAt)}</p>
            </div>
            <div className="grid gap-3 text-sm leading-[1.85] text-[#4f3429]">
              <RecordLine label="戳到我的" value={entry.touched} />
              <RecordLine label="身体反应" value={entry.body} />
              <RecordLine label="我想说" value={entry.sentence} />
              <div className="border-t border-[var(--line)] pt-3 text-clay">{summarizeReflectionEntry(entry)}</div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function AIRecords({ entries }: { entries: AIConversationEntry[] }) {
  if (!entries.length) return <EmptyArchive title="还没有 AI 对话记录。" href="/day/1" action="去 Day 01 开始" />;
  return (
    <div className="grid gap-3">
      {entries.map((record) => (
        <article className="thin-panel grid gap-3 p-5" key={record.id}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="sans text-xs uppercase tracking-[0.18em] text-clay">Day {String(record.day).padStart(2, "0")}</p>
              <h2 className="mt-1 text-2xl text-ink">{record.title}</h2>
            </div>
            <Link className="action-ghost !px-3 !py-2 !text-xs" href={`/day/${record.day}/ai`}>回到对话</Link>
          </div>
          <p className="leading-[1.85] text-[var(--muted)]">{summarizeAIConversation(record)}</p>
        </article>
      ))}
    </div>
  );
}

function GrowthProfilePanel({ profile }: { profile: ReturnType<typeof createGrowthProfile> }) {
  return (
    <div className="grid gap-4">
      <section className="thin-panel bg-[#fff8ed] p-6">
        <p className="sans text-xs uppercase tracking-[0.18em] text-clay">{profile.walkedDays} days</p>
        <h2 className="mt-2 text-4xl font-normal text-ink">{profile.name}的成长画像</h2>
        <p className="mt-3 max-w-xl leading-[1.85] text-[#563a2e]">
          它不是评判，只是把你反复写下来的东西放到一起，让你看见：有些旧声音，已经开始松动了。
        </p>
      </section>
      <ArchiveList title="反复出现的场景" empty="还没有足够记录。" items={profile.repeatedScenes.map((item) => `${item.name} · ${item.count} 次`)} />
      <ArchiveList title="高频情绪词" empty="还没有明显高频词。" items={profile.emotionWords.map((item) => `${item.word} · ${item.count} 次`)} />
      <ArchiveList title="最近开始松动的" empty="先留下几段书写，这里会慢慢长出来。" items={profile.latestLoosened} />
      <section className="thin-panel p-5">
        <p className="sans mb-2 text-xs uppercase tracking-[0.18em] text-clay">最近触动你的一句</p>
        <p className="text-xl leading-relaxed text-[#3f281f]">“{profile.latestTouchedSentence}”</p>
      </section>
    </div>
  );
}

function ArchiveList({ empty, items, title }: { empty: string; items: string[]; title: string }) {
  return (
    <section className="thin-panel p-5">
      <p className="sans mb-3 text-xs uppercase tracking-[0.18em] text-clay">{title}</p>
      {items.length ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => <span className="pill" key={item}>{item}</span>)}
        </div>
      ) : (
        <p className="m-0 text-[var(--muted)]">{empty}</p>
      )}
    </section>
  );
}

function EmptyArchive({ action, href, title }: { action: string; href: string; title: string }) {
  return (
    <div className="thin-panel grid min-h-[360px] place-items-center p-8 text-center">
      <div className="max-w-sm">
        <p className="text-2xl text-ink">{title}</p>
        <p className="mt-3 leading-[1.8] text-[var(--muted)]">从任意一天的故事页进入「今日自我看见」，写下三句话后，它会自动收进这里。</p>
        <Link className="action-primary mt-5 inline-flex" href={href}>{action}</Link>
      </div>
    </div>
  );
}

function RecordLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="sans text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">{label}</span>
      <span>{value || "还没有写下这一项。"}</span>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { day: "2-digit", hour: "2-digit", minute: "2-digit", month: "2-digit" }).format(new Date(value));
}

function readLocalArray<T>(key: string): T[] {
  const parsed = readJson<T[]>(key);
  return Array.isArray(parsed) ? parsed : [];
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
