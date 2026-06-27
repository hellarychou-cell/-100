"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LOCAL_PROGRESS_KEY } from "@/lib/auth";
import { dayContents } from "@/lib/content";
import { supabase } from "@/lib/supabase";

type DayFooterProps = {
  day: number;
};

export function DayFooter({ day }: DayFooterProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCollectToday = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // 更新本地进度
      const raw = window.localStorage.getItem(LOCAL_PROGRESS_KEY);
      const progress = raw
        ? JSON.parse(raw)
        : { currentDay: day, completedDays: [] };

      if (!progress.completedDays.includes(day)) {
        progress.completedDays = [...progress.completedDays, day];
        progress.currentDay = Math.max(progress.currentDay, day + 1);
        window.localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(progress));
      }

      // 如果有 Supabase，也更新远程
      if (supabase) {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        if (user) {
          const { data: existingProgress } = await supabase
            .from("progress")
            .select("current_day, completed_days, cards_collected")
            .eq("user_id", user.id)
            .maybeSingle();

          if (existingProgress) {
            const currentCompletedDays = Array.isArray(existingProgress.completed_days)
              ? existingProgress.completed_days
              : [];
            const newCompletedDays = currentCompletedDays.includes(day)
              ? currentCompletedDays
              : [...currentCompletedDays, day];

            await supabase
              .from("progress")
              .update({
                current_day: Math.max(existingProgress.current_day ?? day + 1, day + 1),
                completed_days: newCompletedDays,
              })
              .eq("user_id", user.id);
          }
        }
      }

      // 跳转到今日看见卡页面
      router.push(`/quote-card?day=${day}`);
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
        disabled={day >= dayContents.length}
        onClick={() => router.push(`/day/${Math.min(dayContents.length, day + 1)}`)}
        type="button"
      >
        下一天 ❯
      </button>
    </footer>
  );
}
