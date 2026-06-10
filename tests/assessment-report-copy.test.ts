import assert from "node:assert/strict";
import test from "node:test";

import {
  getDimensionInterpretation,
  getModeInsight,
  getReportSummary,
  getTopAndLowDimensions,
} from "../src/lib/assessment-report-copy.ts";

test("report summary uses the original total-score tiers", () => {
  assert.equal(getReportSummary(150).title, "深度隐形内耗");
  assert.equal(getReportSummary(120).seedling, "刚刚破土");
  assert.equal(getReportSummary(90).title, "中度隐形内耗");
  assert.equal(getReportSummary(60).title, "轻度隐形内耗");
});

test("dimension interpretations use high, middle, and low copy", () => {
  assert.equal(getDimensionInterpretation("self-worth", 90).title, "证明模式运行中");
  assert.equal(getDimensionInterpretation("boundaries", 50).title, "有觉察但还做不到");
  assert.equal(getDimensionInterpretation("wealth", 10).title, "财富容器扩容中");
});

test("mode insight returns core code and three lines", () => {
  const insight = getModeInsight("讨好型");
  assert.equal(insight.coreCode, "别人的需求比我重要，我不能让别人失望");
  assert.equal(insight.lines.length, 3);
});

test("top and low dimensions sort by raw score", () => {
  const result = getTopAndLowDimensions([
    { id: "self-worth", name: "自我价值", score: 30, index: 82 },
    { id: "boundaries", name: "关系边界", score: 22, index: 54 },
    { id: "decision", name: "决策模式", score: 12, index: 18 },
  ]);

  assert.deepEqual(result.top.map((item) => item.name), ["自我价值", "关系边界"]);
  assert.equal(result.low.name, "决策模式");
});
