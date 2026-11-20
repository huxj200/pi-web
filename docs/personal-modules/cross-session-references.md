# 跨会话引用

## 状态与来源

- **类型**：Pi Web 本身的 UI、API 和服务端改动，不是可单独安装的 pi 扩展。
- **状态**：**开发中**。功能来源提交为 `31510e6c48ca0647d417ea554869543fdf33f9b5`（`feature/current-customizations`）。截至 2026-11-17，该改动已应用并暂存在本机 `/Users/xiaoming/projects/AI/aiTools/pi-web-suite/pi-web-personal` 的 `personal/customized` 工作树；本地 `personal/main` 与 `origin/personal/main` 仍停在官方基线，没有个人功能提交。
- **官方兼容基线**：`upstream/main` 的 `174bff967807cdb59abb0204198d3d7cc19c862d`，Pi Web `0.17.0`，pi SDK 包 `1.5.2`。官方 `v0.17.0` 标签及 npm `gitHead` 在核实时均指向该提交。
- **上游化计划**：已按 CONTRIBUTING 发布官方 issue [#1716](https://github.com/agegr/pi-web/issues/1716)（中文，2026-11-17），待官方表态后决定是否整理 PR。若官方接受，本模块从 fork 差异中移除，差异归零。
- **部署状态**：**未部署**。2026-11-17 核对时，30141 服务仍由上层 aiTools 目录的 npm 安装包 `@agegr/pi-web@0.15.0` 启动。

## 功能和使用方式

在 Pi Web 新会话或已有会话的输入框中，于行首或空白字符后输入 `#`，再输入关键词筛选历史会话。列表默认优先显示当前项目的会话；用上下方向键移动，按 `Tab` 或 `Enter` 插入引用，按 `Escape` 关闭列表。选择后，输入框中插入如下紧凑引用：

```md
[会话标题](#session:会话UUID)
```

这只是输入框里的引用标记。发送消息时，服务端会读取所选会话的活动分支，并将有限长度的内容展开到实际发送给模型的消息中。引用块包含来源标题、项目目录和日期，并明确标注这些文字属于历史对话、不是当前指令。会话文件已不存在时，发送内容中会出现“引用会话不可用”的提示。

## 实现入口

- `components/ChatInput.tsx`：识别 `#` token，获取/筛选会话目录，渲染选择菜单并插入引用标记。
- `app/api/sessions/[id]/markdown/route.ts`：只读地返回一个会话的有界 Markdown，不启动 AgentSession。
- `lib/session-fuzzy.ts`：匹配排序和当前项目优先规则。
- `lib/session-markdown.ts`：从活动分支生成有界 Markdown。
- `lib/session-reference.ts`：识别引用、保护代码/转义文本、解析引用目标并构造历史上下文块。
- `lib/rpc-manager.ts`：在 prompt 进入 SDK 前展开引用；保留官方会话生命周期及 prompt 预检逻辑。

更细的键盘、消息路径、分支遍历和兼容约定见[会话主题说明](../agents/sessions.md)。

## 依赖、边界和限制

- 必须运行包含以上 UI、API 和服务端代码的 Pi Web 源码版本；不能通过只安装 pi 扩展启用。底层读取使用 pi 的 `SessionManager` 和 Pi Web 的会话路径解析。
- 候选来自 `GET /api/sessions`；客户端实例缓存已取回的目录。搜索列表最多显示 20 项，空查询时近期会话优先，并将当前项目会话排前。
- 展开时只沿着来源会话的活动父链读取，最多考虑 300 个条目、总渲染长度上限 40,000 字符。工具参数最多显示 120 字符，单个工具结果摘录最多 200 字符；思考内容和系统消息不展开，图片仅显示 `[图片]`，tool result 使用短摘录。
- 长度上限信息存在一个实现细节：达到字符上限会设置 `truncated` 标记；达到 300 条目上限时，当前实现会裁出最近 300 条，但不会单独设置该标记。因此“条目上限已截断”的提示目前可能缺失。这是已知限制，不代表没有截断。
- 截断提示中的“共 N 条消息”目前取自 SessionManager 条目总数，并非严格统计渲染出的用户/助手消息数。
- fenced/indented code、行内反引号代码和反斜杠转义中的引用保持原样，不展开，避免代码示例变成实际会话引用。
- 被选会话的部分内容会作为当前 prompt 发送给所选模型。引用前应确认历史会话中的信息适合进入当前模型上下文。
- 会话读取失败或目标消失不会自动启动目标会话；该引用会替换为不可用提示。

## 验证记录

2026-11-16，在 `personal/customized` 隔离工作树（官方基线 `174bff967807cdb59abb0204198d3d7cc19c862d` + 个人功能改动）执行：

- `npm test`：3,565 通过、0 失败、2 跳过。
- `node_modules/.bin/tsc --noEmit`：通过。
- `npm run lint`：通过。
- `npm run build`：成功；构建有一条 `app/api/sessions/[id]/export/route.ts` 动态依赖 warning，与此功能无关。
- 临时端口 30142 的生产构建通过 HTTP 检查；浏览器检查确认 `#` 显示会话候选，选择后将 `[标题](#session:UUID)` 插入输入框。没有发送模型请求。

这些结果验证的是隔离候选工作树，不代表功能已进入 `personal/main` 或当前 30141 服务。代码改动的整合细节和会话行为以[会话主题说明](../agents/sessions.md)为准。

## 后续整合注意事项

功能源分支 `feature/current-customizations` 保留了原始个人提交。未来更新官方主线时，以已验证的个人主线提交为起点逐项整合；保留本功能中的引用菜单与 prompt 展开，同时保留官方对扩展 UI 对话框、RPC、会话缓存和 SDK 生命周期的改动。若两边再次冲突，先比较行为并记录解决方案，再更新此文档的基线、来源提交和验证结果。
