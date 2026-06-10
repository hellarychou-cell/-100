import type { DimensionId } from "./assessment";

export type ReportDimensionRow = {
  id: DimensionId | string;
  index: number;
  name: string;
  score: number;
};

type DimensionInterpretation = {
  body: string;
  drain?: string;
  level: "high" | "mid" | "low";
  title: string;
};

export type ReportSummary = {
  actionAdvice: string[];
  bottomCode: string;
  maturity: string;
  seedling: string;
  title: string;
  likelyPatterns?: string[];
};

const dimensionCopy: Record<DimensionId, Record<DimensionInterpretation["level"], DimensionInterpretation>> = {
  "self-worth": {
    high: {
      level: "high",
      title: "证明模式运行中",
      body:
        "你的底层代码里有一个声音在说：你还不够好，你需要做得更多才值得被爱。你对自己的要求很高，内在有一个永远不满意的声音。你可能在事业上做得不错，但内心深处始终觉得这不够。你不是不优秀，是你的系统把被认可当成了呼吸一样的需求。",
      drain: "你花大量能量在证明自己上，而不是在享受自己上。你赚到的钱、获得的认可，都没有被你真正接收到。",
    },
    mid: {
      level: "mid",
      title: "摇摆模式",
      body:
        "你有时候觉得自己挺好的，有时候又会掉进我不配的漩涡。外在条件好的时候你能自信，一旦遇到挫折或被质疑，内在的不安全感会迅速涌上来。你正在知道和做到之间挣扎。",
      drain: "你的自我价值感不稳定，容易被外部评价左右，能量花在了情绪波动上。",
    },
    low: {
      level: "low",
      title: "内在稳定",
      body:
        "你对自己的价值有比较清晰的认知，不太容易被外界评价动摇。你能接受自己的不完美，也能接收别人的认可。你的自我价值感是从内在长出来的，不依赖外部证明。",
    },
  },
  boundaries: {
    high: {
      level: "high",
      title: "讨好程序全速运行",
      body:
        "你的关系模式被一个旧程序控制着：我必须让别人满意，才能确保自己是安全的。你在关系中扮演的是付出者、调和者、照顾者，但很少是自己。你不是不想为自己说话，是内在有个声音告诉你：如果你不好说话了，你就会被抛弃。",
      drain:
        "你把大量的生命能量用在管理别人的情绪上。你的时间、精力、注意力都在围着别人转，留给自己的所剩无几。",
    },
    mid: {
      level: "mid",
      title: "有觉察但还做不到",
      body:
        "你已经意识到自己在关系中的讨好模式，但在真实场景中还是很难做到拒绝。你可能脑子很清楚但身体很诚实，知道该说不，但嘴巴先说了好。你正在建立边界感的路上。",
      drain: "内在的旧我和新我在拉扯，你为做不到自己知道该做的事而自我攻击。",
    },
    low: {
      level: "low",
      title: "边界清晰",
      body:
        "你在关系中能比较好地保持自我，能温和但坚定地表达需求。你不为别人的情绪过度负责，也不怕因为说不而失去关系。你的关系边界是健康的。",
    },
  },
  decision: {
    high: {
      level: "high",
      title: "外包模式运行中",
      body:
        "你的决策系统被外包了。你不是没有判断力，是内在有一个底层代码在说：如果我选错了，那就是我的错，而我承受不起这个后果。所以你宁愿不选、晚选、让别人选。",
      drain: "决策前的焦虑加上决策后的后悔，组成了一个永动机般的内耗循环。",
    },
    mid: {
      level: "mid",
      title: "半自主模式",
      body:
        "你在一些领域能自主决策，但在关键领域还是容易犹豫和依赖他人意见。你正在从向外求走向向内看，但还需要更多练习信任自己的判断。",
      drain: "在重要决策节点上的反复纠结消耗了你本该用于行动的能量。",
    },
    low: {
      level: "low",
      title: "内在导航在线",
      body:
        "你有比较清晰的内在导航系统，能在收集信息后做出自主判断，并为自己的选择负责。你不怕做错，因为你知道做了再调整比永远在想更有效。",
    },
  },
  emotion: {
    high: {
      level: "high",
      title: "情绪海绵模式",
      body:
        "你是一块情绪海绵，周围人的情绪你全部吸收了。你不只是高敏感，你的底层代码里写着：别人的感受比我的重要，别人不开心我就不安全。你花大量精力在读空气上，社交后需要很长时间恢复。",
      drain: "你的情绪系统一直在超负荷运转，因为它不只在处理你自己的情绪，还在处理所有你接触到的人的情绪。",
    },
    mid: {
      level: "mid",
      title: "部分渗透",
      body:
        "你能感知到自己有时候会被别人的情绪影响，但还能在一些时候找回自己的中心。你在亲近的人面前更容易被影响，在不太熟的人面前可以保持距离。",
      drain: "在亲密关系和重要客户面前，你的情绪边界会变得模糊，被对方的情绪带着走。",
    },
    low: {
      level: "low",
      title: "情绪主权在握",
      body:
        "你能比较好地分辨哪些情绪是自己的、哪些是别人的。你有同理心，但不会被别人的情绪裹挟。你能在感受到对方情绪的同时保持自己的中心。",
    },
  },
  action: {
    high: {
      level: "high",
      title: "刹车模式全开",
      body:
        "你的行动通道被一个内在刹车系统卡住了。你不缺想法，不缺能力，甚至不缺机会，你缺的是允许自己开始的许可。你的底层代码在说：如果不完美，就不要做；如果可能犯错，就不要开始。",
      drain: "拖延不是懒，是内在在打架。一边想做，一边怕做。你的能量在油门和刹车之间被撕裂。",
    },
    mid: {
      level: "mid",
      title: "间歇启动",
      body:
        "你有时候可以突破阻力开始行动，但在关键时刻会卡住。你能做别人安排的事，但对自己主导的事更容易拖延。你的行动力有波动。",
      drain: "能量不稳定，在冲刺和停滞之间来回切换，缺少持续且平稳的行动节奏。",
    },
    low: {
      level: "low",
      title: "创造通道畅通",
      body:
        "你能比较快地将想法转化为行动，不追求完美主义，接受边做边调整。你面对新机会时的第一反应是兴奋而不是恐惧。你的能量主要用于创造。",
    },
  },
  wealth: {
    high: {
      level: "high",
      title: "漏斗模式",
      body:
        "你的财富容器有漏洞。不是你赚不到钱，是你的内在系统承不住钱。你的底层代码可能是：有钱的人不是好人、钱来了一定会走、我不配拥有太多。你对钱的恐惧和渴望同时在运行。",
      drain: "你在财富上的能量是分裂的，一边想赚更多，一边在潜意识里推走已经到手的。",
    },
    mid: {
      level: "mid",
      title: "有限容器",
      body:
        "你能赚到一定水平的钱，但很难突破到下一个台阶。你在某个收入区间会觉得差不多了或到头了。你的财富容器有大小，当超出容量时，钱会通过各种方式漏出去。",
      drain: "你在赚钱和花钱之间没有真正的自主感，总是被某种应该驱动。",
    },
    low: {
      level: "low",
      title: "财富容器扩容中",
      body:
        "你与金钱的关系比较健康，能自在地赚钱和花钱。你不回避谈钱，也不被钱绑架。你相信丰盛是可以持续的，也愿意为自己投资。",
    },
  },
};

