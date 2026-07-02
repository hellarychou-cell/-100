import assert from "node:assert/strict";
import test from "node:test";
import {
  getClickDrivenCurrentDay,
  getCollapsedProgressDays,
  getNextUnlockDate,
  isDayUnlocked,
  getReadableCurrentDay,
  markDayCompleted,
  requiresMembershipForDay,
  startProgressFromDay,
} from "../src/lib/progress.ts";

test("uses the saved progress day when it has published content", () => {
  assert.equal(getReadableCurrentDay(3), 3);
});

test("keeps the saved recommended day even when content is not published yet", () => {
  assert.equal(getReadableCurrentDay(20), 20);
});

test("starts the journey from the selected day without completing earlier days", () => {
  assert.deepEqual(startProgressFromDay(1, "2026-06-28"), {
    completedDays: [],
    currentDay: 1,
    journeyStartDate: "2026-06-28",
    journeyStartDay: 1,
    nextUnlockDate: null,
  });
  assert.deepEqual(startProgressFromDay(7, "2026-06-28"), {
    completedDays: [],
    currentDay: 7,
    journeyStartDate: "2026-06-28",
    journeyStartDay: 7,
    nextUnlockDate: null,
  });
});

test("falls back to day one when saved progress is missing", () => {
  assert.equal(getReadableCurrentDay(null), 1);
});

test("marks a day completed once and waits until the next China date to unlock the following day", () => {
  assert.deepEqual(markDayCompleted({ currentDay: 7, completedDays: [1, 2, 6] }, 7, "2026-06-28"), {
    currentDay: 7,
    completedDays: [1, 2, 6, 7],
    nextUnlockDate: "2026-06-29",
  });
});

test("marking an already completed day keeps completedDays unique", () => {
  assert.deepEqual(markDayCompleted({ currentDay: 7, completedDays: [1, 2, 7] }, 7, "2026-06-28"), {
    currentDay: 7,
    completedDays: [1, 2, 7],
    nextUnlockDate: "2026-06-29",
  });
});

test("click-driven progress stays on a collected day until the next China date", () => {
  assert.equal(
    getClickDrivenCurrentDay({
      completedDays: [1, 2, 6, 7],
      journeyStartDate: "2026-06-28",
      journeyStartDay: 7,
      nextUnlockDate: "2026-06-29",
      savedDay: 7,
      todayDate: "2026-06-28",
    }),
    7,
  );
  assert.equal(
    getClickDrivenCurrentDay({
      completedDays: [1, 2, 6, 7],
      journeyStartDate: "2026-06-28",
      journeyStartDay: 7,
      nextUnlockDate: "2026-06-29",
      savedDay: 7,
      todayDate: "2026-06-29",
    }),
    8,
  );
});

test("does not skip unfinished days when the user is away for multiple calendar days", () => {
  assert.equal(
    getClickDrivenCurrentDay({
      completedDays: [1, 2, 3, 4, 5, 6, 7],
      journeyStartDay: 7,
      nextUnlockDate: "2026-06-29",
      savedDay: 8,
      todayDate: "2026-07-03",
    }),
    8,
  );
});

test("repairs legacy natural-day jumps back to the first unfinished day", () => {
  assert.equal(
    getClickDrivenCurrentDay({
      completedDays: [1, 2, 3, 4, 5, 6, 7],
      journeyStartDay: 7,
      savedDay: 9,
      todayDate: "2026-06-30",
    }),
    8,
  );
});

test("day access unlocks only the effective current day and completed days", () => {
  assert.equal(isDayUnlocked({ day: 7, currentDay: 7, completedDays: [1, 2, 6, 7] }), true);
  assert.equal(isDayUnlocked({ day: 8, currentDay: 7, completedDays: [1, 2, 6, 7] }), false);
  assert.equal(isDayUnlocked({ day: 8, currentDay: 8, completedDays: [1, 2, 6, 7] }), true);
});

test("calculates the next unlock date in China time", () => {
  assert.equal(getNextUnlockDate("2026-06-28"), "2026-06-29");
});

test("uses the first seven days for the folded progress range", () => {
  const days = Array.from({ length: 100 }, (_, index) => ({ day: index + 1 }));
  assert.deepEqual(getCollapsedProgressDays(days, 8).map((item) => item.day), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(getCollapsedProgressDays(days, 14).map((item) => item.day), [1, 2, 3, 4, 5, 6, 7]);
});

test("keeps day one free and requires membership from day two", () => {
  assert.equal(requiresMembershipForDay(1), false);
  assert.equal(requiresMembershipForDay(2), true);
  assert.equal(requiresMembershipForDay(100), true);
});

test("recommended-day entry keeps prior content free for the first experience", () => {
  assert.equal(requiresMembershipForDay(1, 7), false);
  assert.equal(requiresMembershipForDay(7, 7), false);
  assert.equal(requiresMembershipForDay(8, 7), true);
  assert.equal(requiresMembershipForDay(20, 20), false);
  assert.equal(requiresMembershipForDay(21, 20), true);
});
