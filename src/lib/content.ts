import { ASSESSMENT_DIMENSIONS, calculateAssessmentResult } from "./assessment";

export const heroImage =
  "https://images.stockcake.com/public/3/f/1/3f1780be-5b12-4937-a500-5ecdc4bc7693_large/sunlit-terracotta-arches-stockcake.jpg";

export const phases = [
  { id: 1, name: "觉醒期", range: "Day 1-25", description: "看见旧程序。每天一面镜子，帮你看见那些一直在替你做决定的旧声音。", progress: 12 },
  { id: 2, name: "理解期", range: "Day 26-50", description: "追溯来源。从原生家庭、童年编程、家族脚本里找到旧程序的根源。", progress: 0 },
  { id: 3, name: "重建期", range: "Day 51-80", description: "练习新反应。每天一个小练习，让身体重新体验「我可以不一样」。", progress: 0 },
  { id: 4, name: "创造期", range: "Day 81-100", description: "整合与绽放。把新的反应模式带进事业、关系和日常生活。", progress: 0 },
];

export const dayContents = [
  {
    day: 1,
    title: "那句“还行吧”",
    subtitle: "第一次听见自己",
    dimension: "自我价值",
    mirror: [
      "有些声音，你已经不记得是谁第一个说的了。",
      "但它一直在替你做决定。",
      "100 天，我们做一件事：把“我”这个字慢慢还给你自己。",
    ],
    storyPreview: "林夏被朋友问起最近怎么样，她第一反应还是说：还行吧。",
    bodyNote: "今晚只做一件小事：让那些没说出口的话，有一个出口。",
    aiQuestion: "今天/最近，有人问你“你怎么样”时，你回答了什么？真正想说的是什么？",
    quote: "把“我”这个字，慢慢从那些声音里还给你自己。",
    quoteBy: "成她100 · Day 01",
  },
  {
    day: 2,
    title: "你先别急着变好",
    subtitle: "不再用力修正自己",
    dimension: "自我价值",
    mirror: ["有时候，你不是不够好。", "你只是太习惯把自己放在待修理的位置。"],
    storyPreview: "她打开备忘录，写下三件要改掉的缺点，却没有写下自己已经做到的事。",
    bodyNote: "把手放在腹部，慢慢呼气三次。先不用改变。",
    aiQuestion: "最近你最想改掉自己的哪一点？如果它不是缺点，它可能在保护什么？",
    quote: "你可以先不变好，只是先回来。",
    quoteBy: "成她100 · Day 02",
  },
  {
    day: 3,
    title: "你不是不会拒绝",
    subtitle: "看见答应之前的紧张",
    dimension: "关系边界",
    mirror: [
      "你不是不会拒绝。",
      "你只是太早学会了：如果别人不高兴，你就要立刻做点什么。",
      "今天先不用改变任何关系。只需要看见，那一秒紧张从哪里来。",
    ],
    storyPreview:
      "林夏收到一条消息，对方问她能不能“顺手帮个忙”。她明明已经很累，却还是回了一个“可以”。",
    bodyNote:
      "今晚只做一个动作：把手放在胸口，慢慢呼气三次。不是为了立刻勇敢，而是先让身体知道：你可以不用马上答应。",
    aiQuestion: "最近一次你想拒绝、但还是答应了的事情是什么？那一秒，你最怕发生什么？",
    quote: "你不是不会拒绝，你只是太早学会了紧张。",
    quoteBy: "成她100 · Day 03",
  },
  { day: 4, title: "那个总想解释的你", subtitle: "把解释放慢一点", dimension: "情绪稳定" },
  { day: 5, title: "你不是太敏感", subtitle: "敏感也可以是线索", dimension: "情绪稳定" },
  { day: 6, title: "把身体还给自己", subtitle: "身体先知道答案", dimension: "行动通道" },
  { day: 7, title: "这一周，你听见了什么", subtitle: "第一次回看", dimension: "自我价值" },
];

export const currentUser = {
  name: "林夏",
  phone: "138****6789",
  currentDay: 3,
  completedDays: 2,
  cards: 2,
  aiConversations: 4,
  aiExpiresAt: "2026-07-07",
};

export const mockAnswers = Object.fromEntries(
  Array.from({ length: 42 }, (_, index) => [`q${index + 1}`, 3]),
);
mockAnswers.q8 = 5;
mockAnswers.q9 = 5;
mockAnswers.q10 = 5;
mockAnswers.q11 = 4;
mockAnswers.q22 = 4;
mockAnswers.q23 = 5;

export const reportResult = calculateAssessmentResult(mockAnswers);

export const dimensionRows = ASSESSMENT_DIMENSIONS.map((dimension) => ({
  id: dimension.id,
  name: dimension.name,
  score: reportResult.dimensionScores[dimension.id].raw,
  index: reportResult.dimensionScores[dimension.id].index,
  text: `${dimension.name}显示了你旧程序里最常被触发的位置。这里会接入正式测评报告文案。`,
}));

export const cardAlbum = [
  { day: 1, person: "杨绛", quote: "我和谁都不争，和谁争我都不屑。", collected: true },
  { day: 2, person: "林徽因", quote: "真正的平静，不是避开车马喧嚣。", collected: true },
  { day: 3, person: "待抽", quote: "今天来抽一张卡吧。", collected: false },
];

export const adminUsers = [
  { name: "林夏", phone: "138****6789", day: "Day 03", assessment: "已完成", expires: "2026-07-07" },
  { name: "苏苏", phone: "136****2201", day: "未开始", assessment: "未测评", expires: "未开通" },
  { name: "阿宁", phone: "139****8821", day: "Day 08", assessment: "已完成", expires: "2026-06-12" },
  { name: "予安", phone: "137****9012", day: "Day 01", assessment: "已完成", expires: "2026-07-01" },
  { name: "小禾", phone: "135****7788", day: "Day 15", assessment: "已完成", expires: "暂停中" },
];