const modeInsights: Record<string, { coreCode: string; lines: string[] }> = {
  讨好型: {
    coreCode: "别人的需求比我重要，我不能让别人失望",
    lines: ["你不是太善良，你只是太害怕了。", "你帮过的每一个人都可能记得你，但谁记得那个累坏了的你？", "学会说不，是你给自己最好的礼物。"],
  },
  证明型: {
    coreCode: "我需要做得足够好，才值得被爱",
    lines: ["你不需要做得更多才值得被爱。你存在，就值得。", "你的还不够好，是小时候的标准。它在你长大后已经失效了。", "停下来，不是失败。停下来，是允许自己已经够好了。"],
  },
  控制型: {
    coreCode: "如果我不掌控一切，就会失控",
    lines: ["你不是在控制，你是在害怕失控。", "放手不等于失败。有时候，放手才能看到全貌。", "你不需要扛起所有事。让一些事，自己流动起来。"],
  },
  冻结型: {
    coreCode: "动了会更糟，不如不动",
    lines: ["你不是懒，你是怕做了也不够好。", "完美主义不是高标准，是对不够好的恐惧。", "做第一步就够了。剩下的，明天再说。"],
  },
  混合型: {
    coreCode: "多个旧程序同时运行，需要系统梳理",
    lines: ["你不是一种类型的人，你是一个底层代码仓库。", "你身上的每一个问题，都是小时候被安装的程序。", "100天后，你不会变成另一个人。但你会真正认识你自己。"],
  },
};

