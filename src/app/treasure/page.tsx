"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { currentUser } from "@/lib/content";
import { LOCAL_AI_CONVERSATION_KEY, LOCAL_REFLECTION_KEY } from "@/lib/self-reflection";

const drawers = [
  { title: "测评结果", desc: "底层代码诊断报告、雷达图、推荐起点", href: "/assessment/result?from=treasure", meta: "最近一次测评：主模式 · 讨好型" },
  { title: "知识库", desc: "Day 1-100 内容目录", href: "/knowledge", meta: "当前打开到 Day 03" },
  { title: "我的集卡", desc: "工具卡、姐妹卡和最后那张写给自己的卡", href: "/collection", meta: "工具 + 姐妹" },
  { title: "成长档案", desc: "每日书写、AI 陪你看见和成长画像", href: "/growth-archive", meta: "你已经留下 0 段话了" },
  { title: "身体驿站", desc: "身体小语的延展阅读，随 Day 自动解锁", href: "/body-station", meta: "Day 1-7 已上线" },
];

export default function TreasurePage() {
  const [archiveCount, setArchiveCount] = useState(0);

  useEffect(() => {
    setArchiveCount(readLocalCount(LOCAL_REFLECTION_KEY) + readLocalCount(LOCAL_AI_CONVERSATION_KEY));
  }, []);

  const drawerItems = useMemo(
    () =>
      drawers.map((drawer) =>
        drawer.title === "成长档案"
          ? { ...drawer, meta: `你已经留下 ${archiveCount} 段话了` }
          : drawer,
      ),
    [archiveCount],
  );

  return (
    <AuthGate>
    <main className="viewport">
      <section className="paper-frame grid grid-rows-[56px_1fr]">
        <header className="topbar">
          <div className="brand">成她100</div>
          <span>个人收藏与记录</span>
          <Link
            aria-label="回到我的状态"
            className="grid h-8 w-8 place-items-center border border-[var(--line)] bg-soft/60 text-lg leading-none text-ink transition hover:bg-ink hover:text-soft"
            href="/home"
          >
            ×
          </Link>
        </header>
        <section className="grid min-h-0 grid-cols-[minmax(320px,.62fr)_minmax(440px,1fr)] gap-9 p-[clamp(20px,3vw,38px)] max-lg:grid-cols-1">
          <div className="grid min-h-0 grid-rows-[auto_1fr_auto] max-lg:block">
            <div>
              <div className="eyebrow mb-3">Private archive</div>
              <h1 className="display-title text-[clamp(54px,7vw,96px)]">我的<br />匣子。</h1>
            </div>
            <p className="self-center max-w-md text-[17px] leading-[1.9] text-[#563a2e] max-lg:my-5">
              这里放着你已经看见、收下和慢慢打开的东西。它不是任务清单，是你自己的回收处。
            </p>
            <div className="grid grid-cols-3 border-y border-[var(--line)]">
              <Metric value={String(currentUser.currentDay).padStart(2, "0")} label="当前 Day" />
              <Metric value={String(currentUser.cards).padStart(2, "0")} label="神秘卡" />
              <Metric value={String(archiveCount).padStart(2, "0")} label="档案记录" last />
            </div>
          </div>
          <section className="grid content-center">
            {drawerItems.map((drawer, index) => (
              <div key={drawer.title} className="grid min-h-[68px] grid-cols-[46px_1fr_auto] items-center gap-4 border-t border-[var(--line)] bg-paper/40 last:border-b">
                <div className="grid h-8 w-8 place-items-center rounded-full border border-clay sans text-xs text-clay">{index + 1}</div>
                  <div>
                    <Link className="block text-2xl font-normal leading-none transition hover:text-clay" href={drawer.href}>
                      {drawer.title}
                    </Link>
                    <span className="mt-1 block sans text-xs text-[var(--muted)]">{drawer.desc}</span>
                  </div>
                <span className="sans text-xs text-[var(--muted)] max-sm:hidden">{drawer.meta}</span>
              </div>
            ))}
          </section>
        </section>
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

function Metric({ value, label, last = false }: { value: string; label: string; last?: boolean }) {
  return (
    <div className={`p-4 sans text-xs text-[var(--muted)] ${last ? "" : "border-r border-[var(--line)]"}`}>
      <strong className="mb-1 block font-serif text-3xl font-normal leading-none text-ink">{value}</strong>
      {label}
    </div>
  );
}
