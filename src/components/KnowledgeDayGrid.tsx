"use client";

import { useState } from "react";

type KnowledgeDay = {
  day: number;
  note: string;
  title: string;
};

export function KnowledgeDayGrid({ days }: { days: KnowledgeDay[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="grid gap-4">
      <button
        className={`knowledge-grid-shell relative block w-full overflow-hidden text-left ${expanded ? "is-expanded" : ""}`}
        onClick={() => setExpanded(true)}
        type="button"
      >
        <div className="grid grid-cols-5 gap-2.5 max-xl:grid-cols-4 max-md:grid-cols-3 max-sm:grid-cols-2">
          {days.map((item) => (
            <article
              key={item.day}
              className="relative grid min-h-[118px] content-between border border-[var(--line)] bg-soft/48 p-3 text-ink/75"
            >
              <div className="sans text-[10px] uppercase tracking-[0.14em] text-clay">
                Day {String(item.day).padStart(2, "0")}
              </div>
              <div>
                <h2 className="m-0 text-base font-normal leading-tight">{item.title}</h2>
                <p className="mt-2 text-[11px] leading-relaxed text-[var(--muted)]">{item.note}</p>
              </div>
            </article>
          ))}
        </div>
        {!expanded ? <span className="knowledge-grid-fade" aria-hidden="true" /> : null}
      </button>
      {expanded ? (
        <button
          className="text-link justify-self-center bg-transparent"
          onClick={() => setExpanded(false)}
          type="button"
        >
          收起到两行
        </button>
      ) : (
        <span className="sans justify-self-center text-xs text-[var(--muted)]">点击展开全部 Day 1-100</span>
      )}
    </div>
  );
}
