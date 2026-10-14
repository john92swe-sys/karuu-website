# KARUU C 设计资源核验

核验日期：2026-10-13。原仓库元数据读取于 **03:56:18 UTC**；README、相关 SKILL、许可文件按下列提交固定读取，补充查询官方组件和截图文档。未安装全局技能、插件、CLI 或 hooks，未改应用源码或依赖。

工程读取起点为 `b7b2763600f855c8e14d9f5621cb2b53bdae006e`。`package-lock.json` 实际解析为 Next **15.5.27**、React/React DOM **18.3.1**、Tailwind **4.3.3**；`components.json` 已配置 RSC、TSX、new-york、CSS variables、Lucide 与 `@/components/ui`。该次初始读取时 AGENTS 中 Next 14 的描述已过时；随后 README/AGENTS 已由主代理纠正为 Next 15 与 Cloudflare 实际平台。此句只保留核验历史，本轮按实际锁文件判断，不因资源引入升级框架。

## 固定视觉依据

- [方案 C 原图](design-reference/C-approved-desktop-mobile-20261013.png)。已实际打开；桌面网页、手机网页应分别取区域比较，图外标题、边框、底部说明不进入页面。
- [用户纠偏指令全文](design-reference/C-visual-correction-instructions-20261013.md)。优先级为：**C 明确视觉及用户指令 > 已确认品牌与真实业务 > 工具的一般建议**。

主指导选 **Anthropic frontend-design**；impeccable 只提供审查方法；交互与浏览器继续复用现有 shadcn/Playwright。UI UX Pro Max 用于补充 token、文字重排与可访问性原则，不运行自动选风格流程。以下是已读取方法的项目应用规则，不表示工具命令已安装或执行。

## 原仓库版本、维护与许可

GitHub 官方 API 返回五仓库均 `archived=false`、`disabled=false`，近期有提交。下列 HEAD 是阅读锁定点，并不等于已安装 npm 版本，也不构成兼容性测试通过声明。

