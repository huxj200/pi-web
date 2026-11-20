# Pi Web 个人开发与部署工作流

本手册管理个人 Fork 上的 Pi Web 定制代码和本机定制服务。官方项目发布仍以 [`docs/release.md`](release.md) 为准；项目检查和扩展边界仍以 [`AGENTS.md`](../AGENTS.md)、[`CONTRIBUTING.md`](../CONTRIBUTING.md) 及 CI 为准。

## 分支职责

- `upstream/main`：GitHub 官方 `agegr/pi-web` 的源码基线，是定制版必须跟随的主线。
- `origin/main`：个人 Fork 的官方镜像分支，只用于与官方主线对齐。
- `origin/personal/main`：个人定制版集成分支，承载已选择的个人功能。
- `feature/*`：单项个人功能分支；新功能从当前个人集成基线创建，保持每项功能的提交和文件差异可辨认。

`main` 与 `personal/main` 的职责不能混用。若远端分支当前相同，也要按职责分别比较；不要把个人功能推入官方镜像分支。个人 Fork 的推送、PR 和公开发布需要单独授权。

## 1. 核对官方源码、npm 与实际服务

先记录工作区和分支状态，再刷新远端跟踪信息：

```bash
git status --short --branch
git branch -avv
git fetch upstream --tags
git fetch origin --tags
git log --graph --oneline --decorate --all -40
```

对官方主线、个人镜像、个人集成线和每个待整合功能分别记录 HEAD、领先/落后提交数及文件差异：

```bash
git rev-parse upstream/main origin/main origin/personal/main
git rev-list --left-right --count upstream/main...origin/main
git rev-list --left-right --count upstream/main...origin/personal/main
git log --left-right --cherry-pick --oneline upstream/main...origin/personal/main
git diff --stat upstream/main...feature/<name>
git diff --name-status upstream/main...feature/<name>
```

对照 npm 发布元数据和包的 Git 来源：

```bash
npm view @agegr/pi-web@latest version gitHead dist.tarball
node -p "require('./package.json').version"
node -p "require('./node_modules/@agegr/pi-web/package.json').version"
npm ls @agegr/pi-web --depth=0
```

最后核实消费方 `package.json` 的版本范围、锁文件解析版本、实际安装目录、LaunchAgent/进程入口、监听地址和服务版本接口。`/api/app-update` 的当前版本来自构建包的 `package.json`，不标识源码 commit；定制部署还要核实 Git HEAD 和实际进程入口。npm `latest`、源码基线、锁文件、安装包和运行进程是不同事实，分别记录；`^` 版本范围不会让已锁定的旧包自动升级。npm 发布的 `gitHead` 可用于核对该包来自哪个源码提交；它不代表本机实际运行了该版本。

## 2. 同步官方主线并整合个人功能

同步前先给出当前分支图、提交和文件差异、各分支用途、预期操作、潜在冲突、验证范围与回退方法。`fetch` 只刷新远端跟踪信息，不等于获准合并、变基、推送或切换服务。

将 `upstream/main` 快进到本地官方镜像 `main`，并保持个人 Fork 的 `origin/main` 与其对齐。整合个人功能时，以最新官方提交为新集成分支起点，逐项加入已确认的 `feature/*` 改动；保留原功能分支及其来源提交，不重写已推送的历史。每个定制改动应能通过提交或清楚的差异定位到原功能。

实际整合前，在隔离工作树中检查合并结果，不在有用户未提交改动的工作树中操作。整合冲突、对行为有实质影响的官方变更、未识别的用户文件、需要丢弃内容或历史改写时，停止并报告：冲突文件和代码、官方与个人两侧的行为、可能影响、可选解决路径及各自代价。等待用户选择后再继续。无冲突且符合预期的常规整合可按授权继续。

## 3. 判断模块应放在哪一层

目标：让个人模块尽量少进入 fork 差异，最终与官方版本合并时冲突最小。开始开发前查项目架构和 [`CONTRIBUTING.md`](../CONTRIBUTING.md)，按以下四级优先级逐级判断：**能上一级就不落到下一级**。

### 第 1 级：pi 扩展（零差异，首选）

新工具、命令、Provider、调度或其他 pi 能力，若可通过 pi CLI 扩展 API 完成，一律做扩展（`~/.pi/agent/extensions/` 或项目 `.pi/extensions/`，自动发现、`/reload` 热重载），并确认其在 pi CLI 与 Pi Web 中行为一致。Pi Web 完整渲染扩展的 `ctx.ui` UI。扩展文档见本地 `node_modules/@earendil-works/pi-coding-agent/docs/extensions.md` 与官方仓库 `examples/extensions/`。

