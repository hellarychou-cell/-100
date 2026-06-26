import assert from "node:assert/strict";
import test from "node:test";
import { getKnowledgeWeek, knowledgeWeeks } from "../src/lib/knowledge-weeks.ts";

test("sixteen editorial weeks cover Day 1 through Day 100 exactly once", () => {
  assert.equal(knowledgeWeeks.length, 16);
  const days = knowledgeWeeks.flatMap((week) =>
    Array.from({ length: week.endDay - week.startDay + 1 }, (_, index) => week.startDay + index),
  );
  assert.deepEqual(days, Array.from({ length: 100 }, (_, index) => index + 1));
});

test("week lookup follows the phase-aligned editorial ranges", () => {
  assert.equal(getKnowledgeWeek(1).id, 1);
  assert.equal(getKnowledgeWeek(25).id, 4);
  assert.equal(getKnowledgeWeek(50).id, 8);
  assert.equal(getKnowledgeWeek(75).id, 12);
  assert.equal(getKnowledgeWeek(100).id, 16);
});
