import assert from "node:assert/strict";
import test from "node:test";
import {
  getCalendarCurrentDay,
  getCollapsedProgressDays,
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
  });
  assert.deepEqual(startProgressFromDay(7, "2026-06-28"), {
    completedDays: [],
    currentDay: 7,
    journeyStartDate: "2026-06-28",
    journeyStartDay: 7,
  });
});

test("falls back to day one when saved progress is missing", () => {
  assert.equal(getReadableCurrentDay(null), 1);
});

test("marks a day completed once without advancing the natural-day journey", () => {
  assert.deepEqual(markDayCompleted({ currentDay: 7, completedDays: [1, 2, 6] }, 7), {
    currentDay: 7,
    completedDays: [1, 2, 6, 7],
  });
});

test("marking an already completed day keeps completedDays unique", () => {
  assert.deepEqual(markDayCompleted({ currentDay: 7, completedDays: [1, 2, 7] }, 7), {
    currentDay: 7,
    completedDays: [1, 2, 7],
  });
});

test("derives the current day from the journey start date in China time", () => {
  assert.equal(
    getCalendarCurrentDay({
      journeyStartDate: "2026-06-28",
      journeyStartDay: 7,
      savedDay: 7,
      todayDate: "2026-06-28",
    }),
    7,
  );
  assert.equal(
    getCalendarCurrentDay({
      journeyStartDate: "2026-06-28",
      journeyStartDay: 7,
      savedDay: 7,
      todayDate: "2026-06-29",
    }),
    8,
  );
});

test("falls back to saved day when journey start data is missing", () => {
  assert.equal(getCalendarCurrentDay({ savedDay: 8, todayDate: "2026-06-29" }), 8);
});

test("uses a continuous folded progress range around the current week", () => {
  const days = Array.from({ length: 100 }, (_, index) => ({ day: index + 1 }));
  assert.deepEqual(getCollapsedProgressDays(days, 8).map((item) => item.day), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(getCollapsedProgressDays(days, 14).map((item) => item.day), [8, 9, 10, 11, 12, 13, 14]);
});

test("keeps day one free and requires membership from day two", () => {
  assert.equal(requiresMembershipForDay(1), false);
  assert.equal(requiresMembershipForDay(2), true);
  assert.equal(requiresMembershipForDay(100), true);
});
