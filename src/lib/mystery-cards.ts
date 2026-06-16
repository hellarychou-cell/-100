export const mysteryCards: Record<
  number,
  {
    front: {
      name: string;
      description: string;
      age?: string;
      quote: string;
      symbol?: string;
    };
    back: {
      type: "tool" | "blank" | "gratitude" | "benefit";
      title: string;
      content: string;
      dayNum: number;
    };
  }
> = {
  1: {
    front: {
      name: "杨绛",
      age: "96 岁出版全集",
      description: "一辈子安静，但骨头最硬。",
      quote: `"还行"是一句很安全的话。`,
      symbol: "🌸",
    },
    back: {
      type: "gratitude",
      title: "感恩卡",
      content: "你今天来了。在你之前，所有别人安装的声音都比你先到。今天，谢谢你愿意让“你”第一个进门。",
      dayNum: 1,
    },
  },
  2: {
    front: {
      name: "上野千鹤子",
      age: "女性主义社会学家",
      description: "把女性的沉默处境，说成可以被看见的问题。",
      quote: "对不起，我不能。",
      symbol: "✊",
    },
    back: {
      type: "tool",
      title: "课题分离",
      content: "先分清这是谁的课题。对方失望、评价、情绪，是对方的课题；你是否诚实表达，是你的课题。",
      dayNum: 2,
    },
  },
  3: {
    front: {
      name: "苏敏",
      age: "自驾出走的阿姨",
      description: "用方向盘把自己从旧生活里开出来。",
      quote: "方向盘比电话沉。",
      symbol: "🚗",
    },
    back: {
      type: "blank",
      title: "空白卡",
      content: "今天没有工具。只留一块空白给你：那句话响起时，你身体里最先缩起来的地方在哪里？",
      dayNum: 3,
    },
  },
  4: {
    front: {
      name: "张爱玲",
      age: "作家",
      description: "把比较里的灰色说出来。",
      quote: "我不看同学的近照。我只看天。",
      symbol: "🍷",
    },
    back: {
      type: "tool",
      title: "自我同情三步",
      content: "承认此刻很难；记得这不是只有你会经历；对自己说一句温柔但真实的话。",
      dayNum: 4,
    },
  },
  5: {
    front: {
      name: "杨本芬",
      age: "作家",
      description: "六十岁以后，把厨房和人生都写出来。",
      quote: "锅里炖着我的第一本书。",
      symbol: "✒️",
    },
    back: {
      type: "benefit",
      title: "福利卡",
      content: "今天允许你少做一件事。不是惩罚别人，是停止用全揽证明自己值得被爱。",
      dayNum: 5,
    },
  },
  6: {
    front: {
      name: "李娟",
      age: "作家",
      description: "把阿勒泰的风，写成自己的节奏。",
      quote: "天一亮，羊先开始走。",
      symbol: "🐑",
    },
    back: {
      type: "gratitude",
      title: "感恩卡",
      content: "谢谢你今天愿意停一下。忙不是你的错，但停下来，是你重新听见自己的开始。",
      dayNum: 6,
    },
  },
  7: {
    front: {
      name: "李清照",
      age: "宋代词人",
      description: "七个字，不需要任何人打分。",
      quote: "生当作人杰。",
      symbol: "🌸",
    },
    back: {
      type: "tool",
      title: "萨提亚冰山模型",
      content: "下次“我不够好”出现时，别急着反驳它，往下问五层：行为、感受、观点、期待、渴望。走到渴望那一层，才是真正需要被看见的你。",
      dayNum: 7,
    },
  },
};
