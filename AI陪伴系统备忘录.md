# AI陪伴系统备忘录

这份文件记录“成她100”当前 AI 陪伴系统已经做到哪里、还缺什么、以后改提示词或排查 AI 时从哪里入手。

## 当前结论

- AI 不是完全没开始做：前端入口、后端接口、用户上下文、4 象限/13 场景提示词、成长档案保存、今日看见卡读取，都已经有代码。
- 目前最大的风险不是“没有 AI 页面”，而是“线上 AI 服务是否稳定连通、后台 prompt 是否真的带入了用户记忆、这些东西用户看不见所以不好验收”。
- 觉醒剧场第一版可以先不强依赖 AI：用户在故事里做选择，先写入成长档案和今日看见卡；AI 只是读取这些选择作为上下文。

## AI 接口

当前 AI 对话接口：

- 路由：`src/app/api/ai/chat/route.ts`
- 页面：`src/app/day/[day]/ai/page.tsx`
- 前端组件：`src/components/AIDayClient.tsx`
- 当前服务商：MiniMax
- 模型常量：`MiniMax-Text-01`
- API 地址：`https://api.minimax.chat/v1/text/chatcompletion_v2`

需要的环境变量：

- `MINIMAX_API_KEY`：MiniMax key，没有它生产环境会返回错误。
- `MINIMAX_GROUP_ID`：可选；如果配置，会拼到 MiniMax 请求 URL。
- `ENABLE_LOCAL_AI_FALLBACK=true`：可选；生产环境开启后，MiniMax 失败时会返回本地兜底回复。

本地开发时，即使没有 MiniMax key，也会走本地兜底回复，方便页面不中断。生产环境默认不兜底，除非显式设置 `ENABLE_LOCAL_AI_FALLBACK=true`。

## 每次对话带给 AI 的内容

前端会在 `AIDayClient` 里调用 `readClientContext(dayNum)`，把以下内容整理成 `clientContext` 传给后端：

- 用户姓名、年龄、身份
- 当下最想解决的问题
- 理想状态
- 测评主模式
- 测评里最需要看见的维度
- 当前 Day
- 最近 7 条自我书写
- 最近 3 次 AI 对话
- 高频情绪词，比如“累、焦虑、委屈、想哭”
- 反复出现的场景，比如“原生家庭、客户关系、亲密关系、金钱压力”
- 当天觉醒剧场选择
- 当天觉醒剧场接话锚点

后端用 `src/lib/user-context.ts` 里的 `buildContextPrompt()` 把这些内容写进 system prompt。核心规则包括：

- 称呼用户的名字。
- 像认识她、记得她近况的陪伴者。
- 可以引用她最近反复出现的词，但不要像数据报告。
- 一次只问一个问题。
- 不说教，不急着给建议，不用鸡汤句。
- 优先用短句、具体身体感受、具体场景回应。
- 如果有觉醒剧场选择，第一句话先接住她此刻的状态，不复述剧情，不评价选项对错。

## 觉醒剧场接话锚点

觉醒剧场第一版已经接入 Day1-7：

- 内容解析：`src/lib/day-document.ts`
- 前端组件：`src/components/AwakeningTheater.tsx`
- 选择存储：`src/lib/awakening-theater.ts`
- AI 锚点：`src/lib/day-ai-anchors.ts`
- Day 页面：`src/app/day/[day]/page.tsx`

选择记录存在 localStorage：

- `chengta.awakeningTheaterChoices`

当前记录字段包括：

- `day`
- `firstChoice`
- `secondChoice`
- `anchors`
- `selectedLabels`
- `createdAt`
- `updatedAt`

这些选择会进入三处：

- 成长档案：在“我的书写”里显示“觉醒剧场选择”。
- 今日看见卡：如果当天没有 AI 对话，会用“今天你在这一幕里选择了……”作为基础看见。
- AI 对话：`AIDayClient` 读取当天选择，传给 `/api/ai/chat` 的 `clientContext`，再由 `buildContextPrompt()` 写入 system prompt。

第一版不强依赖 AI 服务。即使 MiniMax 暂时不可用，用户仍然可以完成觉醒剧场选择，并在成长档案和今日看见卡里看到记录。

## 每天的 AI 方法

每日 AI 方法来自：

- `src/lib/ai-prompts.ts`

这里包含：

- 4 个象限提示词：苏格拉底式、第三象限、第一象限、第四象限追溯根源。
- 13 个场景提示词：情绪崩溃、烦躁、愤怒、焦虑、麻木、吵架后、被人说了、反复想、怀疑自己、没价值感、内疚、拖延、没兴趣等。
- `dayAIPrompts`：把 Day 映射到具体提示词。

Day 页面上的 AI 今日问题来自：

- Day1-7：优先读 `成她-Day1-7.md`
- 兜底：`src/lib/content.ts`

## 姐妹触发机制

已做的“姐妹关键词触发”在：

- `src/lib/sister-profiles.ts`
- `src/components/AIDayClient.tsx`

当前已录入 Day1-7 的姐妹：

- 杨绛
- 上野千鹤子
- 苏敏
- 张爱玲
- 杨本芬
- 李娟
- 李清照

