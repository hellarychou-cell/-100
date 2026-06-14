"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LOCAL_PROGRESS_KEY } from "@/lib/auth";
import { dayContents, heroImage } from "@/lib/content";
import { markDayCompleted } from "@/lib/progress";
import { supabase } from "@/lib/supabase";

export function QuoteCardClient({ dayNum }: { dayNum: number }) {
  const day = dayContents.find((item) => item.day === dayNum) ?? dayContents[0];
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function saveProgress() {
      const localProgress = readLocalProgress();
      const nextProgress = markDayCompleted(localProgress, day.day);
      window.localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(nextProgress));

      if (!supabase) return;
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      const { data: progress } = await supabase
        .from("progress")
        .select("current_day,completed_days,cards_collected")
        .eq("user_id", user.id)
        .maybeSingle();

      const remoteNext = markDayCompleted(
        {
          currentDay: progress?.current_day ?? day.day,
          completedDays: Array.isArray(progress?.completed_days) ? progress.completed_days : [],
        },
        day.day,
      );

      await supabase.from("progress").upsert({
        user_id: user.id,
        current_day: remoteNext.currentDay,
        completed_days: remoteNext.completedDays,
        cards_collected: Math.max(progress?.cards_collected ?? 0, remoteNext.completedDays.length),
      });
    }

    saveProgress();
  }, [day.day]);

  return (
    <main className="viewport grid place-items-center">
      <section className="relative grid h-[min(560px,calc(100vh_-_28px))] w-full max-w-4xl grid-cols-[330px_1fr] overflow-hidden border border-paper/50 bg-soft shadow-2xl max-md:h-auto max-md:grid-cols-1">
        <Link
          aria-label="回到我的状态"
          className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center border border-[var(--line)] bg-soft/80 text-lg leading-none text-ink transition hover:bg-ink hover:text-soft"
          href="/home"
        >
          ×
        </Link>
        <div className="grid place-items-center border-r border-[var(--line)] bg-paper/50 p-6 max-md:border-b max-md:border-r-0">
          <div ref={cardRef} className="grid aspect-[3/4.8] w-56 grid-rows-[2fr_1fr] overflow-hidden border border-ink/20 bg-soft shadow-2xl">
            <div
              className="relative bg-cover bg-center"
              style={{ backgroundImage: `linear-gradient(rgba(36,22,16,.08),rgba(36,22,16,.28)),url(${heroImage})` }}
            >
              <span className="sans absolute left-4 top-4 text-[10px] uppercase tracking-[0.16em] text-paper/90">
                Day {String(day.day).padStart(2, "0")}
              </span>
            </div>
            <div className="grid content-center bg-soft px-5 py-4">
              <p className="m-0 text-[17px] leading-normal text-[#342117]">{day.quote}</p>
              <span className="mt-3 sans text-[11px] tracking-wider text-clay">- {day.quoteBy}</span>
            </div>
          </div>
        </div>
        <section className="grid grid-rows-[auto_1fr_auto] gap-5 p-9 max-md:p-6">
          <div>
            <div className="eyebrow mb-3">Today bookmark</div>
            <h1 className="display-title text-5xl">
              今天，
              <br />
              你收下了。
            </h1>
          </div>
          <p className="self-center max-w-sm text-[17px] leading-[1.85] text-[#563a2e]">
            完成当天后生成一张书签式金句卡。回到状态页后，Day {String(day.day).padStart(2, "0")} 会变成已读状态。
          </p>
          <div className="flex gap-3 max-sm:grid">
            <button
              className="action-primary"
              disabled={saving}
              onClick={() => void saveQuoteImage(cardRef.current, setSaving)}
              type="button"
            >
              {saving ? "正在保存" : "保存图片"}
            </button>
            <Link className="action-ghost" href="/home">回到我的状态</Link>
          </div>
        </section>
      </section>
    </main>
  );
}

async function saveQuoteImage(element: HTMLElement | null, setSaving: (saving: boolean) => void) {
  if (!element) return;
  setSaving(true);
  try {
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#f8efe1",
    });
    const link = document.createElement("a");
    link.download = `成她100-Day金句卡-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error(error);
    window.print();
  } finally {
    setSaving(false);
  }
}

function readLocalProgress() {
  const raw = window.localStorage.getItem(LOCAL_PROGRESS_KEY);
  if (!raw) return { currentDay: 1, completedDays: [] };

  try {
    const parsed = JSON.parse(raw) as { currentDay?: number; completedDays?: number[] };
    return {
      currentDay: Number.isInteger(parsed.currentDay) ? Number(parsed.currentDay) : 1,
      completedDays: Array.isArray(parsed.completedDays) ? parsed.completedDays.filter(Number.isInteger) : [],
    };
  } catch {
    window.localStorage.removeItem(LOCAL_PROGRESS_KEY);
    return { currentDay: 1, completedDays: [] };
  }
}
