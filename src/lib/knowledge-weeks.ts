export type KnowledgeWeek = {
  endDay: number;
  id: number;
  milestone?: string;
  phase: "觉醒期" | "理解期" | "重建期" | "创造期" | "毕业";
  startDay: number;
  title: string;
};

export const knowledgeWeeks: KnowledgeWeek[] = [
  { id: 1, startDay: 1, endDay: 7, phase: "觉醒期", title: "第一次听见自己", milestone: "第一次听见自己" },
  { id: 2, startDay: 8, endDay: 14, phase: "觉醒期", title: "我的性格不是我", milestone: "看见，是觉醒的第一步" },
  { id: 3, startDay: 15, endDay: 21, phase: "觉醒期", title: "在生活里抓现行", milestone: "觉醒练习周回顾" },
  { id: 4, startDay: 22, endDay: 25, phase: "觉醒期", title: "钱的功课", milestone: "Day 25 第一次大测评" },
  { id: 5, startDay: 26, endDay: 32, phase: "理解期", title: "我有权不孝顺" },
  { id: 6, startDay: 33, endDay: 39, phase: "理解期", title: "母亲、外婆、我" },
  { id: 7, startDay: 40, endDay: 46, phase: "理解期", title: "我和她的边界" },
  { id: 8, startDay: 47, endDay: 50, phase: "理解期", title: "关系里的旧程序", milestone: "Day 50 第二次大测评" },
  { id: 9, startDay: 51, endDay: 57, phase: "重建期", title: "工作、野心、女人" },
  { id: 10, startDay: 58, endDay: 64, phase: "重建期", title: "单身、已婚、育儿都可以" },
  { id: 11, startDay: 65, endDay: 71, phase: "重建期", title: "闺蜜、姐妹、不雌竞" },
  { id: 12, startDay: 72, endDay: 75, phase: "重建期", title: "把新的反应留下来", milestone: "Day 75 第三次大测评" },
  { id: 13, startDay: 76, endDay: 82, phase: "创造期", title: "蓝海赛道，没有竞争者" },
  { id: 14, startDay: 83, endDay: 89, phase: "创造期", title: "我的方式撑起一角" },
  { id: 15, startDay: 90, endDay: 96, phase: "创造期", title: "温柔藏风骨" },
  { id: 16, startDay: 97, endDay: 100, phase: "毕业", title: "成她", milestone: "Day 100 毕业典礼" },
];

export function getKnowledgeWeek(day: number) {
  return knowledgeWeeks.find((week) => day >= week.startDay && day <= week.endDay) ?? knowledgeWeeks[0];
}
