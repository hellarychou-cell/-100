import { readFileSync } from "node:fs";
import path from "node:path";
import { isEditorialNoteLine } from "./content-cleaning.ts";

export type MarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "quote"; text: string }
  | { type: "paragraph"; text: string };

export function readRootMarkdown(fileName: string): MarkdownBlock[] {
  const absolutePath = path.join(process.cwd(), fileName);
  const raw = readFileSync(absolutePath, "utf8")
    .replace(/^---[\s\S]*?---\s*/u, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && line !== "---" && !isEditorialNoteLine(line));

  return raw
    .filter((line) => !line.startsWith("related:") && !line.startsWith("tags:"))
    .map((line) => {
      const heading = line.match(/^(#{1,3})\s+(.+)$/u);
      if (heading) {
        return { type: "heading", level: heading[1].length, text: cleanMarkdown(heading[2]) } as MarkdownBlock;
      }
      if (line.startsWith(">")) {
        return { type: "quote", text: cleanMarkdown(line.replace(/^>\s?/u, "")) };
      }
      return { type: "paragraph", text: cleanMarkdown(line) };
    });
}

function cleanMarkdown(text: string) {
  return text
    .replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/gu, (_, first: string, second: string) => second || first)
    .replace(/\*\*([^*]+)\*\*/gu, "$1")
    .replace(/`([^`]+)`/gu, "$1");
}
