import assert from "node:assert/strict";
import test from "node:test";

import { treasureEntries } from "../src/lib/product-navigation.ts";

test("treasure entries use the final public collection name", () => {
  const titles = treasureEntries.map((entry) => entry.title);

  assert.deepEqual(titles, ["成长档案", "知识库", "身体驿站", "神秘卡册", "测评结果"]);
  assert.equal(treasureEntries.find((entry) => entry.title === "神秘卡册")?.href, "/collection");
});
