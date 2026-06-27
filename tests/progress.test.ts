import assert from "node:assert/strict";
import test from "node:test";
import { getReadableCurrentDay, markDayCompleted, startProgressFromDay } from "../src/lib/progress.ts";

test("uses the saved progress day when it has published content", () => {
  assert.equal(getReadableCurrentDay(3), 3);
});

test("keeps the saved recommended day even when content is not published yet", () => {
  assert.equal(getReadableCurrentDay(20), 20);
});

test("starts the journey from the selected day without completing earlier days", () => {
  assert.deepEqual(startProgressFromDay(1), { currentDay: 1, completedDays: [] });
  assert.deepEqual(startProgressFromDay(7), { currentDay: 7, completedDays: [] });
});

test("falls back to day one when saved progress is missing", () => {
  assert.equal(getReadableCurrentDay(null), 1);
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