触发逻辑：

- 用户必须已经解锁对应姐妹卡。
- 用户输入命中关键词，比如“妈妈、电话、拒绝、分数、累”等。
- 同一姐妹同一天只触发一次。
- 触发后在 AI 回复末尾追加一段“你今天的话，让我想到了……”。

触发记录存在 localStorage：

- `chengta.sisterTriggerLog`

## 成长档案和今日看见卡

自我书写记录：

- 存储 key：`chengta.selfReflectionEntries`
- 类型定义：`src/lib/self-reflection.ts`
- 页面：`/growth-archive`

AI 对话记录：

- 存储 key：`chengta.aiConversationEntries`
- 每次 AI 回复后保存或更新当天对话。
- 成长档案里的“AI 陪我看见”读取这批记录。

今日看见卡：

- 存储 key：`chengta.todaySeeingCards`
- 生成逻辑：`src/lib/today-seeing-card.ts`
- 页面：`/quote-card?day=N`

今日看见卡会优先读取当天 AI 对话。如果没有 AI 对话，会优先读取当天觉醒剧场选择，再用当天镜子和身体小语生成基础版。

## 目前的已完成测试

相关测试文件：

- `tests/ai-intimacy.test.ts`

已经覆盖：

- 用户上下文能读取姓名、身份、测评、最近书写、最近 AI 对话和高频情绪词。
- system prompt 里包含用户名字和“一次只问一个问题”规则。
- 成长画像能从本地记录生成。
- 今日看见卡能在“有 AI 对话”和“无 AI 对话”两种情况下生成。
- 姐妹关键词能命中，且同日不会重复触发。
- 本地 AI 兜底能在没有 MiniMax 时返回带名字和陪伴语气的回复。
- 觉醒剧场选择能进入 AI prompt。
- 今日看见卡能在没有 AI 对话时读取觉醒剧场选择。

## 还缺什么

### 1. AI 连通性验收

需要单独验证：

- 本地 `.env.local` 是否有 `MINIMAX_API_KEY`。
- Vercel 生产环境是否有 `MINIMAX_API_KEY`。
- 腾讯云 `.env.production` 是否有 `MINIMAX_API_KEY`。
- MiniMax 返回格式是否能被 `extractMiniMaxReply()` 正确解析。
- 失败时页面是否显示明确提示，而不是像“没反应”。

建议新增一个人工验收流程：

1. 打开 `/day/1/ai`。
2. 输入：“我妈又打电话，我很累。”
3. 检查 AI 是否叫出用户名字。
4. 检查 AI 是否只问一个问题。
5. 检查如果苏敏已解锁，是否出现姐妹触发提示。
6. 检查成长档案里是否保存这段对话。

### 2. 后台 prompt 可检测

用户看不到 system prompt，所以后续最好加“测试模式”或“测试用例”，证明后台确实带入：

- 用户名字
- 最近书写
- 最近 AI 对话
- 当天 Day
- 当天觉醒剧场选择
- 今日姐妹/卡片意象

不能在正式页面暴露完整 prompt，但可以用单元测试和开发环境日志验证。

### 3. 觉醒剧场后续增强

当前只做 Day1-7 第一版。后续如果继续增强，可以考虑：

- Day8-100 逐步补互动分支。
- 把用户连续几天的选择串成“模式线索”。
- 在成长画像里单独统计常选的反应模式。
- 等数据库接入后，把剧场选择从 localStorage 迁移到账号数据。

### 4. 跨设备记忆还没完成

目前很多记录存在 localStorage，也就是同一浏览器可见。未来做 APP 或多设备同步，需要把这些数据迁移到数据库：

- 自我书写
- AI 对话
- 今日看见卡
- 姐妹触发记录
- 觉醒剧场选择
- Day1 写给未来自己的信

## 建议下一步优先级

1. 先做 AI 连通性验收，确认 MiniMax 在本地、Vercel、腾讯云都能通。
2. 再补“后台 prompt 测试”，确保名字、近期记录、当天选择真的进 prompt。
3. 然后做“觉醒剧场选择”第一版，不强依赖 AI。
4. 最后再考虑 Day1 写信 / Day100 回信、跨设备数据库记忆和 APP 化。

## 常用检查命令

```bash
npm test -- tests/ai-intimacy.test.ts
npm run lint
npm run build
```

如果只想看 AI 接口代码：

```bash
sed -n '1,260p' src/app/api/ai/chat/route.ts
sed -n '1,220p' src/lib/user-context.ts
sed -n '1,220p' src/components/AIDayClient.tsx
```

## 给后续开发者的注意事项

- 不要把觉醒剧场第一版做成复杂分支游戏。先做“选择记录 + 档案 + 今日看见卡 + AI 上下文”。
- 不要把“内在小苗苗”和“亲密度积分”重复做成两套系统。现阶段保留小苗苗，借用亲密度语言即可。
- 不要在正式页面暴露完整 system prompt。
- 不要让 AI 一次问很多问题。成她 AI 的底层规则始终是：一次只问一个问题，短句、具体、克制、像陪伴者。
