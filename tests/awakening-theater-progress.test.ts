import test from "node:test";
import assert from "node:assert/strict";
import {
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

test("day page reading stage locks later sections until theater and AI are complete", () => {
  assert.equal(getDayPageReadingStage({ aiCompleted: false, reflectionUnlocked: false, theaterCompleted: false }), "theater");
  assert.equal(getDayPageReadingStage({ aiCompleted: false, reflectionUnlocked: false, theaterCompleted: true }), "theater");
  assert.equal(getDayPageReadingStage({ aiCompleted: false, reflectionUnlocked: true, theaterCompleted: true }), "reflection");
  assert.equal(getDayPageReadingStage({ aiCompleted: true, reflectionUnlocked: true, theaterCompleted: true }), "content");
  assert.equal(getDayPageReadingStage({ aiCompleted: true, reflectionUnlocked: true, theaterCompleted: false }), "theater");
});
