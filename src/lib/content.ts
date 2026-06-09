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
  {
    day: 4,
    title: "同学群里的一张照片",
    subtitle: "嫉妒不是问题，问题是你在用谁的眼光",
    dimension: "自我价值",
    mirror: [
      "你有没有过这样一刻——打开同学群，看到那张照片：某个女同学晒她的生日礼物、孩子、旅行……",
      "你第一秒点了赞，留了一句\"好幸福啊\"。放下手机，5 分钟后你又点开，10 分钟后又点开，直到一整天结束——点开了 47 遍。",
      "你跟自己说\"我就是替她开心\"。但只有你自己知道，你反复看的那一刻，心里那个声音根本不是祝福。",
    ],
    storyPreview: "沈意反复刷着大学室友的朋友圈——她有老公、孩子、马尔代夫旅行。而她只有一个人吃不完的小火锅外卖。她不知道自己为什么停不下来。",
    bodyNote: "今晚做一件小事：站在一面墙前，双手撑住，用力推——推到肩膀紧绷的极限，坚持 10 秒，然后松开。重复 3 次。让那团反复刷朋友圈的能量，有一个出口。",
    aiQuestion: "你最近反复看的一条____（朋友圈/照片/聊天）是什么？你以为自己在看 TA，但我会陪你看见——你真正在反复听的那句话，是谁最早对你说的。",
    quote: "你不是嫉妒朋友，你是在用她的\"赢\"，反复证明你妈妈对你说的\"你不行\"。",
    quoteBy: "成她100 · Day 04",
  },
  {
    day: 5,
    title: "老公那句\"你不要这么累\"",
    subtitle: "你不是贤妻，是 3 代女人在交保护费",
    dimension: "关系边界",
    mirror: [
      "晚上 11 点你还在加班，老公端来一杯水，轻轻说：\"你不要这么累。\"",
      "那一秒你不是感动，你是烦。你心里冒出一句：\"说得轻巧，家里的事我不做谁做？孩子的事我不管谁管？\"",
      "你以为你在维系关系，你其实在用\"我有用\"抵押\"我被爱\"。",
    ],
    storyPreview: "顾棠一个人撑起整个家——早餐、晚餐、洗衣、打扫、公婆生日、老公体检、家里所有琐事。她做家居 IP 月入 5 万，但先生不知道这个家是怎么转的。",
    bodyNote: "今晚做一件小事：站直，双手十指交叉，掌心向上，慢慢翻转向上托举——手臂伸直，仿佛要顶住天，头微微后仰。深呼吸 3 秒，慢慢放下。重复 6 次。",
    aiQuestion: "今天/最近，老公/家人做了一件事，你表面上没事，但你心里很烦——那件事是什么？我会陪你看见，你真正烦的是那件事戳中的，你默默扛了几年的什么。",
    quote: "你不是贤妻，你是用\"我可以全揽\"当成了\"他一定不会走\"的押金。3 代女人交了 100 多年。今天，先收回 1 块。",
    quoteBy: "成她100 · Day 05",
  },
  {
    day: 6,
    title: "周一早上 6 点的闹钟",
    subtitle: "你不是自律，是不敢停",
    dimension: "行动通道",
    mirror: [
      "你有没有想过——每个周一早上 6 点闹钟响，你从床上挣扎起来，那不是因为你勤奋。是因为你怕停下来。",
      "因为只要你停下来，你心里有一个声音会问你一句话：\"你做的这些事，真的是你想做的吗？\"",
      "而你回答不出来。所以你继续忙，忙到根本没时间听见这个问题。忙，是这一代女人最体面的逃跑方式。",
    ],
    storyPreview: "程瑰每天 6 点起床，日程表精确到 30 分钟——晨跑、冥想、修图、客户、健身、复盘。小红书粉丝叫她\"自律女神\"。但她 3 年了没拍过她真正想拍的《她》项目。",
    bodyNote: "今晚做一件小事：11 点之前关手机，关灯，闭眼。右手轻轻拍打左肩（胆经在肩部的循行点）——108 下。换边再拍 108 下。让那个\"决断\"的力，从今晚开始慢慢回来。",
    aiQuestion: "这一周，你做的所有事里，哪一件是你做完后心里有点失落的？把那件事告诉我。我会陪你分析，它是，你真的想做的，还是你怕停下来才做的。",
    quote: "你不是自律，你是用\"忙\"逃避一个问题：\"我做的这些事，真的是我想做的吗？\" 一旦停下来，你怕这个问题真的来。",
    quoteBy: "成她100 · Day 06",
  },
  {
    day: 7,
    title: "那 2 分",
    subtitle: "你不是不够好，是在等永远不会来的\"够了\"",
    dimension: "自我价值",
    mirror: [
      "有些人小时候有一个分数线画在心里。考 98 分回家，妈妈看一眼说：\"那 2 分呢？\"从那以后她就明白了——100 分才是及格线。",
      "20 年过去了，她做到了一切——升职、加薪、独立、自由。但每一次她都觉得，自己还差 2 分。",
      "她不是在追求完美，她是在等一句话：\"你已经做得够好了。\"那句话不会从妈妈嘴里说出来，只能她自己对那个 8 岁的自己说。",
    ],
    storyPreview: "韵秋桌面上有一张老照片——8 岁的她捧着全班第 3 名的试卷，笑得很开心。照片背后是妈妈的字：\"还有 2 个人比你好。继续努力。\"她 33 年了，这张照片一直在桌面上。",
    bodyNote: "今晚做一件小事：闭上眼睛，双手摊开放在太阳轮上（肚脐和胸骨之间），深呼吸。对那个 8 岁的自己说：\"你已经做得够好了，不用再考 100 分。从今天起，我自己来。\"感受手心下方的温度，是不是慢慢热起来？那是太阳轮在被你重新点亮。",
    aiQuestion: "在你身上，那个\"我还差 2 分\"的感觉，最早是什么时候有的？那一刻，谁对你说了什么？我会陪你看见，那句话，现在还在你身上做什么。",
    quote: "你不是不够好，你是在等一个永远不会来的\"够了\"。这句话只能你自己，对那个 8 岁的你，说。",
    quoteBy: "成她100 · Day 07",
  },
];

export const currentUser = {
  name: "林夏",
  phone: "138****6789",
  currentDay: 3,
  completedDays: [1, 2],
  cards: 2,
  aiConversations: 4,
  aiExpiresAt: "2026-07-07",
};

export { mysteryCards } from "./mystery-cards";

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
