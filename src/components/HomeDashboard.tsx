"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getLocalUser } from "@/lib/auth";
import { currentUser, dayContents, phases } from "@/lib/content";
import { getReadableCurrentDay } from "@/lib/progress";
import { supabase } from "@/lib/supabase";

type ProgressState = {
  cardsCollected: number;
  completedDays: number;
  currentDay: number;
  displayName: string;
};

const publishedDayLimit = dayContents.length;

export function HomeDashboard() {
  const [state, setState] = useState<ProgressState>({
    cardsCollected: currentUser.cards,
    completedDays: currentUser.completedDays,
    currentDay: currentUser.currentDay,
    displayName: currentUser.name,
  });

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
          .select("current_day,completed_days,cards_collected,ai_conversation_count")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (!cancelled) {
        setState({
          cardsCollected: progress?.cards_collected ?? currentUser.cards,
          completedDays: progress?.completed_days?.length ?? currentUser.completedDays,
          currentDay: getReadableCurrentDay(progress?.current_day, publishedDayLimit),
          displayName: profile?.display_name ?? String(user.user_metadata?.display_name ?? currentUser.name),
        });
      }
    }

    loadProgress();
    return () => {
      cancelled = true;
    };
  }, []);

  const today = useMemo(
    () => dayContents.find((day) => day.day === state.currentDay) ?? dayContents[0],
    [state.currentDay],
  );
  const completionRate = Math.round((state.completedDays / 100) * 100);

  return (
    <main className="viewport">
      <section className="paper-frame grid grid-rows-[64px_1fr]">
        <header className="topbar">
          <div className="brand">成她100</div>
          <nav className="flex gap-5 max-sm:hidden">
            <Link className="text-link" href={`/day/${today.day}`}>
              今日推荐
            </Link>
            <Link className="text-link" href="/knowledge">
              知识库
            </Link>
          </nav>
          <Link className="action-ghost !px-3 !py-2 !text-xs" href="/treasure">
            我的匣子
          </Link>
        </header>
        <section className="grid min-h-0 grid-cols-[minmax(0,1fr)_310px] gap-6 p-[clamp(16px,2.8vw,34px)] max-lg:grid-cols-1">
          <div className="grid min-h-0 grid-rows-[auto_1fr_auto]">
            <div>
              <div className="eyebrow mb-3">Private progress · Phase 01</div>
              <h1 className="display-title text-[clamp(44px,6.8vw,94px)]">
                {state.displayName}，
                <br />
                你走到
                <br />
                Day {String(today.day).padStart(2, "0")}。
              </h1>
              <p className="mt-5 max-w-xl text-[17px] leading-[1.8] text-[#5a3e32]">
                不用急着变好。今天只打开一页，听见那个比“应该”更早的自己。
              </p>
            </div>
            <section className="self-end thin-panel grid grid-cols-[auto_1fr_auto] items-center gap-4 p-5 max-sm:grid-cols-1">
              <div className="grid h-20 w-20 place-items-center rounded-full border border-clay sans text-xs uppercase tracking-wider text-clay">
                Day {String(today.day).padStart(2, "0")}
              </div>
              <div>
                <strong className="block text-3xl font-normal leading-tight">{today.title}</strong>
                <span className="mt-2 block sans text-sm text-[var(--muted)]">今日推荐 · {today.dimension}</span>
              </div>
              <Link className="action-primary" href={`/day/${today.day}`}>
                开始阅读
              </Link>
            </section>
          </div>
          <aside className="grid gap-4">
            <section className="thin-panel p-5">
              <div className="mb-5 flex justify-between sans text-xs text-[var(--muted)]">
                <span>当前状态</span>
                <span className="pill">觉醒期 W1</span>
              </div>
              <div className="text-6xl leading-none">{completionRate}%</div>
              <div className="mt-2 sans text-xs text-clay">
                已完成 {state.completedDays} 天 · 收集 {state.cardsCollected} 张卡
              </div>
            </section>
            <section className="thin-panel grid content-center gap-2 p-4">
              {phases.map((phase) => (
                <div key={phase.id} className="grid grid-cols-[22px_1fr_auto] items-center gap-3 sans text-xs text-[var(--muted)]">
                  <span className={`h-2.5 w-2.5 rounded-full border border-clay ${phase.id === 1 ? "bg-clay" : ""}`} />
                  <strong className="font-serif text-lg font-normal text-ink">{phase.name}</strong>
                  <span>{phase.range}</span>
                </div>
              ))}
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}
