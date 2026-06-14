"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LOCAL_PROGRESS_KEY } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { BodyStationIndexItem } from "@/lib/body-station";

type Progress = {
  completedDays: number[];
};

export function BodyStationIndexClient({ items }: { items: BodyStationIndexItem[] }) {
  const [completedDays, setCompletedDays] = useState<number[]>([]);
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

  function isUnlocked(item: BodyStationIndexItem) {
    return item.status === "ready" && completedDays.includes(item.day);
  }

  return (
    <div className="grid gap-4">
      {message ? (
        <div className="thin-panel bg-clay/5 p-3 text-center sans text-xs text-clay">
          {message}
        </div>
      ) : null}
      <div className="grid grid-cols-5 gap-2.5 max-xl:grid-cols-4 max-md:grid-cols-3 max-sm:grid-cols-2">
        {items.map((item) => {
          const unlocked = isUnlocked(item);
          const card = (
            <article
              className={`grid min-h-[132px] content-between border p-3 transition ${
                unlocked
                  ? "border-clay/50 bg-soft text-ink hover:-translate-y-0.5 hover:shadow-lg"
                  : "border-[var(--line)]/40 bg-soft/35 text-ink/45"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="sans text-[10px] uppercase tracking-[0.14em] text-clay">
                  Day {String(item.day).padStart(2, "0")}
                </span>
                <span className="sans text-[10px] text-[var(--muted)]">
                  {unlocked ? "已解锁" : "锁定"}
                </span>
              </div>
              <div>
                <h2 className="m-0 text-base font-normal leading-tight">{item.title}</h2>
                <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-[var(--muted)]">
                  {item.bodyNote || item.subtitle}
                </p>
              </div>
            </article>
          );

          return unlocked ? (
            <Link key={item.day} href={`/body-station/${item.day}?from=station`}>
              {card}
            </Link>
          ) : (
            <button
              className="block bg-transparent p-0 text-left"
              key={item.day}
              onClick={() => setMessage(`完成 Day ${item.day} 的内容后，身体驿站会自动解锁。`)}
              type="button"
            >
              {card}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function readLocalProgress(): Progress {
  const raw = window.localStorage.getItem(LOCAL_PROGRESS_KEY);
  if (!raw) return { completedDays: [] };

  try {
    const parsed = JSON.parse(raw) as { completedDays?: number[] };
    return {
      completedDays: Array.isArray(parsed.completedDays) ? parsed.completedDays.filter(Number.isInteger) : [],
    };
  } catch {
    window.localStorage.removeItem(LOCAL_PROGRESS_KEY);
    return { completedDays: [] };
  }
}
