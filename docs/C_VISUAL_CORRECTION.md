# KARUU C 纠偏：真实视觉对照与交付记录

日期：2026-10-13。本轮依据用户纠偏指令与 C 的桌面/手机网页区域，对当前官网首页展示层进行修正；业务能力、版次、品牌隔离和 KRU 开关分别记录，不用视觉替代功能验收。

> **迭代状态：compact 新版本已发布到独立 review Worker，线上五视口截图已验证；正式站保持原版本。** 四张 C/前后对照继续使用 `work/c-visual-worker-compact/` 的真实本地截图，线上证据独立保存在 `work/c-visual-remote/`；不将本地对照冒称线上对照。第一轮图与记录保留在 `work/c-visual-comparison/iteration-1/`。当前结果展示实际结构和差异，不宣称逐像素还原或商用端到端全部通过。


## 截图版本与验证范围

| 证据 | 实际范围 |
| --- | --- |
| Before | 旧 runtime `649dc7968b75d9980c9fd429d0d63812384c7ebd`，截图记录时间 `04:43:42.679 UTC`；这是纠偏前页面，不是新视觉基线 |
| After（本地） | 正式 OpenNext 构建的本地 workerd `http://localhost:3097`，截图时间 `06:38:32.091 UTC`，Edge `155.0.4283.45` headless；不含 Next dev 的 N 指示器。截图报告的 HEAD 为 `e78f9d794fe76668a3f425e30ecde4303ca840b2`，`builtSource` 明确写为该提交加手机 CSS 修正，采集时 `src/app/home-c.css` 尚未提交；不能把该 HEAD 单独称为最终构建提交 |
| After（线上独立 review） | 实际远程 URL 下 Edge 截图，时间 `07:03:30.574 UTC`；源码 `72634a8fa6064e1e7e0f4a7d104e1a3691b11b1a`，Worker 版本 `10b5ed26-6f51-4082-bf2b-a26e8cd3e936`。该次报告的 workingTree 仅有文档修改；不替换本地截图身份及时间 |
| C 参考 | 已裁纯网页的 `reference-desktop.png`（1105×1002）、`reference-mobile.png`（337×1002）；不含图外中文标题、外框、底说明。原图 SHA 与坐标保存在 `docs/design-reference/reference-crops.json` |

本地 After 脚本实际记录了五个规定 CSS 视口，分别为 **1440×1000、1920×1080、390×844、430×932、360×844**。每次回读 viewport/窗口宽高，文档与 body 滚动宽度等于该视口宽度，五项记录均 passed，脚本 pageerror 列表为空。桌面9个、手机8个实际渲染的内容图片条目均 complete 且 naturalWidth>0。手机重复 audio 插图记录 `rendered:false`、零尺寸和未请求状态，属于隐藏元素，不当作断图。来源是[compact 本地视觉报告](../work/c-visual-worker-compact/visual-browser-verification.json)，本对照任务没有重复执行五视口测试。模拟 CSS 视口不称为实机手机测试，pageerror 为空不等于所有控制台或网络请求均正常。

本子任务新增的浏览器操作只有 1440×1000 与 390×844 两次只读页脚 boundingBox。实际页高与 After 截图证据相符；未修改、停止或重启父任务持有的 workerd。

| 当前 after CSS 视口 | 文档全高 | hero 高 | 实体区高 | 数字区高 |
| --- | ---: | ---: | ---: | ---: |
| 1440×1000 | 1600px | 390px | 407.6875px | 407.6875px |
| 1920×1080 | 1612px | 390px | 419.6875px | 419.6875px |
| 390×844 | 2039px | 240px | 212px | 248px |
| 430×932 | 2039px | 240px | 212px | 248px |
| 360×844 | 2047px | 240px | 212px | 237px |

全高含公司页脚，对照裁图按另行实测的 footer 起点排除页脚。五个视口的原始首屏/全页截图保留于 `work/c-visual-worker-compact/`。


## 独立 review 线上截图与本地截图

