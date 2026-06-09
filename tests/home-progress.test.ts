import assert from "node:assert/strict";
import test from "node:test";

import { getHomeUserState, getProgressCardState, shouldShowAssessmentPrompt } from "../src/lib/home-state.ts";

test("home state asks new users to complete assessment first", () => {
  assert.equal(getHomeUserState({ hasAssessment: false, isMember: false }), "needs-assessment");
});

test("home state lets assessed users view their report while waiting for membership", () => {
  assert.equal(getHomeUserState({ hasAssessment: true, isMember: false }), "waiting-membership");
});

test("home state opens active progress after assessment and membership", () => {
  assert.equal(getHomeUserState({ hasAssessment: true, isMember: true }), "active-member");
});

test("progress card states distinguish completed, today, tomorrow, and future days", () => {
  assert.equal(getProgressCardState({ day: 6, currentDay: 7, completedDays: [1, 2, 6] }), "completed");
  assert.equal(getProgressCardState({ day: 7, currentDay: 7, completedDays: [1, 2, 6] }), "today");
  assert.equal(getProgressCardState({ day: 8, currentDay: 7, completedDays: [1, 2, 6] }), "tomorrow");
  assert.equal(getProgressCardState({ day: 9, currentDay: 7, completedDays: [1, 2, 6] }), "future");
});

test("assessment prompt appears only until dismissed or completed", () => {
  assert.equal(shouldShowAssessmentPrompt({ hasAssessment: false, dismissed: false }), true);
  assert.equal(shouldShowAssessmentPrompt({ hasAssessment: false, dismissed: true }), false);
  assert.equal(shouldShowAssessmentPrompt({ hasAssessment: true, dismissed: false }), false);
});
