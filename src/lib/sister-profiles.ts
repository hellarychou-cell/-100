export const LOCAL_SISTER_TRIGGER_LOG_KEY = "chengta.sisterTriggerLog";

export type SisterProfile = {
  dailyVoice: string;
  gift: string;
  name: string;
  symbol: string;
  triggerKeywords: string[];
};

export type SisterTriggerLog = Record<string, string[]>;

export const sisterProfiles: SisterProfile[] = [
  {
    name: "杨绛",
    symbol: "🌸",
    triggerKeywords: ["还行", "都行", "随便", "无所谓"],
    gift: "📖 《我们仨》第 173 页",
    dailyVoice: `"还行"是一句很安全的话。\n我没用过。\n──\n昨夜西风凋碧树，\n我读到这一句的时候，\n正在烧水。`,
  },
  {
    name: "上野千鹤子",
    symbol: "✊",
    triggerKeywords: ["拒绝", "不会说不", "答应", "为难"],
    gift: "💬 70 岁那年说：\"女人的解放不是和男人一样\"",
    dailyVoice: `七十五岁，\n我每年还在写不能去的信。\n──\n开头都是同一句：\n"对不起，我不能。"`,
  },
  {
    name: "苏敏",
    symbol: "🚗",
    triggerKeywords: ["妈妈", "母亲", "电话", "原生家庭", "婆婆"],
    gift: "🚗 从郑州出发的 G4 京港澳高速",
    dailyVoice: `我妈也打电话。\n我每次都接。\n只是后来——\n我开车的时候不接了。\n方向盘比电话沉。`,
  },
  {
    name: "张爱玲",
    symbol: "🍷",
    triggerKeywords: ["同学", "对比", "朋友圈", "羡慕", "晒"],
    gift: "💬 23 岁说“出名要趁早”，75 岁说“其实趁迟也行”",
    dailyVoice: `我不看同学的近照。\n我只看天。\n香港的天和上海的天，\n其实是一种灰。`,
  },
  {
    name: "杨本芬",
    symbol: "✒️",
    triggerKeywords: ["累", "丈夫", "老公", "你别", "歇歇"],
    gift: "📖 《秋园》第一段",
    dailyVoice: `他说"你别这么累"。\n我那年六十岁。\n我说好。\n──\n然后转身去厨房。\n锅里炖着我的第一本书。`,
  },
  {
    name: "李娟",
    symbol: "🐑",
    triggerKeywords: ["早起", "闹钟", "起床", "不想起", "周一"],
    gift: "🏔 阿勒泰的春牧场",
    dailyVoice: `牧场没有闹钟。\n天一亮，\n羊先开始走。\n──\n我现在的闹钟设在六点，\n和那时候的羊\n差不多。`,
  },
  {
    name: "李清照",
    symbol: "🌸",
    triggerKeywords: ["分数", "成绩", "考试", "评分", "打分"],
    gift: "🌸 《如梦令·昨夜雨疏风骤》",
    dailyVoice: `我没考过试。\n"生当作人杰"\n七个字而已。\n──\n没有人给它打分。`,
  },
];

export function getSisterProfile(name: string) {
  return sisterProfiles.find((profile) => normalizeName(profile.name) === normalizeName(name)) ?? null;
}

export function shouldTriggerSister({
  day,
  sisterName,
  triggerLog,
}: {
  day: number;
  sisterName: string;
  triggerLog: SisterTriggerLog;
}) {
  return !(triggerLog[String(day)] ?? []).includes(sisterName);
}

export function findTriggeredSister({
  day,
  message,
  triggerLog,
  unlockedSisters,
}: {
  day: number;
  message: string;
  triggerLog: SisterTriggerLog;
  unlockedSisters: string[];
}) {
  const normalizedUnlocked = unlockedSisters.map(normalizeName);
  return (
    sisterProfiles.find((profile) => {
      if (!normalizedUnlocked.includes(normalizeName(profile.name))) return false;
      if (!shouldTriggerSister({ day, sisterName: profile.name, triggerLog })) return false;
      return profile.triggerKeywords.some((keyword) => message.includes(keyword));
    }) ?? null
  );
}

export function buildSisterTriggerText(profile: SisterProfile, userName = "你") {
  return [`───`, `你今天的话，让我想到了——`, profile.dailyVoice, `礼物：${profile.gift}`, `── 致 ${userName}`].join("\n");
}

function normalizeName(value: string) {
  return value.replace(/\s+/g, "").replace("弗吉尼亚·", "").replace("桑塔格", "苏珊·桑塔格");
}
