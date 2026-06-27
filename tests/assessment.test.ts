import test from "node:test";
import assert from "node:assert/strict";

import {
  ASSESSMENT_DIMENSIONS,
  calculateAssessmentResult,
} from "../src/lib/assessment.ts";

test("assessment is six dimensions with seven questions each", () => {
  assert.equal(ASSESSMENT_DIMENSIONS.length, 6);
  assert.equal(
    ASSESSMENT_DIMENSIONS.reduce((sum, dimension) => sum + dimension.questions.length, 0),
    42,
  );
  for (const dimension of ASSESSMENT_DIMENSIONS) {
    assert.equal(dimension.questions.length, 7);
  }
});

test("calculates totalScore100 with the locked formula", () => {
  const answers = Object.fromEntries(
    Array.from({ length: 42 }, (_, index) => [`q${index + 1}`, 3]),
  );

  const result = calculateAssessmentResult(answers);

  assert.equal(result.rawTotal, 126);
  assert.equal(result.totalScore100, 50);
});

test("maps assessment score tiers to recommended days within the first 20 days", () => {
  const buildAnswers = (value: number) =>
    Object.fromEntries(Array.from({ length: 42 }, (_, index) => [`q${index + 1}`, value]));

  assert.equal(calculateAssessmentResult(buildAnswers(5)).recommendedDay, 1);
  assert.equal(calculateAssessmentResult(buildAnswers(3)).recommendedDay, 7);
  assert.equal(calculateAssessmentResult(buildAnswers(2)).recommendedDay, 14);
  assert.equal(calculateAssessmentResult(buildAnswers(1)).recommendedDay, 20);
});

test("calculates dimension raw scores from seven answers per dimension", () => {
  const answers = Object.fromEntries(
    Array.from({ length: 42 }, (_, index) => [`q${index + 1}`, 1]),
  );
  for (let index = 1; index <= 7; index += 1) {
    answers[`q${index}`] = 5;
  }

  const result = calculateAssessmentResult(answers);

  assert.equal(result.dimensionScores["self-worth"].raw, 35);
  assert.equal(result.dimensionScores["boundaries"].raw, 7);
});

test("rejects incomplete or out-of-range assessment answers", () => {
  assert.throws(() => calculateAssessmentResult({ q1: 3 }), /42 answers/);

  const answers = Object.fromEntries(
    Array.from({ length: 42 }, (_, index) => [`q${index + 1}`, 3]),
  );
  answers.q42 = 6;

  assert.throws(() => calculateAssessmentResult(answers), /between 1 and 5/);
});
