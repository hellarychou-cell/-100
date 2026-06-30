"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LOCAL_MILESTONE_VIEWED_KEY, type MilestoneContent } from "@/lib/milestone-types";
import { LOCAL_AI_CONVERSATION_KEY, type AIConversationEntry } from "@/lib/self-reflection";

export function MilestoneClient({ content, day }: { content: MilestoneContent; day: number }) {
  const router = useRouter();
  const [aiCount, setAiCount] = useState(content.stats.find((stat) => stat.label.includes("AI"))?.value ?? 0);

  useEffect(() => {
    setAiCount(countAIConversationsThroughDay(day));
  }, [day]);

  function finish() {
    const viewed = readViewedMilestones();
    window.localStorage.setItem(LOCAL_MILESTONE_VIEWED_KEY, JSON.stringify({ ...viewed, [String(day)]: true }));
    router.push(`/quote-card?day=${day}`);
  }

  const stats = content.stats.map((stat) => stat.label.includes("AI") ? { ...stat, value: aiCount } : stat);

  return (
    <main className="viewport milestone-page">
      <section className="milestone-modal__card" aria-labelledby="milestone-title">
        <button className="milestone-modal__close" onClick={() => router.push(`/day/${day}`)} type="button" aria-label="关闭里程碑">
          ×
        </button>
        <div className="milestone-modal__spark milestone-modal__spark--left" aria-hidden>✦</div>
        <div className="milestone-modal__spark milestone-modal__spark--right" aria-hidden>✦</div>
        <div className="milestone-modal__badge" aria-label={`第 ${content.weekNumber} 周`}>
          <span>{content.weekNumber}</span>
          <small>WEEK</small>
        </div>
        <header className="milestone-modal__header">
          <p>{content.eyebrow}</p>
          <h1 id="milestone-title">{content.title}</h1>
          <span>你已经完成 {content.completedRange}</span>
        </header>

        <div className="milestone-modal__stats" aria-label="本周完成统计">
          {stats.map((stat) => (
            <div key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
              <i aria-hidden>{stat.icon}</i>
            </div>
          ))}
        </div>

        <p className="milestone-modal__summary">{content.summary}</p>

        <section className="milestone-modal__collected" aria-label="本周收下">
          <span>本周收下：</span>
          <div>
            {content.collectedItems.map((item) => (
              <figure key={item.label}>
                <i aria-hidden>{item.icon}</i>
                <figcaption>{item.label}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <footer className="milestone-modal__actions">
          <button className="milestone-modal__primary" onClick={finish} type="button">
            收下这一周
          </button>
          <button className="milestone-modal__secondary" onClick={() => router.push("/growth-archive")} type="button">
            查看本周总结
          </button>
        </footer>
      </section>
    </main>
  );
}

export function hasViewedMilestone(day: number) {
  if (typeof window === "undefined") return false;
  return Boolean(readViewedMilestones()[String(day)]);
}

function readViewedMilestones() {
  const raw = window.localStorage.getItem(LOCAL_MILESTONE_VIEWED_KEY);
  if (!raw) return {} as Record<string, boolean>;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, boolean> : {};
  } catch {
    window.localStorage.removeItem(LOCAL_MILESTONE_VIEWED_KEY);
    return {};
  }
}

function countAIConversationsThroughDay(day: number) {
  const raw = window.localStorage.getItem(LOCAL_AI_CONVERSATION_KEY);
  if (!raw) return 0;
  try {
    const entries = JSON.parse(raw) as AIConversationEntry[];
    return Array.isArray(entries) ? entries.filter((entry) => Number(entry.day) <= day).length : 0;
  } catch {
    window.localStorage.removeItem(LOCAL_AI_CONVERSATION_KEY);
    return 0;
  }
}
