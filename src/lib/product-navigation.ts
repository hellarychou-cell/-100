export type TreasureEntry = {
  title: string;
  desc: string;
  href: string;
  meta: string;
};

export const treasureEntries: TreasureEntry[] = [
  {
    title: "成长档案",
    desc: "每日书写、AI 陪你看见和成长画像",
    href: "/growth-archive",
    meta: "书写 + AI 看见",
  },
  {
    title: "知识库",
    desc: "Day 1-100 内容目录",
    href: "/knowledge",
    meta: "四个阶段",
  },
  {
    title: "身体驿站",
    desc: "身体小语的延展阅读，随 Day 自动解锁",
    href: "/body-station",
    meta: "Day 1-7 已上线",
  },
  {
    title: "神秘卡册",
    desc: "工具卡、姐妹卡和最后那张写给自己的卡",
    href: "/collection",
    meta: "工具 + 姐妹",
  },
  {
    title: "测评结果",
    desc: "底层代码诊断报告、雷达图、推荐起点",
    href: "/assessment/result?from=treasure",
    meta: "最近一次测评",
  },
];
