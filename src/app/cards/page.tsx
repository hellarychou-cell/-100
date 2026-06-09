"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { MysteryCard } from "@/components/MysteryCard";
import { mysteryCards } from "@/lib/content";
import { getToolCards } from "@/lib/tool-cards-client";
import { LOCAL_PROGRESS_KEY } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type ProgressData = {
  currentDay: number;
  completedDays: number[];
  cardsCollected: number[];
};

export default function CardsPage() {
  const [progressData, setProgressData] = useState<ProgressData>({
    currentDay: 1,
    completedDays: [],
    cardsCollected: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProgress() {
      const localProgress = readLocalProgress();

      if (supabase) {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        if (user) {
          const { data: progress } = await supabase
            .from("progress")
            .select("current_day, completed_days, cards_collected")
            .eq("user_id", user.id)
            .maybeSingle();

          if (progress) {
            setProgressData({
              currentDay: progress.current_day ?? 1,
              completedDays: progress.completed_days ?? [],
              cardsCollected: progress.cards_collected ?? [],
            });
            setLoading(false);
            return;
          }
        }
      }

      setProgressData({
        currentDay: localProgress.currentDay,
        completedDays: localProgress.completedDays,
        cardsCollected: localProgress.completedDays, // 完成后即解锁
      });
      setLoading(false);
    }

    loadProgress();
  }, []);

  if (loading) {
    return (
      <AuthGate>
        <main className="viewport">
          <section className="paper-frame grid place-items-center">
            <div className="thin-panel p-6 text-center text-[#563a2e]">正在打开你的卡册…</div>
          </section>
        </main>
      </AuthGate>
    );
  }

  const toolCards = getToolCards();
  const toolCardMap = new Map(toolCards.map((card) => [card.front.name, card]));

  // 构建25个卡位：神秘卡册有100张卡，但每张卡位对应一个工具卡或空白/感恩/福利
  // 已解锁的卡：根据用户完成的天数来决定
  // Day 1-7的神秘卡背面类型：1=感恩卡, 2=工具卡(课题分离), 3=空白卡, 4=工具卡(自我同情), 5=福利卡, 6=感恩卡, 7=工具卡(萨提亚冰山)
  const cardSlots = Array.from({ length: 25 }, (_, index) => {
    const dayNum = index + 1;
    const mysteryCard = mysteryCards[dayNum];
    const isUnlocked = progressData.completedDays.includes(dayNum);

    if (!mysteryCard) {
      return { day: dayNum, type: "locked" as const, card: null };
    }

    const backType = mysteryCard.back.type;
    let toolCardContent = null;

    // 如果是工具卡，尝试找到完整的工具卡内容
    if (backType === "tool") {
      const toolCard = toolCardMap.get(mysteryCard.back.title);
      if (toolCard) {
        toolCardContent = toolCard.back.content;
      }
    }

    return {
      day: dayNum,
      type: isUnlocked ? "unlocked" as const : "locked" as const,
      card: mysteryCard,
      toolCardContent,
    };
  });

  // 找到第一个已解锁的工具卡作为展示卡
  const featuredSlot = cardSlots.find((slot) => slot.type === "unlocked" && slot.card?.back.type === "tool" && slot.toolCardContent);
  const featuredCard = featuredSlot?.card ?? cardSlots.find((slot) => slot.type === "unlocked")?.card;
  const featuredContent = featuredSlot?.toolCardContent ?? featuredCard?.back.content;

  return (
    <AuthGate>
      <main className="viewport">
        <section className="paper-frame grid grid-rows-[56px_1fr]">
          <header className="topbar">
            <div className="brand">成她100</div>
            <span>神秘卡册</span>
            <Link
              aria-label="回到我的匣子"
              className="grid h-8 w-8 place-items-center border border-[var(--line)] bg-soft/60 text-lg leading-none text-ink transition hover:bg-ink hover:text-soft"
              href="/treasure"
            >
              ×
            </Link>
          </header>
          <section className="grid min-h-0 grid-cols-[330px_1fr] gap-9 p-[clamp(18px,2.8vw,34px)] max-lg:grid-cols-1">
            <div className="grid min-h-0 grid-rows-[auto_1fr_auto] max-lg:grid-cols-[1fr_220px] max-lg:gap-5 max-sm:grid-cols-1">
              <div>
                <div className="eyebrow mb-3">Mystery card album</div>
                <h1 className="display-title text-5xl">你收下的<br />女性力量。</h1>
              </div>
              <div className="self-center justify-self-center">
                {featuredCard ? (
                  <MysteryCard
                    front={featuredCard.front}
                    back={{
                      type: featuredCard.back.type,
                      title: featuredCard.back.title,
                      content: featuredContent ?? featuredCard.back.content,
                      dayNum: featuredCard.back.dayNum,
                    }}
                  />
                ) : (
                  <div className="grid aspect-[3/4.25] w-36 place-items-center border border-[var(--line)] bg-soft/35 text-[var(--muted)]">
                    <span>🔒 待解锁</span>
                  </div>
                )}
              </div>
              <p className="text-[15px] leading-[1.75] text-[#563a2e]">
                点开卡片可以翻到背面，查看工具卡完整内容。未解锁的卡位会保留一点影子。
              </p>
            </div>
            <section className="grid min-h-0 grid-rows-[auto_1fr_auto] gap-4">
              <div className="flex items-end justify-between border-b border-[var(--line)] pb-4">
                <h2 className="m-0 text-4xl font-normal leading-none">卡册</h2>
                <span className="sans text-xs text-[var(--muted)]">
                  {progressData.completedDays.length} / 25 · 已解锁
                </span>
              </div>
              <div className="grid min-h-0 grid-cols-6 gap-2 max-md:grid-cols-4 max-sm:grid-cols-3">
                {cardSlots.map((slot) => {
                  if (slot.type === "locked" || !slot.card) {
                    return (
                      <div
                        key={slot.day}
                        className="grid min-h-28 place-items-center border border-[var(--line)]/35 bg-soft/35 p-2 text-center opacity-45"
                      >
                        <div>
                          <span className="sans text-[10px] text-[var(--muted)]">Day {String(slot.day).padStart(2, "0")}</span>
                          <b className="mt-1 block font-normal text-[var(--muted)]">🔒 待解锁</b>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={slot.day}
                      className="grid min-h-28 place-items-center border border-[var(--line)] bg-gradient-to-br from-[#241610] via-[#744531] to-gold p-2 text-center"
                    >
                      <div>
                        <span className="sans text-[10px] text-paper/75">Day {String(slot.day).padStart(2, "0")}</span>
                        <b className="mt-1 block font-normal text-paper">{slot.card.front.name}</b>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button className="text-link justify-self-center bg-transparent">展开更多卡位</button>
            </section>
          </section>
        </section>
      </main>
    </AuthGate>
  );
}

function readLocalProgress() {
  if (typeof window === "undefined") {
    return { currentDay: 1, completedDays: [] };
  }
  const raw = window.localStorage.getItem(LOCAL_PROGRESS_KEY);
  if (!raw) {
    return { currentDay: 1, completedDays: [] };
  }
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