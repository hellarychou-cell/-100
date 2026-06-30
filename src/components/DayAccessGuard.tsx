"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { LOCAL_PROGRESS_KEY } from "@/lib/auth";
import { getClickDrivenCurrentDay, isDayUnlocked } from "@/lib/progress";
import { supabase } from "@/lib/supabase";

type DayAccessGuardProps = {
  children: ReactNode;
  day: number;
};

type ProgressLike = {
  completedDays?: number[];
  completed_days?: number[] | null;
  currentDay?: number;
  current_day?: number | null;
  journeyStartDate?: string | null;
  journey_start_date?: string | null;
  journeyStartDay?: number | null;
  journey_start_day?: number | null;
  nextUnlockDate?: string | null;
  next_unlock_date?: string | null;
};

export function DayAccessGuard({ children, day }: DayAccessGuardProps) {
  const [access, setAccess] = useState<{ checked: boolean; currentDay: number; unlocked: boolean }>({
    checked: false,
    currentDay: 1,
    unlocked: day <= 1,
  });

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      const local = readLocalProgress();
      let next = getAccessSnapshot(day, local);

      if (supabase) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { data, error } = await supabase
            .from("progress")
            .select("current_day,completed_days,journey_start_day,journey_start_date,next_unlock_date")
            .eq("user_id", userData.user.id)
            .maybeSingle();
          if (!error && data) {
            next = getAccessSnapshot(day, data as ProgressLike);
          } else if (error) {
            const { data: fallback } = await supabase
              .from("progress")
              .select("current_day,completed_days")
              .eq("user_id", userData.user.id)
              .maybeSingle();
            if (fallback) next = getAccessSnapshot(day, fallback as ProgressLike);
          }
        }
      }

      if (!cancelled) setAccess({ ...next, checked: true });
    }

    void checkAccess();
    return () => {
      cancelled = true;
    };
  }, [day]);

  if (!access.checked) {
    return (
      <main className="viewport botanical-page">
        <section className="paper-frame grid place-items-center">
          <section className="soft-panel p-6 text-center text-[#563a2e]">正在确认今天是否已经解锁。</section>
        </section>
      </main>
    );
  }

  if (!access.unlocked) {
    return (
      <main className="viewport botanical-page">
        <section className="paper-frame grid place-items-center p-6">
          <section className="chengta-dialog chengta-dialog--small">
            <span className="chengta-dialog__mark" aria-hidden>⌁</span>
            <h2>还没走到这里</h2>
            <p>你现在停在 Day {String(access.currentDay).padStart(2, "0")}。收下今天后，下一天会在次日 0 点后解锁。</p>
            <Link className="action-primary mt-4 w-full" href="/home">
              回到我的状态
            </Link>
          </section>
        </section>
      </main>
    );
  }

  return children;
}

function getAccessSnapshot(day: number, progress: ProgressLike | null) {
  const completedDays = normalizeCompletedDays(progress);
  const currentDay = getClickDrivenCurrentDay({
    completedDays,
    journeyStartDate: progress?.journeyStartDate ?? progress?.journey_start_date,
    journeyStartDay: progress?.journeyStartDay ?? progress?.journey_start_day,
    nextUnlockDate: progress?.nextUnlockDate ?? progress?.next_unlock_date,
    savedDay: progress?.currentDay ?? progress?.current_day ?? 1,
  });

  return {
    currentDay,
    unlocked: isDayUnlocked({ day, currentDay, completedDays }),
  };
}

function normalizeCompletedDays(progress: ProgressLike | null) {
  const value = progress?.completedDays ?? progress?.completed_days ?? [];
  return Array.isArray(value) ? value.filter(Number.isInteger) : [];
}

function readLocalProgress() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LOCAL_PROGRESS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ProgressLike;
  } catch {
    window.localStorage.removeItem(LOCAL_PROGRESS_KEY);
    return null;
  }
}
