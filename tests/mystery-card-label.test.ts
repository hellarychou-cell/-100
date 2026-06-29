import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getDailyMysteryCardTypeLabel } from "../src/lib/mystery-card-label.ts";

test("daily mystery card labels show benefit, gratitude, and a softer blank label", () => {
  assert.equal(getDailyMysteryCardTypeLabel("benefit"), "福利卡");
  assert.equal(getDailyMysteryCardTypeLabel("gratitude"), "感恩卡");
  assert.equal(getDailyMysteryCardTypeLabel("blank"), "留白卡");
});

test("daily mystery card back does not render a duplicate type label above the title", () => {
  const source = fs.readFileSync("src/components/MysteryCard.tsx", "utf8");
  const dailyStart = source.indexOf('if (variant === "daily")');
  const defaultStart = source.indexOf("  return (\n    <div", dailyStart);
  const dailyBranch = source.slice(dailyStart, defaultStart);

  assert.doesNotMatch(dailyBranch, /mystery-card__daily-type/);
});
