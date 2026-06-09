"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { getHomeUserState, getProgressCardState, ProgressCardState } from "@/lib/home-state";
import { getLocalUser, LOCAL_PROGRESS_KEY, LOCAL_RESULT_KEY } from "@/lib/auth";
import { currentUser, dayContents, phases } from "@/lib/content";
import { getReadableCurrentDay } from "@/lib/progress";
import { supabase } from "@/lib/supabase";

type ProgressState = {
  cardsCollected: number;
  completedDays: number[];
  currentDay: number;
  displayName: string;
  hasAssessment: boolean;
  isMember: boolean;
  loading: boolean;
};

const publishedDayLimit = dayContents.length;

const allDaysData = [
  ...dayContents.map((day) => ({
    day: day.day,
    title: day.title,
    note: day.mirror?.[0] ?? day.subtitle,
  })),
  ...Array.from({ length: 93 }, (_, index) => {
    const day = index + 8;
    const phase = day <= 25 ? "在生活里抓现行" : day <= 50 ? "追溯来源" : day <= 80 ? "练习新反应" : "整合与绽放";
    return { day, title: `Day ${day} · ${phase}`, note: "内容筹备中" };
  }),
];

export function HomeDashboard() {
  const [state, setState] = useState<ProgressState>({
    cardsCollected: currentUser.cards,
    completedDays: currentUser.completedDays,
    currentDay: currentUser.currentDay,
    displayName: currentUser.name,
    hasAssessment: false,
    isMember: false,
    loading: true,
  });
  const [expanded, setExpanded] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      const localUser = getLocalUser();
      const localHasAssessment = Boolean(window.localStorage.getItem(LOCAL_RESULT_KEY));
      const localProgress = readLocalProgress();
      if (localUser && !cancelled) {
        setState((current) => ({
          ...current,
          displayName: localUser.displayName,
          completedDays: localProgress.completedDays,
          currentDay: getReadableCurrentDay(localProgress.currentDay, publishedDayLimit),
          cardsCollected: localProgress.completedDays.length,
          hasAssessment: localHasAssessment,
          isMember: localUser.isMember,
          loading: Boolean(supabase),
        }));
      }

      if (!supabase) {
        if (!cancelled) {
          setState((current) => ({
            ...current,
            completedDays: localProgress.completedDays,
            currentDay: getReadableCurrentDay(localProgress.currentDay, publishedDayLimit),
            cardsCollected: localProgress.completedDays.length,
            hasAssessment: localHasAssessment,
            loading: false,
          }));
        }
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        if (!cancelled) setState((current) => ({ ...current, loading: false }));
        return;
      }

      const [{ data: profile }, { data: progress }, { data: assessment }, { data: membership }] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
        supabase
          .from("progress")
          .select("current_day,completed_days,cards_collected")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("assessments")
          .select("id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle(),
        supabase
          .from("memberships")
          .select("expires_at,ai_paused")
          .eq("user_id", user.id)
          .order("expires_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (!cancelled) {
        const completedDays = Array.isArray(progress?.completed_days) ? progress.completed_days : [];
        const isMemberActive =
          Boolean(membership?.expires_at) &&
          new Date(membership?.expires_at ?? "").getTime() > Date.now() &&
          !membership?.ai_paused;

        setState({
          cardsCollected: progress?.cards_collected ?? completedDays.length,
          completedDays,
          currentDay: getReadableCurrentDay(progress?.current_day, publishedDayLimit),
          displayName: profile?.display_name ?? String(user.user_metadata?.display_name ?? currentUser.name),
          hasAssessment: Boolean(assessment),
          isMember: isMemberActive,
          loading: false,
        });

        if (assessment && !isMemberActive && !popupDismissed) {
          setShowWelcomePopup(true);
        }
      }
    }

    loadProgress();
    return () => {
      cancelled = true;
    };
  }, [popupDismissed]);

  const today = useMemo(
    () => dayContents.find((day) => day.day === state.currentDay) ?? dayContents[0],
    [state.currentDay],
  );
  const currentPhase = useMemo(() => {
    const day = state.currentDay;
    if (day <= 25) return phases[0];
    if (day <= 50) return phases[1];
    if (day <= 80) return phases[2];
    return phases[3];
  }, [state.currentDay]);

  const visibleDays = expanded ? allDaysData : allDaysData.slice(0, 14);
  const completionRate = Math.round((state.completedDays.length / 100) * 100);
  const homeState = getHomeUserState({
    hasAssessment: state.hasAssessment,
    isMember: state.isMember,
  });

  if (state.loading) {
    return <HomeShell status="正在读取" body={<LoadingState />} />;
  }

  if (homeState === "needs-assessment") {
    return (
      <HomeShell
        status="未开始"
        body={
          <OnboardingState
            displayName={state.displayName}
            title="欢迎来到你的100天"
            text="在进入100天之前，系统需要先了解你的旧程序。42道题，6个维度，生成一张属于你的底层代码诊断报告。"
            cardTitle="先做测评"
            cardText="测评只需做一次，之后可以直接进入你的100天。"
            actionHref="/assessment/profile"
            actionText="开始测评"
          />
        }
      />
    );
  }

  if (homeState === "waiting-membership") {
    return (
      <HomeShell
        status="等待开通"
        overlay={
          showWelcomePopup ? (
            <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 backdrop-blur-sm">
              <div className="thin-panel w-full max-w-sm p-8 text-center">
                <div className="mb-4 text-5xl">已完成</div>
                <h2 className="mb-3 text-3xl font-normal">欢迎来到你的100天</h2>
                <p className="mb-3 text-[#563a2e]">你的测评报告已生成，100天内容可以浏览。</p>
                <p className="mb-6 text-sm text-[var(--muted)]">请先找管理员开通会员，开启你的AI之旅。</p>
                <button
                  className="action-primary w-full"
                  onClick={() => {
                    setShowWelcomePopup(false);
                    setPopupDismissed(true);
                  }}
                  type="button"
                >
                  我知道了
                </button>
              </div>
            </div>
          ) : null
        }
        body={
          <OnboardingState
            displayName={state.displayName}
            title="这里等待开通"
            text="你的账号已经注册完成，测评报告也已生成。现在需要管理员为你开通会员权限，才能开始100天旅程。"
            cardTitle="测评报告"
            cardText="点击查看你的诊断结果。"
            actionHref="/assessment/result"
            actionText="查看测评报告"
          />
        }
      />
    );
  }

  return (
    <main className="viewport overflow-auto">
      <section className="paper-frame grid min-h-full grid-rows-[56px_auto_auto_auto] gap-0">
        <header className="topbar">
          <div className="brand">成她100</div>
          <Link className="action-ghost !px-3 !py-2 !text-xs" href="/treasure">
            我的匣子
          </Link>
        </header>

        <div className="border-b border-[var(--line)] px-[clamp(16px,2.4vw,28px)] py-5">
          <div className="mb-3 flex items-end justify-between gap-4 max-sm:flex-col max-sm:items-start">
            <div>
              <div className="eyebrow mb-2">{currentPhase.name}</div>
              <h1 className="font-serif text-[clamp(38px,5.5vw,76px)] font-normal leading-[.92] text-ink">
                {state.displayName}，Day {String(state.currentDay).padStart(2, "0")}
              </h1>
            </div>
            <div className="text-right max-sm:text-left">
              <div className="text-5xl font-normal leading-none">{completionRate}%</div>
              <div className="mt-1 sans text-xs text-[var(--muted)]">
                已完成 {state.completedDays.length} 天 · 收集 {state.cardsCollected} 张卡
              </div>
            </div>
          </div>
          <div className="progress-track">
            <i className="progress-fill" style={{ width: `${completionRate}%` }} />
          </div>
        </div>

        <div className="grid min-h-0 grid-cols-[1fr_280px] gap-6 p-[clamp(16px,2.4vw,28px)] max-lg:grid-cols-1">
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

        <div className="border-t border-[var(--line)] px-[clamp(16px,2.4vw,28px)] py-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="eyebrow">100天状态</div>
            <button
              onClick={() => setExpanded((current) => !current)}
              className="sans text-xs text-clay transition-colors hover:text-ink"
              type="button"
            >
              {expanded ? "收起" : "展开全部"}
            </button>
          </div>
          <div className="grid grid-cols-[repeat(7,minmax(0,1fr))] gap-3 max-lg:grid-cols-[repeat(4,minmax(0,1fr))] max-sm:grid-cols-2">
            {visibleDays.map((item) => (
              <ProgressDayCard
                key={item.day}
                currentDay={state.currentDay}
                completedDays={state.completedDays}
                item={item}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function HomeShell({
  body,
  overlay,
  status,
}: {
  body: ReactNode;
  overlay?: ReactNode;
  status: string;
}) {
  return (
    <main className="viewport">
      {overlay}
      <section className="paper-frame grid grid-rows-[56px_1fr]">
        <header className="topbar">
          <div className="brand">成她100</div>
          <div className="flex items-center gap-3">
            <span className="pill">{status}</span>
            <Link className="action-ghost !px-3 !py-2 !text-xs" href="/treasure">
              我的匣子
            </Link>
          </div>
        </header>
        {body}
      </section>
    </main>
  );
}

function LoadingState() {
  return (
    <section className="grid place-items-center p-[clamp(20px,3vw,38px)]">
      <div className="thin-panel p-6 text-center text-[#563a2e]">正在打开你的状态页。</div>
    </section>
  );
}

function OnboardingState({
  actionHref,
  actionText,
  cardText,
  cardTitle,
  displayName,
  text,
  title,
}: {
  actionHref: string;
  actionText: string;
  cardText: string;
  cardTitle: string;
  displayName: string;
  text: string;
  title: string;
}) {
  return (
    <section className="grid min-h-0 grid-cols-[minmax(0,1fr)_310px] gap-6 p-[clamp(16px,2.8vw,34px)] max-lg:grid-cols-1">
      <div className="grid min-h-0 grid-rows-[auto_1fr] content-start">
        <div>
          <div className="eyebrow mb-3">成她100</div>
          <h1 className="display-title text-[clamp(44px,6.8vw,94px)]">
            {displayName}，
            <br />
            {title}
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-[1.8] text-[#5a3e32]">{text}</p>
        </div>
        <section className="self-end thin-panel grid grid-cols-[auto_1fr] items-center gap-4 p-5 max-sm:grid-cols-1">
          <div className="grid h-16 w-16 place-items-center rounded-full border border-clay text-clay">成她</div>
          <div>
            <strong className="block text-2xl font-normal leading-tight">{cardTitle}</strong>
            <span className="mt-1 block text-sm text-[var(--muted)]">{cardText}</span>
          </div>
          <Link className="action-primary col-start-2 max-sm:col-start-1" href={actionHref}>
            {actionText}
          </Link>
        </section>
      </div>
      <aside className="grid content-start gap-4">
        <section className="thin-panel p-5">
          <div className="mb-5 flex justify-between sans text-xs text-[var(--muted)]">
            <span>当前状态</span>
            <span className="pill">{cardTitle}</span>
          </div>
          <div className="text-6xl leading-none">0%</div>
          <div className="mt-2 sans text-xs text-clay">已完成 0 天 · 收集 0 张卡</div>
          <Link className="action-primary mt-4 text-center" href={actionHref}>
            {actionText}
          </Link>
        </section>
      </aside>
    </section>
  );
}

function ProgressDayCard({
  completedDays,
  currentDay,
  item,
}: {
  completedDays: number[];
  currentDay: number;
  item: { day: number; title: string; note: string };
}) {
  const state = getProgressCardState({ day: item.day, currentDay, completedDays });
  const href = item.day <= currentDay + 1 ? `/day/${Math.min(item.day, publishedDayLimit)}` : "/home";

  const styles: Record<ProgressCardState, string> = {
    completed: "border-ink/50 bg-ink text-soft",
    today: "progress-today border-clay bg-[#f7ead8] text-ink",
    tomorrow: "border-clay/25 bg-[#fbf1df] text-[#563a2e]",
    future: "border-[var(--line)]/35 bg-soft/35 text-[var(--muted)]/45",
  };

  return (
    <Link
      className={`grid min-h-[108px] content-between border p-3 transition ${styles[state]}`}
      href={href}
      aria-disabled={item.day > currentDay + 1}
    >
      <div className="sans text-[10px] uppercase tracking-[0.14em] text-clay">
        Day {String(item.day).padStart(2, "0")}
      </div>
      <div>
        <h2 className={`m-0 text-sm font-normal leading-tight ${state === "completed" ? "text-soft/85" : "text-inherit"}`}>
          {item.title}
        </h2>
        <p className={`mt-1 line-clamp-2 sans text-[10px] leading-relaxed ${state === "completed" ? "text-soft/60" : ""}`}>
          {item.note}
        </p>
      </div>
    </Link>
  );
}

function readLocalProgress() {
  if (typeof window === "undefined") return { currentDay: currentUser.currentDay, completedDays: currentUser.completedDays };
  const raw = window.localStorage.getItem(LOCAL_PROGRESS_KEY);
  if (!raw) return { currentDay: currentUser.currentDay, completedDays: currentUser.completedDays };

  try {
    const parsed = JSON.parse(raw) as { currentDay?: number; completedDays?: number[] };
    return {
      currentDay: Number.isInteger(parsed.currentDay) ? Number(parsed.currentDay) : currentUser.currentDay,
      completedDays: Array.isArray(parsed.completedDays) ? parsed.completedDays.filter(Number.isInteger) : currentUser.completedDays,
    };
  } catch {
    window.localStorage.removeItem(LOCAL_PROGRESS_KEY);
    return { currentDay: currentUser.currentDay, completedDays: currentUser.completedDays };
  }
}
