"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getProgressCardState, ProgressCardState, shouldShowAssessmentPrompt } from "@/lib/home-state";
import { getLocalUser, LOCAL_PROGRESS_KEY, LOCAL_RESULT_KEY } from "@/lib/auth";
import { currentUser, dayContents, phases } from "@/lib/content";
import { getReadableCurrentDay } from "@/lib/progress";
import { getSeedlingState, SeedlingState } from "@/lib/seedling-state";
import { supabase } from "@/lib/supabase";

type ProgressState = {
  cardsCollected: number;
  completedDays: number[];
  currentDay: number;
  displayName: string;
  hasAssessment: boolean;
  isMember: boolean;
  loading: boolean;
  totalScore100: number | null;
};

const publishedDayLimit = dayContents.length;

const allDaysData = [
  ...dayContents.map((day) => ({
    day: day.day,
    title: day.title,
    subtitle: day.subtitle,
    phase: day.phase ?? "第一阶段觉醒期",
    dimension: day.dimension ?? "",
    cardPoint: day.cardPoint ?? "",
    note: day.mirror?.[0] ?? day.subtitle,
  })),
  ...Array.from({ length: 93 }, (_, index) => {
    const day = index + 8;
    const phase = day <= 25 ? "第一阶段觉醒期" : day <= 50 ? "第二阶段理解期" : day <= 80 ? "第三阶段重建期" : "第四阶段创造期";
    return { day, title: `Day ${day}`, subtitle: "内容筹备中", phase, dimension: "", cardPoint: "", note: "内容筹备中" };
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
    totalScore100: null,
  });
  const [expanded, setExpanded] = useState(false);
  const [assessmentPromptDismissed, setAssessmentPromptDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      const localUser = getLocalUser();
      const localAssessment = readLocalAssessment();
      const localHasAssessment = Boolean(localAssessment);
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
          totalScore100: localAssessment?.totalScore100 ?? null,
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
            totalScore100: localAssessment?.totalScore100 ?? null,
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
          .select("id,total_score_100")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
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
          totalScore100:
            assessment?.total_score_100 !== undefined && assessment?.total_score_100 !== null
              ? Number(assessment.total_score_100)
              : localAssessment?.totalScore100 ?? null,
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
  const currentPhase = useMemo(() => {
    const day = state.currentDay;
    if (day <= 25) return phases[0];
    if (day <= 50) return phases[1];
    if (day <= 80) return phases[2];
    return phases[3];
  }, [state.currentDay]);

  const completionRate = Math.round((state.completedDays.length / 100) * 100);
  const seedlingState = getSeedlingState(state.totalScore100);
  if (state.loading) {
    return <LoadingState />;
  }

  return (
    <main className="viewport overflow-auto">
      {shouldShowAssessmentPrompt({ hasAssessment: state.hasAssessment, dismissed: assessmentPromptDismissed }) ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-4 backdrop-blur-sm">
          <div className="thin-panel relative w-full max-w-md bg-soft p-8 text-center shadow-2xl">
            <button
              aria-label="关闭测评提示"
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center border border-[var(--line)] bg-soft/80 text-lg leading-none transition hover:bg-ink hover:text-soft"
              onClick={() => setAssessmentPromptDismissed(true)}
              type="button"
            >
              ×
            </button>
            <div className="eyebrow mb-3">Before reading</div>
            <h2 className="mb-4 text-4xl font-normal leading-tight">先做一次测评</h2>
            <p className="mx-auto mb-6 max-w-sm text-sm leading-[1.8] text-[#563a2e]">
              我们会根据测评内容判断你更适合从第几天开始阅读。你也可以先关掉这个窗口，直接浏览知识库。
            </p>
            <Link className="action-primary w-full" href="/assessment/profile">
              开始测评
            </Link>
          </div>
        </div>
      ) : null}
      <section className="paper-frame grid min-h-full grid-rows-[56px_auto_auto_auto] gap-0">
        <header className="topbar">
          <div className="brand">成她100</div>
          <div className="flex items-center gap-2">
            <Link className="action-ghost !px-3 !py-2 !text-xs" href="/treasure">
              我的匣子
            </Link>
          </div>
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
          <PlantStateDisplay seedling={seedlingState} />
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
          <div className="grid gap-6">
            {/* 觉醒期 */}
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#5b382c] text-xs text-soft">🌱</span>
                <div>
                  <strong className="text-sm font-normal text-[#5b382c]">第一阶段：觉醒期</strong>
                  <span className="ml-2 sans text-xs text-[var(--muted)]">Day 1-25</span>
                </div>
              </div>
              <div className="h-px bg-[#5b382c]/20" />
              <div className="mt-3 grid grid-cols-[repeat(7,minmax(0,1fr))] gap-3 max-lg:grid-cols-[repeat(4,minmax(0,1fr))] max-sm:grid-cols-2">
                {(expanded ? allDaysData.filter(d => d.day >= 1 && d.day <= 25) : allDaysData.filter(d => d.day >= 1 && d.day <= 7)).map((item) => (
                  <ProgressDayCard
                    key={item.day}
                    currentDay={state.currentDay}
                    completedDays={state.completedDays}
                    item={item}
                  />
                ))}
              </div>
            </div>

            {/* 理解期 */}
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#8B6914] text-xs text-soft">🌾</span>
                <div>
                  <strong className="text-sm font-normal text-[#8B6914]">第二阶段：理解期</strong>
                  <span className="ml-2 sans text-xs text-[var(--muted)]">Day 26-50</span>
                </div>
              </div>
              <div className="h-px bg-[#8B6914]/20" />
              <div className="mt-3 grid grid-cols-[repeat(7,minmax(0,1fr))] gap-3 max-lg:grid-cols-[repeat(4,minmax(0,1fr))] max-sm:grid-cols-2">
                {expanded && allDaysData.filter(d => d.day >= 26 && d.day <= 50).map((item) => (
                  <ProgressDayCard
                    key={item.day}
                    currentDay={state.currentDay}
                    completedDays={state.completedDays}
                    item={item}
                  />
                ))}
              </div>
            </div>

            {/* 重建期 */}
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#2D5A4A] text-xs text-soft">🌿</span>
                <div>
                  <strong className="text-sm font-normal text-[#2D5A4A]">第三阶段：重建期</strong>
                  <span className="ml-2 sans text-xs text-[var(--muted)]">Day 51-80</span>
                </div>
              </div>
              <div className="h-px bg-[#2D5A4A]/20" />
              <div className="mt-3 grid grid-cols-[repeat(7,minmax(0,1fr))] gap-3 max-lg:grid-cols-[repeat(4,minmax(0,1fr))] max-sm:grid-cols-2">
                {expanded && allDaysData.filter(d => d.day >= 51 && d.day <= 80).map((item) => (
                  <ProgressDayCard
                    key={item.day}
                    currentDay={state.currentDay}
                    completedDays={state.completedDays}
                    item={item}
                  />
                ))}
              </div>
            </div>

            {/* 创造期 */}
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#6B4A8B] text-xs text-soft">🌸</span>
                <div>
                  <strong className="text-sm font-normal text-[#6B4A8B]">第四阶段：创造期</strong>
                  <span className="ml-2 sans text-xs text-[var(--muted)]">Day 81-100</span>
                </div>
              </div>
              <div className="h-px bg-[#6B4A8B]/20" />
              <div className="mt-3 grid grid-cols-[repeat(7,minmax(0,1fr))] gap-3 max-lg:grid-cols-[repeat(4,minmax(0,1fr))] max-sm:grid-cols-2">
                {expanded && allDaysData.filter(d => d.day >= 81 && d.day <= 100).map((item) => (
                  <ProgressDayCard
                    key={item.day}
                    currentDay={state.currentDay}
                    completedDays={state.completedDays}
                    item={item}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function LoadingState() {
  return (
    <main className="viewport">
      <section className="paper-frame grid place-items-center">
        <section className="thin-panel p-6 text-center text-[#563a2e]">
          正在打开你的状态页。
        </section>
      </section>
    </main>
  );
}

function PlantStateDisplay({ seedling }: { seedling: SeedlingState }) {
  return (
    <section className="mt-4 grid grid-cols-[auto_1fr] items-center gap-4 rounded-none border border-[#d8b98a]/60 bg-[#fbf1df]/70 p-4">
      <div className={`seedling-illustration seedling-${seedling.icon}`} aria-hidden="true">
        <span className="seedling-pot" />
        <span className="seedling-soil" />
        <span className="seedling-stem" />
        <span className="seedling-leaf seedling-leaf-left" />
        <span className="seedling-leaf seedling-leaf-right" />
        <span className="seedling-crown" />
      </div>
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="eyebrow">内在小苗苗</span>
          <span className="sans text-xs text-clay">{seedling.label}</span>
        </div>
        <p className="m-0 text-sm leading-[1.75] text-[#563a2e]">{seedling.sentence}</p>
      </div>
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
  item: {
    day: number;
    title: string;
    subtitle: string;
    phase: string;
    dimension: string;
    cardPoint: string;
    note: string;
  };
}) {
  const [showLockedModal, setShowLockedModal] = useState(false);
  const state = getProgressCardState({ day: item.day, currentDay, completedDays });
  const isLocked = item.day > currentDay + 1 && item.day > publishedDayLimit;
  const href = !isLocked && item.day <= currentDay + 1 ? `/day/${Math.min(item.day, publishedDayLimit)}` : "#";

  const styles: Record<ProgressCardState, string> = {
    completed: "border-[#5b382c] bg-[#5b382c] text-soft",
    today: "progress-today border-[#5b382c] bg-[#f7ead8] text-ink",
    available: "border-transparent bg-[#fbf1df] text-[#563a2e]",
    future: "border-[var(--line)]/35 bg-soft/35 text-[var(--muted)]/45",
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isLocked) {
      e.preventDefault();
      setShowLockedModal(true);
    }
  };

  return (
    <>
      <Link
        className={`grid min-h-[108px] content-between border p-3 transition ${styles[state]} ${isLocked ? "cursor-pointer" : ""}`}
        href={href}
        aria-disabled={isLocked}
        onClick={handleClick}
      >
        <div className="flex flex-col gap-1">
          <div className="sans text-[10px] uppercase tracking-[0.14em] text-clay flex items-center gap-1">
            {item.phase &&<span className="text-[9px]">{item.phase}</span>}
            {isLocked && <span className="text-[10px]">🔒</span>}
          </div>
          <div className="sans text-[10px] uppercase tracking-[0.14em] text-clay">
            Day {String(item.day).padStart(2, "0")}
          </div>
        </div>
        <div>
          <h2 className={`m-0 text-sm font-normal leading-tight ${state === "completed" ? "text-soft/85" : "text-inherit"}`}>
            {item.title}
          </h2>
          {item.dimension && (
            <p className={`mt-1 line-clamp-1 sans text-[9px] leading-relaxed ${state === "completed" ? "text-soft/60" : "text-[var(--muted)]"}`}>
             维度：{item.dimension}
            </p>
          )}
          {item.cardPoint && (
            <p className={`mt-0.5 line-clamp-1 sans text-[9px] leading-relaxed ${state === "completed" ? "text-soft/60" : "text-[var(--muted)]"}`}>
              卡点：{item.cardPoint}
            </p>
          )}
        </div>
      </Link>
      {showLockedModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-4 backdrop-blur-sm" onClick={() => setShowLockedModal(false)}>
          <div className="thin-panel relative w-full max-w-xs bg-soft p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-[#563a2e]">你还没有进入到这一天</p>
            <button className="action-primary mt-4 w-full" onClick={() => setShowLockedModal(false)} type="button">
              我知道了
            </button>
          </div>
        </div>
      )}
    </>
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

function readLocalAssessment() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LOCAL_RESULT_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { result?: { totalScore100?: number } };
    return typeof parsed.result?.totalScore100 === "number"
      ? { totalScore100: parsed.result.totalScore100 }
      : null;
  } catch {
    window.localStorage.removeItem(LOCAL_RESULT_KEY);
    return null;
  }
}
