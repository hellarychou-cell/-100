"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LOCAL_PROGRESS_KEY } from "@/lib/auth";
import { getChinaDateString, getClickDrivenCurrentDay, isDayUnlocked, markDayCompleted } from "@/lib/progress";
import { supabase } from "@/lib/supabase";
import { LOCAL_MILESTONE_VIEWED_KEY } from "@/lib/milestone-types";

type DayFooterProps = {
  day: number;
};

export function DayFooter({ day }: DayFooterProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [nextUnlocked, setNextUnlocked] = useState(day < 100);

  useEffect(() => {
    setNextUnlocked(isNextDayUnlocked(day));
  }, [day]);

  const handleCollectToday = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // 更新本地进度
      const raw = window.localStorage.getItem(LOCAL_PROGRESS_KEY);
      const progress = raw
        ? JSON.parse(raw)
        : { currentDay: day, completedDays: [], journeyStartDay: day, journeyStartDate: getChinaDateString() };

      const nextProgress = markDayCompleted({
        completedDays: Array.isArray(progress.completedDays) ? progress.completedDays : [],
        currentDay: progress.currentDay ?? day,
        journeyStartDate: progress.journeyStartDate ?? getChinaDateString(),
        journeyStartDay: progress.journeyStartDay ?? progress.currentDay ?? day,
        nextUnlockDate: progress.nextUnlockDate ?? null,
      }, day);
      window.localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(nextProgress));

      // 如果有 Supabase，也更新远程
      if (supabase) {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        if (user) {
          const { data: progressWithUnlock, error: progressWithUnlockError } = await supabase
            .from("progress")
            .select("current_day, completed_days, cards_collected, journey_start_day, journey_start_date, next_unlock_date")
            .eq("user_id", user.id)
            .maybeSingle();
          const { data: fallbackProgress } = progressWithUnlockError
            ? await supabase
                .from("progress")
                .select("current_day, completed_days, cards_collected")
                .eq("user_id", user.id)
                .maybeSingle()
            : { data: null };
          const existingProgress = progressWithUnlock ?? fallbackProgress;

          if (existingProgress) {
            const currentCompletedDays = Array.isArray(existingProgress.completed_days)
              ? existingProgress.completed_days
              : [];
            const newCompletedDays = currentCompletedDays.includes(day)
              ? currentCompletedDays
              : [...currentCompletedDays, day];

            const { error: updateError } = await supabase
              .from("progress")
              .update({
                current_day: nextProgress.currentDay,
                completed_days: newCompletedDays,
                cards_collected: newCompletedDays.length,
                next_unlock_date: nextProgress.nextUnlockDate,
              })
              .eq("user_id", user.id);
            if (updateError) {
              await supabase
                .from("progress")
                .update({
                  current_day: nextProgress.currentDay,
                  completed_days: newCompletedDays,
                  cards_collected: newCompletedDays.length,
                })
                .eq("user_id", user.id);
            }
          } else {
            const { error } = await supabase.from("progress").upsert({
              user_id: user.id,
              current_day: day,
              completed_days: [day],
              cards_collected: 1,
              journey_start_date: getChinaDateString(),
              journey_start_day: day,
              next_unlock_date: nextProgress.nextUnlockDate,
            });
            if (error) {
              await supabase.from("progress").upsert({
                user_id: user.id,
                current_day: day,
                completed_days: [day],
                cards_collected: 1,
              });
            }
          }
        }
      }

      // Day 7 首次收下后，先进入第一周里程碑，再生成今日看见卡。
      if (day === 7 && !hasViewedMilestone(day)) {
        router.push(`/milestone/${day}`);
      } else {
        router.push(`/quote-card?day=${day}`);
      }
    } catch (error) {
      console.error("Failed to collect today:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="day-footer">
      <button
        className="day-footer__nav"
        disabled={day <= 1}
        onClick={() => router.push(`/day/${Math.max(1, day - 1)}`)}
        type="button"
      >
        ❮ 上一天
      </button>
      <button
        className="day-footer__collect"
        onClick={handleCollectToday}
        disabled={loading}
        type="button"
      >
        {loading ? "收集中..." : "♡ 收下今天 ♡"}
      </button>
      <button
        className="day-footer__nav"
        disabled={day >= 100 || !nextUnlocked}
        onClick={() => {
          if (!nextUnlocked) return;
          router.push(`/day/${Math.min(100, day + 1)}`);
        }}
        type="button"
      >
        {nextUnlocked ? "下一天 ❯" : "明天解锁"}
      </button>
    </footer>
  );
}

function hasViewedMilestone(day: number) {
  const raw = window.localStorage.getItem(LOCAL_MILESTONE_VIEWED_KEY);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return Boolean(parsed?.[String(day)]);
  } catch {
    window.localStorage.removeItem(LOCAL_MILESTONE_VIEWED_KEY);
    return false;
  }
}

function isNextDayUnlocked(day: number) {
  if (typeof window === "undefined" || day >= 100) return false;
  const raw = window.localStorage.getItem(LOCAL_PROGRESS_KEY);
  if (!raw) return day + 1 <= 1;
  try {
    const progress = JSON.parse(raw) as {
      completedDays?: number[];
      currentDay?: number;
      journeyStartDate?: string | null;
      journeyStartDay?: number | null;
      nextUnlockDate?: string | null;
    };
    const completedDays = Array.isArray(progress.completedDays) ? progress.completedDays.filter(Number.isInteger) : [];
    const currentDay = getClickDrivenCurrentDay({
      completedDays,
      journeyStartDate: progress.journeyStartDate,
      journeyStartDay: progress.journeyStartDay,
      nextUnlockDate: progress.nextUnlockDate,
      savedDay: progress.currentDay ?? day,
    });
    return isDayUnlocked({ day: day + 1, currentDay, completedDays });
  } catch {
    return false;
  }
}
