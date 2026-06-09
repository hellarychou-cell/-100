"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getLocalUser } from "@/lib/auth";
import { currentUser, dayContents, phases } from "@/lib/content";
import { getReadableCurrentDay } from "@/lib/progress";
import { supabase } from "@/lib/supabase";

type ProgressState = {
  cardsCollected: number;
  completedDays: number[];
  currentDay: number;
  displayName: string;
};

const previewDays = [
  { day: 1, title: "那句“还行吧”", note: "你不是低调，是把“我做到了”藏太久" },
  { day: 2, title: "你不是不会拒绝", note: "你是用“我有用”抵押“我被爱”" },
  { day: 3, title: "妈妈又打来电话了", note: "父母的情绪不是你的责任" },
  { day: 4, title: "同学群里的一张照片", note: "你不是嫉妒，是替你妈再骂自己一遍" },
  { day: 5, title: "老公那句“你不要这么累”", note: "你不是贤妻，是 3 代女人在交保护费" },
  { day: 6, title: "周一早上 6 点的闹钟", note: "你不是自律，是不敢停" },
  { day: 7, title: "那 2 分", note: "你不是不够好，是在等永远不会来的“够了”" },
  ...Array.from({ length: 18 }, (_, index) => {
    const day = index + 8;
    const week =
      day <= 14 ? "我的“性格”不是我" : day <= 21 ? "在生活里抓现行" : "Day 25 第一次大测评";
    return { day, title: week, note: "内容筹备中" };
  }),
];

