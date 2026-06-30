"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AwakeningTheaterContent, TheaterChoiceKey, TheaterChoiceOption } from "@/lib/day-document";
import {
  AWAKENING_THEATER_CHOICE_EVENT,
  createAwakeningTheaterChoice,
  getAwakeningTheaterProgress,
  LOCAL_DAY_READING_STAGE_KEY,
  readAwakeningTheaterChoice,
  saveAwakeningTheaterChoice,
  summarizeTheaterChoice,
} from "@/lib/awakening-theater";
import { saveTheaterChoiceRecord } from "@/lib/growth-records";

export function AwakeningTheater({
  day,
  theater,
}: {
  day: number;
  theater: AwakeningTheaterContent;
}) {
  const [firstChoice, setFirstChoice] = useState<TheaterChoiceKey | null>(null);
  const [secondChoice, setSecondChoice] = useState<TheaterChoiceKey | null>(null);
  const [condensed, setCondensed] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const hasFirstChoices = theater.firstChoices.length > 0;
  const hasSecondChoices = theater.secondChoices.length > 0;

  useEffect(() => {
    const existing = readAwakeningTheaterChoice(day);
    if (!existing) return;
    setFirstChoice(existing.firstChoice);
    setSecondChoice(existing.secondChoice ?? null);
    if (isReflectionUnlocked(day)) {
      setCondensed(true);
    }
  }, [day]);

  const canStartAI = !hasFirstChoices || (firstChoice && (!hasSecondChoices || secondChoice));
  const currentChoice = useMemo(() => {
    if (!firstChoice && !secondChoice && !hasFirstChoices) {
      return createAwakeningTheaterChoice({ day, firstChoice: "A" });
    }
    if (!firstChoice) return null;
    return createAwakeningTheaterChoice({
      day,
      firstChoice,
      secondChoice: secondChoice ?? undefined,
    });
  }, [day, firstChoice, hasFirstChoices, secondChoice]);
  const progress = getAwakeningTheaterProgress({
    choice: currentChoice,
    hasFirstChoices,
    hasSecondChoices,
  });
  const isComplete = progress.mode === "completed";
  const shouldCondense = condensed && isComplete;

  function chooseFirst(key: TheaterChoiceKey) {
    setFirstChoice(key);
    setSecondChoice(null);
    setCondensed(false);
    if (!hasSecondChoices) {
      persistChoice(createAwakeningTheaterChoice({ day, firstChoice: key }));
    }
  }

  function chooseSecond(key: TheaterChoiceKey) {
    if (!firstChoice) return;
    setSecondChoice(key);
    setCondensed(false);
    persistChoice(createAwakeningTheaterChoice({ day, firstChoice, secondChoice: key }));
  }

  function startTodayConversation() {
    if (!hasFirstChoices) {
      persistChoice(createAwakeningTheaterChoice({ day, firstChoice: "A" }));
    }
    unlockReflection();
  }

  function persistChoice(choice: ReturnType<typeof createAwakeningTheaterChoice>) {
    saveAwakeningTheaterChoice(choice);
    saveTheaterChoiceRecord(choice).catch((error) => {
      console.warn("Failed to sync awakening theater choice:", error);
    });
    window.dispatchEvent(new CustomEvent(AWAKENING_THEATER_CHOICE_EVENT, { detail: { day } }));
  }

  function unlockReflection() {
    setCondensed(true);
    saveReflectionUnlocked(day);
    window.dispatchEvent(new CustomEvent(AWAKENING_THEATER_CHOICE_EVENT, { detail: { day } }));
  }

  return (
    <div className={`awakening-theater ${isComplete ? "is-complete" : ""} ${shouldCondense ? "is-condensed" : ""}`}>
      {shouldCondense ? (
        <div className="awakening-theater__summary">
          <p>{summarizeTheaterChoice(currentChoice)}</p>
          <button type="button" onClick={() => setCondensed(false)}>
            重新展开剧场
          </button>
        </div>
      ) : (
        <div className="awakening-theater__stage" ref={stageRef}>
          <div className="awakening-theater__copy">
            {renderParagraphs(theater.intro || theater.fullText)}
          </div>

          {hasFirstChoices ? (
            <ChoiceGroup
              choices={theater.firstChoices}
              current={firstChoice}
              label="第一选择 · 面对外界那一秒"
              onChoose={chooseFirst}
            />
          ) : null}

          {firstChoice ? (
            <BranchPanel content={theater.branches[firstChoice] ?? ""} title={`你选择了 ${firstChoice}`} />
          ) : null}

          {firstChoice && theater.common ? (
            <div className="awakening-theater__common">
              {renderParagraphs(theater.common)}
            </div>
          ) : null}

          {firstChoice && hasSecondChoices ? (
            <ChoiceGroup
              choices={theater.secondChoices}
              current={secondChoice}
              label="第二选择 · 夜里一个人时"
              onChoose={chooseSecond}
            />
          ) : null}

          {secondChoice ? (
            <BranchPanel content={theater.branches[secondChoice] ?? ""} title={`你选择了 ${secondChoice}`} />
          ) : null}

          {(!hasFirstChoices || currentChoice) && theater.reveal ? (
            <div className="awakening-theater__reveal">
              <strong>底层代码揭示</strong>
              {renderParagraphs(theater.reveal)}
            </div>
          ) : null}

          {(!hasFirstChoices || canStartAI) && theater.interlude ? (
            <div className="awakening-theater__interlude">
              <p>{theater.interlude.replace(/→\s*\[开始对话\]/, "").trim()}</p>
              <button type="button" onClick={startTodayConversation}>
                点击开始今日对话
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function isReflectionUnlocked(day: number) {
  if (typeof window === "undefined") return false;
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

function saveReflectionUnlocked(day: number) {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(LOCAL_DAY_READING_STAGE_KEY);
  let parsed: Record<string, { reflectionUnlocked?: boolean }> = {};
  if (raw) {
    try {
      parsed = JSON.parse(raw) as Record<string, { reflectionUnlocked?: boolean }>;
    } catch {
      parsed = {};
    }
  }
  window.localStorage.setItem(
    LOCAL_DAY_READING_STAGE_KEY,
    JSON.stringify({ ...parsed, [String(day)]: { ...parsed[String(day)], reflectionUnlocked: true } }),
  );
}

function ChoiceGroup({
  choices,
  current,
  label,
  onChoose,
}: {
  choices: TheaterChoiceOption[];
  current: TheaterChoiceKey | null;
  label: string;
  onChoose: (key: TheaterChoiceKey) => void;
}) {
  return (
    <div className="awakening-theater__choices">
      <p>{label}</p>
      <div>
        {choices.map((choice) => (
          <button
            className={current === choice.key ? "is-selected" : ""}
            key={choice.key}
            onClick={() => onChoose(choice.key)}
            type="button"
          >
            <span>{choice.key}</span>
            <strong>{choice.label}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}

function BranchPanel({ content, title }: { content: string; title: string }) {
  if (!content) return null;
  return (
    <div className="awakening-theater__branch">
      <span>{title}</span>
      {renderParagraphs(content)}
    </div>
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
