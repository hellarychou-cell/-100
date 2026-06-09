"use client";

import { useState } from "react";

export function AIHoverTip({
  methodTitle,
  methodNote,
}: {
  methodTitle: string;
  methodNote: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const text = `今天用的方法是“${methodTitle}”。${methodNote}`;

  return (
    <button
      className="mb-3 block w-full bg-transparent p-0 text-left sans text-[11px] leading-relaxed text-[var(--muted)]/70"
      onClick={() => setExpanded((current) => !current)}
      type="button"
    >
      <span className={expanded ? "" : "line-clamp-1"}>
        {text}
      </span>
      {!expanded ? <span className="text-clay/70">...</span> : null}
    </button>
  );
}
