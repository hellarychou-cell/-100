---
title: AI 接话锚点 · 代码改造建议（v6.2 对接觉醒剧场）
type: 开发文档
created: 2026-06-28
tags: [#AI对话, #代码改造, #前端, #后端, #觉醒剧场]
related: [[wiki/商业IP/100天计划/W1-AI接话锚点示例.md]], [[wiki/商业IP/100天计划/成她-说明书.md]], [[wiki/商业IP/100天计划/AI陪伴系统备忘录.md]]
---

# AI 接话锚点 · 代码改造建议

> **目标**：让 AI 对话开场第一句能"接住"用户在觉醒剧场里的选择，直接问出她没说出口的问题。
> **原理**：用户选 A/B/C（或 X/Y）→ 前端传"锚点"→ 后端拼进 system prompt → AI 根据锚点生成开场句。

---

## 一、改动范围

| 层级 | 文件 | 改什么 | 工作量 |
|---|---|---|---|
| **数据层** | 新建 `src/lib/day-ai-anchors.ts` | Day 1-100 的锚点映射表 | 10 分钟（先写 W1，其他留空）|
| **前端逻辑层** | `src/components/AIDayClient.tsx` | 读取用户选择 + 锚点，传给后端 | 5 分钟 |
| **后端 prompt 层** | `src/lib/user-context.ts` | 在 `buildContextPrompt()` 里拼接锚点 | 5 分钟 |
| **觉醒剧场记录层** | `src/lib/awakening-theater.ts`（如果有）| 记录用户选择到 localStorage | 5 分钟（可能已有）|

**总工作量**：~30 分钟（假设觉醒剧场选择记录已有）

---

## 二、数据层：新建 `src/lib/day-ai-anchors.ts`

### 2.1 文件结构

```typescript
// src/lib/day-ai-anchors.ts

/**
 * 每天的 AI 接话锚点
 * 用户在觉醒剧场选 A/B/C（或 X/Y）后，AI 根据对应锚点生成开场句
 */

export interface DayAnchor {
  A: string;
  B: string;
  C: string;
  X?: string; // 2 分支天才有
  Y?: string;
}

export const dayAIAnchors: Record<number, DayAnchor> = {
  // W1 示例
  1: {
    A: "笑着说'大家开心就好'+许愿时脑子空白",
    B: "想了3秒+说出了那件从没跟人说的事+朋友惊讶",
    C: "看手机说'有消息'+把话题带走+卫生间看镜子",
    X: "'算了明天又是新一天'+闭眼但苏苏那句话还在转",
    Y: "'我不是不知道，是从没敢说出来'+哪怕只对自己"
  },
  2: {
    A: "打7次删7次+发了'好我弄'+焦虑+凌晨3点",
    B: "打7次删7次+没发+看着屏幕发呆到12点半",
    C: "打7次删7次+回'好啊周一发您'+关机",
    X: "'我这人就是心软'+翻身睡+但睡不着",
    Y: "'我怕的不是她生气，我怕的是我不够好'+第一次承认"
  },
  3: {
    A: "接了+忍着听完妈妈唠叨+挂掉后手抖",
    B: "挂掉+5分钟后回电说'刚开会'+内疚一下午",
    C: "深呼吸+接了+平静说完+但心还堵着",
  },
  4: {
    A: "秒赞+留言'好棒'+关掉手机+心情一下午都不好",
    B: "盯着照片看了10分钟+退出群+又进去",
    C: "截图发给闺蜜'你看她又晒'+吐槽半小时",
    X: "'我就是爱比较'+翻身睡+但睡不着",
    Y: "'她的赢不是我的输'+写下这句话+第一次看见"
  },
  5: {
    A: "老公说'你不要这么累'+你没回话+继续洗碗+夜里躺下想'我撑不起这个家谁撑'",
    B: "", // 0α 单线流只有一个锚点，放在 A
    C: "",
  },
  6: {
    A: "秒起床+洗漱化妆+7点出门+全天紧绷",
    B: "躺了10分钟+想'要不请假'+起床了+一天都心不在焉",
    C: "关掉闹钟+给客户发消息改时间+睡回笼觉+醒来内疚",
    X: "'我就是这样的人'+翻身睡+但睡不着",
    Y: "'我不是勤奋，我是怕停下来'+第一次看见"
  },
  7: {
    A: "跟自己说'都过去了'+继续刷手机+但那句话还在响",
    B: "打开备忘录+写下'我还差2分才值得被爱'+看着这句话发呆",
    C: "给妈妈打电话+想说又没说+挂掉后哭了",
  },
  
  // Day 8-100 待补充
  // 8: { A: "...", B: "...", C: "..." },
  // ...
}
```

---

## 三、前端逻辑层：`src/components/AIDayClient.tsx`

### 3.1 读取用户选择 + 锚点

```typescript
// src/components/AIDayClient.tsx

import { dayAIAnchors } from '@/lib/day-ai-anchors'

// 假设觉醒剧场选择已存在 localStorage：
// chengta.awakeningTheaterChoices = { day: 1, choice: "A" }

function readClientContext(dayNum: number) {
  // 读取用户在觉醒剧场的选择
  const theaterChoices = JSON.parse(
    localStorage.getItem('chengta.awakeningTheaterChoices') || '{}'
  )
  const userChoice = theaterChoices[dayNum] || '' // "A" 或 "B" 或 "C" 或 "X" 或 "Y"
  
  // 读取对应的锚点
  const todayAnchor = userChoice 
    ? dayAIAnchors[dayNum]?.[userChoice as keyof typeof dayAIAnchors[number]] || ''
    : ''
  
  return {
    ...现有字段（姓名/年龄/测评/书写/AI对话历史等）,
    
    // 新增 2 个字段
    todayChoice: userChoice,    // "A" / "B" / "C" / "X" / "Y"
    todayAnchor: todayAnchor,   // "笑着说'大家开心就好'+许愿时脑子空白"
  }
}
```

### 3.2 传给后端

```typescript
// src/components/AIDayClient.tsx（调用 AI API 的地方）

const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: userInput,
    clientContext: readClientContext(dayNum), // 已经包含 todayChoice 和 todayAnchor
  })
})
```

---

## 四、后端 prompt 层：`src/lib/user-context.ts`

### 4.1 在 `buildContextPrompt()` 里拼接锚点

```typescript
// src/lib/user-context.ts

export function buildContextPrompt(clientContext: any): string {
  const basePrompt = `你是恬馨的 AI 陪伴助手。
你的名字是「小她」。
今天是 Day ${clientContext.currentDay}。

用户信息：
- 名字：${clientContext.userName}
- 年龄：${clientContext.userAge}
- 身份：${clientContext.userIdentity}
- 测评主模式：${clientContext.testMode}
- 最近反复出现的情绪词：${clientContext.frequentEmotions?.join('、')}

核心规则：
1. 称呼用户的名字。
2. 像认识她、记得她近况的陪伴者。
3. 一次只问一个问题。
4. 不说教，不急着给建议，不用鸡汤句。
5. 优先用短句、具体身体感受、具体场景回应。`

  // 🆕 拼接锚点（如果用户在觉醒剧场做了选择）
  const anchorPrompt = clientContext.todayAnchor 
    ? `\n\n用户刚刚在觉醒剧场里的状态：${clientContext.todayAnchor}。
你的第一句话要直接接住她此刻的状态——不要复述剧情，直接问出她没说出口的问题。

例如：
- 如果锚点是"笑着说大家开心就好+许愿时脑子空白"，你可以问："你刚才笑着说'大家开心就好'。但许愿的时候，你发现自己脑子是空的。跟我说说，那3秒里你在想什么？"
- 如果锚点是"接了电话+忍着+挂掉后手抖"，你可以问："你接了电话，挂掉的时候手在抖。跟我说说，那通电话里你在忍什么？"

不要机械照搬例子，用你自己的语气问。` 
    : ''
  
  // 拼接当天 AI 方法（从 src/lib/ai-prompts.ts 读取）
  const todayMethod = getTodayAIMethod(clientContext.currentDay)
  
  return basePrompt + anchorPrompt + todayMethod
}
```

---

## 五、觉醒剧场记录层（可能已有）

### 5.1 记录用户选择

```typescript
// src/lib/awakening-theater.ts（或在觉醒剧场页面组件里）

export function saveTheaterChoice(day: number, choice: 'A' | 'B' | 'C' | 'X' | 'Y') {
  const choices = JSON.parse(
    localStorage.getItem('chengta.awakeningTheaterChoices') || '{}'
  )
  choices[day] = choice
  localStorage.setItem('chengta.awakeningTheaterChoices', JSON.stringify(choices))
}
```

### 5.2 在觉醒剧场页面调用

```typescript
// 用户点击 A/B/C 按钮时
<button onClick={() => {
  saveTheaterChoice(dayNum, 'A')
  // 展开 A 分支内容...
}}>
  A · "哎呀我就是想大家开心就好啦！"
</button>
```

---

## 六、测试验证

### 6.1 本地测试 Day 1

1. 打开 `/day/1`，在觉醒剧场选 **A**
2. 点进 `/day/1/ai`
3. 输入："我不知道怎么说。"
4. 检查 AI 回复：
   - ✅ 叫出用户名字
   - ✅ 只问一个问题
   - ✅ 开场提到"笑着说大家开心就好" / "许愿时脑子空白"

### 6.2 验证不同选择

- 用户选 **B** → AI 开场应该提到"说出那件事" / "8双眼睛看着你"
- 用户选 **C** → AI 开场应该提到"有消息" / "把话题带走"
- 用户选 **X** → AI 开场应该提到"算了明天又是新一天"
- 用户选 **Y** → AI 开场应该提到"我不是不知道，是从没敢说"

### 6.3 验证没选择的情况

- 用户直接进 AI 对话页，没在剧场选过 → `todayAnchor` 为空 → AI 用通用开场（不影响对话）

### 6.4 验证锚点组合（2 分支天）

**重要**：Day 1-2 / Day 4 / Day 6 是 **2 分支天**（A/B/C + X/Y = 3×2 = 6 种组合）。

**后端不需要写死 6 种开场句**。AI 会根据 2 个锚点自动组合生成开场句。

**AI 自动组合逻辑**：

用户选择是 **组合型**（第一选择 A/B/C + 第二选择 X/Y）。

后端 `buildContextPrompt()` 拼接时：

```typescript
const anchorPrompt = clientContext.todayAnchor 
  ? `\n\n用户刚刚在觉醒剧场里的状态：${clientContext.todayAnchor}。
你的第一句话要直接接住她此刻的状态——不要复述剧情，直接问出她没说出口的问题。` 
  : '';
```

**示例**：用户选 A+Y（Day 1）

- 前端传给后端：
  ```json
  {
    "todayChoice": "A+Y",
    "todayAnchor": "笑着说'大家开心就好'+许愿时脑子空白 + '我不是不知道，是从没敢说出来'+哪怕只对自己"
  }
  ```

- AI 读到这个组合锚点，自己生成开场句：
  > "你刚才笑着说'大家开心就好'，但许愿时脑子空白。夜里你写下'我不是不知道，是从没敢说'。跟我说说，那个'不敢说'的是什么？"

**锚点文档只需提供 3 个示例**（A+X / B+Y / C+X），证明组合逻辑能跑通即可。AI 会根据任意组合自动生成合适的开场句。

---

## 七、Day 8-100 补充方式

### 7.1 谁来写

- 方案 A：恬馨自己按觉醒剧场分支结尾提炼（推荐）
- 方案 B：AI 辅助批量生成（给 AI 每天的剧场分支，让它提炼锚点）

### 7.2 补充格式

```typescript
// src/lib/day-ai-anchors.ts

8: {
  A: "【从 Day 8 觉醒剧场 A 分支结尾提炼的状态】",
  B: "【从 Day 8 觉醒剧场 B 分支结尾提炼的状态】",
  C: "【从 Day 8 觉醒剧场 C 分支结尾提炼的状态】",
  X: "【如果是 2 分支天，从 X 分支结尾提炼】",
  Y: "【如果是 2 分支天，从 Y 分支结尾提炼】",
},
```

### 7.3 提炼原则

锚点 = **用户此刻的状态**（行动 + 情绪），不是剧情复述。

**❌ 不好的锚点**：
- "用户在餐厅过生日，朋友问她想要什么" ← 这是剧情
- "用户很焦虑" ← 太抽象

**✅ 好的锚点**：
- "笑着说'大家开心就好'+许愿时脑子空白" ← 行动 + 细节
- "打7次删7次+发了'好我弄'+凌晨3点还在改" ← 行动 + 时间 + 结果

---

## 八、常见问题

### Q1：如果用户没在觉醒剧场做选择，直接进 AI 对话页怎么办？

A：`todayAnchor` 为空，AI 用通用开场（现有逻辑），不影响对话。可以在 AI 开场加一句"要不先去看看今天的故事？"

### Q2：0 分支天（0α/0β/0γ）怎么办？

A：0α 单线流只有 1 个锚点（放在 `A` 位置），用户看完故事自动标记为"已看"。0β/0γ 没有剧场，`todayAnchor` 为空。

### Q3：Day 8-100 锚点没补全之前，AI 对话会坏吗？

A：不会。`todayAnchor` 为空时，AI 用通用开场。补全是渐进式的，W1 先上线，其他周陆续补。

---

## 九、给代码端的总结

**改 3 个文件，30 分钟搞定**：

1. **新建** `src/lib/day-ai-anchors.ts`（W1 示例已给，其他留空）
2. **改** `src/components/AIDayClient.tsx`（`readClientContext` 加 2 行读锚点）
3. **改** `src/lib/user-context.ts`（`buildContextPrompt` 加锚点拼接段）

测试 Day 1-7 验证通过，Day 8-100 后续补。

---

最后更新：2026-06-28
