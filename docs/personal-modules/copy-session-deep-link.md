# 会话复制功能（决策与实现记录）

本模块曾有两个目标：复制会话**文件路径**（供 Codex 等外部 Agent 读取会话内容）与复制会话**深链接**。最终取舍：**深链接用官方原生能力，fork 只保留"复制会话文件路径"一项**。

## 最终结论

- **复制会话深链接：移除**（不在 fork 菜单实现，也不做用户脚本）。官方原生已覆盖，且官方明确不接受行菜单加复制项。
- **复制会话文件路径：保留**（fork 菜单项 `copy-session-path`）。无官方原生等价物，是 S491 目标（把 Pi Agent 对话快速交给 Codex 等 Coding Agent 读取）。

## 官方原生用法（替代深链接项）

- **侧边栏会话标题就是真实链接**：`<a href="?session=<id>">`，浏览器右键 →「复制链接地址」即得完整深链接。已在本机 30141 服务上用无头 Chrome 实测确认（会话标题均为 `?session=` 链接）。
- **Session info 面板**：顶栏 Session info 里有复制按钮，可复制会话 ID（同时显示文件路径、项目目录、分支）。

## 决策依据

- 官方答复（2026-11-17，[#1713](https://github.com/agegr/pi-web/issues/1713) 关闭、[#1714](https://github.com/agegr/pi-web/pull/1714) 关闭）：会话 ID 已可从 Session info 复制；侧边栏标题已是真实 `?session=<id>` 链接，浏览器「复制链接地址」即得深链接；官方刻意保持行菜单简短（同类决定 #1558），**不在行菜单加复制项**。
- 用户决定（2026-11-17）：深链接项"确实没必要"，去掉并同步文档。

## 演进历史

1. **用户脚本 v0.2.1**（浏览器 Hook 注入，复制文件路径 + 深链接）：曾在 30141 服务（0.17.0）上用系统 Chrome E2E 验证通过（9 项检查全 PASS）；随后按"更规整"目标转向 fork 原生菜单实现，脚本弃用。
2. **fork 原生菜单**：`lib/sidebar-actions.ts` 新增 `copy-session-path` / `copy-session-link` 两个菜单项（`components/SessionSidebar.tsx` 标签与图标、`components/SidebarIcons.tsx` 的 `CopyIcon`）。
3. **本轮收口**：按用户决定与官方答复，`copy-session-link` 项已从 `sidebar-actions.ts` 与 `SessionSidebar.tsx` 移除；保留 `copy-session-path`。

## 当前实现状态

- fork 菜单仅剩「复制会话文件路径」项（`copy-session-path`），位于普通/置顶/归档会话菜单；类型检查通过。
- **开发中**：菜单项分发逻辑与 i18n（`sidebar.copySessionPath`）已完成，并作为本地提交 `fddc7f3` 落在 `personal/customized`；未部署。
