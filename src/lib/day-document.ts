import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type DayExtraSection = {
  title: string;
  content: string;
};

export type DayDocumentContent = {
  aiMethod: {
    title: string;
    note: string;
  };
  aiOpening: string;
  aiQuestion: string;
  bodyNote: string;
  cardPointLine: string;
  dimensionLine: string;
  extraSections: DayExtraSection[];
  mirror: string;
  phaseLine: string;
  story: string;
  storyPreview: string;
  title: string;
};

const dayDocumentPath = join(process.cwd(), "成她-Day1-7.md");

export async function getDayDocumentContent(day: number): Promise<DayDocumentContent> {
  const source = await readFile(dayDocumentPath, "utf8");
  return parseDayDocumentContent(source, day);
}

export function parseDayDocumentContent(source: string, day: number): DayDocumentContent {
  const header = extractDayHeader(source, day);
  const dayBlock = extractDayBlock(source, day);
  const metadata = extractMetadata(dayBlock);
  const mirror = cleanupMarkdown(extractSection(dayBlock, "🪞 今日镜子", "📖 她的故事"));
  const story = cleanupMarkdown(extractSection(dayBlock, "📖 她的故事", "🌿 今日身体小语"));
  const bodyNote = cleanupMarkdown(extractSection(dayBlock, "🌿 今日身体小语", "🤖 AI · 今日对话"));
  const aiBlock = extractSection(dayBlock, "🤖 AI · 今日对话", "🎴 今日神秘卡");
  const cardAndAfter = extractSection(dayBlock, "🎴 今日神秘卡", "💎 完成 AI 对话后解锁");

  const methodMatch = aiBlock.match(/🎯\s+\*\*今日方法：(.+?)\*\*/);
  const detailsMatch = aiBlock.match(/<details>[\s\S]*?<summary>.*?<\/summary>([\s\S]*?)<\/details>/);
  const openingMatch = aiBlock.match(/---\s*([\s\S]*?)\[\s*输入框\s*\]/);

  return {
    aiMethod: {
      title: cleanupMarkdown(methodMatch?.[1] ?? ""),
      note: cleanupMarkdown(detailsMatch?.[1] ?? ""),
    },
    aiOpening: cleanupMarkdown(openingMatch?.[1] ?? ""),
    aiQuestion: cleanupMarkdown(openingMatch?.[1] ?? ""),
    bodyNote,
    cardPointLine: metadata.cardPointLine,
    dimensionLine: metadata.dimensionLine,
    extraSections: extractExtraSections(cardAndAfter),
    mirror,
    phaseLine: metadata.phaseLine,
    story,
    storyPreview: buildStoryPreview(story),
    title: header.title,
  };
}

function extractDayHeader(source: string, day: number) {
  const pattern = new RegExp(`^# 成她 100 · Day ${day} · (.+)$`, "m");
  const match = source.match(pattern);
  return { title: cleanupMarkdown(match?.[1] ?? `Day ${day}`) };
}

function extractDayBlock(source: string, day: number) {
  const startPattern = new RegExp(`^# 成她 100 · Day ${day} · .+$`, "m");
  const startMatch = source.match(startPattern);
  if (!startMatch || startMatch.index === undefined) {
    throw new Error(`Day ${day} content was not found in 成她-Day1-7.md`);
  }

  const rest = source.slice(startMatch.index + startMatch[0].length);
  const nextMatch = rest.match(/^# 成她 100 · Day \d+ · .+$/m);
  return nextMatch && nextMatch.index !== undefined ? rest.slice(0, nextMatch.index) : rest;
}

function extractMetadata(source: string) {
  const metaLines = source
    .split("\n")
    .map((line) => cleanupMarkdown(line.replace(/^`|`$/g, "")))
    .filter((line) => line.startsWith("📌") || line.startsWith("🏷️"));
  const dimensionLine = metaLines.find((line) => line.includes("维度")) ?? "";
  return {
    cardPointLine: dimensionLine.match(/🎯\s*卡点：(.+)$/)?.[1]?.trim() ?? "",
    dimensionLine: dimensionLine.match(/🏷️\s*维度：(.+?)(?:\s*·|$)/)?.[1]?.trim() ?? "",
    phaseLine: metaLines.find((line) => line.startsWith("📌"))?.replace(/^📌\s*/, "") ?? "",
  };
}

function extractSection(source: string, startTitle: string, endTitle: string) {
  const start = source.indexOf(`## ${startTitle}`);
  if (start < 0) return "";

  const contentStart = source.indexOf("\n", start);
  const end = source.indexOf(`## ${endTitle}`, contentStart);
  return source.slice(contentStart + 1, end >= 0 ? end : undefined).trim();
}

function extractExtraSections(source: string): DayExtraSection[] {
  const sections: DayExtraSection[] = [];
  const sectionPattern = /^## (🧠|🎯|📚|🎵|🌸) (.+)$/gm;
  const matches = [...source.matchAll(sectionPattern)];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const next = matches[index + 1];
    if (match.index === undefined) continue;

    const contentStart = source.indexOf("\n", match.index);
    const contentEnd = next?.index ?? source.length;
    sections.push({
      title: cleanupMarkdown(match[2]),
      content: cleanupMarkdown(source.slice(contentStart + 1, contentEnd)),
    });
  }

  return sections.filter((section) => section.content.length > 0);
}

function buildStoryPreview(story: string) {
  const paragraphs = story
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .filter((paragraph) => !paragraph.startsWith("林夏，34 岁") && !paragraph.startsWith(">"));
  return paragraphs.slice(0, 3).join("\n\n").slice(0, 360);
}

function cleanupMarkdown(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, "")
    .replace(/<details>|<\/details>/g, "")
    .replace(/<summary>.*?<\/summary>/g, "")
    .replace(/\[\[(.*?)\]\]/g, "$1")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/^>\s?/gm, "")
    .replace(/^\s*---\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
