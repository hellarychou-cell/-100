"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LOCAL_PROGRESS_KEY } from "@/lib/auth";
import { dayContents, heroImage } from "@/lib/content";
import { markDayCompleted } from "@/lib/progress";
import {
  createTodaySeeingCard,
  LOCAL_TODAY_SEEING_KEY,
  type TodaySeeingCard,
} from "@/lib/today-seeing-card";
import { AIConversationEntry, LOCAL_AI_CONVERSATION_KEY } from "@/lib/self-reflection";
import { supabase } from "@/lib/supabase";

export function QuoteCardClient({ dayNum }: { dayNum: number }) {
  const day = dayContents.find((item) => item.day === dayNum) ?? dayContents[0];
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [card, setCard] = useState<TodaySeeingCard | null>(null);

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

  useEffect(() => {
    const nextCard = createTodaySeeingCard({
      aiEntry: readAIEntry(day.day),
      bodyNote: day.bodyNote,
      day: day.day,
      mirror: Array.isArray(day.mirror) ? day.mirror.join(" ") : "",
      title: day.title,
    });
    setCard(nextCard);
    saveSeeingCard(nextCard);
  }, [day]);

  const displayCard =
    card ??
    createTodaySeeingCard({
      bodyNote: day.bodyNote,
      day: day.day,
      mirror: Array.isArray(day.mirror) ? day.mirror.join(" ") : "",
      title: day.title,
    });

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
          <div ref={cardRef} className="grid aspect-[3/4.8] w-64 grid-rows-[auto_auto_1fr_auto] overflow-hidden border border-ink/20 bg-[#fff8ed] px-6 py-5 shadow-2xl">
            <span className="sans text-[10px] uppercase tracking-[0.16em] text-clay">
              成她100 · Day {String(day.day).padStart(2, "0")}
            </span>
            <h2 className="mt-4 text-3xl font-normal leading-none text-ink">{displayCard.title}</h2>
            <div className="mt-5 min-h-0 overflow-hidden text-[#3f281f]">
              <p className="sans text-[11px] uppercase tracking-[0.14em] text-clay/80">今天你说</p>
              <p className="mt-1 text-sm leading-relaxed">“{displayCard.userExcerpt}”</p>
              <div className="my-4 h-px bg-[var(--line)]" />
              <p className="sans text-[11px] uppercase tracking-[0.14em] text-clay/80">AI 看见的</p>
              <ol className="mt-2 grid gap-1 text-sm leading-relaxed">
                {displayCard.aiSeeings.map((item, index) => (
                  <li key={item}>{String(index + 1).padStart(2, "0")}　{item}</li>
                ))}
              </ol>
              <div className="my-4 h-px bg-[var(--line)]" />
              <p className="sans text-[11px] uppercase tracking-[0.14em] text-clay/80">今晚带回身体的</p>
              <p className="mt-1 text-sm leading-relaxed">{displayCard.bodyAction}</p>
            </div>
            <p className="mt-3 sans text-[11px] tracking-wider text-clay">-- 成她100 · 今天的看见</p>
          </div>
          <div className="hidden">
            <div
              className="relative bg-cover bg-center"
              style={{ backgroundImage: `linear-gradient(rgba(36,22,16,.08),rgba(36,22,16,.28)),url(${heroImage})` }}
            />
          </div>
        </div>
        <section className="grid grid-rows-[auto_1fr_auto] gap-5 p-9 max-md:p-6">
          <div>
            <div className="eyebrow mb-3">Today bookmark</div>
            <h1 className="display-title text-5xl">
              今日
              <br />
              看见卡。
            </h1>
          </div>
          <p className="self-center max-w-sm text-[17px] leading-[1.85] text-[#563a2e]">
            今天你收下的不只是进度，也是一小段被看见的证据。回到状态页后，Day {String(day.day).padStart(2, "0")} 会变成已读状态。
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
    link.download = `成她100-Day今日看见卡-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error(error);
    window.print();
  } finally {
    setSaving(false);
  }
}

function readAIEntry(day: number) {
  const entries = readJson<AIConversationEntry[]>(LOCAL_AI_CONVERSATION_KEY);
  return Array.isArray(entries) ? entries.find((entry) => entry.day === day) ?? null : null;
}

function saveSeeingCard(card: TodaySeeingCard) {
  const cards = readJson<TodaySeeingCard[]>(LOCAL_TODAY_SEEING_KEY) ?? [];
  const next = [card, ...cards.filter((item) => item.day !== card.day)];
  window.localStorage.setItem(LOCAL_TODAY_SEEING_KEY, JSON.stringify(next));
}

function readJson<T>(key: string): T | null {
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.removeItem(key);
    return null;
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
