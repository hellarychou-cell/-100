"use client";

import { useEffect, useState } from "react";
import {
  AWAKENING_THEATER_CHOICE_EVENT,
  buildSelfSeeingPreview,
  readAwakeningTheaterChoice,
  type AwakeningTheaterChoice,
} from "@/lib/awakening-theater";

export function SelfSeeingPrompt({
  day,
  fallbackQuestion,
}: {
  day: number;
  fallbackQuestion: string;
}) {
  const [choice, setChoice] = useState<AwakeningTheaterChoice | null>(null);

  useEffect(() => {
    const refresh = () => setChoice(readAwakeningTheaterChoice(day));
    refresh();
    window.addEventListener(AWAKENING_THEATER_CHOICE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(AWAKENING_THEATER_CHOICE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [day]);

  return (
    <p className="day-page__ai-prompt mb-4 leading-[1.8] text-[#4f3429]">
      {buildSelfSeeingPreview({ choice, fallbackQuestion })}
    </p>
  );
}
