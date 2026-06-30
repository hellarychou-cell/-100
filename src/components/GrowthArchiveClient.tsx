"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { LOCAL_PROFILE_KEY, LOCAL_RESULT_KEY } from "@/lib/auth";
import { dayContents } from "@/lib/content";
import { createGrowthDimensionInsight, createGrowthProfile } from "@/lib/growth-archive";
import {
  AIConversationEntry,
  LOCAL_AI_CONVERSATION_KEY,
  LOCAL_REFLECTION_KEY,
  SelfReflectionEntry,
  summarizeAIConversation,
  summarizeReflectionEntry,
} from "@/lib/self-reflection";
import { buildClientContext } from "@/lib/user-context";
import { readAwakeningTheaterChoices, summarizeTheaterChoice, type AwakeningTheaterChoice } from "@/lib/awakening-theater";
import { MobileTopBar } from "@/components/MobileTopBar";
import { loadGrowthRecords } from "@/lib/growth-records";

type Tab = "writing" | "ai" | "profile";

export function GrowthArchiveClient() {
  const [tab, setTab] = useState<Tab>("profile");
  const [entries, setEntries] = useState<SelfReflectionEntry[]>([]);
  const [aiEntries, setAiEntries] = useState<AIConversationEntry[]>([]);
  const [theaterChoices, setTheaterChoices] = useState<AwakeningTheaterChoice[]>([]);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [assessment, setAssessment] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadGrowthRecords().then((records) => {
      if (cancelled) return;
      setEntries(records.reflections);
      setAiEntries(records.aiEntries);
      setTheaterChoices(records.theaterChoices);
    }).catch(() => {
      if (cancelled) return;
      setEntries(readLocalArray<SelfReflectionEntry>(LOCAL_REFLECTION_KEY));
      setAiEntries(readLocalArray<AIConversationEntry>(LOCAL_AI_CONVERSATION_KEY));
      setTheaterChoices(Object.values(readAwakeningTheaterChoices()));
    });
    setProfile(readJson(LOCAL_PROFILE_KEY));
    setAssessment(readJson(LOCAL_RESULT_KEY));
    return () => {
      cancelled = true;
    };
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
  const sortedTheaterChoices = useMemo(
    () => [...theaterChoices].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [theaterChoices],
  );
  const growthProfile = useMemo(() => createGrowthProfile({ context }), [context]);
  const latestEntry = sortedEntries[0];
  const totalArchiveCount = sortedEntries.length + sortedAiEntries.length + sortedTheaterChoices.length;

  return (
    <AuthGate>
      <main className="viewport">
        <section className="paper-frame growth-archive grid grid-rows-[56px_1fr]">
          <MobileTopBar
            rightAction={<Link className="mobile-topbar__action" href="/treasure">返回匣子</Link>}
            title="成长档案"
          />

          <section className="min-h-0 overflow-y-auto">
            <div className="growth-archive__content">
              <aside className="growth-archive__hero">
                <div>
                  <p className="sans mb-2 text-xs uppercase tracking-[0.26em] text-clay">Growth Archive</p>
                  <h1 className="max-w-[8em] text-[clamp(42px,7vw,86px)] leading-[0.9] text-ink">
                    成长档案。
                  </h1>
                </div>
                <p className="growth-archive__hero-copy max-w-sm leading-[1.9] text-[var(--muted)]">
                  这里不做流水账。它只帮你把反复出现的场景、身体信号和 AI 陪你看见的线索，慢慢收起来。
                </p>

                <div className="growth-archive__summary">
                  <Metric icon="✍" label="书写" unit="篇记录" value={sortedEntries.length + sortedTheaterChoices.length} />
                  <Metric icon="☵" label="AI 对话" unit="次深度对话" value={sortedAiEntries.length} />
                  <Metric icon="▥" label="已留下" unit="个线索" value={totalArchiveCount} />
                </div>

                {latestEntry ? (
                  <div className="growth-archive__latest thin-panel bg-clay/5 p-5">
                    <p className="sans mb-2 text-xs uppercase tracking-[0.18em] text-clay">最近一次</p>
                    <p className="text-lg leading-relaxed text-[#3f281f]">{summarizeReflectionEntry(latestEntry)}</p>
                  </div>
                ) : null}
              </aside>

              <div className="growth-archive__records">
                <div className="growth-archive__tabs">
                  <TabButton active={tab === "writing"} onClick={() => setTab("writing")}>我的书写</TabButton>
                  <TabButton active={tab === "ai"} onClick={() => setTab("ai")}>AI 陪我看见</TabButton>
                  <TabButton active={tab === "profile"} onClick={() => setTab("profile")}>成长画像</TabButton>
                </div>

                {tab === "writing" ? <WritingRecords entries={sortedEntries} theaterChoices={sortedTheaterChoices} /> : null}
                {tab === "ai" ? <AIRecords entries={sortedAiEntries} /> : null}
                {tab === "profile" ? (
                  <GrowthProfilePanel
                    aiEntries={sortedAiEntries}
                    assessment={assessment}
                    entries={sortedEntries}
                    profile={growthProfile}
                    setTab={setTab}
                  />
                ) : null}
              </div>
            </div>
          </section>
        </section>
      </main>
    </AuthGate>
  );
}

