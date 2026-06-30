import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const ignoreGlobs = [
  ".next/**",
  ".next-dev/**",
  "node_modules/**",
  ".superpowers/**",
  "next-env.d.ts",
  "._*",
  "**/._*",
];

const eslintConfig = [
  { ignores: ignoreGlobs },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
