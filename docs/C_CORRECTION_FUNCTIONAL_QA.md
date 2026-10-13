# C 视觉纠偏后的本地功能回归

## 最新：正式 OpenNext / workerd 回归

2026-10-13 `06:41–06:46 UTC`，对已经运行的正式 OpenNext 本地 workerd **`http://localhost:3097`** 执行实际 headless Edge **155.0.4283.45** / bundled Playwright 回归。未启动构建、改应用、停服务、部署或commit。源码HEAD为 **`e78f9d794fe76668a3f425e30ecde4303ca840b2`**，并有未提交 `home-c.css`、视觉QA脚本、说明及360/390/430基线更新；报告保留真实dirty清单，不把它称为clean提交原样。补测的六份首页/导航/作品文件前后SHA相同，同时记录浏览器实际取得的两份CSS URL/字节/SHA，限定本次所测运行产物。

既有 `scripts/qa-c-store.mjs` 在3097实跑：**20路由 / 6既有宽度 / 5流程通过，pageerror=0**。另在实际 **360×844、390×844**、`isMobile=true`、`hasTouch=true` 的两个浏览器上下文执行 **13组补测全部通过**：

| 本次 workerd 验证 | 实际结果 |
| --- | --- |
| 手机菜单 | tap打开、关闭按钮、Escape、新路由链接及同一路由再次点击均关闭菜单；同路由不依赖pathname变化 |
| 四类内容tabs | 两个手机尺寸实际tap Books / Books & audio / Music / Games，内容与aria-selected对应；ArrowRight/ArrowLeft循环、Home/End和焦点通过 |
| GET搜索 | 桌面导航真实表单与两手机菜单进入搜索页后提交，实际跳 `/search?q=low+tide` 并找到真书 |
| 两业务与素材 | 运动服卡指向 `/products`，JKJ卡指向独立 `/physical/jkj-plus`；两书实际加载WebP，natural尺寸992×1586与1009×1559，complete=true |
| 媒体入口 | 音乐图准确指向 `https://www.youtube.com/watch?v=i6mns_U5nxE` 且安全新标签；游戏指向真实Nordic原型详情。只核本站实际href，未把它称为本轮远程音频播放/试玩验收 |
| 账户/交易/会员 | 两手机登录与注册提交禁用、空袋无付款按钮、会员不承诺礼金/可兑换点数、匿名后台为明确门禁；订单/书库/后台API各401 |
| 服务状态 | status200，但database/accounts/payments/privateMedia/inquiries/KRU均关闭；SKU接口200 `items=[]`，没有可付款商品 |
| 双品牌失败路径 | 390真实提交KARUU→503 `database_not_configured`（缺Worker数据库绑定），JKJ→503 `brand_routing_not_configured`；均显示错误、保留表单与重试按钮，不显示回执 |

这些503证明当前缺配置情况下准确失败，**不是线上入库/发信成功**。表单测试前再次检查database/inquiries=false，使用 `workerd-c-qa@example.test`；没有真实客户通知、订单、扣款或KRU。没有重跑PGlite持久化fixture，也没有用假网络成功响应替代workerd。

本轮独立证据：

- `work/c-workerd-final-functional/existing-harness/browser-verification.json`及6个首页/5个路由截图。
- `work/c-workerd-final-functional/touch-and-gates/touch-and-gates.json`：13组结果、前后dirty与文件SHA、实际视口、CSS与媒体目标、服务状态及两品牌503响应。
- 同目录的两手机tabs/搜索、桌面GET搜索、匿名后台、两品牌失败截图；复核脚本 `work/c-workerd-final-functional/touch-and-gates.mjs`。

这是本地正式Workers适配运行验证，区别于下面旧Next dev3095证据。外部数据库、邮件、支付供应商、私有交付、游戏/KRU仍未配置/未完成，远程审查或生产也不由本地通过推断。规定尺寸的C视觉对照与最终CSS基线由独立视觉QA记录；本次功能结果不能替代设计验收或实体手机测试。

## 此前：Next dev 3095 回归与限制

执行日期：2026-10-13，主要浏览器回归起始 `04:09:37 UTC`，补测 `04:12–04:14 UTC`。对象为 `b7b2763600f855c8e14d9f5621cb2b53bdae006e` 基础上的**未提交视觉改动**：首页 `hc-*`、新 HomeExplore tabs、导航真实搜索表单及五张 lifestyle 图。它不是该提交原样的不可变构建，也不是远程部署验收。功能补测记录了相关源码 SHA-256，执行期间五份首页/导航文件的前后哈希相同。

复用已运行的本地 Next dev `http://127.0.0.1:3095`，未停止/重启服务。使用 bundled Playwright 模块 `C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright` 与 headless Edge **155.0.4283.45**，没有安装工具/依赖。所有截图/JSON新存 `work/c-correction-regression/`，没有覆盖前次 QA 证据。

## 已验证

既有 `scripts/qa-c-store.mjs` 实跑通过：六个宽度 **320 / 360 / 390 / 768 / 1280 / 1440**（高度960），20个路由返回200并有页面主标题；页面/文档滚动宽度未超出相应视口。手机路由检查实际宽度390，记录为390而非未生效的设备覆盖。所有流程 `pageerror` 为0；这不表示所有网络请求都为200。