export function HomeDashboard() {
  const [state, setState] = useState<ProgressState>({
    cardsCollected: currentUser.cards,
    completedDays: Array.isArray(currentUser.completedDays) ? currentUser.completedDays : [currentUser.completedDays].filter(Boolean),
    currentDay: currentUser.currentDay,
    displayName: currentUser.name,
  });
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      const localUser = getLocalUser();
      if (localUser && !cancelled) {
        setState((current) => ({ ...current, displayName: localUser.displayName }));
      }

      if (!supabase) return;

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      const [{ data: profile }, { data: progress }] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
        supabase
          .from("progress")
          .select("current_day,completed_days,cards_collected")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (!cancelled) {
        setState({
          cardsCollected: progress?.cards_collected ?? currentUser.cards,
          completedDays: (progress?.completed_days && Array.isArray(progress.completed_days)) ? progress.completed_days : Array.isArray(currentUser.completedDays) ? currentUser.completedDays : [currentUser.completedDays].filter(Boolean),
          currentDay: getReadableCurrentDay(progress?.current_day, dayContents.length),
          displayName: profile?.display_name ?? String(user.user_metadata?.display_name ?? currentUser.name),
        });
      }
    }

    loadProgress();
    return () => {
      cancelled = true;
    };
  }, []);

  // 超过这个天数的显示为灰色，点击弹提示
  const lockThreshold = state.currentDay + 1;

  const currentPhase = useMemo(() => {
    const d = state.currentDay;
    if (d <= 25) return phases[0];
    if (d <= 50) return phases[1];
    if (d <= 80) return phases[2];
    return phases[3];
  }, [state.currentDay]);

  const completionRate = Math.round((state.completedDays.length / 100) * 100);

  function handleDayClick(day: number) {
    if (day > lockThreshold) {
      alert("你还没有走到那一步");
    } else {
      window.location.href = `/day/${day}`;
    }
  }

  const today = useMemo(
    () => dayContents.find((item) => item.day === state.currentDay) ?? dayContents[0],
    [state.currentDay],
  );

  const visibleDays = expanded ? previewDays : previewDays.slice(0, 7);

  return (
    <main className="viewport overflow-auto">
      <section className="paper-frame grid min-h-full grid-rows-[56px_auto_auto] gap-0">
        {/* 顶部导航 */}
        <header className="topbar">
          <div className="brand">成她100</div>
          <Link className="action-ghost !px-3 !py-2 !text-xs" href="/treasure">
            我的匣子
          </Link>
        </header>

        {/* 顶部进度区 */}
        <div className="border-b border-[var(--line)] px-[clamp(16px,2.4vw,28px)] py-5">
          <div className="mb-3 flex items-end justify-between gap-4 max-sm:flex-col max-sm:items-start">
            <div>
              <div className="eyebrow mb-2">{currentPhase.name}</div>
              <h1 className="font-serif text-[clamp(38px,5.5vw,76px)] font-normal leading-[.92] text-ink">
                {state.displayName}，Day {String(state.currentDay).padStart(2, "0")}
              </h1>
            </div>
            <div className="text-right">
              <div className="text-5xl font-normal leading-none">{completionRate}%</div>
              <div className="mt-1 sans text-xs text-[var(--muted)]">
                已完成 {state.completedDays.length} 天 · 收集 {state.cardsCollected} 张卡
              </div>
            </div>
          </div>
          {/* 进度条 */}
          <div className="progress-track">
            <i className="progress-fill" style={{ width: `${completionRate}%` }} />
          </div>
        </div>

        {/* 主内容区 */}
        <div className="grid min-h-0 grid-cols-[1fr_280px] gap-6 p-[clamp(16px,2.4vw,28px)] max-lg:grid-cols-1">
          {/* 左侧：今日阅读 */}
          <div className="thin-panel grid content-start gap-4 p-5">
            <div className="eyebrow">今日推荐</div>
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span className="grid h-16 w-16 place-items-center rounded-full border border-clay font-serif text-2xl text-clay">
                  {String(today.day).padStart(2, "0")}
                </span>
                <div>
                  <strong className="block text-2xl font-normal">{today.title}</strong>
                  <span className="sans text-xs text-[var(--muted)]">{today.dimension}</span>
                </div>
              </div>
              <p className="line-clamp-2 text-sm leading-[1.8] text-[#563a2e]">{today.storyPreview}</p>
            </div>
            <Link className="action-primary w-full text-center" href={`/day/${today.day}`}>
              开始阅读
            </Link>
          </div>

          {/* 右侧：阶段进度 */}
          <div className="thin-panel grid content-start gap-2 p-4">
            <div className="eyebrow">当前阶段</div>
            {phases.map((phase) => (
              <div key={phase.id} className="grid grid-cols-[22px_1fr_auto] items-center gap-3 sans text-xs text-[var(--muted)]">
                <span className={`h-2.5 w-2.5 rounded-full border border-clay ${phase.id === currentPhase.id ? "bg-clay" : ""}`} />
                <strong className="font-serif text-lg font-normal text-ink">{phase.name}</strong>
                <span>{phase.range}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 知识库卡片区域 */}
        <div className="border-t border-[var(--line)] px-[clamp(16px,2.4vw,28px)] py-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="eyebrow">知识库</div>
            {!expanded ? (
              <button
                onClick={() => setExpanded(true)}
                className="sans text-xs text-clay hover:text-ink transition-colors"
              >
                点击展开剩余部分 ↓
              </button>
            ) : (
              <button
                onClick={() => setExpanded(false)}
                className="sans text-xs text-clay hover:text-ink transition-colors"
              >
                点击收起 ↑
              </button>
            )}
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
            {visibleDays.map((item) => {
              const isCompleted = state.completedDays.includes(item.day);
              const isLocked = item.day > lockThreshold;
              const isAvailable = !isCompleted && !isLocked;

              // 已领取：深色；可领取未领：黄色；锁定未到：灰色
              let cardStyle = "";
              if (isCompleted) {
                cardStyle = "border-ink/50 bg-ink text-soft";
              } else if (isAvailable) {
                cardStyle = "border-clay/45 bg-[#f7ead8] hover:border-clay/70";
              } else {
                cardStyle = "border-[var(--line)]/30 bg-soft/30 text-[var(--muted)]/40";
              }

              return (
                <article
                  key={item.day}
                  onClick={() => handleDayClick(item.day)}
                  className={`grid min-h-[100px] content-between cursor-pointer border p-4 transition-all ${cardStyle}`}
                >
                  <div className="sans text-[10px] uppercase tracking-[0.14em] text-clay">
                    Day {String(item.day).padStart(2, "0")}
                  </div>
                  <div>
                    <h2 className={`m-0 text-sm font-normal leading-tight ${isCompleted ? "text-soft/80" : "text-ink"}`}>
                      {item.title}
                    </h2>
                    <p className={`mt-1 sans text-[10px] leading-relaxed line-clamp-2 ${isCompleted ? "text-soft/60" : "text-[var(--muted)]"}`}>
                      {item.note}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
          {!expanded && (
            <p className="mt-3 text-center sans text-xs text-clay/60">
              Day 08-25 点击上方展开查看
            </p>
          )}
        </div>
      </section>
    </main>
  );
}