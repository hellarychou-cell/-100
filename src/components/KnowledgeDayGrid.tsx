"use client";

import Link from "next/link";
import { useState } from "react";
import { knowledgeWeeks } from "@/lib/knowledge-weeks";

type KnowledgeDay = {
  day: number;
  dimension?: string;
  note: string;
  status?: string;
  title: string;
};

export function KnowledgeDayGrid({ days }: { days: KnowledgeDay[] }) {
  const [weekId, setWeekId] = useState(1);
  const [mapOpen, setMapOpen] = useState(false);
  const week = knowledgeWeeks.find((item) => item.id === weekId) ?? knowledgeWeeks[0];
  const visibleDays = days.filter((item) => item.day >= week.startDay && item.day <= week.endDay);

  return (
    <div className="knowledge-day-grid">
      <div className="knowledge-page__phase-tabs" aria-label="成长阶段">
        {[
          { label: "△ 觉醒期", week: 1 },
          { label: "▣ 理解期", week: 5 },
          { label: "◔ 重建期", week: 9 },
          { label: "☼ 创造期", week: 13 },
        ].map((phase) => (
          <button
            className={week.id >= phase.week && week.id < phase.week + 4 ? "is-active" : ""}
            key={phase.week}
            onClick={() => setWeekId(phase.week)}
            type="button"
          >{phase.label}</button>
        ))}
      </div>

      <nav aria-label="主题周" className="knowledge-week-nav">
        {knowledgeWeeks.map((item) => (
          <button
            aria-current={item.id === week.id ? "page" : undefined}
            className={item.id === week.id ? "is-active" : ""}
            key={item.id}
            onClick={() => setWeekId(item.id)}
            type="button"
          >
            <span>W{item.id}</span><small>{item.startDay}–{item.endDay}</small>
          </button>
        ))}
      </nav>

      <header className="knowledge-week-theme">
        <div>
          <span>{week.phase} · W{week.id}</span>
          <h2>{week.title}</h2>
          <p>Day {String(week.startDay).padStart(2, "0")}–{String(week.endDay).padStart(2, "0")}</p>
        </div>
        {week.milestone ? <strong>✦ {week.milestone}</strong> : <i aria-hidden>⌇</i>}
      </header>

      <section className="knowledge-theme-map">
        <button
          aria-expanded={mapOpen}
          className="knowledge-theme-map-toggle"
          onClick={() => setMapOpen((value) => !value)}
          type="button"
        >
          ⓘ 主题地图
        </button>
        {mapOpen ? (
          <p>
            100 天被拆成 16 个主题周。先看当前周，也可以用上方 W1-W16 切换到任意主题，已解锁的 Day 可以直接进入内容页。
          </p>
        ) : null}
      </section>

      <div className="knowledge-grid-shell">
        <div className="knowledge-day-grid__cards">
          {visibleDays.map((item) => {
            const card = (
              <>
                <div className="knowledge-day-card__top">
                  <span>{item.day <= 8 ? "✓" : ""}</span>
                  <small>{item.day <= 8 ? "觉醒期" : item.status ?? "排期"}</small>
                </div>
                <div>
                  <strong>Day {String(item.day).padStart(2, "0")}</strong>
                  <h2>{item.dimension || item.title}</h2>
                  <p>{item.title}</p>
                </div>
                <span className="knowledge-day-card__icon" aria-hidden>{item.day > 8 ? "▣" : "⌑"}</span>
              </>
            );

            return item.day <= 8 ? (
              <Link href={`/day/${item.day}`} key={item.day} className="knowledge-day-card">
                {card}
              </Link>
            ) : (
              <article
                data-disabled="true"
                key={item.day}
                className="knowledge-day-card is-locked"
              >
                {card}
              </article>
            );
          })}
        </div>
      </div>

      <div className="knowledge-week-pager">
        <button
          disabled={week.id === 1}
          onClick={() => setWeekId((current) => Math.max(1, current - 1))}
          type="button"
        >
          ← 上一主题周
        </button>
        <span>{week.id} / 16</span>
        <button
          disabled={week.id === 16}
          onClick={() => setWeekId((current) => Math.min(16, current + 1))}
          type="button"
        >
          下一主题周 →
        </button>
      </div>
    </div>
  );
}