### 第 2 级：官方集成钩子（零差异）

需要改变 Pi Web 界面的功能，先查官方当前提供的钩子：`docs/integrations.md`，最新清单同步维护在 [`docs/personal-modules/README.md`](./personal-modules/README.md) 的“官方集成钩子清单”节。有对应钩子就用钩子（下游脚本或嵌入应用注入），不修改源码。官方每版新增钩子时，对照清单把已登记模块能迁移的迁移掉。

### 第 3 级：上游化（差异归零的唯一路径）

确实需要改变 Pi Web 界面、路由、存储或服务流程且无官方钩子的功能：按 CONTRIBUTING **先开官方 issue** 描述用例，官方表态后再整理 PR。官方接受则功能随官方版本发布，本地删除对应改动，fork 差异归零；被拒也不白干（官方会指出可收部分，往往以后以更窄的形式收进去）。对外发布 issue/PR 需要单独授权。

### 第 4 级：fork 定制（兜底，最小化）

官方拒绝、久无回应或功能过于个人化时，才修改 Pi Web 源码：新功能从当前个人集成基线创建 `feature/*` 分支，保持新模块隔离（独立文件 + 最小侵入点），并登记到 `docs/personal-modules/`。每次同步官方前，先对照钩子清单检查是否有可迁移项；整合冲突时按第 2 节流程处理。

### 决策清单（每个新模块按顺序过一遍）

1. 是会话内能力（工具/命令/Provider/调度/交互 UI）？→ 做**第 1 级 pi 扩展**。
2. 是 Pi Web 界面功能？查官方钩子清单 → 有对应钩子 → **第 2 级**。
3. 无钩子？→ 按 CONTRIBUTING **先开官方 issue** → 官方接受 → **第 3 级 PR 上游化**。
4. 官方拒绝或久无回应？→ **第 4 级 fork 兜底**，保持最小侵入并登记。

### 既有约束（保持原样）

- 不要为个人功能扩展 Pi Web 专属的 pi 扩展 API（官方明确拒绝，PR 会被拒）。
- 归属不清、需要私有 pi 内部 API 或会增加新子系统时，先研究现有实现和约定，再确定边界；不要把临时个人功能伪装成官方功能。

## 4. 验证与本地部署

使用项目配置的 TypeScript、`npm test` 和 `npm run lint`。UI 或交互变化还要在浏览器实际检查本次涉及的关键流程；CI 的构建成功不代替界面检查。需要运行生产构建时，遵守 [`AGENTS.md`](../AGENTS.md) 的 `.next/` 规则：开发服务器运行期间不得在同一工作树执行 `next build`。

定制版使用独立、可识别的部署工作树和构建目录，避免与开发工作树或 npm 安装目录共用 `.next/`。构建前核对该工作树 HEAD 等于记录的官方基线加已整合个人功能；部署记录包括基线 commit、个人 feature commit、源码版本、构建时间、启动路径和端口。

切换服务前：

1. 保存当前 npm LaunchAgent 配置、安装版本、包路径和日志位置；保持 npm 包及其依赖不变，作为回退版本。
2. 在隔离工作树完成依赖核对、构建、适用检查和本地健康检查。
3. 记录预期的新入口、工作目录、环境变量和端口；检查端口占用，避免两个服务竞争。
4. 经核验后再切换服务管理配置。启动后检查 HTTP/API 响应、服务自报版本、进程命令行及真实工作目录。
5. 任一检查失败，恢复已保存的 npm 启动配置并重新验证端口由原 npm 服务监听。

部署新定制版本时保留上一份可运行的构建和启动配置，直到新服务验证完成。回退应只切回已记录的启动配置和构建，不重装或改写 npm 锁文件。只有用户另行授权时才升级 npm 版、推送 Fork、创建 PR 或发布包。

## 5. 交付和恢复记录

个人模块的当前状态和逐模块说明以[个人模块索引](personal-modules/README.md)为准。每轮同步、功能整合或部署在 `.scratch/<任务>/handoff.md` 记录：官方远端及基线 commit、核验时 npm 版本与 `gitHead`、分支关系、整合的个人 commit、冲突决定、修改路径、检查和浏览器验证、服务启动路径/版本/端口、npm 回退配置和未完成事项。把实现事实、推断和未验证内容分开写；服务运行状态变化后更新记录。

最终提交仍遵循项目共享收尾规则：只有明确要求“收尾并提交本轮工作”后，才通过共享 round-closeout 创建本地提交；该授权不包含推送。
