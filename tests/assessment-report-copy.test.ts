import assert from "node:assert/strict";
import test from "node:test";

import {
  getDimensionInterpretation,
  getModeInsight,
  getReportSummary,
  getTopAndLowDimensions,
} from "../src/lib/assessment-report-copy.ts";

test("report summary uses the improvement proposal growth-oriented score tiers", () => {
  assert.equal(getReportSummary(10).title, "自主创造期");
  assert.equal(getReportSummary(35).seedling, "正在扎根生长");
  assert.equal(getReportSummary(55).title, "深度看见期");
  assert.equal(getReportSummary(75).title, "系统觉醒期");
  assert.equal(getReportSummary(90).title, "深层释放期");
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
