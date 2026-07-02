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
  const syncScript = read("scripts/sync-to-github.sh");

  assert.match(pkg.scripts["preview:local"], /NEXT_DIST_DIR=\.next-dev/);
  assert.match(pkg.scripts["preview:local"], /next dev -p 3001/);
  assert.match(pkg.scripts.build, /^next build$/);
  assert.match(config, /distDir:\s*process\.env\.NEXT_DIST_DIR\s*\?\?\s*"\.next"/);
  assert.match(tsconfig, /\.next-dev\/types\/\*\*\/\*\.ts/);
  assert.match(eslintConfig, /"\.next-dev\/\*\*"/);
  assert.doesNotMatch(publicPage, /localhost:3002|3002/);
  assert.match(syncScript, /--exclude "\.next-dev\/"/);
  assert.match(syncScript, /--exclude "\.next-dev\*\/"/);
  assert.match(syncScript, /--exclude "\.env\.local"/);
  assert.match(syncScript, /--exclude "\.env\.production"/);
});

test("wechat verification file is served from the public root", () => {
  const file = "public/6693ea9e54b24c8e0740725fee817709.txt";
  assert.equal(fs.existsSync(path.join(root, file)), true);
  assert.equal(read(file).trim(), "29c3f055846cd4699bc61c0a1d324831372ef88f");
});
