"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { MobileTopBar } from "@/components/MobileTopBar";
import { MysteryCard } from "@/components/MysteryCard";
import { LOCAL_PROGRESS_KEY } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { ToolCard } from "@/lib/tool-cards";

export type ToolCardSlot = ToolCard & {
  day: number | null;
};

export function CardsAlbumClient({ slots }: { slots: ToolCardSlot[] }) {
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [selectedFile, setSelectedFile] = useState(slots[0]?.file ?? "");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const local = readLocalProgress();
      if (supabase) {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        if (user) {
          const { data } = await supabase
            .from("progress")
            .select("completed_days")
            .eq("user_id", user.id)
            .maybeSingle();
          if (Array.isArray(data?.completed_days)) {
            setCompletedDays(data.completed_days);
            return;
          }
        }
      }
      setCompletedDays(local.completedDays);
    }

    load();
  }, []);

  const unlockedSlots = useMemo(
    () => slots.filter((slot) => slot.day !== null && completedDays.includes(slot.day)),
    [completedDays, slots],
  );
  const selected = slots.find((slot) => slot.file === selectedFile) ?? unlockedSlots[0] ?? slots[0];
  const grouped = groupSlots(slots);

  function isUnlocked(slot: ToolCardSlot) {
    return slot.day !== null && completedDays.includes(slot.day);
  }

  return (
    <AuthGate>
      <main className="viewport">
        <section className="paper-frame cards-album-page grid grid-rows-[56px_1fr]">
          <MobileTopBar
            rightAction={<Link aria-label="回到我的匣子" className="mobile-topbar__action" href="/treasure">返回匣子</Link>}
            title="神秘卡册"
          />
          <section className="grid min-h-0 grid-cols-[330px_1fr] gap-9 overflow-auto p-[clamp(18px,2.8vw,34px)] max-lg:grid-cols-1">
            <div className="grid min-h-0 grid-rows-[auto_1fr_auto] max-lg:grid-cols-[1fr_220px] max-lg:gap-5 max-sm:grid-cols-1">
              <div>
                <div className="eyebrow mb-3">Mystery card album</div>
                <h1 className="display-title text-5xl">
                  你收下的
                  <br />
                  工具碎片。
                </h1>
              </div>
              <div className="self-center justify-self-center">
                {selected && isUnlocked(selected) ? (
                  <MysteryCard front={selected.front} back={{ ...selected.back, dayNum: selected.day ?? undefined }} />
                ) : (
                  <div className="grid aspect-[3/4.25] w-56 place-items-center border border-[var(--line)] bg-soft/35 text-center text-[var(--muted)]">
                    <span>完成对应 Day 后解锁</span>
                  </div>
                )}
              </div>
              <p className="text-[15px] leading-[1.75] text-[#563a2e]">
                卡册按工具维度排列。每天收到的卡会落在它自己的工具位置上，像一点一点拼回完整地图。
              </p>
            </div>
            <section className="grid min-h-0 grid-rows-[auto_auto_1fr] gap-4">
              <div className="flex items-end justify-between border-b border-[var(--line)] pb-4">
                <h2 className="m-0 text-4xl font-normal leading-none">卡册</h2>
                <span className="sans text-xs text-[var(--muted)]">
                  {unlockedSlots.length} / {slots.length} · 已解锁
                </span>
              </div>
              {message ? (
                <div className="thin-panel bg-clay/5 p-3 text-center sans text-xs text-clay">{message}</div>
              ) : null}
              <div className="grid min-h-0 content-start gap-5 overflow-auto pr-1">
                {grouped.map((group) => (
                  <section className="grid gap-2" key={group.category}>
                    <div className="sans text-xs uppercase tracking-[0.18em] text-clay">{cleanCategory(group.category)}</div>
                    <div className="grid grid-cols-4 gap-2 max-xl:grid-cols-3 max-md:grid-cols-4 max-sm:grid-cols-2">
                      {group.slots.map((slot) => {
                        const unlocked = isUnlocked(slot);
                        return (
                          <button
                            className={`grid min-h-28 place-items-center border p-2 text-center transition ${
                              unlocked
                                ? "border-[var(--line)] bg-gradient-to-br from-[#241610] via-[#744531] to-gold text-paper hover:-translate-y-0.5"
                                : "border-[var(--line)]/35 bg-soft/35 text-[var(--muted)] opacity-55"
                            }`}
                            key={slot.file}
                            onClick={() => {
                              setSelectedFile(slot.file);
                              setMessage(
                                unlocked
                                  ? ""
                                  : slot.day
                                    ? `完成 Day ${slot.day} 后会解锁这张工具卡。`
                                    : "这张工具卡已入册，等待后续 Day 分配。",
                              );
                            }}
                            type="button"
                          >
                            <div>
                              <span className="sans text-[10px]">
                                {slot.day ? `Day ${String(slot.day).padStart(2, "0")}` : "工具箱"}
                              </span>
                              <b className="mt-1 block font-normal">{slot.front.name}</b>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </section>
          </section>
        </section>
      </main>
    </AuthGate>
  );
}

function groupSlots(slots: ToolCardSlot[]) {
  const map = new Map<string, ToolCardSlot[]>();
  for (const slot of slots) {
    map.set(slot.category, [...(map.get(slot.category) ?? []), slot]);
  }
  return Array.from(map.entries()).map(([category, groupSlots]) => ({ category, slots: groupSlots }));
}

function cleanCategory(value: string) {
  return value.replace(/^\d+-/, "");
}

function readLocalProgress() {
  const raw = window.localStorage.getItem(LOCAL_PROGRESS_KEY);
  if (!raw) return { completedDays: [] as number[] };

  try {
    const parsed = JSON.parse(raw) as { completedDays?: number[] };
    return {
      completedDays: Array.isArray(parsed.completedDays) ? parsed.completedDays.filter(Number.isInteger) : [],
    };
  } catch {
    window.localStorage.removeItem(LOCAL_PROGRESS_KEY);
    return { completedDays: [] as number[] };
  }
}
