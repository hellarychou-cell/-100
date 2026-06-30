import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSelfSeeingPreview,
  createAwakeningTheaterChoice,
  getAwakeningTheaterProgress,
  getDayPageReadingStage,
} from "../src/lib/awakening-theater.ts";

test("awakening theater stays in reading mode until required choices are complete", () => {
  const noChoice = getAwakeningTheaterProgress({
    choice: null,
    hasFirstChoices: true,
    hasSecondChoices: true,
  });
  assert.equal(noChoice.mode, "reading");
  assert.equal(noChoice.reflectionExpanded, false);

  const onlyFirst = getAwakeningTheaterProgress({
    choice: createAwakeningTheaterChoice({ day: 1, firstChoice: "B" }),
    hasFirstChoices: true,
    hasSecondChoices: true,
  });
  assert.equal(onlyFirst.mode, "reading");
  assert.equal(onlyFirst.reflectionExpanded, false);

  const completed = getAwakeningTheaterProgress({
    choice: createAwakeningTheaterChoice({ day: 1, firstChoice: "B", secondChoice: "Y" }),
    hasFirstChoices: true,
    hasSecondChoices: true,
  });
  assert.equal(completed.mode, "completed");
  assert.equal(completed.reflectionExpanded, true);
  assert.match(completed.anchorPreview, /从没跟人说的事/);
  assert.match(completed.anchorPreview, /没敢说出来|只对自己/);
});

test("single-line theater days can complete without second choices", () => {
  const completed = getAwakeningTheaterProgress({
    choice: createAwakeningTheaterChoice({ day: 5, firstChoice: "A" }),
    hasFirstChoices: false,
    hasSecondChoices: false,
  });

  assert.equal(completed.mode, "completed");
  assert.equal(completed.reflectionExpanded, true);
  assert.match(completed.anchorPreview, /今天 AI 会从你刚才的选择接住你/);
});

test("self seeing preview changes with awakening theater choices", () => {
  const fallback = "今天妈妈说了什么？";
  const choiceA = createAwakeningTheaterChoice({ day: 1, firstChoice: "A", secondChoice: "X" });
  const choiceC = createAwakeningTheaterChoice({ day: 1, firstChoice: "C", secondChoice: "Y" });

  const promptA = buildSelfSeeingPreview({ choice: choiceA, fallbackQuestion: fallback });
  const promptC = buildSelfSeeingPreview({ choice: choiceC, fallbackQuestion: fallback });

  assert.notEqual(promptA, promptC);
  assert.match(promptA, /大家开心就好/);
  assert.match(promptC, /消息|带走/);
  assert.match(buildSelfSeeingPreview({ choice: null, fallbackQuestion: fallback }), /今天妈妈说了什么/);
});

test("day page reading stage locks later sections until theater and AI are complete", () => {
  assert.equal(getDayPageReadingStage({ aiCompleted: false, reflectionUnlocked: false, theaterCompleted: false }), "theater");
  assert.equal(getDayPageReadingStage({ aiCompleted: false, reflectionUnlocked: false, theaterCompleted: true }), "theater");
  assert.equal(getDayPageReadingStage({ aiCompleted: false, reflectionUnlocked: true, theaterCompleted: true }), "reflection");
  assert.equal(getDayPageReadingStage({ aiCompleted: true, reflectionUnlocked: true, theaterCompleted: true }), "content");
  assert.equal(getDayPageReadingStage({ aiCompleted: true, reflectionUnlocked: true, theaterCompleted: false }), "theater");
});
