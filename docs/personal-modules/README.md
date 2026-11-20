# Pi Web 个人模块索引

本文记录个人定制版的官方源码基线、个人模块及其整合/部署状态。定制版的定义是“官方基线 + 可追踪的个人改动”，不能只用 npm 版本号代表源码来源。

## 当前基线与分支状态

核实日期：2026-11-17（Asia/Shanghai）。

| 项目 | 当前核实结果 |
| --- | --- |
| 官方源码 | [agegr/pi-web](https://github.com/agegr/pi-web)，基线分支 `upstream/main` |
| 最新官方基线 | `174bff967807cdb59abb0204198d3d7cc19c862d`（2026-11-17 通过 GitHub `ls-remote` 核实） |
| 官方版本标签 | `v0.17.0` 指向同一提交 |
| npm 发布包 | `@agegr/pi-web@0.17.0` 的 `gitHead` 为 `174bff967807cdb59abb0204198d3d7cc19c862d`；与当前官方基线一致 |
| 个人 Fork 的 `origin/main` | `174bff967807cdb59abb0204198d3d7cc19c862d`，与官方基线一致 |
| 个人主线 `personal/main` | 本地分支及 `origin/personal/main` 当前均为 `174bff967807cdb59abb0204198d3d7cc19c862d`；提交层面与官方基线相同，还未含个人模块提交 |
| 当前本机集成候选 | 工作树 `/Users/xiaoming/projects/AI/aiTools/pi-web-suite/pi-web-personal`，分支 `personal/customized`，HEAD 为 `174bff967807cdb59abb0204198d3d7cc19c862d`；跨会话引用补丁已应用并暂存，但尚未形成集成提交 |
| 功能来源分支 | `feature/current-customizations`，个人源提交 `31510e6c48ca0647d417ea554869543fdf33f9b5`，基于较早官方代码；原功能分支仍保留 |
| 本机运行服务 | `127.0.0.1:30141` 当前由 `aiTools/node_modules/@agegr/pi-web` 的 npm `0.17.0` 提供（2026-11-17 核实，进程为 `next-server (v16.4.4)`），不含本候选改动；个人模块未部署 |

提交哈希说明的是 Git 提交位置，不代表工作树一定干净。当前候选的 `HEAD` 与官方提交相同，但其暂存区包含个人改动；因此它是“官方基线 + 待提交的个人改动”，不能称为与官方源码完全相同。远端 `personal/main` 目前仍是官方基线提交，当前候选尚未进入该分支。

## 状态定义

- **计划中**：只有需求或方案，尚无可运行实现。
- **开发中**：功能在开发/候选分支或工作树中，尚未成为个人主线的可追踪提交。
- **已整合**：个人主线提交中已包含并可定位到该模块改动；仅在分支名或工作区暂存状态中出现不算。
- **已部署**：当前服务进程从包含该主线提交/模块改动的源码构建并运行，且已核实监听地址、进程入口和服务响应。
- **待核实**：现有证据不足以判断模块归属、来源或状态。不要用此状态替代已确认的开发进度。

模块从“开发中”改为“已整合”或“已部署”时，必须记录相应的提交或运行进程证据。

## 已确认个人模块

| 模块 | 类型 | 状态 | 来源/版本 | 说明 |
| --- | --- | --- | --- | --- |
| [跨会话引用](./cross-session-references.md) | Pi Web 改动 | **开发中**：已在本机 `personal/customized` 候选工作树应用并暂存；`personal/main` 远端尚未包含，也未部署；上游化 issue [#1716](https://github.com/agegr/pi-web/issues/1716) 已发布（2026-11-17），待官方表态 | `feature/current-customizations`，`31510e6c48ca0647d417ea554869543fdf33f9b5` | 输入框 `#` 选择历史会话，并在发送时展开有边界的历史上下文 |
| [会话复制（文件路径/深链接）](./copy-session-deep-link.md) | fork 菜单 + 官方原生 | **开发中**：fork 菜单仅保留「复制会话文件路径」项（`copy-session-path`，`sidebar-actions.ts` 等，未提交未部署）；「复制会话链接」项已移除 | 官方 v0.17.0 原生（标题 `?session=` 链接、Session info 复制按钮）+ fork 兜底 | 复制会话文件路径供 Codex 等 agent 读取（无原生等价，保留）；深链接用官方原生（标题右键「复制链接地址」）；脚本 v0.2.1 曾 E2E 实测通过后弃用；决策依据见 [#1713](https://github.com/agegr/pi-web/issues/1713) / [#1714](https://github.com/agegr/pi-web/pull/1714) |

## 官方集成钩子清单（零源码差异的出口）

官方当前提供的可复用钩子（`docs/integrations.md`）：

- `pi-web:session-row-contextmenu` 浏览器事件（v0.17.0+）：会话行右键菜单可被下游整体接管；无“往内置菜单加一项”的接口。
- 服务端 session-liveness registry（`globalThis[Symbol.for("@agegr/pi-web/session-liveness/v1")]`）：pi 扩展可阻止会话被 idle 回收。

新功能先按“能做成 pi 扩展 → 有官方钩子 → 能上游化 → 才进 fork”的顺序判断；官方每版新增钩子时，对照本清单把已登记模块能迁移的迁移掉。



截至核实日期，尚未在 Pi Web 仓库或上述个人模块分支中确认由用户维护、计划整合的独立 pi 扩展。运行环境中发现全局安装的 `~/.pi/agent/extensions/claude-mem/`（包名 `@claude-mem/pi`），但现有资料不足以确认其是否属于本项目个人模块，故不纳入集成清单；若要纳入，需先核实来源、版本、维护者和使用范围。

## 添加或更新模块记录

每新增一个确认的个人模块，先按[个人开发与部署工作流](../personal-development-workflow.md)第 3 节的四级优先级（pi 扩展 → 官方钩子 → 上游化 → fork 兜底）判断落层，再新增对应的中文模块说明并从上表链接。更新状态时检查 Git 主线、个人分支和实际运行进程，不根据旧对话或预期状态推断。模块实施方法见[个人开发与部署工作流](../personal-development-workflow.md)；会话引用的实现契约见[会话主题说明](../agents/sessions.md)。

