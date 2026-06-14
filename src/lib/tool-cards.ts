import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { readRootMarkdown } from "./markdown.ts";

export type ToolCard = {
  category: string;
  file: string;
  front: {
    age?: string;
    description: string;
    name: string;
    quote: string;
  };
  back: {
    content: string;
    title: string;
    type: "tool";
  };
};

const toolboxRoot = "心理学工具箱";

export function getToolCards(): ToolCard[] {
  return listToolCardFiles()
    .map((file) => {
      const blocks = readRootMarkdown(file);
      const heading = blocks.find((block) => block.type === "heading" && block.level === 1);
      const quote = blocks.find((block) => block.type === "quote")?.text ?? "这是一张可以反复使用的工具卡。";
      const content = blocks
        .filter((block) => !(block.type === "heading" && block.level === 1))
        .map((block) => block.text)
        .join("\n\n");
      const title = normalizeToolName(heading?.text ?? path.basename(file, ".md"));

      return {
        category: file.split(path.sep)[1] ?? "工具卡",
        file,
        front: {
          age: title.match(/^\d/) ? title.split(" · ")[0] : "工具卡",
          description: "心理学工具卡",
          name: title,
          quote,
        },
        back: {
          type: "tool" as const,
          title,
          content,
        },
      };
    })
    .sort((a, b) => a.file.localeCompare(b.file, "zh-CN"));
}

function listToolCardFiles() {
  const absoluteRoot = path.join(process.cwd(), toolboxRoot);
  const files: string[] = [];

  for (const group of readdirSync(absoluteRoot)) {
    if (group.startsWith(".") || group.startsWith("._")) continue;
    const groupPath = path.join(absoluteRoot, group);
    if (!statSync(groupPath).isDirectory()) continue;

    for (const file of readdirSync(groupPath)) {
      if (!file.endsWith(".md") || file === "index.md" || file.startsWith("._")) continue;
      files.push(path.join(toolboxRoot, group, file));
    }
  }

  return files;
}

function normalizeToolName(value: string) {
  return value.replace(/^#*\s*/g, "").replace(/^[\d.]+\s*·\s*/u, "").trim();
}