function Metric({ icon, label, unit, value }: { icon: string; label: string; unit: string; value: number }) {
  return (
    <div className="border-r border-[var(--line)] p-4 last:border-r-0">
      <span aria-hidden>{icon}</span>
      <p>{label}</p>
      <p><strong>{value}</strong> {unit}</p>
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

function WritingRecords({ entries, theaterChoices }: { entries: SelfReflectionEntry[]; theaterChoices: AwakeningTheaterChoice[] }) {
  if (!entries.length && !theaterChoices.length) return <EmptyArchive title="还没有保存书写。" href="/day/1" action="去 Day 01 写下第一条" />;
  return (
    <div className="growth-archive-list growth-archive-list--writing">
      <header>
        <span aria-hidden>✍</span>
        <div>
          <h2>我的书写</h2>
          <p>每一天被你写下来的感受，都会变成成长画像里的线索。</p>
        </div>
      </header>
      {theaterChoices.map((choice) => {
        const day = dayContents.find((item) => item.day === choice.day);
        return (
          <article className="growth-archive-list__card" key={`theater-${choice.day}`}>
            <div className="growth-archive-list__meta">
              <span>Day {String(choice.day).padStart(2, "0")}</span>
              <strong>{day?.title ?? "觉醒剧场"}</strong>
              <time>{formatDate(choice.updatedAt)}</time>
            </div>
            <div className="growth-archive-list__body">
              <RecordLine label="觉醒剧场" value={summarizeTheaterChoice(choice)} />
              <RecordLine label="选择" value={[choice.firstChoice, choice.secondChoice].filter(Boolean).join(" + ")} />
            </div>
          </article>
        );
      })}
      {entries.map((entry) => {
        const day = dayContents.find((item) => item.day === entry.day);
        return (
          <article className="growth-archive-list__card" key={entry.id}>
            <div className="growth-archive-list__meta">
              <span>Day {String(entry.day).padStart(2, "0")}</span>
              <strong>{day?.title ?? "今日书写"}</strong>
              <time>{formatDate(entry.createdAt)}</time>
            </div>
            <div className="growth-archive-list__body">
              <RecordLine label="戳到我的" value={entry.touched} />
              <RecordLine label="身体反应" value={entry.body} />
              <RecordLine label="我想说" value={entry.sentence} />
              <p className="growth-archive-list__summary">{summarizeReflectionEntry(entry)}</p>
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
    <div className="growth-archive-list growth-archive-list--ai">
      <header>
        <span aria-hidden>☵</span>
        <div>
          <h2>AI 陪我看见</h2>
          <p>这些不是聊天记录备份，而是那些被陪你慢慢说清楚的时刻。</p>
        </div>
      </header>
      {entries.map((record) => (
        <article className="growth-archive-list__card" key={record.id}>
          <div className="growth-archive-list__meta">
            <span>Day {String(record.day).padStart(2, "0")}</span>
            <strong>{record.title}</strong>
            <time>{formatDate(record.updatedAt)}</time>
          </div>
          <div className="growth-archive-list__body">
            <p>{summarizeAIConversation(record)}</p>
            <div>
              <Link className="growth-archive-list__link" href={`/day/${record.day}/ai`}>回到这次对话 ›</Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function GrowthProfilePanel({
  aiEntries,
  assessment,
  entries,
  profile,
  setTab,
}: {
  aiEntries: AIConversationEntry[];
  assessment: Record<string, unknown> | null;
  entries: SelfReflectionEntry[];
  profile: ReturnType<typeof createGrowthProfile>;
  setTab: (tab: Tab) => void;
}) {
  const [openDimension, setOpenDimension] = useState<string | null>(null);
  const dimensions = getGrowthDimensions(assessment);
  const sceneItems = profile.repeatedScenes.length
    ? profile.repeatedScenes.slice(0, 3).map((item) => `${item.name}　${item.count}次`)
    : ["原生家庭　0次", "客户关系　0次", "同辈对比　0次"];
  const emotionItems = profile.emotionWords.length
    ? profile.emotionWords.slice(0, 4).map((item) => item.word)
    : ["累", "不知道怎么办", "想哭", "烦"];
  const loosenedItems = profile.latestLoosened.length
    ? profile.latestLoosened.slice(0, 3)
    : ["开始允许自己停一下", "表达边界", "把感受说出来"];
  const walkedDays = Math.max(0, Math.min(100, profile.walkedDays));

  return (
    <div className="growth-profile-panel">
      <section className="growth-profile-panel__dimensions">
        <header>
          <div><span aria-hidden>🌿</span><h2>{profile.name}的成长画像</h2></div>
          <p><span>一起点 (Day 01)</span><span>现在 (Day {String(Math.max(profile.walkedDays + 1, 1)).padStart(2, "0")})</span></p>
        </header>
        <small>走过 {profile.walkedDays} 天 · 已收进 {entries.length + aiEntries.length} 条线索</small>
        <div className="growth-profile-panel__overview">
          <span>当前关键词</span>
          <strong>{emotionItems.slice(0, 2).join(" · ")}</strong>
          <em>{profile.repeatedScenes[0]?.name ?? "正在形成"}</em>
        </div>
        <div className="growth-profile-panel__dimension-list">
          {dimensions.map((item) => {
            const isOpen = openDimension === item.name;
            return (
              <div className="growth-profile-panel__dimension-wrap" key={item.name}>
                <button
                  className={`growth-profile-panel__dimension growth-profile-panel__dimension--${item.tone}`}
                  onClick={() => setOpenDimension(isOpen ? null : item.name)}
                  type="button"
                >
                  <span aria-hidden>{item.icon}</span>
                  <p><strong>{item.name}</strong> {item.range}</p>
                  <i
                    aria-label={`${item.name} 从 ${item.initialScore} 到 ${item.score}`}
                    style={{
                      "--current-score": `${item.score}%`,
                      "--future-score": `${item.futureScore}%`,
                      "--initial-score": `${item.initialScore}%`,
                    } as CSSProperties}
                  >
                    <b />
                    <span />
                  </i>
                  <em>{isOpen ? "⌄" : "›"}</em>
                </button>
                {isOpen ? (
                  <p className="growth-profile-panel__dimension-insight">
                    {createGrowthDimensionInsight({
                      aiCount: aiEntries.length,
                      currentScore: item.score,
                      initialScore: item.initialScore,
                      name: item.name,
                      walkedDays: profile.walkedDays,
                      writingCount: entries.length,
                    })}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="growth-profile-panel__journey">
          <span>起点</span>
          <strong style={{ width: `${walkedDays}%` }} />
          <span>Day {String(Math.max(profile.walkedDays + 1, 1)).padStart(2, "0")}</span>
        </div>
      </section>

      <section className="growth-profile-panel__signals">
        <SignalCard className="is-scenes" icon="🌿" items={sceneItems} title="反复出现的场景" />
        <SignalCard className="is-emotions" icon="✓" items={emotionItems} title="高频情绪词" />
        <SignalCard className="is-loosened" icon="🌿" items={loosenedItems} title="最近开始松动的" />
      </section>

      <section className="growth-profile-panel__quote">
        <p>最近触动你的一句 <span>✦</span></p>
        <blockquote>“{profile.latestTouchedSentence}”</blockquote>
      </section>

      <section className="growth-archive__record-columns">
        <RecordColumn
          allAction={() => setTab("writing")}
          empty="还没有书写记录"
          href="/day/1"
          items={entries.slice(0, 3).map((entry) => ({
            day: entry.day,
            date: formatShortDate(entry.createdAt),
            title: summarizeReflectionEntry(entry),
          }))}
          title="我的书写记录"
        />
        <RecordColumn
          allAction={() => setTab("ai")}
          empty="还没有 AI 对话记录"
          href="/day/1/ai"
          linkKind="ai"
          items={aiEntries.slice(0, 3).map((entry) => ({
            day: entry.day,
            date: formatShortDate(entry.updatedAt),
            title: entry.title,
          }))}
          title="AI 陪我看见记录"
        />
      </section>

      <p className="growth-profile-panel__footer">🌿 你的每一次诚实记录，都是系统为你看见的依据。</p>
    </div>
  );
}

function SignalCard({ className, icon, items, title }: { className: string; icon: string; items: string[]; title: string }) {
  return (
    <article className={className}>
      <h3>{title} <span>{icon}</span></h3>
      <div>{items.map((item) => <span key={item}>{item}</span>)}</div>
    </article>
  );
}

function RecordColumn({
  allAction,
  empty,
  href,
  items,
  linkKind = "day",
  title,
}: {
  allAction?: () => void;
  empty: string;
  href: string;
  items: Array<{ date: string; day: number; title: string }>;
  linkKind?: "ai" | "day";
  title: string;
}) {
  return (
    <article>
      <header>
        <h3>{title}</h3>
        {allAction ? <button type="button" onClick={allAction}>查看全部 ›</button> : <Link href={href}>查看全部 ›</Link>}
      </header>
      {items.length ? items.map((item) => (
        <Link href={linkKind === "ai" ? `/day/${item.day}/ai` : `/day/${item.day}`} key={`${title}-${item.day}-${item.date}`}>
          <span>Day {String(item.day).padStart(2, "0")}</span><strong>{item.title}</strong><time>{item.date}</time>
        </Link>
      )) : <p>{empty}</p>}
      <span>…</span>
    </article>
  );
}

function getGrowthDimensions(assessment: Record<string, unknown> | null) {
  const result = assessment?.result as { dimensionScores?: Record<string, { index?: number }> } | undefined;
  const scores = result?.dimensionScores ?? {};
  const definitions = [
    ["self-worth", "♥", "自我价值", "clay"],
    ["boundaries", "♟", "关系边界", "gold"],
    ["decision", "◉", "决策自主", "clay"],
    ["emotion", "♧", "情绪稳定", "terracotta"],
    ["action", "⌁", "行动通道", "sage"],
    ["wealth", "♛", "财富容器", "blue"],
  ] as const;

  return definitions.map(([id, icon, name, tone]) => {
    const index = Math.max(0, Math.min(100, Number(scores[id]?.index ?? 45)));
    const score = Math.max(18, Math.round(100 - index * 0.55));
    const initialScore = Math.max(12, score - 12);
    const futureScore = Math.min(100, score + 14);
    return { futureScore, icon, initialScore, name, range: `${initialScore}–${score}`, score, tone };
  });
}

function formatShortDate(value: string) {
  const date = new Date(value);
  return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
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
