"use client";

import { useRouter } from "next/navigation";
import { LOCAL_MILESTONE_VIEWED_KEY, type MilestoneContent } from "@/lib/milestone-types";

export function MilestoneClient({ content, day }: { content: MilestoneContent; day: number }) {
  const router = useRouter();

  function finish() {
    const viewed = readViewedMilestones();
    window.localStorage.setItem(LOCAL_MILESTONE_VIEWED_KEY, JSON.stringify({ ...viewed, [String(day)]: true }));
    router.push(`/quote-card?day=${day}`);
  }

  return (
    <main className="viewport botanical-page">
      <section className="paper-frame milestone-page">
        <div className="milestone-page__stars" aria-hidden />
        <header>
          <span>{content.subtitle}</span>
          <h1>{content.title}</h1>
          <p>这一周不是结束，是你第一次把耳朵转向自己。</p>
        </header>
        <section className="milestone-page__body">
          {renderMilestoneMarkdown(content.body)}
        </section>
        <footer>
          <button className="action-primary" onClick={finish} type="button">
            收下第一周，生成今日看见卡
          </button>
          <button className="text-link" onClick={() => router.push(`/day/${day}`)} type="button">
            先回到 Day {String(day).padStart(2, "0")}
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

function renderMilestoneMarkdown(value: string) {
  return value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      if (/^##\s+/.test(block)) return <h2 key={block}>{block.replace(/^##\s+/u, "")}</h2>;
      if (/^\|/.test(block)) return <pre key={block}>{block}</pre>;
      if (/^>/.test(block)) {
        return <blockquote key={block}>{block.replace(/^>\s?/gmu, "")}</blockquote>;
      }
      if (/^[┌│└]/u.test(block)) return <pre key={block}>{block}</pre>;
      return <p key={block}>{renderInline(block)}</p>;
    });
}

function renderInline(value: string) {
  return value.split(/(\*\*[^*]+\*\*)/g).map((part) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={part}>{part.slice(2, -2)}</strong>;
    return part;
  });
}