20个路由：`/physical`、`/physical/jkj-plus`、`/products`、`/products/kr01-0001`、`/oem-odm`、`/manufacturing`、`/quality-certifications`、`/sustainability`、`/about`、`/contact`、`/creations`、两本原书详情、`/account`、`/bag`、`/member-benefits`、`/admin`、`/search?q=low+tide`、`/privacy`、`/terms`。

| 功能 | 实际结果 |
| --- | --- |
| 手机导航 | 两业务入口存在，Escape关闭；额外实际点击 Digital creations 后跳目录，菜单自动关闭 |
| 公司搜索 | `low tide`找到真书；新增导航 GET 搜索表单输入并Enter，实际跳 `/search?q=low+tide` 并显示同书 |
| 目录筛选/空态 | Music显示 Kitchen Floor Gravity且不含 Last Room；无匹配输入显示正确空态 |
| 首页新分类 | Books、Books & audio、Music、Games实际更新 tabpanel 对应内容；ArrowRight从末项回首项，End转末项，焦点与 aria-selected一致 |
| 本站商品选项 | 公共SKU接口200且 `items=[]`；Key详情显示直售未开，没有 Add to bag，Google音频/Payhip精确外链且含noopener/noreferrer |
| 账户 | Sign in提交按钮禁用，切Create account后提交仍禁用；页面说明外平台购买留在其原书库 |
| 购物袋/会员 | 空购物袋没有付款按钮；会员页明确不承诺注册礼、奖励或可兑换点数 |
| 后台 | 匿名页面显示 Administrator access required，不出现导出/退款/保存操作；匿名订单/书库/后台GET各401 `authentication_required` |

本地 `/api/commerce/status` 实际返回：`database=false`、`accounts=false`、`payments=false`、`privateMedia=false`、`inquiries=false`、`kru.enabled=false`；`publicCatalogAvailable=true` 表示可显示内置公开介绍，不表示有可收款SKU或已接数据库。

主要记录：

- `work/c-correction-regression/existing-harness/browser-verification.json`：原回归脚本结果passed、6视口/20路由/5流程及截图。
- `work/c-correction-regression/functional-extra/functional-verification.json`：新交互/门禁7组passed；最后一组按预期503断言发现实际403，保留failed与源码前后哈希，未抹掉失败证据。
- 同目录额外截图：导航搜索结果、手机菜单、首页Games tab、Key平台选项、禁用账户、空袋、会员说明及后台匿名门禁。

## 本地询盘 Origin 差异已实测

原浏览器回归只断言联系页不显示伪回执，因而passed；额外测试要求明确的缺数据库503，发现127浏览器得到403。只读隔离对比显示，同一API请求路径携带127 Origin→403；localhost Origin→503。没有改动安全校验或假造网络响应，也没有通过真实邮箱完成询盘。

又用真实浏览器各提交两品牌一次，实际390×844，保存响应及错误截图：

| 本地页面 Origin | 品牌/页面 | 响应 |
| --- | --- | --- |
| `http://127.0.0.1:3095` | KARUU `/contact`；JKJ `/physical/jkj-plus` | 各403 `origin_denied`，无回执 |
| `http://localhost:3095` | KARUU `/contact` | 503 `database_not_configured`，无回执 |
| `http://localhost:3095` | JKJ `/physical/jkj-plus` | 503 `brand_routing_not_configured`，无回执 |

四次页面均保留表单、明确错误且提交按钮可重试，`pageerror=0`。依据 `origin-probe.json` 与 `inquiry-origin-observation/inquiry-observation.json`；四张 `*-inquiry-error-390.png` 与JSON同目录。额外观察脚本首次因通用alert定位同时命中Next路由播报器而失败，已保留attempt1 JSON，改为主内容内表单alert后完成；这属于测试选择器修正，不是应用源码修正。

本地应统一访问主机名与预期site origin；远程审查/生产origin需准确对应实际域名。127失败不能描述成503缺配置路径已通过，localhost的503也不能称127环境已修复。这里两品牌后端均未配置，因此所有测试没有入库、客户通知或扣款。此前PGlite实际SQL持久化/通知fixture回执独立见 `C_VISUAL_ASSET_EVIDENCE.md`，不能混作本地Next或远程Worker真实记录。

## 验收边界

上述是功能和基本宽度回归，六个既有尺寸不替代用户要求 **1440×1000、1920×1080、390×844、430×932** 及360宽的新版构图/视觉对照；规定尺寸与CSS最终检查另行记录。模拟视口不是实体手机。当前未提交视觉修改后如继续改相关组件，应对受影响首页交互/导航再测；旧结果不能直接当后续版本通过。

未验证真实数据库/Hyperdrive、商户test-mode交易、真实邮件接收、私有文件交付、生产订单、游戏服务器/KRU执行或远程审查部署。测试数据均使用 `.test`/`.invalid` 地址，补测禁止外部浏览器请求，并在任何表单操作前确认数据库与询盘 readiness 为false；没有点击外平台支付/发信入口。本次只编写工作区测试证据与说明，未修改业务源、部署、commit或push。
