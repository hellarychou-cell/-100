import assert from "node:assert/strict";
import test from "node:test";

import { getSeedlingState } from "../src/lib/seedling-state.ts";

test("seedling state follows assessment score tiers", () => {
  assert.deepEqual(getSeedlingState(88), {
    stage: "seed",
    icon: "seed",
    label: "还在土里，但已经有力量",
    sentence: "你可能经常觉得累、卡、拧巴、不自由。但这不是你不行。更可能是你身上背了太多不属于你的声音。",
  });
  assert.equal(getSeedlingState(66).stage, "sprout");
  assert.equal(getSeedlingState(46).stage, "seedling");
  assert.equal(getSeedlingState(28).stage, "sapling");
  assert.equal(getSeedlingState(12).stage, "tree");
});

test("seedling state has a gentle default before assessment", () => {
  assert.deepEqual(getSeedlingState(null), {
    stage: "seed",
    icon: "seed",
    label: "等待第一次测评",
    sentence: "先把自己种回自己的土壤里，做完测评后，这里会长出你的内在小苗苗状态。",
  });
});