[独立 review 页面](https://karuu-c-review-20261013.john92swe.workers.dev) 已由真实线上 Edge 正常请求；未修改 UA 或保护策略。线上报告记录五个指定 CSS 视口均 passed，页面与 body 宽度均未越出视口，pageerror 为0；实际显示的内容图片均加载，手机隐藏 audio 图片按 `rendered:false` 排除。完整记录见[线上视觉报告](../work/c-visual-remote/visual-browser-verification.json)。本次新增五视口浏览器证据独立记录，保留前轮 HTTP 403 的原报告，不把它改写为成功，也不据此宣称 API 或账户/支付/交付端到端通过。

| CSS 视口 | 本地首屏 / 全页 | 线上 review 首屏 / 全页 |
| --- | --- | --- |
| 1440×1000 | [首屏](../work/c-visual-worker-compact/home-1440x1000-first.png) / [全页](../work/c-visual-worker-compact/home-1440x1000-full.png) | [首屏](../work/c-visual-remote/home-1440x1000-first.png) / [全页](../work/c-visual-remote/home-1440x1000-full.png) |
| 1920×1080 | [首屏](../work/c-visual-worker-compact/home-1920x1080-first.png) / [全页](../work/c-visual-worker-compact/home-1920x1080-full.png) | [首屏](../work/c-visual-remote/home-1920x1080-first.png) / [全页](../work/c-visual-remote/home-1920x1080-full.png) |
| 390×844 | [首屏](../work/c-visual-worker-compact/home-390x844-first.png) / [全页](../work/c-visual-worker-compact/home-390x844-full.png) | [首屏](../work/c-visual-remote/home-390x844-first.png) / [全页](../work/c-visual-remote/home-390x844-full.png) |
| 430×932 | [首屏](../work/c-visual-worker-compact/home-430x932-first.png) / [全页](../work/c-visual-worker-compact/home-430x932-full.png) | [首屏](../work/c-visual-remote/home-430x932-first.png) / [全页](../work/c-visual-remote/home-430x932-full.png) |
| 360×844 | [首屏](../work/c-visual-worker-compact/home-360x844-first.png) / [全页](../work/c-visual-worker-compact/home-360x844-full.png) | [首屏](../work/c-visual-remote/home-360x844-first.png) / [全页](../work/c-visual-remote/home-360x844-full.png) |

线上1440及390全页图已另行目视核对，呈现 compact 新版湖山首屏、真实封面、手机紧凑双分区及未启用 KRU 信息条。内置浏览器 reload 后的独立桌面截图保存在交付目录 `after-online/in-app-desktop.jpg`，亦已目视查看；该截图不冒称五个规定视口之一。

## 可以直接看的本地对照图

各图均为 **左侧参考/修改前，右侧当前实现**。没有给任何图计算“还原度百分比”或自动通过评分。

| 对照 | 文件与方法 |
| --- | --- |
| C 桌面 vs 当前 main | [compare-c-desktop.png](../work/c-visual-comparison/compare-c-desktop.png)。当前 1440px 全页图取 `(0,0,1440,1244)`，两侧保持比例归一到1105px宽 |
| C 手机 vs 当前 main | [compare-c-mobile.png](../work/c-visual-comparison/compare-c-mobile.png)。当前390px全页图取 `(0,0,390,1322)`，两侧保持比例归一到337px宽 |
| 桌面修改前/后 | [before-after-desktop.png](../work/c-visual-comparison/before-after-desktop.png)。两张原始1440×1000首屏直接并排，不裁切、不缩放 |
| 手机修改前/后 | [before-after-mobile.png](../work/c-visual-comparison/before-after-mobile.png)。两张原始390×844首屏直接并排，不裁切、不缩放 |

页脚实际起点分别为 **y=1244.578125** 和 **y=1322.65625**，取向下整数作为排除页脚的裁切下界。C 概念网页结束于 KRU，参考对照也统一到导航→KRU；真实公司的页脚没有从网站删去，完整原始截图仍保留。24px白色列间距及较短图片下方白色区域属于对照画布，不能当成网站额外空白。

Pillow仅进行所声明的截图裁切、等比例Lanczos缩放与并排排版，不改色、不重绘、不换图、不涂抹内容；原始图均保持。四张对照均已用 `view_image` 实际查看，来源顺序与区域正确。精确源文件 SHA、截图尺寸、裁切坐标、归一宽度、输出SHA与目视记录见[comparison-evidence.json](../work/c-visual-comparison/comparison-evidence.json)和[footer-boundaries.json](../work/c-visual-comparison/footer-boundaries.json)。

## 与 C 概念图的有依据差异

1. **完整场景及人物姿态。** 当前首屏已从粉色衣服局部、拱形及悬浮书封拼贴改为整幅明亮湖山场景，保持左文右人、两个入口、蓝色实心与浅色次按钮。新场景为标注的 AI 品牌氛围图，人物姿态、山形和光线不是原概念照片的逐像素复制，也不冒充真实户外拍摄或准确在售绿色服装。
2. **真实运动服是粉色。** 实体运动服卡使用原官网获准目录 `KR01-0004/02-light-pink-lifestyle.webp`，而非 C 示意的绿色服装。保留真实产品身份与足够大的图片，不能为颜色更像参考而换成未确认在售款。实拍与原文件未被本对照任务裁切或改色。
3. **两本出版封面保持真实。** 当前使用两书真实原出版封面的 WebP 编码副本，书名、作者、画面和边界未改成 C 的概念书封。书籍入口依实际版本指向 Google/Kindle/详情等路径，未把两书都冒称已有同一平台版本或本站音频组合已交付。封面编码证据单独见[素材说明](C_VISUAL_ASSET_EVIDENCE.md)。
4. **JKJ 杯壶仍是说明性插画。** 没有找到可作为 JKJ-Plus 已批准准确产品图的实拍资料；首页用 AI 协作概念图，并在画面标注 `Collaboration illustration`。它支持合作询盘，不代表具体型号已供货，也没有重新公开受旧 Hydration 安全门禁限制的供应商图片。
5. **音乐与游戏保留真实内容边界。** 音乐景观为说明性插画，实际音乐入口对应现有官方内容。游戏卡使用 *Nordic Rush: Aurora Relay* v0.1.0 的真实蓝色实机场景与中文 HUD，标注原型/开发中；它不是 C 示意的山地猫图，也不表示试玩、充值或商品已经开放。
6. **手机密度已重新收紧，剩余高度差如实保留。** 手机 hero 现为240px高，实体图区域为132px高。上方紫色重点区只保留两张可点击真实书封；重复书名、CTA、平台链接与 audio 横条已隐藏。真实书名、详情按钮及已有平台链接保留在下方 Explore 列表，音频由44px高的 `Books & audio` 分类操作及现有目录进入，桌面仍保留两本书加 audio 卡。目视对照可见导航→湖山→实体双图→两封面→分类/小书条→音乐游戏→KRU 的顺序已接近 C，紫色重点区与下方作品区连续呈现。此次390px的 footer 起点为1322.65625px，较首轮1625.65625px收紧303px；裁1322px并按337px宽归一后为1142px，概念裁图为1002px高。剩余140px的归一高度差可在实际分类操作区、真实书名/平台以及音乐/游戏说明和未启用 KRU 说明中看到。没有纵向拉伸或把文字缩到概念图小字来制造等高，完整公司页脚仍在对照裁区之外。
7. **KRU 是未启用的信息条。** 保留 C 的轻量 KRU / Member benefits 布局，实际显示 `Programme information. Rewards are not active.` 并链接会员说明。没有币价、礼金、注册赠礼、充值或开通动作；`commerce.status().kru.enabled` 与服务端资格/执行门未因本轮视觉更改。参考中的“eligible markets rewards”不是当前已兑现的承诺。原交接中国业务隔离规则继续适用，视觉保留不等于开通能力。

## 功能、素材与资源的独立证据

- [C_CORRECTION_FUNCTIONAL_QA.md](C_CORRECTION_FUNCTIONAL_QA.md)：远程只读的20页面、4组交互与5个匿名API，以及本地路由、菜单、搜索、分类、外链和账户/询盘未配置结果；127与localhost Origin的不同结果分别记录。远程没有提交询盘、付款或账户表单，不能把本地报错提示当作成功入库。
- [C_VISUAL_ASSET_EVIDENCE.md](C_VISUAL_ASSET_EVIDENCE.md)：原素材身份、封面编码，以及独立PGlite真实SQL/持久化和通知fixture回执。该回执不是远程数据库或客户真实收件证明。
- [C_DESIGN_RESOURCES.md](C_DESIGN_RESOURCES.md)：五组官方原仓库版本与许可；唯一主指导为已局部保存的 Anthropic frontend-design，impeccable只作审查方法，复用已有shadcn/Playwright，没有为美化重启系统。

## 本地最终回归与构建

compact 截图逐项目视核对 C 后，仅更新三组手机的首屏/整页基线；桌面四张基线未变。随后不带 `--update-snapshots` 运行 `npm run test:visual`，五个视口、十张截图回归通过（`work/c-visual-regression.json`）。这验证当前实现的稳定性，不是与概念图的自动相似度评分。隐藏的手机 audio 插图按真实零尺寸排除加载断言；八张实际显示的手机内容图均加载。

最终 OpenNext 构建完成；Wrangler dry-run 读取523个资产，上传体积6830.12KiB、gzip1323.49KiB，所有商用开关仍false。28项业务/目录测试、TypeScript和lint记录见工作目录；正式 workerd 的20路由/6宽度、5原流程与13组补测另见功能报告。数据库缺失和品牌路由缺失的503按未配置结果记录，不称询盘已成功保存。

手机第一本书的 Google 平台入口经真实详情页可达；第二本书下方直接显示 Kindle。没有为了概念图对称而伪造第一本书的 Kindle 版。发布范围为独立 review；正式站原生产版本的实际读回见下节。

## 发布状态：独立 review 新版已发布，正式站原版本未变

| 记录 | 当前可确认事实 |
| --- | --- |
| 首轮视觉源码 | `e78f9d794fe76668a3f425e30ecde4303ca840b2`；本轮 compact 原始截图在此 HEAD 加手机 CSS 修正的构建上采集，保留原报告，不事后改写采集身份 |
| 最终 compact runtime 源码 | `72634a8fa6064e1e7e0f4a7d104e1a3691b11b1a`，tree `0436d9fbfd5f536343af4c18f0d0af8ed16d6b72`；本地 Git 已只读回读确认该提交与 tree，主代理已确认提交到远程 |
| 测试源码对应关系 | 主代理记录本地 tested `7d506f0` 与上述最终远程 runtime 的 tree 一致；截图的原始 HEAD、时间及未提交状态继续按采集时报告单独记载 |
| 新独立 review Worker | 版本 `10b5ed26-6f51-4082-bf2b-a26e8cd3e936`，部署 `f90a64e1-bd60-4476-b5be-86207341e345`，该 review 的100%流量；版本创建时间 `2026-10-13T06:59:16.424931Z`，部署创建时间 `2026-10-13T06:59:19.056222Z`。官方 CLI/API JSON 已读回 |
| 正式站 | `karuu-production` 仍为部署 `8b611224-1961-40d1-9726-b6cda2e4fe74` → 版本 `5abbde92-a504-4a86-9d6a-34d0689a2b88`，100%生产流量，创建时间 `2026-09-17T20:42:35.821555Z`。本次未更新正式站 |

官方读回来源分别为 [review 部署清单](../work/c-correction-review-deployments.json)、[review 版本资料](../work/c-correction-review-version.json) 与 [生产部署清单](../work/c-correction-production-deployments.json)。此前独立 review 的 `acc84001-1b28-4a91-8e64-6f70f39e3593` 对应旧 `649dc7968b75d9980c9fd429d0d63812384c7ebd` runtime；本次新视觉的发布证据为上表新版本与线上报告。四张本地合成图及 comparison JSON 保留生成时的原始来源、时间与待发布备注，当前发布状态由本节独立记载。后续文档单独提交不会更改此处固定的 runtime 源码身份。

## 恢复位置：仅记录候选，未执行回滚

| 候选 | 身份及适用范围 |
| --- | --- |
| 视觉纠偏前源码恢复分支 | `codex/karuu-c-before-visual-correction-20261013` → `b7b2763600f855c8e14d9f5621cb2b53bdae006e`；本地 `refs/heads` 已只读核对，作为源码恢复位置 |
| 前轮独立 review Worker 版本 | `acc84001-1b28-4a91-8e64-6f70f39e3593`；仅为独立 `karuu-c-review-20261013` 的回滚候选，不是正式 `karuu-production` 的回滚版本 |

本对照子任务仅编辑文档，没有登录、部署、改写 runtime 或执行源码/Worker 回滚；未操作正式站回滚。

数据库、真实支付、邮件、私有文件交付、游戏服务和 KRU 仍按已知配置状态分别记录。新截图、构建通过和预览可打开不能替代真实商用端到端验证；本对照任务没有改应用、测试或视觉基线。
