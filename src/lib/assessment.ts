export type DimensionId =
  | "self-worth"
  | "boundaries"
  | "decision"
  | "emotion"
  | "action"
  | "wealth";

export type AssessmentQuestion = {
  id: string;
  text: string;
};

export type AssessmentDimension = {
  id: DimensionId;
  innerMonologue: string;
  motherTheme: string;
  name: string;
  subtitle: string;
  questions: AssessmentQuestion[];
};

export type AssessmentAnswers = Record<string, number>;

export type DimensionScore = {
  raw: number;
  index: number;
};

export type AssessmentResult = {
  rawTotal: number;
  totalScore100: number;
  dimensionScores: Record<DimensionId, DimensionScore>;
  primaryMode: string;
  recommendedDay: number;
};

export const PUBLISHED_DAY_LIMIT = 7;

export const ASSESSMENT_DIMENSIONS: AssessmentDimension[] = [
  {
    id: "self-worth",
    innerMonologue: "我是不是不够好？",
    motherTheme: "我配不配",
    name: "自我价值与配得感",
    subtitle: "你是否能稳定地认可自己，接住成功、爱、钱、赞美和更好的生活。",
    questions: [
      { id: "q1", text: "当别人真心夸我、认可我、给我机会时，我心里常常会先怀疑：“我真的配吗？”" },
      { id: "q2", text: "即使做出了成绩，我也很难真正为自己高兴，反而会马上盯着没做好的地方。" },
      { id: "q3", text: "我常常觉得自己的成功只是运气好、有人帮、时机对，而不是我本来就有能力。" },
      { id: "q4", text: "收入、粉丝数、客户反馈或作品数据一波动，我对自己的评价也会跟着大幅波动。" },
      { id: "q5", text: "我很难无条件地休息或享受，总觉得自己必须先完成很多事，才有资格放松。" },
      { id: "q6", text: "当我过得比父母、伴侣、朋友或身边人更好时，我内心会有隐隐的不安或愧疚。" },
      { id: "q7", text: "我会压住自己的野心和欲望，觉得“女人太想赢、太想要、太有钱”好像不太安全。" },
    ],
  },
  {
    id: "boundaries",
    innerMonologue: "我能不能让别人失望？",
    motherTheme: "我敢不敢拒绝",
    name: "关系边界与自我主权",
    subtitle: "你在家庭、亲密关系、朋友、客户和合作里，是否能守住自己的位置。",
    questions: [
      { id: "q8", text: "当别人提出要求时，即使我不愿意，也很难第一时间拒绝。" },
      { id: "q9", text: "我经常帮别人处理问题，事后才发现自己其实已经越界、透支或很不舒服。" },
      { id: "q10", text: "我容易把别人的情绪当成自己的责任，对方不高兴时，我会急着修复关系。" },
      { id: "q11", text: "看到别人痛苦、混乱或过得不好时，我会忍不住想拯救对方，哪怕牺牲自己。" },
      { id: "q12", text: "在亲密关系里，我容易用过度付出、忍耐或懂事来换取安全感。" },
      { id: "q13", text: "面对熟人、朋友或老客户，我会不好意思谈钱、收费、提条件或维护利益。" },
      { id: "q14", text: "我很怕被说自私、冷漠、不孝顺、不体贴，所以常常压下真实需求。" },
    ],
  },
  {
    id: "decision",
    innerMonologue: "我可不可以按自己的感受活？",
    motherTheme: "我有没有主权",
    name: "决策自主与内在权威",
    subtitle: "你是否容易被社会规训、外在权威、家族信念、传统观念和别人的标准覆盖自己的判断。",
    questions: [
      { id: "q15", text: "做重要决定前，我常常要问很多人，别人不认可我就很难继续。" },
      { id: "q16", text: "我经常把父母、老师、伴侣、专家或行业前辈的话，当成比自己感受更重要的标准。" },
      { id: "q17", text: "即使我内心很想走一条路，只要它不符合“稳定、体面、正常”，我就会开始怀疑自己。" },
      { id: "q18", text: "我很怕自己的选择让家人失望，或者被身边人评价“你怎么变成这样了”。" },
      { id: "q19", text: "我常常分不清：这是我真正想要的，还是我被教导应该想要的。" },
      { id: "q20", text: "当一个选择需要付出代价、承担冲突或损失关系时，我就容易退回原来的生活。" },
      { id: "q21", text: "我习惯先问“别人都是怎么做的”，很少真正问“如果由我设计，我想怎么做”。" },
    ],
  },
  {
    id: "emotion",
    innerMonologue: "别人一句话，会不会定义我？",
    motherTheme: "我能不能稳住自己",
    name: "情绪自主与内在稳定",
    subtitle: "你面对否定、忽视、冲突、嫉妒、羞耻、焦虑和亲密关系触发时，是否能稳住自己。",
    questions: [
      { id: "q22", text: "被否定、批评或质疑时，我很容易感觉不是事情被评价，而是我整个人被否定。" },
      { id: "q23", text: "当亲近的人没有及时回复、回应或安抚我时，我容易焦虑、脑补，甚至怀疑关系变了。" },
      { id: "q24", text: "当我暴露真实需求、谈钱、犯错或表现得“不够好”时，会有强烈的羞耻感。" },
      { id: "q25", text: "我其实很生气，但常常不敢直接表达，最后变成冷处理、阴阳怪气或突然爆发。" },
      { id: "q26", text: "看到同龄人、同行或朋友过得更好、更快、更有钱时，我内心会被刺痛，甚至开始否定自己。" },
      { id: "q27", text: "我经常在脑子里复盘一句话、一个表情、一个场景，越想越消耗。" },
      { id: "q28", text: "压力一来，我的身体会先紧绷、心慌、胃堵、胸闷或睡不好，比头脑更早进入防御状态。" },
    ],
  },
  {
    id: "action",
    innerMonologue: "我敢不敢开始？",
    motherTheme: "我能不能行动",
    name: "行动通道与创造力",
    subtitle: "你能不能把想法落地，能不能承受不完美、失败、曝光、试错和成长的代价。",
    questions: [
      { id: "q29", text: "我有很多想法、计划和灵感，但真正开始做的比例很低。" },
      { id: "q30", text: "我总觉得还要再准备、再学习、再想清楚一点，才可以开始。" },
      { id: "q31", text: "我害怕失败、被笑话、被否定，所以常常宁愿不做，也不想做错。" },
      { id: "q32", text: "我害怕被看见，作品、观点、产品一旦要公开，就会想躲起来或反复修改。" },
      { id: "q33", text: "我容易在一个方向遇到卡点后，就怀疑是不是方向错了，想重新开始。" },
      { id: "q34", text: "我明明知道该做什么，但会用刷手机、忙杂事、整理资料、想方案来拖延真正行动。" },
      { id: "q35", text: "当目标越来越清晰、机会越来越近时，我反而会紧张，甚至下意识把事情搞复杂。" },
    ],
  },
  {
    id: "wealth",
    innerMonologue: "我能不能安全地拥有更多？",
    motherTheme: "我敢不敢丰盛",
    name: "财富容器与生活丰盛感",
    subtitle: "你和金钱、享受、资源、机会、生活品质之间的关系是否顺畅。",
    questions: [
      { id: "q36", text: "我对“有钱”“赚大钱”“收很多钱”这件事有隐隐的不安、羞耻或道德压力。" },
      { id: "q37", text: "我容易相信“赚钱必须很辛苦”，对轻松、顺利、愉悦得到的钱不太放心。" },
      { id: "q38", text: "当收入变好、机会变多、生活变顺时，我会担心“好日子不会太久”。" },
      { id: "q39", text: "我有时会觉得，如果我拥有更多，别人就会嫉妒我、远离我，或向我索取。" },
      { id: "q40", text: "我会觉得世界上的资源是有限的，自己拿多了、赚多了，好像就会亏欠别人。" },
      { id: "q41", text: "别人给我礼物、帮助、照顾或特殊机会时，我会不自在，想赶紧还回去或证明自己值得。" },
      { id: "q42", text: "我不太敢真正满足自己的欲望，买好东西、享受生活、接受照顾时会有负罪感。" },
    ],
  },
];

