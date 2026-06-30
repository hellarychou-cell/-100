export function getAIQuadrantTooltip(id: string, fallback: string) {
  if (id === "fourth" || id === "socratic") {
    return "第四象限：你不知道，AI也不知道答案。适合你已经感觉到一个反复出现的模式，却还说不清根源时使用。AI 会从感受、身体反应和具体场景往下问，一次只问一个问题，陪你慢慢追溯。";
  }

  if (id === "third") {
    return "第三象限：你知道一些线索，AI 帮你把它们整理清楚。适合把情绪、场景和身体反应放在一起看。";
  }

  if (id === "first") {
    return "第一象限：你已经比较知道答案，只需要 AI 陪你把那句话说完整、说稳一点。";
  }

  return fallback || "今天先从一句真实的话开始，AI 会一次只问一个问题。";
}
