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
      quote: "我和谁都不争，和谁争我都不屑。",
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
      quote: "女性主义不是变得像男人那样强势，是允许弱者以弱者的样子被尊重。",
      symbol: "✊",
    },
    back: {
      type: "tool",
      title: "课题分离",
      content: "她生不生气，是她的课题。我说不说，是我的课题。",
      dayNum: 2,
    },
  },
  3: {
    front: {
      name: "李红",
      age: "《出走的决心》原型",
      description: "开着小白车，终于先爱自己。",
      quote: "我不是不爱我妈，我只是终于愿意先爱我自己。",
      symbol: "🚗",
    },
    back: {
      type: "blank",
      title: "空白卡",
      content: "今天没有工具。今天的工具，是允许自己不接那个电话。",
      dayNum: 3,
    },
  },
  4: {
    front: {
      name: "贾玲",
      age: "40 岁拍《热辣滚烫》",
      description: "减掉的不是肉，是“我应该”。",
      quote: "我减掉的不是肉，是 40 年来“我应该”活成的样子。",
      symbol: "🌶️",
    },
    back: {
      type: "tool",
      title: "自我同情三步",
      content: "你不是要变好，你是要先停止替别人攻击自己。",
      dayNum: 4,
    },
  },
  5: {
    front: {
      name: "苏敏",
      age: "50 岁阿姨自驾游",
      description: "开着白色 POLO，独自上路。",
      quote: "半辈子我都为家人活，剩下的我想试试为我自己。",
      symbol: "🚗",
    },
    back: {
      type: "benefit",
      title: "福利卡",
      content: "你今天的觉察值得被深聊。连续打卡 5 天：1v1 深聊原价 388 → 188 元，7 天有效。",
      dayNum: 5,
    },
  },
  6: {
    front: {
      name: "林青霞",
      age: "60 岁以后写作",
      description: "用后半生做自己。",
      quote: "我用前半生当了别人喜欢的女明星，用后半生做我自己。",
      symbol: "🍃",
    },
    back: {
      type: "gratitude",
      title: "感恩卡",
      content: "你今天来了。在你之前，没有一个声音问过你：“你今天想做什么”。今天，谢谢你愿意问自己一句。",
      dayNum: 6,
    },
  },
  7: {
    front: {
      name: "杨绛/钱媛",
      age: "杨绛 87 岁以后",
      description: "一个人，也是一支完整的队伍。",
      quote: "我们仨走散了，我得把还没做完的事做完。",
      symbol: "🌸",
    },
    back: {
      type: "tool",
      title: "萨提亚冰山模型",
      content: "你看见的是行为，水下藏着 5 层。",
      dayNum: 7,
    },
  },
};
