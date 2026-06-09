"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LOCAL_PROGRESS_KEY } from "@/lib/auth";
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

      // 跳转到金句卡页面
      router.push(`/quote-card?day=${day}`);
    } catch (error) {
      console.error("Failed to collect today:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="flex items-center justify-between border-t border-[var(--line)] px-[clamp(16px,2.4vw,30px)] sans text-xs text-[var(--muted)]">
      <span>完成后会生成今日金句卡，可保存图片。</span>
      <button
        className="text-link bg-transparent transition hover:text-clay"
        onClick={handleCollectToday}
        disabled={loading}
        type="button"
      >
        {loading ? "收集中..." : "收下今天"}
      </button>
    </footer>
  );
}