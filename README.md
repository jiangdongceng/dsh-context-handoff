# DSH Context Handoff

**把老对话的设定、规则、背景和当前状态整理成 AI 摘要，在新对话中载入这些背景。**

不复制旧对话正文，不自动继续旧任务。新对话只“知道设定”，然后等你下一条指令。

![icon](icon.svg)

## 它解决什么问题

DSH 的上下文窗口会被长对话慢慢吃满。`/compact` 是在原会话里重写历史，`fork` 是复制整段历史。这个插件走第三条路：

1. 让模型读取当前对话，写一份结构化的**设定摘要**。
2. 摘要保存到磁盘，可在 Web 界面里审阅、编辑、删除、搜索。
3. 一键创建一个干净的新对话，把摘要作为第一条消息发过去。
4. 新对话只把摘要当背景，不继承旧 transcript，也不会自己继续旧任务。

适合：角色/世界观设定、长期项目背景、固定工作规则、跨会话的产品或技术上下文。

## 不是什么

| | `/compact` | fork | 本插件 |
|---|---|---|---|
| 旧会话 | 原地压缩 | 保留 | **原样保留** |
| 新会话内容 | 同一会话 | 整段历史 | **一份 AI 生成的背景摘要** |
| 是否自动继续任务 | 是 | 是 | **否，等用户下一条指令** |

## 功能

- 会话标题旁的「载入会话设定」入口
- 设置页里的完整摘要库：搜索、审阅、编辑、删除、打开来源、复制
- 结构化摘要：前提与目的、既定事实与设定、规则/约束/偏好、人物与术语、文件与技术环境、已做决策、当前状态、待确认问题
- 长对话自动分段滚动总结
- 某一段返回空文本时自动拆分重试
- 输出 token 截断时自动续写
- 摘要自动去掉模型擅自添加的 “Next steps” 章节
- 新对话只接收设定摘要、来源标题和工作目录

## 安装

这是一个普通 DSH Bundle，纯 ESM，无构建步骤。

1. 克隆仓库：

   ```sh
   git clone https://github.com/jiangdongceng/dsh-context-handoff.git
   ```

2. 在 DSH 中打开 **Settings → Plugins → Add plugin**，选择克隆下来的目录。
3. 启用 `@local/dsh-context-handoff`。

也可以把目录链接到当前 profile 的 `node_modules`，再按 DSH 的本地 bundle 方式加入 profile。

## 使用

1. 打开一个已经开始的对话。
2. 点标题右侧的设定图标。
3. 可选填写关注点，例如“保留项目背景、规则、API 决策”。
4. 点「生成设定摘要」。
5. 审阅/编辑摘要，点「用此设定开新对话」。
6. 新对话会回一句“已了解设定”，然后等你发新指令。

旧对话保持不变。

## 摘要格式

```markdown
## Premise and purpose
## Established facts and setting
## Rules, constraints, and preferences
## People, characters, and terminology
## Files, tools, and technical setup
## Decisions already made
## Current state
## Open questions
```

没有 `Next steps`。模型写了也会被移除。

## 数据与隐私

- 生成摘要时，旧对话文本会发送给当前模型；界面有明确提示。
- 新对话只收到摘要，不接收旧对话原文。
- 默认数据目录为 `<DSH_HOME>/context-handoff`；如果 `D:\dsh\context-handoff` 已存在，会优先使用它。
- 可用 bundle 配置里的 `dataDir` 或环境变量 `DSH_CONTEXT_HANDOFF_DIR` 指定其他绝对路径。
- 数据文件是 `briefs.json`；每次写入前会把上一版留成 `briefs.json.bak`。插件不写入 DSH 核心包。

## 兼容性

- 已在 DSH `0.2.2-rc.3` 的 Desktop / Web 界面验证 Bundle 加载、Host 路由和 Slot 注册。
- 仅使用公开的 Connection、Session Controller、LLM 和 Web Slot 接口。
- 没有 `Config` schema；`dataDir` 通过 bundle 配置传入。

## 开发

```sh
node test/handoff.test.mjs
```

测试覆盖摘要分段、输出续写、空文本拆分、设定摘要清洗、存储 CRUD、Host 服务和认证路由处理。

## 参考

这些项目提供了“先总结、再开新会话”的思路；本插件是为 DSH 0.2.2 重新实现的、以设定交接为目标的版本，没有直接复制代码：

- [MountBatten718/dsh-session-handoff](https://github.com/MountBatten718/dsh-session-handoff)
- [thepushkarp/handoff](https://github.com/thepushkarp/handoff)
- [clever-cc-plugins/cc-handoff](https://github.com/clever-cc-plugins/cc-handoff)

## License

MIT
