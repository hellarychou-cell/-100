import { readFileSync } from "node:fs";
import path from "node:path";

export type ScheduleDay = {
  aiPrompt: string;
  bodyNote: string;
  bodyStation: string;
  day: number;
  dimension: string;
  mirror: string;
  mysteryCard: string;
  rotation: string;
  title: string;
};

export type ScheduleWoman = {
  cardType: string;
  day: number;
  field: string;
  name: string;
  quoteSource: string;
};

const schedulePath = path.join(process.cwd(), "100天内容 · 完整排期表.md");

export function getScheduleDays() {
  return parseScheduleMarkdown(readFileSync(schedulePath, "utf8"));
}

export function getScheduleDay(day: number) {
  return getScheduleDays().find((item) => item.day === day) ?? null;
}

export function getScheduleWomen() {
  return parseScheduleWomenMarkdown(readFileSync(schedulePath, "utf8"));
}

export function parseScheduleMarkdown(source: string): ScheduleDay[] {
  const scopedSource = sliceBetween(source, "## 六、100天完整排期表", "## 七、神秘卡分配校验");
  const rows = scopedSource
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && /\|\s*(?:\*\*)?\d+/.test(line));

  const byDay = new Map<number, ScheduleDay>();

  for (const row of rows) {
    const cells = row
      .split("|")
      .slice(1, -1)
      .map((cell) => cleanupCell(cell));
    const day = Number(cells[0]);
    if (!Number.isInteger(day) || day < 1 || day > 100) continue;

    const hasBodyStationColumn = cells.length >= 9;
    byDay.set(day, {
      day,
      title: cells[1] || `Day ${day}`,
      dimension: cells[2] || "",
      mirror: cells[3] || "",
      bodyNote: cells[4] || "",
      bodyStation: hasBodyStationColumn ? cells[5] : "",
      aiPrompt: hasBodyStationColumn ? cells[6] : cells[5] || "",
      rotation: hasBodyStationColumn ? cells[7] : cells[6] || "",
      mysteryCard: hasBodyStationColumn ? cells[8] : cells[7] || "",
    });
  }

  return Array.from(byDay.values()).sort((a, b) => a.day - b.day);
}

export function parseScheduleWomenMarkdown(source: string): ScheduleWoman[] {
  const scopedSource = sliceBetween(source, "## 十、神秘卡正面", "## 十一、金句来源分类");
  return scopedSource
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && /\|\s*\d+\s*\|/.test(line))
    .map((row) => {
      const cells = row
        .split("|")
        .slice(1, -1)
        .map((cell) => cleanupCell(cell));
      return {
        day: Number(cells[0]),
        name: cells[1] || "",
        field: cells[2] || "",
        cardType: cells[3] || "",
        quoteSource: cells[4] || "",
      };
    })
    .filter((item) => Number.isInteger(item.day) && item.day >= 1 && item.day <= 100);
}

function sliceBetween(source: string, startText: string, endText: string) {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start >= 0 ? start : 0);
  if (start < 0) return source;
  return source.slice(start, end > start ? end : undefined);
}

export function getPhaseForDay(day: number) {
  if (day <= 25) return "觉醒期";
  if (day <= 50) return "理解期";
  if (day <= 75) return "重建期";
  return "创造期";
}

function cleanupCell(value: string) {
  return value
    .replace(/<br\s*\/?>/giu, " ")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
