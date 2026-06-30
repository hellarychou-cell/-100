import { readFileSync } from "node:fs";
import path from "node:path";
import type { MilestoneContent } from "./milestone-types.ts";

export function getMilestoneContent(day: number): MilestoneContent | null {
  if (day !== 7) return null;
  const raw = readFileSync(path.join(process.cwd(), "成她-Day1-7.md"), "utf8");
  const match = raw.match(/#\s+🌸\s+第一周里程碑\s+·\s+(.+?)\n/u);
  if (!match) return null;
  return {
    collectedItems: [
      { icon: "🪞", label: "镜子" },
      { icon: "📖", label: "故事" },
      { icon: "🌿", label: "身体小语" },
      { icon: "✨", label: "神秘卡" },
    ],
    completedRange: "Day 01-07",
    day,
    eyebrow: "第 1 周里程碑",
    stats: [
      { icon: "✦", label: "天已点亮", value: 7 },
      { icon: "▣", label: "张神秘卡", value: 7 },
      { icon: "♡", label: "次 AI 对话", value: 0 },
    ],
    summary: "这一周，你不是变得更好，而是开始更诚实地看见自己。",
    title: normalizeMilestoneTitle(match[1]),
    weekNumber: 1,
  };
}

function normalizeMilestoneTitle(value: string) {
  return value
    .trim()
    .replace(/^第\d+周里程碑\s*·\s*/u, "")
    .replace(/"([^"]+)"/u, "，$1")
    .replace(/，$/u, "");
}
