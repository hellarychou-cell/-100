"use client";

import { ReactNode, useState } from "react";

export function CollapsibleStory({
  children,
  preview,
}: {
  children: ReactNode;
  preview: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="day-page__story">
      {preview}
      {open ? (
        <div className="day-page__story-full">
          {children}
          <button className="text-link day-page__collapse" onClick={() => setOpen(false)} type="button">
            收起故事⌃
          </button>
        </div>
      ) : (
        <button className="text-link day-page__expand" onClick={() => setOpen(true)} type="button">
          展开余下故事
        </button>
      )}
    </div>
  );
}
