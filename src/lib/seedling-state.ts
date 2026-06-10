export type SeedlingStage = "seed" | "sprout" | "seedling" | "sapling" | "tree";

export type SeedlingState = {
  icon: SeedlingStage;
  label: string;
  sentence: string;
  stage: SeedlingStage;
};

export function getSeedlingState(score: number | null | undefined): SeedlingState {
  if (typeof score !== "number" || Number.isNaN(score)) {
    return {
      stage: "seed",
      icon: "seed",
      label: "等待第一次测评",
      sentence: "先把自己种回自己的土壤里，做完测评后，这里会长出你的内在小苗苗状态。",
    };
  }

  if (score > 80) {
    return {
      stage: "seed",
      icon: "seed",
      label: "还在土里，但已经有力量",
      sentence: "你可能经常觉得累、卡、拧巴、不自由。但这不是你不行。更可能是你身上背了太多不属于你的声音。",
    };
  }

  if (score > 60) {
    return {
      stage: "sprout",
      icon: "sprout",
      label: "刚刚破土",
      sentence: "你的很多选择可能并不是从自己出发，而是被关系、权威、恐惧、羞耻、旧信念和家族脚本推着走。",
    };
  }

  if (score > 40) {
    return {
      stage: "seedling",
      icon: "seedling",
      label: "根系正在变深",
      sentence: "你已经知道很多问题和自己的内在模式有关。但真的遇到事情还是会被打回原形。",
    };
  }

  if (score > 20) {
    return {
      stage: "sapling",
      icon: "sapling",
      label: "正在扎根生长",
      sentence: "你已经有明显的自我意识，也开始知道自己不是只能活在别人的期待里。",
    };
  }

  return {
    stage: "tree",
    icon: "tree",
    label: "正在抽枝开花",
    sentence: "你的内在系统整体比较稳定，多数旧程序已经能被你觉察、识别和调整。",
  };
}