export function calculateAssessmentResult(answers: AssessmentAnswers): AssessmentResult {
  const questionIds = ASSESSMENT_DIMENSIONS.flatMap((dimension) =>
    dimension.questions.map((question) => question.id),
  );
  if (questionIds.some((id) => answers[id] === undefined)) {
    throw new Error("Assessment requires 42 answers.");
  }

  const dimensionScores = {} as Record<DimensionId, DimensionScore>;
  let rawTotal = 0;

  for (const dimension of ASSESSMENT_DIMENSIONS) {
    const raw = dimension.questions.reduce((sum, question) => {
      const value = answers[question.id];
      if (!Number.isInteger(value) || value < 1 || value > 5) {
        throw new Error(`Answer ${question.id} must be between 1 and 5.`);
      }
      return sum + value;
    }, 0);
    rawTotal += raw;
    dimensionScores[dimension.id] = {
      raw,
      index: Math.round(((raw - 7) / 28) * 100),
    };
  }

  const totalScore100 = Math.round((((rawTotal - 42) / 168) * 100) * 10) / 10;

  return {
    rawTotal,
    totalScore100,
    dimensionScores,
    primaryMode: inferPrimaryMode(dimensionScores),
    recommendedDay: inferRecommendedDay(totalScore100),
  };
}

function inferPrimaryMode(scores: Record<DimensionId, DimensionScore>): string {
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b.raw - a.raw);
  const topIds = sorted.slice(0, 2).map(([id]) => id);

  if (topIds.includes("boundaries") && topIds.includes("emotion")) return "讨好型";
  if (topIds.includes("self-worth") && topIds.includes("action")) return "证明型";
  if (topIds.includes("decision") && topIds.includes("boundaries")) return "失权型";
  if (topIds.includes("emotion") && topIds.includes("self-worth")) return "高敏内耗型";
  if (topIds.includes("action") && topIds.includes("decision")) return "冻结拖延型";
  if (topIds.includes("wealth") && topIds.includes("self-worth")) return "财富收缩型";
  return "混合型";
}

function inferRecommendedDay(totalScore100: number): number {
  // 推荐起点是产品节奏，不受当前已上线内容数量限制。
  // 内耗越重越需要从前面开始；内耗较轻也保留在 Day 20 以内，避免用户误以为前面的内容不重要。
  if (totalScore100 <= 20) return 20;
  if (totalScore100 <= 40) return 14;
  if (totalScore100 <= 60) return 7;
  return 1;
}
