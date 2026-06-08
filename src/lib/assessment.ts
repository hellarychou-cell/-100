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
    name: "自我价值",
    subtitle: "你觉得自己值不值得",
    questions: [
      { id: "q1", text: "当别人夸我的时候，我心里的第一反应是“我没那么好”。" },
      { id: "q2", text: "我给产品/服务定价时，总觉得不好意思定太高。" },
      { id: "q3", text: "即使做出了成绩，我仍然觉得“我只是运气好”。" },
      { id: "q4", text: "我经常觉得自己需要再努力一点，才有资格享受当下的一切。" },
      { id: "q5", text: "当客户说“太贵了”，我第一反应是想降价而不是解释价值。" },
      { id: "q6", text: "在一群优秀的人中间，我会不自觉地觉得自己不属于这里。" },
      { id: "q7", text: "当我休息的时候，心里会冒出“我是不是太懒了”的声音。" },
    ],
  },
  {
    id: "boundaries",
    name: "关系边界",
    subtitle: "你在关系里是不是自己",
    questions: [
      { id: "q8", text: "当别人提出不合理的要求时，我很难直接说“不”。" },
      { id: "q9", text: "我经常在帮了别人之后才意识到，其实我不想帮。" },
      { id: "q10", text: "在关系中，我总是主动让步的那一个。" },
      { id: "q11", text: "别人的一点不高兴，就会让我开始反思是不是我做错了什么。" },
      { id: "q12", text: "我会因为怕影响关系而不敢表达自己的真实想法。" },
      { id: "q13", text: "我总觉得如果我不够好或不够有用，别人就会离开我。" },
      { id: "q14", text: "我常常先答应，再回头消化自己的委屈。" },
    ],
  },
  {
    id: "decision",
    name: "决策自主",
    subtitle: "你能不能替自己做决定",
    questions: [
      { id: "q15", text: "做决定前，我会先想别人会不会失望。" },
      { id: "q16", text: "我经常需要别人确认，才敢相信自己的判断。" },
      { id: "q17", text: "如果我的选择和别人期待不同，我会感到明显不安。" },
      { id: "q18", text: "我很难分清这是我想要的，还是别人希望我想要的。" },
      { id: "q19", text: "我会为了显得懂事而放弃自己的优先级。" },
      { id: "q20", text: "遇到重要选择时，我常常拖到不得不选。" },
      { id: "q21", text: "我害怕自己的选择带来冲突或评价。" },
    ],
  },
  {
    id: "emotion",
    name: "情绪稳定",
    subtitle: "你会不会被外界反应带走",
    questions: [
      { id: "q22", text: "别人的语气变化会让我反复琢磨很久。" },
      { id: "q23", text: "我很容易因为一点反馈怀疑自己。" },
      { id: "q24", text: "我常常需要立刻解释，才能让自己安心。" },
      { id: "q25", text: "关系里有一点冷场，我就会想办法补救。" },
      { id: "q26", text: "我很难允许别人暂时不高兴。" },
      { id: "q27", text: "我经常在情绪里消耗大量精力。" },
      { id: "q28", text: "我会把别人的反应当成对自己的评价。" },
    ],
  },
  {
    id: "action",
    name: "行动通道",
    subtitle: "你能不能自然行动",
    questions: [
      { id: "q29", text: "我常常想很多，但真正开始很难。" },
      { id: "q30", text: "我害怕做得不够好，所以干脆晚一点再做。" },
      { id: "q31", text: "我会因为担心评价而推迟发布或表达。" },
      { id: "q32", text: "事情越重要，我越容易卡住。" },
      { id: "q33", text: "我常常等状态足够好才允许自己开始。" },
      { id: "q34", text: "我对失败的想象会消耗很多行动力。" },
      { id: "q35", text: "我会用准备更多来替代真正行动。" },
    ],
  },
  {
    id: "wealth",
    name: "财富容器",
    subtitle: "你能不能接住拥有",
    questions: [
      { id: "q36", text: "谈到收钱或涨价，我会明显紧张。" },
      { id: "q37", text: "赚到钱后，我很难安心留住它。" },
      { id: "q38", text: "我会担心拥有更多之后关系变复杂。" },
      { id: "q39", text: "我常常觉得自己还没有资格收更多。" },
      { id: "q40", text: "当别人为我付费时，我会想额外补偿很多。" },
      { id: "q41", text: "我对丰盛既向往又有点害怕。" },
      { id: "q42", text: "我会把稳定拥有和不安全感联系在一起。" },
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
  let recommendedDay = 1;
  if (totalScore100 < 20) recommendedDay = 51;
  else if (totalScore100 < 40) recommendedDay = 26;
  else if (totalScore100 < 60) recommendedDay = 8;

  return Math.min(recommendedDay, PUBLISHED_DAY_LIMIT);
}
