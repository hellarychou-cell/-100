import assert from "node:assert/strict";
import test from "node:test";
import { getReadableCurrentDay, markDayCompleted } from "../src/lib/progress.ts";

test("uses the saved progress day when it has published content", () => {
  assert.equal(getReadableCurrentDay(3, 7), 3);
});

test("falls back to latest published day when saved progress is beyond current content", () => {
  assert.equal(getReadableCurrentDay(80, 7), 7);
});

test("falls back to day one when saved progress is missing", () => {
  assert.equal(getReadableCurrentDay(null, 7), 1);
});

test("marks a day completed once and advances to the next readable day", () => {
  assert.deepEqual(markDayCompleted({ currentDay: 7, completedDays: [1, 2, 6] }, 7), {
    currentDay: 8,
    completedDays: [1, 2, 6, 7],
  });
});

test("marking an already completed day keeps completedDays unique", () => {
  assert.deepEqual(markDayCompleted({ currentDay: 7, completedDays: [1, 2, 7] }, 7), {
    currentDay: 8,
    completedDays: [1, 2, 7],
  });
});
