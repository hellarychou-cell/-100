"use client";

import { useEffect, useState } from "react";
import {
  AWAKENING_THEATER_CHOICE_EVENT,
  getAwakeningTheaterProgress,
  readAwakeningTheaterChoice,
} from "@/lib/awakening-theater";

export function TheaterAnchorHint({
  day,
  hasFirstChoices,
  hasSecondChoices,
}: {
  day: number;
  hasFirstChoices: boolean;
  hasSecondChoices: boolean;
}) {
  const [text, setText] = useState("完成觉醒剧场选择后，AI 会从你刚才那一幕接住你。");

  useEffect(() => {
    function refresh() {
      const progress = getAwakeningTheaterProgress({
        choice: readAwakeningTheaterChoice(day),
        hasFirstChoices,
        hasSecondChoices,
      });
      setText(progress.anchorPreview);
    }

    refresh();
    window.addEventListener(AWAKENING_THEATER_CHOICE_EVENT, refresh);
    return () => window.removeEventListener(AWAKENING_THEATER_CHOICE_EVENT, refresh);
  }, [day, hasFirstChoices, hasSecondChoices]);

  return <p className="day-page__anchor-hint">{text}</p>;
}
