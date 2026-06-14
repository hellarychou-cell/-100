import { readFileSync } from "node:fs";
import path from "node:path";
import { getPhaseForDay, getScheduleDays } from "./schedule.ts";

export type BodyStationSection = {
  content: string;
  title: string;
};

export type BodyStationEntry = {
  day: number;
  intro: string;
  sections: BodyStationSection[];
  subtitle: string;
  theme: string;
  title: string;
};

export type BodyStationIndexItem = {
  bodyNote: string;
  day: number;
  phase: string;
  status: "ready" | "locked";
  subtitle: string;
  title: string;
};

const bodyStationPath = path.join(process.cwd(), "成她-身体驿站页.md");

export function getBodyStationEntries() {
  return parseBodyStationMarkdown(readFileSync(bodyStationPath, "utf8"));
}

export function getBodyStationEntry(day: number) {
  return getBodyStationEntries().find((entry) => entry.day === day) ?? null;
}

export function getBodyStationIndex(): BodyStationIndexItem[] {
  const entries = getBodyStationEntries();
  const entryMap = new Map(entries.map((entry) => [entry.day, entry]));

  return getScheduleDays().map((day) => {
    const entry = entryMap.get(day.day);
    return {
      bodyNote: day.bodyNote,
      day: day.day,
      phase: getPhaseForDay(day.day),
      status: entry ? "ready" : "locked",
      subtitle: entry?.subtitle || day.bodyStation || day.bodyNote || "身体驿站内容待更新",
      title: entry?.title || day.bodyStation || `Day ${day.day}`,
    };
  });
}

export function parseBodyStationMarkdown(source: string): BodyStationEntry[] {
  const headingPattern = /^## 🍃 (.+?) · Day (\d+)$/gm;
  const matches = [...source.matchAll(headingPattern)];

  return matches.map((match, index) => {
    const start = match.index ?? 0;
    const next = matches[index + 1]?.index ?? source.length;
    const block = source.slice(start, next);
    const day = Number(match[2]);
    const theme = cleanup(match[1]);
    const subtitle = cleanup(block.match(/^### (.+)$/m)?.[1] ?? "");
    const intro = cleanup((block.match(/>\s*([\s\S]*?)\n\n### ①/m)?.[1] ?? "").replace(/^>\s?/gm, ""));
    const sections = parseSections(block);

    return {
      day,
      intro,
      sections,
      subtitle,
      theme,
      title: subtitle ? `${theme}：${subtitle}` : theme,
    };
  });
}

function parseSections(block: string): BodyStationSection[] {
  const sectionPattern = /^### (.+)$/gm;
  const matches = [...block.matchAll(sectionPattern)];

  return matches.map((match, index) => {
    const start = block.indexOf("\n", match.index ?? 0);
    const next = matches[index + 1]?.index ?? block.length;
    return {
      title: cleanup(match[1]),
      content: cleanup(block.slice(start + 1, next)),
    };
  }).filter((section) => section.content.length > 0);
}

function cleanup(value: string) {
  return value
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
