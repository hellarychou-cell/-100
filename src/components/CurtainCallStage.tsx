"use client";

import type { CSSProperties } from "react";
import { useRef, useState } from "react";

const WHEEL_THRESHOLD = 110;
const TOUCH_THRESHOLD = 86;

export function CurtainCallStage({ content }: { content: string }) {
  const [open, setOpen] = useState(false);
  const [pull, setPull] = useState(0);
  const wheelTotal = useRef(0);
  const touchStartY = useRef<number | null>(null);
  const resetTimer = useRef<number | null>(null);

  function resetPullSoon() {
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => {
      wheelTotal.current = 0;
      setPull(0);
    }, 220);
  }

  function handleWheel(event: React.WheelEvent<HTMLElement>) {
    if (open || event.deltaY <= 0) return;
    wheelTotal.current += event.deltaY;
    setPull(Math.min(1, wheelTotal.current / WHEEL_THRESHOLD));
    if (wheelTotal.current >= WHEEL_THRESHOLD) {
      event.preventDefault();
      setOpen(true);
      wheelTotal.current = 0;
      setPull(0);
      return;
    }
    resetPullSoon();
  }

  function handleTouchStart(event: React.TouchEvent<HTMLElement>) {
    touchStartY.current = event.touches[0]?.clientY ?? null;
  }

  function handleTouchMove(event: React.TouchEvent<HTMLElement>) {
    if (open || touchStartY.current === null) return;
    const currentY = event.touches[0]?.clientY ?? touchStartY.current;
    const distance = touchStartY.current - currentY;
    if (distance <= 0) return;
    setPull(Math.min(1, distance / TOUCH_THRESHOLD));
    if (distance >= TOUCH_THRESHOLD) {
      event.preventDefault();
      setOpen(true);
      touchStartY.current = null;
      setPull(0);
    }
  }

  return (
    <section
      aria-label="整天散场尾韵"
      className={`day-page__curtain-gate ${open ? "is-open" : ""}`}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      onWheel={handleWheel}
      style={{ "--curtain-pull": pull } as CSSProperties}
    >
      <button className="day-page__curtain-peek" onClick={() => setOpen(true)} type="button">
        <span>✦</span>
        <small>用力上滑，打开今晚的尾韵</small>
        <span>✦</span>
      </button>
      {open ? (
        <div className="day-page__curtain-overlay" role="dialog" aria-modal="true">
          <div className="day-page__curtain-stars" aria-hidden />
          <button className="day-page__curtain-close" onClick={() => setOpen(false)} type="button">
            收起
          </button>
          <article className="day-page__curtain-full">
            <p className="day-page__curtain-kicker">整天散场尾韵</p>
            <div className="day-page__curtain-copy">
              {renderParagraphs(content)}
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}

function renderParagraphs(content: string) {
  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => (
      <p key={paragraph} className="m-0 whitespace-pre-line">
        {paragraph}
      </p>
    ));
}
