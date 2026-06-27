"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { treasureEntries } from "@/lib/product-navigation";
import { LOCAL_PROGRESS_KEY } from "@/lib/auth";
import { LOCAL_AI_CONVERSATION_KEY, LOCAL_REFLECTION_KEY } from "@/lib/self-reflection";
import { MobileTopBar } from "@/components/MobileTopBar";

const entryIcons = ["✍", "▤", "♨", "✦", "◎"];
const metricIcons = ["◐", "✦", "▧"];

export default function TreasurePage() {
  const [archiveCount, setArchiveCount] = useState(0);
  const [progress, setProgress] = useState({ currentDay: 1, cards: 0 });

  useEffect(() => {
    setArchiveCount(readLocalCount(LOCAL_REFLECTION_KEY) + readLocalCount(LOCAL_AI_CONVERSATION_KEY));
    const localProgress = readLocalProgress();
    setProgress({ currentDay: localProgress.currentDay, cards: localProgress.completedDays.length });
  }, []);

  const drawerItems = useMemo(
    () =>
      treasureEntries.map((drawer) => {
        if (drawer.title === "成长档案") {
          return { ...drawer, meta: `你已经留下 ${archiveCount} 段话了` };
        }
        if (drawer.title === "身体驿站") {
          return { ...drawer, href: `/body-station/${Math.max(1, progress.currentDay - 1)}` };
        }
        return drawer;
      }),
    [archiveCount, progress.currentDay],
  );

  return (
    <AuthGate>
    <main className="viewport botanical-page">
      <section className="paper-frame treasure-page">
        <MobileTopBar
          rightAction={<Link aria-label="回到我的状态" className="mobile-topbar__action" href="/home">返回状态</Link>}
          title="我的匣子"
        />
        <div className="treasure-page__content">
          <section className="treasure-page__hero">
            <div>
              <small>PRIVATE ARCHIVE</small>
              <h1>我的<br />匣子</h1>
              <p>这里放着你已经看见、收下<br />和慢慢打开的东西。</p>
            </div>
            <div className="treasure-page__illustration" aria-hidden>
              <i /><i /><span>✦　　✦</span>
            </div>
          </section>

          <section className="treasure-page__metrics">
            <Metric icon={metricIcons[0]} value={String(progress.currentDay).padStart(2, "0")} label="当前 Day" />
            <Metric icon={metricIcons[1]} value={String(progress.cards).padStart(2, "0")} label="神秘卡" />
            <Metric icon={metricIcons[2]} value={String(archiveCount).padStart(2, "0")} label="档案记录" last />
          </section>

          <section className="treasure-page__entries">
            {drawerItems.map((drawer, index) => (
              <Link className="treasure-page__entry" href={drawer.href} key={drawer.title}>
                <span className="treasure-page__number">{index + 1}</span>
                <span className="treasure-page__icon" aria-hidden><i className="treasure-page__icon-mark">{entryIcons[index]}</i></span>
                <span className="treasure-page__copy">
                    <strong>
                      {drawer.title}
                    </strong>
                    <small>{drawer.desc}</small>
                </span>
                <span className="treasure-page__meta">
                  <MetaText title={drawer.title} archiveCount={archiveCount} progress={progress} fallback={drawer.meta} />
                  <b>›</b>
                </span>
              </Link>
            ))}
          </section>
          <footer className="treasure-page__footer">✦　　✦<p>你所有认真的向内，都会在未来的某一天，变成看得见的自由与力量。</p></footer>
        </div>
      </section>
    </main>
    </AuthGate>
  );
}

function readLocalCount(key: string) {
  const raw = window.localStorage.getItem(key);
  if (!raw) return 0;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    window.localStorage.removeItem(key);
    return 0;
  }
}

function Metric({ icon, value, label, last = false }: { icon: string; value: string; label: string; last?: boolean }) {
  return (
    <div className={last ? "" : "has-divider"}>
      <i aria-hidden>{icon}</i>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MetaText({
  archiveCount,
  fallback,
  progress,
  title,
}: {
  archiveCount: number;
  fallback: string;
  progress: { currentDay: number; cards: number };
  title: string;
}) {
  if (title === "成长档案") {
    return (
      <span className="treasure-page__archive-meta">
        <span>你已经留下</span>
        <span><strong>{archiveCount}</strong> 段话了</span>
      </span>
    );
  }
  if (title === "知识库") return <><strong>{Math.min(8, progress.currentDay)}</strong><span>/100 天<br />已解锁</span></>;
  if (title === "身体驿站") return <><strong>{Math.max(1, progress.currentDay - 1)}</strong><span>/100 篇<br />已解锁</span></>;
  if (title === "神秘卡册") return <><strong>{progress.cards}</strong><span>张卡<br />已收集</span></>;
  if (title === "测评结果") return <span className="treasure-page__report-meta"><strong>最新报告</strong><span>{formatChineseDate(new Date())}</span></span>;
  return <span>{fallback}</span>;
}

function formatChineseDate(date: Date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function readLocalProgress() {
  const raw = window.localStorage.getItem(LOCAL_PROGRESS_KEY);
  if (!raw) return { currentDay: 1, completedDays: [] as number[] };
  try {
    const parsed = JSON.parse(raw) as { currentDay?: number; completedDays?: number[] };
    return {
      currentDay: Number.isInteger(parsed.currentDay) ? Number(parsed.currentDay) : 1,
      completedDays: Array.isArray(parsed.completedDays) ? parsed.completedDays.filter(Number.isInteger) : [],
    };
  } catch {
    window.localStorage.removeItem(LOCAL_PROGRESS_KEY);
    return { currentDay: 1, completedDays: [] as number[] };
  }
}
