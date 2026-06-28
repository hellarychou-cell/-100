"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getProgressCardState, ProgressCardState, shouldShowAssessmentPrompt } from "@/lib/home-state";
import { getLocalUser, LOCAL_PROGRESS_KEY, LOCAL_RESULT_KEY } from "@/lib/auth";
import { currentUser, dayContents, phases } from "@/lib/content";
import { getCalendarCurrentDay, getCollapsedProgressDays, getReadableCurrentDay } from "@/lib/progress";
import { getSeedlingState } from "@/lib/seedling-state";
import { supabase } from "@/lib/supabase";
import { MobileTopBar } from "@/components/MobileTopBar";

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

type RemoteProgressRow = {
  cards_collected?: number | null;
  completed_days?: number[] | null;
  current_day?: number | null;
  journey_start_date?: string | null;
  journey_start_day?: number | null;
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
        const localCurrentDay = getCalendarCurrentDay({
          journeyStartDate: localProgress.journeyStartDate,
          journeyStartDay: localProgress.journeyStartDay,
          savedDay: localProgress.currentDay,
        });
        setState((current) => ({
          ...current,
          displayName: localUser.displayName,
          completedDays: localProgress.completedDays,
          currentDay: localCurrentDay,
          cardsCollected: localProgress.completedDays.length,
          hasAssessment: localHasAssessment,
          isMember: localUser.isMember,
          loading: Boolean(supabase),
          totalScore100: localAssessment?.totalScore100 ?? null,
        }));
      }

      if (!supabase) {
        const localCurrentDay = getCalendarCurrentDay({
          journeyStartDate: localProgress.journeyStartDate,
          journeyStartDay: localProgress.journeyStartDay,
          savedDay: localProgress.currentDay,
        });
        if (!cancelled) {
          setState((current) => ({
            ...current,
            completedDays: localProgress.completedDays,
            currentDay: localCurrentDay,
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

      const [{ data: profile }, progress, { data: assessment }, { data: membership }] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
        loadRemoteProgress(user.id),
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

      const completedDays = Array.isArray(progress?.completed_days) ? progress.completed_days : [];
      const currentDay = getCalendarCurrentDay({
        journeyStartDate: progress?.journey_start_date,
        journeyStartDay: progress?.journey_start_day,
        savedDay: progress?.current_day,
      });

      if (!cancelled) {
        const isMemberActive =
          Boolean(membership?.expires_at) &&
          new Date(membership?.expires_at ?? "").getTime() > Date.now() &&
          !membership?.ai_paused;

        setState({
          cardsCollected: progress?.cards_collected ?? completedDays.length,
          completedDays,
          currentDay,
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
      if (progress?.journey_start_date && progress?.journey_start_day && currentDay !== getReadableCurrentDay(progress.current_day)) {
        await supabase.from("progress").update({ current_day: currentDay }).eq("user_id", user.id);
      }
    }

    loadProgress();
    return () => {
      cancelled = true;
    };
  }, []);

  const today = useMemo(
    () => allDaysData.find((day) => day.day === state.currentDay) ?? allDaysData[0],
    [state.currentDay],
  );
  const todayHref = `/day/${today.day}`;
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
    <main className="viewport botanical-page overflow-auto">
      {shouldShowAssessmentPrompt({ hasAssessment: state.hasAssessment, dismissed: assessmentPromptDismissed }) ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-4 backdrop-blur-sm">
          <div className="chengta-dialog relative">
            <button
              aria-label="关闭测评提示"
              className="chengta-dialog__close"
              onClick={() => setAssessmentPromptDismissed(true)}
              type="button"
            >
              ×
            </button>
            <span className="chengta-dialog__mark" aria-hidden>✦</span>
            <div className="eyebrow mb-3">Before reading</div>
            <h2>先做一次测评</h2>
            <p>
              我们会根据测评内容判断你更适合从第几天开始阅读。你也可以先关掉这个窗口，直接浏览知识库。
            </p>
            <Link className="action-primary w-full" href="/assessment/profile">
              开始测评
            </Link>
          </div>
        </div>
      ) : null}
      <section className="paper-frame home-status">
        <MobileTopBar
          rightAction={<Link className="mobile-topbar__action" href="/treasure">我的匣子</Link>}
          title="我的状态"
        />
        <div className="home-status__content">
          <section className="home-status__summary">
            <div className="home-status__identity">
              <span className="home-status__seedling" aria-hidden>🌱</span>
              <div>
                <span className="home-status__phase-tag">第{currentPhase.id === 1 ? "一" : currentPhase.id === 2 ? "二" : currentPhase.id === 3 ? "三" : "四"}阶段{currentPhase.name}</span>
                <h1>{state.displayName}，<em>Day {String(state.currentDay).padStart(2, "0")}</em></h1>
              </div>
            </div>
            <div className="home-status__percent" aria-label={`总进度 ${completionRate}%`}><small>总进度</small><strong>{completionRate}</strong><span>%</span></div>
            <div className="progress-track"><i className="progress-fill" style={{ width: `${completionRate}%` }} /></div>
            <div className="home-status__progress-copy">
              <p>已完成 {state.completedDays.length} 天　收集 {state.cardsCollected} 张卡</p>
              <Link href="/assessment/result">🌱 内在小苗苗　{seedlingState.label}　›</Link>
            </div>
          </section>

          <div className="home-status__middle">
            <section className="home-status__recommendation">
              <small>今日推荐 🍃</small>
              <div className="home-status__preview">
                <span>Day {String(today.day).padStart(2, "0")}</span>
                <b aria-hidden>🧘‍♀️</b>
              </div>
              <h2>{today.title}</h2>
              <i>{today.dimension}</i>
              <p>{today.note}</p>
              <Link className="action-primary" href={todayHref}>{today.day > publishedDayLimit ? "查看今日框架" : "开始阅读"}</Link>
            </section>
            <section className="home-status__phase">
              <small>当前阶段</small>
              {phases.map((phase) => (
                <div className={phase.id === currentPhase.id ? "is-current" : ""} key={phase.id}>
                  <span>{phase.id === currentPhase.id ? "✓" : ""}</span>
                  <p><strong>{phase.name}</strong><small>{phase.range}</small></p>
                  {phase.id === currentPhase.id ? <em>当前</em> : null}
                </div>
              ))}
            </section>
          </div>

          <section className="home-status__days">
            <header>
              <strong>100天状态 🍃</strong>
              <button onClick={() => setExpanded((current) => !current)} type="button">
                {expanded ? "收起" : "展开全部"} ›
              </button>
            </header>
            <div className="home-status__phase-row is-open">
              <span>●　第一阶段：自我觉醒期 (Day 1 - 25)</span><small>进行中</small>
            </div>
            <div className="home-status__day-grid">
              {(expanded ? allDaysData.filter((item) => item.day <= 25) : getCollapsedProgressDays(allDaysData, state.currentDay))
                .filter((item, index, items) => item && items.findIndex((candidate) => candidate.day === item.day) === index)
                .sort((a, b) => a.day - b.day)
                .map((item) => (
                <ProgressDayCard key={item.day} currentDay={state.currentDay} completedDays={state.completedDays} item={item} />
              ))}
            </div>
            {phases.slice(1).map((phase, index) => (
              <div className="home-status__phase-row" key={phase.id}>
                <span>{index > 0 ? "🔒" : "○"}　{phase.name} ({phase.range})</span>
                <small>{index > 0 ? "未解锁" : "展开 ›"}</small>
              </div>
            ))}
          </section>
        </div>
      </section>
    </main>
  );
}

function LoadingState() {
  return (
    <main className="viewport">
      <section className="paper-frame grid place-items-center">
        <section className="soft-panel p-6 text-center text-[#563a2e]">
          正在打开你的状态页。
        </section>
      </section>
    </main>
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
  const isLocked = item.day > currentDay;
  const href = !isLocked ? `/day/${item.day}` : "#";

  const styles: Record<ProgressCardState, string> = {
    completed: "is-completed",
    today: "is-today",
    available: "is-available",
    future: "is-future",
  };
  const statusLabel: Record<ProgressCardState, string> = {
    completed: "✓ 已完成",
    today: "● 进行中",
    available: "可阅读",
    future: "未解锁",
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
        className={`home-status__day-card ${styles[state]} ${isLocked ? "is-locked" : ""}`}
        href={href}
        aria-disabled={isLocked}
        onClick={handleClick}
      >
        <span className="home-status__day">Day {String(item.day).padStart(2, "0")}</span>
        <strong>{item.title}</strong>
        <span className="home-status__dimension">{item.dimension || item.subtitle}</span>
        <span className="home-status__day-state">{isLocked ? "🔒 未解锁" : statusLabel[state]}</span>
      </Link>
      {showLockedModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-4 backdrop-blur-sm" onClick={() => setShowLockedModal(false)}>
          <div className="chengta-dialog chengta-dialog--small" onClick={(e) => e.stopPropagation()}>
            <span className="chengta-dialog__mark" aria-hidden>⌁</span>
            <h2>还没走到这里</h2>
            <p>你还没有进入到这一天。先收下前面的内容，它会慢慢解锁。</p>
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
    const parsed = JSON.parse(raw) as { currentDay?: number; completedDays?: number[]; journeyStartDate?: string; journeyStartDay?: number };
    return {
      currentDay: Number.isInteger(parsed.currentDay) ? Number(parsed.currentDay) : currentUser.currentDay,
      completedDays: Array.isArray(parsed.completedDays) ? parsed.completedDays.filter(Number.isInteger) : currentUser.completedDays,
      journeyStartDate: typeof parsed.journeyStartDate === "string" ? parsed.journeyStartDate : null,
      journeyStartDay: Number.isInteger(parsed.journeyStartDay) ? Number(parsed.journeyStartDay) : null,
    };
  } catch {
    window.localStorage.removeItem(LOCAL_PROGRESS_KEY);
    return { currentDay: currentUser.currentDay, completedDays: currentUser.completedDays };
  }
}

async function loadRemoteProgress(userId: string) {
  if (!supabase) return null;
  const withJourney = await supabase
    .from("progress")
    .select("current_day,completed_days,cards_collected,journey_start_day,journey_start_date")
    .eq("user_id", userId)
    .maybeSingle();

  if (!withJourney.error) return withJourney.data as RemoteProgressRow | null;

  const fallback = await supabase
    .from("progress")
    .select("current_day,completed_days,cards_collected")
    .eq("user_id", userId)
    .maybeSingle();
  return fallback.data as RemoteProgressRow | null;
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
