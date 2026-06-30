import assert from "node:assert/strict";
import test from "node:test";

import { createSisterGiftDisplay, splitInlineStrong } from "../src/lib/collection-copy.ts";

test("sister gift display turns raw card labels into warm interaction copy", () => {
  const gift = createSisterGiftDisplay("🎴 工具卡：2.1 课题分离", "上野千鹤子");

  assert.match(gift, /上野千鹤子/);
  assert.match(gift, /轻轻拍拍自己|护身符/);
  assert.doesNotMatch(gift, /工具卡：2\.1 课题分离/);
});

test("inline markdown splitter removes visible bold marker pairs", () => {
  const parts = splitInlineStrong("然后 **先回到自己**，不要替别人扛。");

  assert.deepEqual(parts, [
    { strong: false, text: "然后 " },
    { strong: true, text: "先回到自己" },
    { strong: false, text: "，不要替别人扛。" },
  ]);
  assert.doesNotMatch(parts.map((part) => part.text).join(""), /\*\*/);
});
