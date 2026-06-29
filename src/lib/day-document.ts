import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type DayExtraSection = {
  title: string;
  content: string;
};

export type TheaterChoiceKey = "A" | "B" | "C" | "X" | "Y";

export type TheaterChoiceOption = {
  key: TheaterChoiceKey;
  label: string;
};

export type AwakeningTheaterContent = {
  branches: Partial<Record<TheaterChoiceKey, string>>;
  common: string;
  firstChoices: TheaterChoiceOption[];
  fullText: string;
  interlude: string;
  intro: string;
  reveal: string;
  secondChoices: TheaterChoiceOption[];
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
  awakeningTheater: AwakeningTheaterContent;
  mirror: string;
  phaseLine: string;
  story: string;
  storyPreview: string;
  curtainCall: string;
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
  const mirror = cleanupMarkdown(extractSectionByAliases(dayBlock, ["🪞 今日镜子"]));
  const rawStory = extractSectionByAliases(dayBlock, ["🎬 觉醒剧场", "📖 她的故事"]);
  const awakeningTheater = parseAwakeningTheater(rawStory);
  const story = cleanupMarkdown(rawStory);
  const bodyNote = cleanupMarkdown(extractSectionByAliases(dayBlock, ["🌿 今日身体小语"]));
  const aiBlock = extractSectionByAliases(dayBlock, ["🤖 AI · 今日自我看见", "🤖 AI · 今日对话"]);
  const curtainCall = cleanupMarkdown(extractSectionByAliases(dayBlock, ["🌙 整天散场尾韵"]));

  const methodMatch = aiBlock.match(/(?:🎯\s+)?(?:\*\*)?今日方法(?:\*\*)?[:：]\s*(?:\*\*)?(.+?)(?:\*\*)?(?:\n|$)/);
  const detailsMatch = aiBlock.match(/<details>[\s\S]*?<summary>.*?<\/summary>([\s\S]*?)<\/details>/);
  const referenceMatch = aiBlock.match(/(?:\*\*)?完整实现参考(?:\*\*)?[:：]\s*(.+?)(?:\n|$)/);
  const openingMatch = aiBlock.match(/---\s*([\s\S]*?)\[\s*输入框\s*\]/);
  const opening = cleanupMarkdown(openingMatch?.[1] ?? aiBlock);
  const aiQuestion = extractAIQuestion(aiBlock, opening);
  const theaterWithInterlude = awakeningTheater.interlude
    ? awakeningTheater
    : { ...awakeningTheater, interlude: `${aiQuestion} → [开始对话]` };

  return {
    aiMethod: {
      title: cleanupMarkdown(methodMatch?.[1] ?? ""),
      note: cleanupMarkdown(detailsMatch?.[1] ?? referenceMatch?.[1] ?? methodMatch?.[1] ?? ""),
    },
    aiOpening: opening,
    aiQuestion: cleanupMarkdown(theaterWithInterlude.interlude || opening),
    bodyNote,
    cardPointLine: metadata.cardPointLine,
    dimensionLine: metadata.dimensionLine,
    extraSections: extractExtraSections(dayBlock),
    awakeningTheater: theaterWithInterlude,
    mirror,
    phaseLine: metadata.phaseLine,
    story,
    storyPreview: buildStoryPreview(story),
    curtainCall,
    title: header.title,
  };
}

