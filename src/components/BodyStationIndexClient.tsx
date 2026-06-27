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
  const groups = [
    { title: "第一阶段 · 觉醒期", range: "Day 01-25", items: items.slice(0, 25) },
    { title: "第二阶段 · 理解期", range: "Day 26-50", items: items.slice(25, 50) },
    { title: "第三阶段 · 重建期", range: "Day 51-75", items: items.slice(50, 75) },
    { title: "第四阶段 · 创造期", range: "Day 76-100", items: items.slice(75, 100) },
  ];

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
    <div className="body-station-index">
      {message ? (
        <div className="body-station-index__message">
          {message}
        </div>
      ) : null}
      {groups.map((group, groupIndex) => (
        <details className="body-station-index__group" key={group.title} open={groupIndex === 0}>
          <summary>
            <span>{group.title}</span>
            <small>{group.range}</small>
          </summary>
          <div>
            {group.items.map((item) => {
              const unlocked = isUnlocked(item);
              const row = (
                <article className={`body-station-index__row ${unlocked ? "is-unlocked" : "is-locked"}`}>
                  <span>Day {String(item.day).padStart(2, "0")}</span>
                  <strong>{item.title}</strong>
                  <small>{unlocked ? "已解锁" : "锁定"}</small>
                  <i>›</i>
                </article>
              );

              return unlocked ? (
                <Link key={item.day} href={`/body-station/${item.day}?from=station`}>
                  {row}
                </Link>
              ) : (
                <button
                  className="body-station-index__button"
                  key={item.day}
                  onClick={() => setMessage(`完成 Day ${item.day} 的内容后，身体驿站会自动解锁。`)}
                  type="button"
                >
                  {row}
                </button>
              );
            })}
          </div>
        </details>
      ))}
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
