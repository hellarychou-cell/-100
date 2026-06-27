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
      className={`ai-method-tip ${expanded ? "is-open" : ""}`}
      onClick={() => setExpanded((current) => !current)}
      type="button"
    >
      <span>{expanded ? text : "深度自我看见"}</span>
    </button>
  );
}