| 原资源 | 固定 HEAD / 提交时间 UTC | 实际许可 |
| --- | --- | --- |
| nextlevelbuilder/ui-ux-pro-max-skill | [7246805992a4](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/commit/7246805992a42b7bba37d4cac83b01416f0c6c44) / 2026-10-12 11:08:03 | MIT |
| anthropics/skills：frontend-design | [dbd4588f9e10](https://github.com/anthropics/skills/commit/dbd4588f9e1033efb41dad4bef2f7947c8993d44) / 2026-10-09 18:45:49 | 该目录 LICENSE.txt 为 Apache-2.0；不把整个混合许可仓库一概当成 Apache |
| pbakaus/impeccable | [245ad82def45](https://github.com/pbakaus/impeccable/commit/245ad82def45831dc56a21b683c7a1ff530b06cc) / 2026-10-12 17:12:50 | Apache-2.0，含 NOTICE.md |
| shadcn-ui/ui | [30a58d4498f2](https://github.com/shadcn-ui/ui/commit/30a58d4498f270af1c1e981a7d78a15cf5740841) / 2026-10-12 17:44:40 | MIT |
| microsoft/playwright | [a3401cfe0dcf](https://github.com/microsoft/playwright/commit/a3401cfe0dcf317101572d025fa46248d0779b42) / 2026-10-12 23:44:45 | Apache-2.0 |

元数据来自官方 `https://api.github.com/repos/<owner>/<repo>` 及 `/commits?per_page=1`；下列固定提交文件是文档与许可证据。所选开源部分可用于本项目；若以后复制分发上游文件，应保留对应许可及适用 NOTICE。本轮仅局部保存 frontend-design 的原文、该目录许可证及来源元数据，不引入付费产品。

### 1. UI UX Pro Max：辅助核对

已读 [README](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/7246805992a42b7bba37d4cac83b01416f0c6c44/README.md)、[SKILL.md](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/7246805992a42b7bba37d4cac83b01416f0c6c44/.claude/skills/ui-ux-pro-max/SKILL.md)、[MIT](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/7246805992a42b7bba37d4cac83b01416f0c6c44/LICENSE)。文档安装入口是 `ui-ux-pro-max-cli` 配合 `uipro init --ai codex`；旧包名 `uipro-cli` 已被文档标为过时。搜索脚本使用 Python 3 标准库，提供 React、Next.js、Tailwind、shadcn 指南，属于方法/数据而非应用运行时依赖。

本轮采纳语义 token、键盘焦点、触屏点击区域、长文本重排、图片留位等原则，供 `src/app/globals.css` 和首页组件整理。C 已定颜色、布局、圆角与密度，自动推荐的新风格不进入实施。

### 2. Anthropic frontend-design：唯一主指导

已读 [README](https://github.com/anthropics/skills/blob/dbd4588f9e1033efb41dad4bef2f7947c8993d44/README.md)、[该 SKILL](https://github.com/anthropics/skills/blob/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/frontend-design/SKILL.md)、[该目录 Apache-2.0](https://github.com/anthropics/skills/blob/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/frontend-design/LICENSE.txt)。README 提供 Claude marketplace / example-skills 安装途径，本项目采用直接阅读单一方法，无 Claude/框架运行时依赖。

采纳真实内容驱动主视觉、明确文字层级、紧凑 token、按 brief 回看截图的流程。当前 SKILL 明确要求固定视觉 brief 优先，足以支持 C，而非重新提案。应用目标为 `src/app/page.tsx` 及其首页展示组件；不用其一般反模板建议取消 C 的淡紫、圆角卡片、蓝色按钮或清晰无衬线标题。

已局部保存完整主指导：[SKILL.md](design-reference/vendor/frontend-design/SKILL.md)、[该目录 LICENSE.txt](design-reference/vendor/frontend-design/LICENSE.txt)、[SOURCE.json](design-reference/vendor/frontend-design/SOURCE.json)。文件原文与上述固定提交读取指纹一致；保留 LICENSE.txt 文件名以对应 SKILL 的许可引用。C 网页区裁切见 [desktop](design-reference/reference-desktop.png)、[mobile](design-reference/reference-mobile.png)及[裁切坐标/原图 SHA](design-reference/reference-crops.json)。

### 3. impeccable：审查方法

已读 [README](https://github.com/pbakaus/impeccable/blob/245ad82def45831dc56a21b683c7a1ff530b06cc/README.md)、[canonical SKILL.src.md](https://github.com/pbakaus/impeccable/blob/245ad82def45831dc56a21b683c7a1ff530b06cc/skill/SKILL.src.md)、[audit](https://github.com/pbakaus/impeccable/blob/245ad82def45831dc56a21b683c7a1ff530b06cc/skill/reference/audit.md)、[polish](https://github.com/pbakaus/impeccable/blob/245ad82def45831dc56a21b683c7a1ff530b06cc/skill/reference/polish.md)、[adapt](https://github.com/pbakaus/impeccable/blob/245ad82def45831dc56a21b683c7a1ff530b06cc/skill/reference/adapt.md)、[许可](https://github.com/pbakaus/impeccable/blob/245ad82def45831dc56a21b683c7a1ff530b06cc/LICENSE)与[NOTICE](https://github.com/pbakaus/impeccable/blob/245ad82def45831dc56a21b683c7a1ff530b06cc/NOTICE.md)。

当前为 **一个 skill、24 个命令**，入口是 `/impeccable audit`、`/impeccable polish`、`/impeccable adapt` 等；独立 `/audit` 需先 pin，不能编造 `/normalize`。文档 `npx impeccable install` 支持 project/global，但会引入 launcher、可能下载二进制和安装项目 hooks，本轮不运行。方法不绑定 React/Next 版本。

抽取对比度/焦点、图片比例与加载跳动、token 一致性、断图、文字溢出、触屏与尺寸重排检查。移动适配需要重新组织，不是缩放桌面。其通用卡片/字体/配色禁忌或默认暗色评分不改变 C；未运行 detector，也不把审查建议分数当验收。

### 4. shadcn/ui：复用现有交互

已读 [README](https://github.com/shadcn-ui/ui/blob/30a58d4498f270af1c1e981a7d78a15cf5740841/README.md)、[shadcn SKILL](https://github.com/shadcn-ui/ui/blob/30a58d4498f270af1c1e981a7d78a15cf5740841/skills/shadcn/SKILL.md)、[MIT](https://github.com/shadcn-ui/ui/blob/30a58d4498f270af1c1e981a7d78a15cf5740841/LICENSE.md)，以及官方 [Next 安装](https://ui.shadcn.com/docs/installation/next)、[Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4)、[React 版本说明](https://ui.shadcn.com/docs/react-19)、[Skills](https://ui.shadcn.com/docs/skills)。安装文档有 `init` / `add`，Skills 页另有项目级 skill 安装；均不必重复运行。

仓库已存在 Button、Input、Command、NavigationMenu、Tabs、Sheet、Dialog、Drawer 等组件。沿用 `src/components/ui/`、现有 Radix 与 Lucide，再以 C 的 token/variant 调整外观。官方 v4 新项目默认 React 19；这不能直接证明任意最新生成代码适配本项目 React 18。复用现有组件，按实际新增组合检查 ref 转发、Slot/触发器、焦点与 peer 依赖；不照抄 React 19 模板、不整体 init、不迁 Base UI 或框架。

### 5. Playwright：既有浏览器与视觉回归

已读 [README](https://github.com/microsoft/playwright/blob/a3401cfe0dcf317101572d025fa46248d0779b42/README.md)、[CLI SKILL](https://github.com/microsoft/playwright/blob/a3401cfe0dcf317101572d025fa46248d0779b42/packages/playwright-core/src/tools/skills/playwright-cli/SKILL.md)、[Apache-2.0](https://github.com/microsoft/playwright/blob/a3401cfe0dcf317101572d025fa46248d0779b42/LICENSE)，及官方[截图比较](https://playwright.dev/docs/test-snapshots)、[系统要求](https://playwright.dev/docs/intro)。文档提供 `npm init playwright@latest` / 浏览器安装；本轮复用已具备的库和浏览器，不执行新的脚手架或 CLI 安装。

现有 `scripts/qa-c-store.mjs` 通过 `PLAYWRIGHT_MODULE` 使用浏览器库。已核本机 bundled Playwright **1.62.1**、Node **24.19.0**，模块具有 `./test` 导出；项目自身未声明 `@playwright/test`。Playwright在应用外驱动浏览器，与 Next/React/Tailwind无运行时耦合。可复用已有截图/交互并按需采用同版本 Test 的 `toHaveScreenshot()`，此核验没有创建快照或执行测试。

## 对 C 的固定应用与验收规则

1. 首屏为明亮湖水/海湾、远山、自然光的完整横向场景，右侧人物与杯壶，左侧真实标题和两个按钮。弃用粉衣局部、拱形与悬浮书封拼贴。主视觉高度、下方内容可见比例按 C 网页区域核对。
2. 实体浅薄荷与数字淡紫分区紧接首屏；实体保留两张大图片入口，数字保留两本重点真封面及 Books & audio。蓝色实心主按钮、浅色次按钮、柔和圆角和紧凑栏目关系为固定要求。
3. 手机顺序为导航、主视觉、实体、数字、分类/书籍、音乐/游戏、KRU、页脚；独立考虑场景裁切、人物脸部、文字与可点击面积，不用统一缩放或隐藏核心入口。
4. 真产品与出版封面不改造成概念款；氛围图说明用途，游戏概念图不得冒充实机。标题/按钮/导航保持 DOM 元素；播放或试玩入口必须对应真实可用内容。
5. 工具的反紫、反圆角、反卡片、自动字体/模板/风格推荐不能覆盖以上规则。明确 C token，沿用业务数据、会员/支付/KRU边界和品牌隔离。
6. 实际测 **1440×1000、1920×1080、390×844、430×932**，另测 360px 宽。回读 `innerWidth/innerHeight` 与滚动宽度；请求了 mobile 但没生效不能算通过。触屏交互与视觉尺寸分别留证，模拟设备不称真机。
7. 桌面和手机分别保存首屏、整页与 C 对应区域并排图。先人工确认结构、构图、色块、图片占比与密度，再建立新实现的回归基线；不把旧不合格页面自动录作通过基线。截图环境/浏览器/字体保持一致，图片加载完成；回归差异仍需视觉判断。
8. 功能与视觉结果分开记录：搜索、菜单、分类、外链、真实媒体、询盘记录/回执各有实际证据；构建、部署、截图数量不替代视觉达标。真实订单、发信、支付、交付或 KRU 未测就保持待配置/未验证。

上述固定规则来自用户本轮纠偏和已打开的 C 原图；第三方方法仅补充实施与检查，不带来额外设计方向、安装、账户或发布授权。
