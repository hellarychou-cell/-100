"use client";

import { ReactNode, useEffect, useState } from "react";
import { AWAKENING_THEATER_CHOICE_EVENT } from "@/components/AwakeningTheater";
import {
  getAwakeningTheaterProgress,
  getDayPageReadingStage,
  LOCAL_DAY_READING_STAGE_KEY,
  readAwakeningTheaterChoice,
  type DayPageReadingStage,
} from "@/lib/awakening-theater";
import { AIConversationEntry, LOCAL_AI_CONVERSATION_KEY } from "@/lib/self-reflection";

export function DayProgressiveSections({
  children,
  day,
  hasFirstChoices,
  hasSecondChoices,
}: {
  children: ReactNode;
  day: number;
  hasFirstChoices: boolean;
  hasSecondChoices: boolean;
}) {
  const [stage, setStage] = useState<DayPageReadingStage>("theater");

  useEffect(() => {
    function refresh() {
      const theaterProgress = getAwakeningTheaterProgress({
        choice: readAwakeningTheaterChoice(day),
        hasFirstChoices,
        hasSecondChoices,
      });
      setStage(
        getDayPageReadingStage({
          aiCompleted: hasCompletedAIConversation(day),
          reflectionUnlocked: isReflectionUnlocked(day),
          theaterCompleted: theaterProgress.mode === "completed",
        }),
      );
    }

    refresh();
    window.addEventListener(AWAKENING_THEATER_CHOICE_EVENT, refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener(AWAKENING_THEATER_CHOICE_EVENT, refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [day, hasFirstChoices, hasSecondChoices]);

  return (
    <div className={`day-page__section-stack day-page__section-stack--${stage}`} data-stage={stage}>
      {children}
    </div>
  );
}

function isReflectionUnlocked(day: number) {
  const raw = window.localStorage.getItem(LOCAL_DAY_READING_STAGE_KEY);
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw) as Record<string, { reflectionUnlocked?: boolean }>;
    return Boolean(parsed?.[String(day)]?.reflectionUnlocked);
  } catch {
    window.localStorage.removeItem(LOCAL_DAY_READING_STAGE_KEY);
    return false;
  }
}

function hasCompletedAIConversation(day: number) {
  const raw = window.localStorage.getItem(LOCAL_AI_CONVERSATION_KEY);
  if (!raw) return false;

  try {
    const entries = JSON.parse(raw) as AIConversationEntry[];
    if (!Array.isArray(entries)) return false;
    const entry = entries.find((item) => item.day === day);
    return Boolean(entry?.messages.some((message) => message.role === "assistant" && message.content.trim().length > 0));
  } catch {
    window.localStorage.removeItem(LOCAL_AI_CONVERSATION_KEY);
    return false;
  }
}
