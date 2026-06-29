# 成她100 · Codex 工作规则

## 唯一工作目录

只在 `/Volumes/PS2000/成她` 修改项目。

不要在 `/Users/macbook/Documents/GitHub/-100` 直接改业务代码。这个目录只用于查看干净的 Git 历史、同步目标和部署后的核对。

不要新建其它同名项目副本，也不要在临时目录、下载目录、桌面或旧 MVP 目录里改正式业务代码。

## 每次开始前

1. 确认当前工作目录是 `/Volumes/PS2000/成她`。
2. 先读本文件，再读与任务相关的源文档或代码。
3. 先定位影响范围，再修改文件。
4. 涉及内容、文案、测评、Day 内容、工具卡或 AI 对话时，先确认内容来源，不要自行扩写。

## 内容来源优先级

冲突时按下面顺序处理：

1. `项目继续修改与同步指南.md`
2. `成她-Day1-7.md`
3. `成她-说明书.md`
4. `讨好型创业女性隐形内耗自测-完整版.md`
5. `ifs的ai自提问手册.md`
6. `心理学工具箱/`
7. `网站开发-移交清单.md`

如果源文档之间存在明显冲突，先说明冲突点，再按最高优先级文件执行。

## 修改边界

- 不直接修改源文档，除非用户明确要求。
- 不整文件回退，不用旧版本覆盖当前文件。
- 查历史时只提取需要的片段，手动合并到当前版本。
- 不为了修一个页面顺手重构全站结构。
- 不删除用户已有改动；遇到不相关的脏工作区变化，保持原样。
- 不把正式 Day 内容改回占位文案。

## 常用验证

代码修改完成后，默认运行：

```bash
npm test
npm run lint
npm run build
```

如果用户明确说“只改本地，不验证”，可以不跑完整验证，但需要在回复里说明未验证。

## 同步与上线

只有用户明确要求上线、同步、提交或部署时，才执行：

```bash
./scripts/sync-to-github.sh "更新说明"
```

上线前先做部署预检，避免重复踩凭据和目录问题：

```bash
cd /Users/macbook/Documents/GitHub/-100
git status --short --branch
git remote -v
git config --show-origin --get-regexp 'remote.origin.url|credential|insteadOf|url\..*\.insteadOf'
```

预期状态：

- `/Users/macbook/Documents/GitHub/-100` 应该是干净的 `main...origin/main`，没有未提交改动。
- `origin` 应该是 `https://github.com/hellarychou-cell/-100.git`。
- 不应该存在错误账号的本地凭据配置，例如 `credential.https://github.com.username 262933974`。

如果发现错误账号凭据配置，先在同步目标仓库移除：

```bash
cd /Users/macbook/Documents/GitHub/-100
git config --unset credential.https://github.com.username
```

本项目曾经在部署时失败过一次，报错是：

```text
fatal: could not read Password for 'https://262933974@github.com': Device not configured
```

根因不是代码构建失败，而是同步目标仓库残留了错误 GitHub 用户名配置，导致 `git push` 读取错误钥匙串凭据。处理方式是移除这条本地 Git config 后重新 `git push origin main`。下次遇到类似 GitHub 密码/凭据错误，先查上面的 `git config --show-origin --get-regexp ...`，不要反复重跑同步脚本。

同步脚本成功后，继续确认 Vercel 部署状态。正式地址是：

```text
https://chengta-100.vercel.app
```

如果本次要求国内访问，也要按 `项目继续修改与同步指南.md` 同步并验证服务器：

```text
http://124.222.242.203
```

推荐的稳定部署顺序：

1. 在 `/Volumes/PS2000/成她` 完成修改。
2. 跑 `npm test`、`npm run lint`、`npm run build`。
3. 在 `/Users/macbook/Documents/GitHub/-100` 做上面的 Git 凭据预检。
4. 回到 `/Volumes/PS2000/成她` 执行 `./scripts/sync-to-github.sh "更新说明"`。
5. 如果脚本已经 commit 但 push 失败，不要重新提交；进入 `/Users/macbook/Documents/GitHub/-100` 修凭据后直接 `git push origin main`。
6. 用 `vercel ls chengta-100 --scope hellary` 和 `vercel inspect chengta-100.vercel.app --scope hellary --timeout 180s` 等到最新 Production Ready。
7. 验证 `https://chengta-100.vercel.app/day/1`、`/collection`、`/day/1/ai` 等关键页面返回 200。
8. 如需国内访问，从 `/Users/macbook/Documents/GitHub/-100` rsync 到腾讯云，远端 `npm ci && npm run build && sudo systemctl restart chengta100`，再验证 `http://124.222.242.203` 关键页面和 `chengta100/nginx` 状态。

## 完成标准

默认完成标准是：

1. 需求已实现。
2. 相关文件已说明。
3. `npm test`、`npm run lint`、`npm run build` 通过，或明确说明未运行原因。
4. 如果涉及上线，GitHub/Vercel/国内服务器按用户要求验证完成。

## 建议的任务输入模板

```text
本次目标：
涉及页面/文件：
内容来源：
完成标准：
是否上线：
```
