import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function read(file: string) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

test("local preview uses an isolated Next cache instead of the production build cache", () => {
  const pkg = JSON.parse(read("package.json")) as { scripts: Record<string, string> };
  const config = read("next.config.ts");
  const tsconfig = read("tsconfig.json");
  const eslintConfig = read("eslint.config.mjs");
  const publicPage = read("src/app/page.tsx");

  assert.match(pkg.scripts["preview:local"], /NEXT_DIST_DIR=\.next-dev/);
  assert.match(pkg.scripts["preview:local"], /next dev -p 3001/);
  assert.match(pkg.scripts.build, /^next build$/);
  assert.match(config, /distDir:\s*process\.env\.NEXT_DIST_DIR\s*\?\?\s*"\.next"/);
  assert.match(tsconfig, /\.next-dev\/types\/\*\*\/\*\.ts/);
  assert.match(eslintConfig, /"\.next-dev\/\*\*"/);
  assert.doesNotMatch(publicPage, /localhost:3002|3002/);
});
