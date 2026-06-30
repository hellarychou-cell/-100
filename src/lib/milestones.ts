import { readFileSync } from "node:fs";
import path from "node:path";
import type { MilestoneContent } from "./milestone-types.ts";

export function getMilestoneContent(day: number): MilestoneContent | null {
  if (day !== 7) return null;
  const raw = readFileSync(path.join(process.cwd(), "成她-Day1-7.md"), "utf8");
  const match = raw.match(/#\s+🌸\s+第一周里程碑\s+·\s+(.+?)\n([\s\S]*?)(?=\n#\s|\n##\s+🌱\s+内在小苗苗状态|$)/u);
  if (!match) return null;
  return {
    body: cleanMilestoneBody(match[2]),
    subtitle: "Week 1 · 完成",
    title: `第一周里程碑 · ${match[1].trim()}`,
  };
}

function cleanMilestoneBody(value: string) {
  return value
    .replace(/```[\s\S]*?```/gu, (block) => block.replace(/```/g, "").trim())
    .replace(/\[ 查看全部 7 天的对话 → \]/u, "")
    .split(/\n/)
    .filter((line) => !/^\s*(最后|最近)更新\s*[：:].*$/u.test(line.trim()))
    .join("\n")
    .trim();
}
