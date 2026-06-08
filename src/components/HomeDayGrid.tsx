"use client";

import Link from "next/link";
import { useState } from "react";
import { dayContents } from "@/lib/content";

type Props = {
  completedDays: number;
  currentDay: number;
};

export function HomeDayGrid({ completedDays, currentDay }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [tooltipDay, setTooltipDay] = useState<number | null>(null);
  const totalDays = 100;

  // Row 1: published days 1-7
  const row1 = dayContents.slice(0, 7);

  // Row 2: days 8-14
  const row2Start = 8;
  const row2End = 14;
  const row2 = Array.from({ length: row2End - row2Start + 1 }, (_, i) => row2Start + i);

  // Expanded rows: 15-100
  const moreDays = Array.from({ length: totalDays - 14 }, (_, i) => 15 + i);

  return (
    <div className="space-y-2">
      {/* Row 1 */}
      <div className="grid grid-cols-7 gap-1.5">
        {row1.map((d) => (
          <DayCell
            key={d.day}
            day={d.day}
            title={d.title}
            isToday={d.day === currentDay}
            isUnlocked={true}
            onTooltip={setTooltipDay}
          />
        ))}
      </div>

      {/* Row 2 with gradient fade */}
      <div className="relative">
        <div className="grid grid-cols-7 gap-1.5">
          {row2.map((d) => {
            const dayData = dayContents.find((c) => c.day === d);
            return (
              <DayCell
                key={d}
                day={d}
                title={dayData?.title ?? `Day ${d}`}
                isToday={d === currentDay}
                isUnlocked={d <= completedDays}
                onTooltip={setTooltipDay}
              />
            );
          })}
          {/* Fill remaining cells */}
          {Array.from({ length: 7 }, (_, i) => (
            <div key={`empty-${i}`} />
          ))}
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-8"
          style={{
            background: "linear-gradient(to top, rgba(251,243,232,1) 0%, rgba(251,243,232,0) 100%)",
          }}
        />
      </div>

      {/* Expanded rows */}
      {expanded && (
        <div className="space-y-1.5">
          {Array.from({ length: Math.ceil(moreDays.length / 7) }, (_, rowIdx) => {
            const rowDays = moreDays.slice(rowIdx * 7, rowIdx * 7 + 7);
            return (
              <div key={`more-row-${rowIdx}`} className="grid grid-cols-7 gap-1.5">
                {rowDays.map((d) => {
                  const dayData = dayContents.find((c) => c.day === d);
                  return (
                    <DayCell
                      key={d}
                      day={d}
                      title={dayData?.title ?? `Day ${d}`}
                      isToday={d === currentDay}
                      isUnlocked={d <= completedDays}
                      onTooltip={setTooltipDay}
                    />
                  );
                })}
                {Array.from({ length: 7 - rowDays.length }, (_, i) => (
                  <div key={`empty-more-${rowIdx}-${i}`} />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Tooltip for locked days */}
      {tooltipDay !== null && (
        <div className="fixed left-1/2 top-1/2 z-50 w-48 -translate-x-1/2 border border-[var(--line)] bg-soft p-4 shadow-xl">
          <p className="m-0 text-sm text-[#563a2e]">你还没有走到这一天</p>
          <button
            className="mt-2 text-xs text-clay underline"
            onClick={() => setTooltipDay(null)}
            type="button"
          >
            关闭
          </button>
        </div>
      )}

      {/* Expand toggle */}
      <button
        className="w-full text-center text-xs text-clay underline"
        onClick={() => setExpanded((e) => !e)}
        type="button"
      >
        {expanded ? "点击收起 ↑" : "点击展开更多 ↓"}
      </button>
    </div>
  );
}

function DayCell({
  day,
  title,
  isToday,
  isUnlocked,
  onTooltip,
}: {
  day: number;
  title: string;
  isToday: boolean;
  isUnlocked: boolean;
  onTooltip: (d: number) => void;
}) {
  if (isUnlocked) {
    return (
      <Link
        href={`/day/${day}`}
        className={`flex flex-col items-center border p-2 text-center transition ${
          isToday ? "border-clay bg-[#f7ead8]" : "border-[var(--line)] bg-soft/60 hover:border-clay"
        }`}
      >
        <span className="sans text-[10px] uppercase tracking-wider text-clay">
          Day {String(day).padStart(2, "0")}
        </span>
        <span className="mt-1 line-clamp-2 text-[10px] leading-tight text-ink">{title}</span>
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onTooltip(day)}
      className="flex w-full flex-col items-center border border-[var(--line)]/40 bg-soft/20 p-2 text-center"
    >
      <span className="sans text-[10px] uppercase tracking-wider text-[var(--muted)]/50">
        Day {String(day).padStart(2, "0")}
      </span>
      <span className="mt-1 line-clamp-2 text-[10px] leading-tight text-[var(--muted)]/50">{title}</span>
    </button>
  );
}
