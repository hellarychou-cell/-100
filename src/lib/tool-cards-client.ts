// Client-safe version of tool cards (no Node.js fs dependency)

type ToolCard = {
  front: {
    name: string;
    description: string;
    age?: string;
    quote: string;
  };
  back: {
    type: "tool" | "blank" | "gratitude" | "benefit";
    title: string;
    content: string;
    dayNum?: number;
  };
};

// Static tool card content for client-side use
const toolCardSources: ToolCard[] = [
  {
    front: {
      name: "萨提亚冰山模型",
      description: "心理学工具卡",
      age: "工具卡",
      quote: "你看见的是行为，水下藏着感受、观点、期待和渴望。",
    },
    back: {
      type: "tool",
      title: "萨提亚冰山模型",
      content: `萨提亚冰山模型：帮助你看见行为下面的五层结构。

第一层：行为——你看见的，也就是别人能看见的。
第二层：感受——身体对事件的直接反应。
第三层：观点——你对事件的解读，往往是从过去经验里编译出来的结论。
第四层：期待——对自己、对别人、对关系的期待。
第五层：渴望——被爱、被看见、被接纳、被理解。

下次"我不够好"出现时，别急着反驳它，往下问五层：走到渴望那一层，才是真正需要被看见的你。`,
    },
  },
  {
    front: {
      name: "拒绝肌肉训练",
      description: "心理学工具卡",
      age: "工具卡",
      quote: "拒绝不是性格，是肌肉。",
    },
    back: {
      type: "tool",
      title: "拒绝肌肉训练",
      content: `拒绝肌肉训练：帮你把"不"字说出口。

拒绝是一种可以练习的能力。就像健身一样，你需要先锻炼拒绝的"肌肉"。

三步练习：
1. 每天找一件小事，对不重要的人说不。
2. 感受说"不"时身体的反应。
3. 记住：拒绝不等于失去关系。真正的关系，不会因为一次拒绝就断裂。`,
    },
  },
  {
    front: {
      name: "RAS网状激活系统",
      description: "心理学工具卡",
      age: "工具卡",
      quote: "你的大脑只看见你相信的东西。",
    },
    back: {
      type: "tool",
      title: "RAS网状激活系统",
      content: `RAS（网状激活系统）：大脑的注意力过滤器。

你的大脑每天接收大量信息，但只会注意到那些符合你现有信念的内容。

这就是为什么：
- 你注意到那些"不够好"的证据
- 而忽略了那些"已经做到"的证据

练习：每天记录一件你做到的事。不是为了证明自己，而是训练你的RAS开始注意到你的资源。`,
    },
  },
  {
    front: {
      name: "金钱家族脚本重写",
      description: "心理学工具卡",
      age: "工具卡",
      quote: "你和钱的关系，95%是从家里继承的。",
    },
    back: {
      type: "tool",
      title: "金钱家族脚本重写",
      content: `金钱家族脚本：重新定义你和钱的关系。

每个人从小都在家里学到了关于钱的"潜规则"：
- 钱是有限的
- 有钱就要付出代价
- 我不配拥有很多钱
- 赚钱是辛苦的

这些脚本不是你的信念，是家族传承下来的。

练习：写下你小时候听过关于钱的3句话。然后问自己：这是真的吗？这属于谁？`,
    },
  },
  {
    front: {
      name: "收受能力训练",
      description: "心理学工具卡",
      age: "工具卡",
      quote: "这个世界一直在给你，你只是没接住。",
    },
    back: {
      type: "tool",
      title: "收受能力训练",
      content: `收受能力训练：学会接受别人的好意。

很多人不习惯被照顾。当别人对你好时，你会：
- 感到不自在
- 想要立刻回报
- 怀疑别人的动机

练习：今天接受一件小事。不要立刻回报，只是说"谢谢"。感受身体的变化。`,
    },
  },
  {
    front: {
      name: "财富容器扩容",
      description: "心理学工具卡",
      age: "工具卡",
      quote: "赚到和留得下，是两件完全不同的事。",
    },
    back: {
      type: "tool",
      title: "财富容器扩容",
      content: `财富容器扩容：扩大你容纳财富的空间。

有些人赚钱很多，但留不住。这是因为他们的"财富容器"大小没有改变。

扩容练习：
1. 写下你值得拥有更多钱的3个理由。
2. 观察每次收到钱时的身体感受。
3. 如果感到紧缩，温柔地对身体说："我允许自己拥有更多。"`,
    },
  },
];

export function getToolCards(): ToolCard[] {
  return toolCardSources;
}