function extractAIQuestion(aiBlock: string, fallback: string) {
  const quoteMatch = aiBlock.match(/^>\s*(.+(?:\n>\s*.+)*)/m);
  return cleanupMarkdown(quoteMatch?.[0]?.replace(/^>\s?/gm, "") ?? fallback);
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

function extractSectionByAliases(source: string, startTitles: string[]) {
  const starts = startTitles
    .map((title) => {
      const index = source.indexOf(`## ${title}`);
      return { index, title };
    })
    .filter((item) => item.index >= 0)
    .sort((a, b) => a.index - b.index);
  const start = starts[0]?.index ?? -1;
  if (start < 0) return "";

  const contentStart = source.indexOf("\n", start);
  const endMatch = source.slice(contentStart + 1).match(/^## .+$/m);
  const end = endMatch?.index === undefined ? -1 : contentStart + 1 + endMatch.index;
  return source.slice(contentStart + 1, end >= 0 ? end : undefined).trim();
}

function extractExtraSections(source: string): DayExtraSection[] {
  const sections: DayExtraSection[] = [];
  const sectionPattern = /^## (🧠|🎯|📚|🎵|🌸) (.+)$/gm;
  const matches = [...source.matchAll(sectionPattern)];
  const curtainMatch = source.match(/^## 🌙 整天散场尾韵$/m);
  const curtainStart = curtainMatch?.index ?? source.length;

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const next = matches[index + 1];
    if (match.index === undefined) continue;

    const contentStart = source.indexOf("\n", match.index);
    const nextSectionStart = next?.index ?? source.length;
    const contentEnd = Math.min(nextSectionStart, curtainStart);
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

function parseAwakeningTheater(raw: string): AwakeningTheaterContent {
  const fullText = cleanupMarkdown(raw);
  const revealRaw = extractFromHeading(raw, "### 💡 底层代码揭示", /^---\s*\n>\s*\*↓\s*幕间卡|\n> \*↓ 幕间卡/m);
  const interludeMatch = raw.match(/>\s*\*↓\s*幕间卡（给开发）：([\s\S]*?)\*/);
  const interlude = cleanupMarkdown(interludeMatch?.[1] ?? "");
  const beforeReveal = revealRaw.start >= 0 ? raw.slice(0, revealRaw.start) : raw;
  const firstChoices = extractChoiceOptions(beforeReveal, ["A", "B", "C"]);
  const secondChoices = extractChoiceOptions(beforeReveal, ["X", "Y"]);
  const branches: Partial<Record<TheaterChoiceKey, string>> = {};

  for (const key of ["A", "B", "C", "X", "Y"] as TheaterChoiceKey[]) {
    const branch = extractChoiceBranch(beforeReveal, key);
    if (branch) branches[key] = cleanupMarkdown(branch);
  }

  const firstChoiceIndex = firstChoices.length ? indexOfChoiceOption(beforeReveal, firstChoices[0].key) : -1;
  const introSource = firstChoiceIndex >= 0 ? beforeReveal.slice(0, firstChoiceIndex) : beforeReveal;
  const secondChoiceIndex = secondChoices.length ? indexOfChoiceOption(beforeReveal, secondChoices[0].key) : -1;
  const common = secondChoiceIndex >= 0
    ? cleanupMarkdown(beforeReveal.slice(endOfBranch(beforeReveal, "C"), secondChoiceIndex))
    : "";

  return {
    branches,
    common,
    firstChoices,
    fullText,
    interlude,
    intro: cleanupMarkdown(introSource),
    reveal: cleanupMarkdown(revealRaw.content),
    secondChoices,
  };
}

function extractChoiceOptions(source: string, keys: TheaterChoiceKey[]) {
  const options: TheaterChoiceOption[] = [];
  for (const key of keys) {
    const match = source.match(choiceOptionPattern(key));
    if (match) options.push({ key, label: cleanupMarkdown(match[1]) });
  }
  return options;
}

function extractChoiceBranch(source: string, key: TheaterChoiceKey) {
  const startMatch = source.match(choiceBranchPattern(key));
  if (!startMatch || startMatch.index === undefined) return "";
  const start = source.indexOf("\n", startMatch.index) + 1;
  const rest = source.slice(start);
  const next = rest.match(choiceBoundaryPattern());
  return rest.slice(0, next?.index).trim();
}

function endOfBranch(source: string, key: TheaterChoiceKey) {
  const startMatch = source.match(choiceBranchPattern(key));
  if (!startMatch || startMatch.index === undefined) return 0;
  const start = source.indexOf("\n", startMatch.index) + 1;
  const rest = source.slice(start);
  const next = rest.match(choiceBoundaryPattern());
  return start + (next?.index ?? rest.length);
}

function choiceOptionPattern(key: TheaterChoiceKey) {
  return new RegExp(`^[ \\t]*(?:\\*\\*)?${key}[ \\t]*[·:：、][ \\t]*(.+?)(?:\\*\\*)?[ \\t]*$`, "m");
}

function choiceBranchPattern(key: TheaterChoiceKey) {
  return new RegExp(`^[ \\t]*(?:\\*\\*)?选[ \\t]*${key}(?:\\*\\*)?[ \\t]*$`, "m");
}

function choiceBoundaryPattern() {
  return /^([ \t]*(?:\*\*)?选[ \t]*[ABCXY](?:\*\*)?[ \t]*$|[ \t]*(?:\*\*)?[XY][ \t]*[·:：、][ \t]*|### 💡 底层代码揭示|[ \t]*> \*↓ 幕间卡)/m;
}

function indexOfChoiceOption(source: string, key: TheaterChoiceKey) {
  const match = source.match(choiceOptionPattern(key));
  return match?.index ?? -1;
}

function extractFromHeading(source: string, heading: string, endPattern: RegExp) {
  const start = source.indexOf(heading);
  if (start < 0) return { content: "", start: -1 };
  const contentStart = source.indexOf("\n", start) + 1;
  const rest = source.slice(contentStart);
  const endMatch = rest.match(endPattern);
  return {
    content: rest.slice(0, endMatch?.index).trim(),
    start,
  };
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