export function getReportSummary(rawScore: number): ReportSummary {
  if (rawScore >= 145) {
    return {
      title: "深度隐形内耗",
      maturity: "依赖期",
      seedling: "还在土里，但已经有力量了",
      bottomCode: "几乎所有维度的旧程序都在运行，而且它们互相缠绕，形成了一个自动化的内耗系统。你可能已经习惯了这种状态，甚至觉得这就是我。但这不是你，这是程序。",
      actionAdvice: ["你不需要自己想通，你需要被专业地看见。", "你今天做了这个测评，就已经是最大的勇气。", "接下来的路，不用你一个人走。"],
    };
  }
  if (rawScore >= 109) {
    return {
      title: "重度隐形内耗",
      maturity: "依赖期 → 独立期",
      seedling: "刚刚破土",
      bottomCode: "你的系统里有4-5个深度旧程序在同时运行。它们互相连接，形成了一张内耗之网。单独处理一个不够，需要从根源上梳理。",
      likelyPatterns: ["讨好 + 不配得 + 选择困难 + 情绪被人遥控", "在我要改变和我没能力改变之间挣扎", "经常感到疲惫、焦虑，但说不出具体原因"],
      actionAdvice: ["你现在最需要的不是方法，而是被看见。", "看见，就是改变的开始。你已经迈出了第一步。"],
    };
  }
  if (rawScore >= 73) {
    return {
      title: "中度隐形内耗",
      maturity: "独立期 → 自主期",
      seedling: "正在扎根生长",
      bottomCode: "你的系统里有2-3个核心旧程序还在运行，它们在你压力大、被触发的时候会自动接管。你需要被帮助看见它们具体长什么样。",
      likelyPatterns: ["脑子清楚但身体做不到", "一个人想的时候很坚定，面对真人就退回去", "反复在这次一定要改和算了又失败了之间循环"],
      actionAdvice: ["看见你的底层代码是什么，只有看见了才能改变。", "不要急着变好，先允许自己看见。"],
    };
  }
  return {
    title: "轻度隐形内耗",
    maturity: "自主期 → 创造期",
    seedling: "正在抽枝开花",
    bottomCode: "大部分旧程序已经被你看见并清理了，剩下的是一些在特定压力场景下才会被触发的小程序。",
    actionAdvice: ["继续保持觉察，留意压力大时哪些旧模式会回来。", "把你的经验分享给身边的人，教是最好的学。", "如果你想继续精进，可以看看还有哪些暗角。"],
  };
}

export function getDimensionInterpretation(id: DimensionId, index: number) {
  const level: DimensionInterpretation["level"] = index >= 70 ? "high" : index >= 25 ? "mid" : "low";
  return dimensionCopy[id][level];
}

export function getModeInsight(mode: string) {
  if (modeInsights[mode]) return modeInsights[mode];
  if (mode === "失权型") return modeInsights.控制型;
  if (mode === "冻结拖延型") return modeInsights.冻结型;
  return modeInsights.混合型;
}

export function getTopAndLowDimensions<T extends ReportDimensionRow>(rows: T[]) {
  const sorted = [...rows].sort((a, b) => b.score - a.score);
  return {
    top: sorted.slice(0, 2),
    low: sorted[sorted.length - 1],
  };
}
