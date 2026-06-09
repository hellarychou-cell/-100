import { readRootMarkdown } from "./markdown";

type ToolCardSource = {
  file: string;
  name: string;
  quote: string;
};

const toolCardSources: ToolCardSource[] = [
  {
    file: "心理学工具箱/1-自我价值与配得感/1.1-萨提亚冰山模型.md",
    name: "萨提亚冰山模型",
    quote: "你看见的是行为，水下藏着感受、观点、期待和渴望。",
  },
  {
    file: "心理学工具箱/2-关系边界与自我主权/2.2-拒绝肌肉训练.md",
    name: "拒绝肌肉训练",
    quote: "拒绝不是性格，是肌肉。",
  },
  {
    file: "心理学工具箱/6-财富容器与丰盛感/6.1-RAS 网状激活系统.md",
    name: "RAS 网状激活系统",
    quote: "你的大脑只看见你相信的东西。",
  },
  {
    file: "心理学工具箱/6-财富容器与丰盛感/6.2-金钱家族脚本重写.md",
    name: "金钱家族脚本重写",
    quote: "你和钱的关系，95% 是从家里继承的。",
  },
  {
    file: "心理学工具箱/6-财富容器与丰盛感/6.3-收受能力训练.md",
    name: "收受能力训练",
    quote: "这个世界一直在给你，你只是没接住。",
  },
  {
    file: "心理学工具箱/6-财富容器与丰盛感/6.4-财富容器扩容.md",
    name: "财富容器扩容",
    quote: "赚到和留得下，是两件完全不同的事。",
  },
];

export function getToolCards() {
  return toolCardSources.map((source) => {
    const blocks = readRootMarkdown(source.file);
    const heading = blocks.find((block) => block.type === "heading" && block.level === 1);
    const content = blocks
      .filter((block) => block.type !== "heading" || block.level > 1)
      .map((block) => block.text)
      .join("\n\n");

    return {
      front: {
        name: source.name,
        description: "心理学工具卡",
        age: "工具卡",
        quote: source.quote,
      },
      back: {
        type: "tool" as const,
        title: heading?.text.replace(/^[\d.]+\s*·\s*/u, "") ?? source.name,
        content,
      },
    };
  });
}
