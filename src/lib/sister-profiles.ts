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
    triggerKeywords: ["还行", "都行", "随便", "无所谓", "我想要"],
    gift: "🌸 感恩卡：谢谢你愿意让“你”第一个进门。",
    dailyVoice: `我和谁都不争，\n和谁争我都不屑。\n──\n一辈子安静，\n但骨头最硬。`,
  },
  {
    name: "上野千鹤子",
    symbol: "✊",
    triggerKeywords: ["拒绝", "不会说不", "答应", "为难"],
    gift: "🎴 工具卡：2.1 课题分离",
    dailyVoice: `女性主义不是变得像男人那样强势，\n是允许弱者以弱者的样子被尊重。\n──\n她生不生气，是她的课题。\n我说不说，是我的课题。`,
  },
  {
    name: "苏敏",
    symbol: "🚗",
    triggerKeywords: ["妈妈", "母亲", "电话", "原生家庭", "婆婆"],
    gift: "🎁 福利卡：你今天的觉察值得被深聊。",
    dailyVoice: `半辈子，\n我都为家人活。\n剩下的，\n我想试试为我自己。\n──\n开着一辆白色 POLO，\n独自上路。`,
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
  {
    name: "李红",
    symbol: "🚗",
    triggerKeywords: ["妈妈", "母亲", "电话", "不接", "原生家庭"],
    gift: "⚪️ 空白卡：今天的工具，是允许自己不接那个电话。",
    dailyVoice: `我不是不爱我妈。\n我只是终于愿意——\n先爱我自己。\n──\n今天没有工具。\n今天的工具，\n是允许自己不接那个电话。`,
  },
  {
    name: "贾玲",
    symbol: "🌶️",
    triggerKeywords: ["比较", "攻击自己", "减肥", "应该", "不够好"],
    gift: "🎴 工具卡：1.4 自我同情三步",
    dailyVoice: `我减掉的，\n不是肉。\n是 40 年来\n“我应该”活成的样子。\n──\n你不是要变好，\n你是要先停止替别人攻击自己。`,
  },
  {
    name: "林青霞",
    symbol: "🍃",
    triggerKeywords: ["今天想做什么", "别人喜欢", "写作", "女明星", "自己"],
    gift: "🌸 感恩卡：谢谢你愿意问自己一句。",
    dailyVoice: `我用前半生，\n当了别人喜欢的女明星。\n用后半生，\n做我自己。\n──\n今天，谢谢你愿意\n问自己一句：\n你今天想做什么？`,
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

export function createSisterTriggerReply({
  sisterName,
  userName = "你",
  userTexts,
}: {
  sisterName: string;
  userName?: string;
  userTexts: string[];
}) {
  const recentText = userTexts
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(-3)
    .join(" ");
  const seenState = inferSeenState(recentText);
  const gentleAction = inferGentleAction(recentText);

  return [
    `如果今天是${sisterName}在这里，她可能会轻轻对${userName || "你"}说：`,
    `“我先看见你刚才那一下${seenState}，那不是小题大做。”`,
    `“不用马上变得很会表达，先${gentleAction}。”`,
  ].join("\n");
}

function normalizeName(value: string) {
  return value.replace(/\s+/g, "").replace("弗吉尼亚·", "").replace("桑塔格", "苏珊·桑塔格");
}

function inferSeenState(text: string) {
  if (/累|疲惫|撑不住|没力气|耗/.test(text)) return "很累却还想撑住";
  if (/妈妈|母亲|电话|家里|父母/.test(text)) return "被家里的声音牵住";
  if (/怕|担心|不敢|害怕/.test(text)) return "想说又怕伤到别人";
  if (/拒绝|不|边界|答应/.test(text)) return "在边界前停了一秒";
  if (/委屈|难过|生气|愤怒/.test(text)) return "委屈终于冒出来";
  if (/都行|随便|还行|无所谓/.test(text)) return "把自己先放到后面";
  return "想被好好听见";
}

function inferGentleAction(text: string) {
  if (/妈妈|母亲|电话|家里|父母/.test(text)) return "把电话那头的声音放远一点，先听听自己";
  if (/拒绝|不|边界|答应/.test(text)) return "把那句没说出口的话放在手心里";
  if (/累|疲惫|撑不住|没力气|耗/.test(text)) return "允许身体先歇一口气";
  if (/委屈|难过|生气|愤怒/.test(text)) return "承认那一点委屈是真的";
  return "把这句话留在自己这边";
}
