# C 方案真实商品与业务链路准备表

核对日期：2026-10-14（Europe/Berlin）；媒体与成本来源保留10月13日核验时间。本文区分用户已授权的目标、已落地服务及仍未完成的配置，不改变已确认C设计，不把授权或fixture当真实交易。

## 2026-10-14 接通状态

**本轮新增实际状态**：R2已由用户开通；EU私有桶、两本正式中英文EPUB与完整hash读回已完成；数据库已登记2个draft SKU/作品及空成本记录，USD1.99有媒体出版计划的用户确认。首管理员邮箱john@karuu.net已选定。用户选择复用PrivateEmail，SMTP适配/云端无AUTH握手与170项完整回归通过，真实应用密码/收件/管理员/支付联调仍待完成。详细当前边界见[C_STORAGE_FULFILMENT_20261014](C_STORAGE_FULFILMENT_20261014.md)；下方旧媒体快照保留当时日期，不外推旧书权利。

业务只读检查截点：`2026-10-13 11:10 UTC` / 柏林 `13:10`；随后补入 ROOT 的真实商户/运行角色回读和本节恢复修复。用户最新明确要求“直接开始真实收款吧”，**live 收款意图已经授权**，不再作为待许可项，也不重复请求测试保存许可。该指令没有补出具体作品的完整成本、现行发行权、本站售价、已接通的私有文件或商户 live 配置；下表只列本次能定位到的实际缺口，不替经营者填写身份或商户声明。

业务代码的完整131项回归与五尺寸视觉证据保留原核验版本。10月14日已发布两项正式服务器Secret和受限Hyperdrive绑定；实际连接证据与当前版本以最新回执/交付校验为准。尚未启用真实新收款或完成订单交付。

| 项目 | 已核事实 | 真实收费前尚未完成的具体事项 |
| --- | --- | --- |
| 收款开关与运行环境 | 独立审查Worker已部署匹配正式凭据的live模式，支付及四项批准门禁均false；无生产routes | 完成实际商品/文件/邮件/税务/条款与交易验收后再开新销售，用户live意图不需重复确认 |
| 商户与支付服务 | 正式acct_1UDS18JtfLuLpt8R已由用户完成开户及本人验证；10月13日15:31UTC API确认charges/payouts/details=true。7权限受限live key及签名Secret已保存，两者审查站激活、正式Worker仅暂存。8事件Snapshot接收端已建且暂停 | 待文件/邮件/商品履约接通、测试环境真实交易/退款及启用接收端；不能把签名入口检查当订单验收 |
| 正式本站价与成本 | 下表有平台 SEK 价格来源；原测算表 `49 SEK`、示例 VAT/支付费及组合价格只是演算。`costResult()` 与 checkout 拒绝未完整输入或未达到实际目标的成本记录 | 新短篇中英文电子书USD1.99、音频USD2.99已确认；活动价及窗口、组合/升级价和完整成本配置仍缺。逐个真实 SKU 以现有作品/发行资料决定，不自动复制平台价或把未知成本填 `0`。首个单书交易不必等所有组合或 KRU 完成 |
| 发行权与实际交付版 | F1–F5 完整 EPUB 已恢复并核对身份/hash；Witness 的原文件不是缺失。平台音频、音乐与草稿的状态分别见商品矩阵 | 首批销售必须将母文件与现行版、语言、署名及本站分销依据对应；已有 Kindle 商品的 KDP Select/排他状态尚未核实。Google AI 有声条目不等于已经取得可站外交付的全本音频与许可。未具备文件/权利的格式继续保留平台入口 |
| 数据库 | 选定Free项目gngdffjluzcsouzpvquq：22表RLS、version1、56策略。原karuu_web NOLOGIN保留；新增karuu_worker_login仅INHERIT该角色，SET/ADMIN=false。实际Hyperdrive已绑定、缓存关闭、软池上限5；真实同一事务身份/RLS与13项越权拒绝通过 | 已登记2个真实版次资产、2个USD1.99的draft SKU、2个draft作品与13项null的成本记录；尚无真实verified账号或管理员；备份恢复和压力验收仍待完成。公开内容库零行保留12项静态作品，不伪造商品或核验时间 |
| 账户与管理员 | 邮箱验证、登录、重置、管理员最小授权工具已实现；[管理员准备工具](C_BACKEND_ADMIN_BOOTSTRAP.md)的 8 项测试只在本地隔离 PostgreSQL-WASM 中执行 | 尚无真实验证邮箱链路、既有 verified 用户及精确 UUID 的首位管理员授权证据。后台 UI 出现或工具测试通过不能代替线上角色。外平台订单不会自动迁入 |
| 邮件与询盘 | 品牌独立relay/EmailService、幂等outbox和关闭的scheduled包装已实现；数据库接通后inquiries=true，账户邮件仍false；[邮件说明](C_MAIL_PROVIDER.md) | 尚需真实KARUU/JKJ发件通道、送达与询盘通知验收、通知Secret/cron及失败监控；没有向客户发信或提交测试询盘 |
| 私有文件 | 私有R2读取/90MiB内上传、SHA/版次/短时授权/Range代码已实现并回归；付费文件未放public | R2已开通，EU私有桶与2个真实EPUB全量SHA已核；90MiB流式上传和原生workerd回归已完成。审查绑定/具体部署见最新回执；音频仍待人听审，超过90MiB的multipart未实现 |
| 购买条款与运营资料 | 当前 `/terms` 和 `/privacy` 仍明确标注准备/审查状态；购买同意记录有 `KARUU_TERMS_VERSION`，按组件含税金额建立不可变订单 | 当前文件尚未包含实际启用市场/作品的最终许可、退款联系与流程、账户/存储 provider、保留期限等运行资料。需把已选实际服务填入现有页面及版本记录；本次不代填经营者声明 |
| 真实业务验收 | 已有线上 20 个 GET 页面、4 个目录/账户交互、5 个匿名 API 检查；未提交业务 form，未产生真实付款或邮件 | 接通上述条件后，验证服务端确认为同一订单、精确权益、私有下载、失败恢复、重复事件和退款撤销。页面验收、匿名关闭状态或 fixture 通过不算 live 收费成功 |
| 游戏与 KRU | 原有身份和资格门沿用，KRU 实际执行始终关闭；未改游戏服务和 eligibility。普通数字作品法币支付不依赖 KRU | 缺真实游戏 API、受控 signer/预算及具体资格的服务继续关闭，不阻断已经具备上述条件的单书收费，也不随 live 开关自动发奖 |

### 本轮代码发现与修复状态

1. **暂停新收费同时阻断既有支付收尾。** 原 `stripeClient()` 要求完整 `paymentsConfigured()`，signed webhook 和管理员退款也调用它，关闭新单门禁会令已付订单确认与退款返回 `503`。现已在工作区提供 `stripeClient({existingPayments:true})`，仅要求准确 test/live 模式及对应 key；默认调用仍要求原 checkout 门禁。付款通知/退款乱序与竞争处理已完成并通过17项隔离回归，已部署审查站；新收款仍关闭，没有真实交易。
2. **首次结账失败的 pending 订单缺少安全恢复。** 原实现先提交 pending，再查 tax-rate / 建 session；失败可能留下无 session ID 的订单，而客户端刷新会丢掉内存 key。现已修改 `commerce.ts` / `bag-content.tsx`：同账号、完全相同请求 hash 的 pending 始终复用原订单及 `checkout-${order.id}` provider key，购物袋在可用 localStorage 中保存请求 key。创建前重核当前权利、文件、成本和商业快照，变化即停止；无绑定 session 超过 23h 停自动重建，交经营者核原记录，绝不按 TTL 放开重单。已有 session ID、URL 缺失时只 retrieve 原 ID。创建结果须模式/用户/订单/金额/币种吻合，经 user→order 锁绑定，已收尾状态或不同 session 不覆盖。

`node --test scripts/test-checkout-recovery.mjs` **21/21 通过**，使用实际应用模块与 SQL、内存 PGlite 及完全隔离的 provider fixture：覆盖 tax 失败、provider 创建前/后超时、绑定保存 rollback、并发新 key、账号隔离、请求变更、23h 窗口、已绑 session 恢复、权利撤回、报价变化、merchant 对象 mismatch、结算竞争及真实 bag handler 的刷新/存储失效/已收尾 key 清除。未连接真实 Stripe/PostgreSQL/Worker，不等于多连接并发、真实支付或线上浏览器验收。typecheck 与这两个文件的 targeted ESLint 已通过；共享业务代码已通过ROOT的131项完整隔离回归。

23h 是针对 [Stripe API v1 的幂等 key 可在至少 24h 后被移除](https://docs.stripe.com/api/idempotent_requests)而保留的实现余量。官方 CLI 的本次公开页读取失败后，由官方文档页面核实此合同；没有运行 login/账号 API 或更改凭据。超过窗口仍保留 pending 及重单保护，不能把“本地无 session ID”当成“商户没有创建过 session”。这些业务代码已经部署审查站；正式生产尚未切换，当前读回见下节。

### 正式生产切换与既有授权

09:26–09:36 UTC 的[官方只读资源记录](../work/c-business-continuation-audit/audit.json)确认：现有 Wrangler OAuth 已具 `workers_scripts(write)`，Worker 元数据/活动部署读取成功，未扩大权限。官网实施请求和本次明确的 live 收款目标已经存在，不把同一意图重复列为待确认事项；技术 write scope 本身仍不证明某次生产切换已执行。

最新可定位的生产读回仍为 `karuu-production` 部署 `8b611224-1961-40d1-9726-b6cda2e4fe74` → 版本 `5abbde92-a504-4a86-9d6a-34d0689a2b88`（`2026-09-17T20:42:35.821555Z`，100% 流量）；C review已部署数据库及两项支付Secret，当前精确版本见最新回执与官方部署读回。生产有 JS fetch handler、`/api/*` Worker-first 与 ASSETS，不能当纯静态站。原 production 模块/资产尚无可核 SHA 的完整恢复备份；候选旧 Git `5994198…` 未证明对应此版本。具体读回及恢复边界见[资源审查](../work/c-business-continuation-audit/RESOURCE_AUDIT.zh.md)。

可以在当前上线目标内准备**保留现有域名/routes 的生产 release 配置、原 API 行为兼容与业务资源绑定验证**；当前唯一部署 helper 只允许 review，尚未形成该生产工件。本次没有改域名、routes、生产 Worker 或 Stripe 商户，也未执行正式回滚。既有 `codex/karuu-c-before-visual-correction-20261013` 是源码恢复分支，旧 `acc84001…` 是 review 回滚候选，都不替代原生产模块备份。

## 本次发现与旧清单的差异

1. **Witness 的母 EPUB 和内嵌原封面已恢复**。`C_ASSET_INVENTORY.md` 中“母文件未恢复”的早期描述已过时；本次独立核对实体、SHA-256、OPF 身份和 ZIP CRC，详见 F3。找到文件仍不能代替站外发行权及当前版对齐。
2. Google 出版账户的 2026-10-13 08:52Z 台账记录了 **6 个已上线格式条目和平台 SEK 价**，含 Witness 有声版，以及当前官网目录外的 *The Voice in Studio Four*、*The House That Counted Winter*。这是平台记录，不是 KARUU 本站 SKU 的正式正常价或活动价。
3. 新短篇正式 EPUB 的 OPF 标题是中文 **《末班车的失物单》** 和英文 **A Receipt for What Was Lost**，署名 **J.KARUU**，不是 K. R. Gannet。两个署名修订版文件均存在；中文完整音频也已生成并核对实体 hash。英文音频在 09:30Z 状态快照中是 5/6 章完成、第 6 章运行中；不能写成双语全本完成。
4. 配乐 **Return of the Last Bus** 最新 RouteNote 回执为 **PLATFORM_IN_REVIEW**、单条已绑定、唯一一次最终提交，不能再沿用旧“未提交草稿”状态，也不能称正式上线。审核回执不会自动批准官网下载销售。
5. 未在本次范围找到已批准的本站正常价、活动价/期限、真实读听套餐价、升级价及完整 SKU 成本记录。成本表中的 49 SEK、奖励预算和 3 件组合对照均为演算输入。

## 商品准备矩阵

下表“测试直售”专指用实际作品和真实商业配置在支付 sandbox 完成账户—订单—权益—私有交付。它不等于仅使用测试夹具跑通代码。已有文件可以独立做私有上传/下载/hash 检查；在权利与价格依据未确认前，不应把实际作品标记为已核权利并激活收款 SKU。

| 作品 / 格式 | 可确认 | 当前缺项 | 本次可推进 / 测试直售结论 |
| --- | --- | --- | --- |
| Key 英文电子书 | F1 完整 EPUB；K. R. Gannet / KARUU AB / en；25 章。Google 账户台账 ebook 42 SEK；旧数字站有精确 Google/Payhip 入口 | 当前平台版与 F1 对齐；是否参加 KDP Select、排他期限及本站再发行依据；正式本站价、成本、税务和交付配置。Key Kindle ASIN 仍未取得 | 原母文件技术准备可进行；目前保留准确外链。不能用 49 示例价或未核 ASIN 开启本站测试直售 |
| Key 英文有声书 | Google 真实条目；旧核验为 Ava (from Google)、AI-narrated、5h28m；账户台账 audio 53 SEK | 完整音频母文件、Google 生成音频站外使用许可、当前发行版本与音质验收；实际成本/价格 | 当前只能由 Google 履约；不能下载平台试听拼成母音频；Key 读听组合也未具备全部交付组件 |
| Last Room 英文电子书 | F2 完整 V2 EPUB；K. R. Gannet / KARUU AB / en-GB；34 章。准确英文 Kindle ASIN B0HK7128ZL、旧 Payhip 商品 dxCwG | 当前发行版、KDP Select/排他期限、站外权利；真实 SEK 参考价及本站正常价/成本 | 文件准备可进行；当前保留英文外链。不能把英文 Kindle 链接当中译本购买入口 |
| Last Room 有声 / 读听组合 | 原指令要求同书读听能力；组合机制已在官网源码实现 | 未找到对应完整母音频/已发行音频身份、许可、组件配置和真实组合定价 | 不激活音频或组合收款。原指令需求不证明该格式已存在 |
| Witness 英文电子书 | F3 原 Google 上传 v1 已恢复，34 章；原内嵌封面也存在。Google 账户台账 ebook 53 SEK；准确 Google ID 2CQOEgAAQBAJ、Kindle B0HK61VB5K | 当前商店版与文件对齐、站外发行权/排他状态、本站价/成本/存储绑定。OPF 未含 publisher/rights，不能自行补写成已授权 | 可用真实原文件准备交付测试；目前外链。无需重写或重生成此书；本次不改公开封面 |
| Witness 英文有声 / 读听组合 | Google 账户台账 GGKEY:BANNY8JB97E，live，audio 53 SEK，精确 AQAAAEBGaGkoPM | 完整音频母文件、声音/再发行许可、版本和人工验收；本站组合/升级价及分摊 | 来源记录可补目录审阅；仍只能平台履约，无法启用本站组合测试直售 |
| The Voice in Studio Four 电子书 | Google 已登录账户原读回：K. R. Gannet、GGKEY:SSCET3ZUF6W、live、53 SEK、ID YywXEgAAQBAJ | 本次恢复目录未找到母 EPUB/封面及权利档案；新的公开页工具访问失败，未独立复核当前公开页面身份 | 先核对应发行资产与公开页；不凭台账自动新增公开 SKU 或收费 |
| The House That Counted Winter: A Nordic Mystery Novella 电子书 | Google 账户原读回 live、K. R. Gannet、21 SEK、ID JNILEgAAQBAJ；本次公开搜索还读到 KARUU AB、44 页及 AI 披露 | 本次恢复目录未找到母 EPUB/封面、站外权利与现行版本对齐；本站价/成本 | 可保留精确平台入口供运营审核；不激活本站直售。公开 US 页面 $1.99 不替代 SEK 台账/本站售价 |
| 新短篇中文 / 英文 EPUB | F4/F5 署名修订版完整文件；各 6 章；J.KARUU。媒体记录已有 EDITORIAL_ACCEPTED、作者直接确认及 EPUBCheck 通过；本次实体 hash/CRC/OPF 通过 | 官网发行的权利确认、正式价格/地区、完整成本、条款、私有媒体对象与账户/支付资源。原生产记录实际新书投稿/上线数 0 | 是首批真实母文件候选；可做私有交付准备。尚无已核商品配置，不能称可售，不能借此触发新的 Google 投稿 |
| 新短篇中文音频 / 中英读听包 | F6 全本中文 6 章、1922.77 秒，MP3/FLAC 实体 hash 与技术报告一致 | 完整人耳审听、读音/角色/声音及模型输出商业权利确认；英文第 6 章及全本、音频成本/组合分摊/升级价 | 可独立验证文件交付；中文全本不代表人审通过。英文全本和双语包未完成，不能激活实际音频/组合 SKU |
| Kitchen Floor Gravity / Neon Finds the Rain | 原 YouTube 精确 Official Audio，J.KARUU / JKARUU Music；两条 URL 见 P3 | 官网正式下载母文件、署名/歌词/录音许可、销售地区/方式与价格成本未核。RouteNote 既有审核记录不等于 YouTube 不可听 | 当前线上收听；不假定下载销售或跨平台正式发行全完成 |
| 第二副碗筷 | 两个原候选 M4A 已恢复；本地 B1 FLAC F8 存在；媒体记录 John 接受两候选音乐方向 | 原生成服务商输出许可/投稿 ID、词作署名和最终正式发行证据；原 AAC 转 FLAC 不恢复无损品质；本站价成本未核 | 保留候选，不重复生成/投稿、不售两份重复版本；当前 In production |
| Return of the Last Bus | F7 84 秒原配乐 FLAC、John Jiang 作曲/J.KARUU 艺术家、KARUU AB 厂牌；最新 RouteNote 单条 In Review 回执，UPC5064149704958、ISRCGXM2X2617834 | 审核结果/正式播放页、官网下载许可与终版采用、本站价/成本。2026/10/30 是计划发行日 | 核实一次既有提交，继续等原回执；不重复发行。尚不能称已上线可购买音乐单品 |
| 《她说，死的不是她》 | 旧数字站精确番茄/喜马拉雅入口、中文笔名江墨染流年、AI 辅助文字/语音合成披露 | 完整本站可发行电子书/音频、平台合同/站外销售权及当前章节/版本；本站价/成本 | 外平台继续履约；不导入外平台订单为本站权益 |
| 《登记簿上的最后一间房》中文版 / 《万灵山河》 | 旧数字站分别为翻译发行安排中、开发作品；原计划与笔名来源存在 | 前者中译正式母文件/发行许可/本语种购买页；后者完整正式稿/人审/售价。规划章节不等于已完成书 | 保持准确开发/安排状态，不套英文链接或新增预售 |
| Xiaoju World stories/extras/NFT | 旧站计划条目 | 正式授权资产、发行版本/交付包、经济/价格依据未落实 | 仅未来范围，不铸造 NFT、不把概念包当商品 |

本站单书、同书读听组合、已购电子书升级、不同格式组合的后台能力已存在于源码；这不证明数据库里已有上述真实 SKU。运营配置需要每个组件真实 assetId/版本/hash/许可，组合组件不得重复收费。Google/Amazon/Payhip 的购买仍由对应平台履约，不自动同步成本、订单或“我的作品”。

## 真实母文件与技术来源

本节路径是内部资料位置，不能复制到公开客户端或静态 public。`CRC 通过`仅表示本次 ZIP 各条目校验未报错；并非完整人工编辑/阅读验收。原 EPUBCheck 结果是已有报告读回，本次未重新跑检查器。F1–F5 的 OPF 未提供有效的站外授权声明；缺少 dc:rights 字段也不表示没有版权。

| 标识 | 精确文件 | 本次独立核验 |
| --- | --- | --- |
| F1 | `D:\KARUU_Workspace\Reports\Media\deliverables\restored-originals\books\The_Key_Returned_at_Low_Tide.epub` | 906536 bytes；SHA-256 `9fc2802424a305e357d4215a28313b6daafc4474af93ce439520484e5f14cae5`；OPF `EPUB/content.opf`；CRC 通过 |
| F2 | `D:\KARUU_Workspace\Reports\Media\deliverables\restored-originals\books\KDP_Last_Room_Register_V2.epub` | 1961029 bytes；SHA-256 `284483dac5ac3d080f6138a1c0bfea8ae4a8aad145a3d60d0d29b3bb0cb92c59`；OPF `OEBPS/package.opf`；CRC 通过 |
| F3 | `D:\KARUU_Workspace\Reports\Media\deliverables\restored-originals\books\A_House_for_the_Witness-Google-original-v1.epub` | 494312 bytes；SHA-256 `f7660172f432b054c1504ca05c2653bcccd60d8a2c6c11e264e71bee276642c0`；OPF `OEBPS/content.opf`；CRC 通过 |
| F4 | `D:\KARUU_Workspace\Reports\Media\deliverables\formal-books-20261013\NEW-LAST-BUS-20261012\zh\1203\credit-7f750d8ceb5d3a3e\ebook_build\book.epub` | 103097 bytes；SHA-256 `3e51a1f89d91aaca6539b0ac65d6db8cf4a72bebb490d3ab96ef60a1639b3c96`；《末班车的失物单》/J.KARUU/zh；CRC 通过 |
| F5 | `D:\KARUU_Workspace\Reports\Media\deliverables\formal-books-20261013\NEW-LAST-BUS-20261012\en\1203\credit-7f750d8ceb5d3a3e\ebook_build\book.epub` | 125370 bytes；SHA-256 `7018f78aa53eb4bc23dc21bab6f6a59a3ece58cf05e3dd8cbf7c7a849291002b`；A Receipt for What Was Lost/J.KARUU/en；CRC 通过 |
| F6 MP3 | `D:\KARUU_Workspace\Projects\karuu-media-studio\pipeline\work\jobs\5c5eed17-ccbf-4cb0-bbac-768b0638e743\whole-book-256cbr.mp3` | 61531210 bytes；SHA-256 `659b1e7b8b93267f1710a4ed8272b98c64d34cf489a8d8bd5b2c0299bbe1e09e`；与原报告匹配 |
| F6 FLAC | `D:\KARUU_Workspace\Projects\karuu-media-studio\pipeline\work\jobs\5c5eed17-ccbf-4cb0-bbac-768b0638e743\whole-book-pcm16.flac` | 78239725 bytes；SHA-256 `ae48df83a04b411180e57eb39ad17cd812fde68ab4cbe9137b9e47130c7b16c3`；与原报告匹配 |
| F7 | `D:\KARUU_Workspace\Reports\Media\deliverables\music-release-20261013\last-bus.flac` | 2514728 bytes；SHA-256 `fb9cb0563912d22785e42dcb1f457b246f7123388abb19b2f10fe943e131ef3c`；与 RouteNote 已绑定文件回执一致 |
| F8 | `D:\KARUU_Workspace\Reports\Media\deliverables\music-release-20261013\second-bowl-b1.flac` | 17127656 bytes；SHA-256 `74e5de821ad35e947882d92853864c722f191d94d7063dd23db67284446213c4`；原候选 AAC 的转换版，不声称无损原母带 |

Witness 原封面：`D:\KARUU_Workspace\Reports\Media\deliverables\restored-originals\books\witness-original-embedded-cover.jpg`，267171 bytes，SHA-256 `6888ff31c8f3bdbb95f7ac5fa5fcdafa0adceaf3eacb523d7103f292de7608e4`。恢复报告 `witness-original-recovery-0906.json` 记载 09:17Z 从 GGKEY:J51AUKJ29RY 的原上传 v1 恢复；原报告 EPUBCheck `witness-original-epubcheck-0906.json` 为 0 fatal/error/warning，`original_epub_unmodified:true`，本轮未重新出版。这里更新库存事实，不批准封面上线或全书再发行。

新短篇来源：`D:\KARUU_Workspace\Reports\Media\deliverables\formal-books-20261013\author-credit-production-qa.json`、同目录 `google-delivery-format-qa.json`，及 `D:\KARUU_Workspace\Projects\karuu-media-studio\MEDIA_STATE.json`（`updated_at:2026-10-13T09:30:14.708999+00:00`）。格式报告记录 11 章文件（中文 6 / 英文 5），不是 11 本书；音频 `human_full_listen_pass:false`、`physical_audio_device_tested:false`、`uploaded:false`、`published:false`。原媒体队列由媒体项目持有，本次没有运行/停止/重开它。

配乐最新来源：`D:\KARUU_Workspace\Reports\Media\deliverables\music-release-20261013\routenote-actual-in-review-receipt-20261013.json`，观察时间 05:33Z，Free 模式、1 track、`submitted:true`、`published:false`、`final_submission_attempts:1`。旧 release-manifest/live-receipt 草稿状态不能覆盖这份较新回执。原音频与报告中的许可/提交授权只按其原适用范围理解，不授权本次代理追加外部操作。

## 原 ZIP、成本、正常价与活动价

原 ZIP：`C:\Users\Administrator\Desktop\KARUU_C_官网升级完整交接包_20261013.zip`，SHA-256 `8024e73a70e7a54bb8573215aea87eb1bff71653a2ce06899e03bb8793c29ec1`。4 个条目：README、完整执行指令、C 参考图、成本工作簿；没有完整商品母文件、最终 SKU 价格表或发行授权文件。

工作簿：`C:\Users\Administrator\Documents\Codex\2026-10-13\karuu-c-1-karuu-c-20261013\work\handoff\KARUU_C_Handoff\03_Cost_Model_20261013.xlsx`，SHA-256 `67ce3f6312a94beeeb6a8439947d91e99b41449fc1ef410292fd5f283eac6718`。本次只读检查了两张工作表的值/公式与注释，没有修改、重新缓存或把推算结果转成商品配置。

| 工作簿实际位置 | 实际内容 | 可用于正式 SKU 的结论 |
| --- | --- | --- |
| `单笔与优惠测算!B3`；`参数与来源!C5:E5` | 默认瑞典电子书 SEK 演算；49 为演算输入，明确不是实际书价/美元实时换算 | 不可当本站正常价、原价或折扣基准 |
| `参数与来源!C6:C14` | 活动倍率、0.06 VAT、1.5%+1.8SEK 卡费、部分 0 假设、1SEK 示例其他成本、3SEK 示例奖励成本 | 均需对应真实账户/品类/地区/账单；0 假设不等于已核为 0，VAT 不适用于所有商品或组合 |
| `参数与来源!C15:C20` | 退款/拒付、获客、固定运营、运营分摊订单量、制作总额、制作分摊订单量为空 | 这些为未知；不足以产生完整管理结余、最低价或奖励上限 |
| `参数与来源!C21:C24` | 10SEK 演算目标、Google 70% 账户条件待核、3 件组合演算数量及对照开关 | 不是经营者已确认目标、真实分成合同或读听包 SKU |
| `单笔与优惠测算!C25:C29` | 缺成本时返回待补/不形成完整指标；原奖励余量保留正负、上限归零是展示边界 | 不以示例数计算出“已盈利”“可赠币数量” |
| `单笔与优惠测算!B44:C47` | 3×49 单独订单与 147 合单的卡费比较 | 仅固定费演算，不是书+音频或音乐套餐售价 |

`参数与来源!B27/B28/B31` 还明确缺实际账单数据、混合组合需组件分摊及不能机械平均 VAT。对应官网后台支持正常价、限期活动价、组件分摊、已购升级价、per-order 成本及总额/订单量分摊；本次没有把上述示例预填进去。真实 SKU 正常价和活动价必须币种/地区/格式/版本一致；活动价需明确有效窗，组合需各组件真实价格/税务分摊。未知成本继续为 null。

原执行指令第 6、7 节明确示例数值不构成正式价格，且单本外平台有声页不证明站外母文件或授权；本文按用户要求读取其中业务约束，将其他媒体报告中的“下一步/申请/发送”等文字当作资料状态而非本次行动指令。

## 平台记录与精确入口

P1：`D:\KARUU_Workspace\Reports\Media\deliverables\google-delivery-setup-20261013\catalog-readback.json`（08:52:42.934Z）。原已登录账户确认 KARUU AB，记录 6 个 PLATFORM_LIVE 条目及平台 SEK 价；本次没有登录账户复查现价/交易。旧 US 公网页价、该账户 SEK 价、本网站拟售价是三个不同口径。

| 作品 / 格式 | 精确平台入口 | 原账户 SEK 记录 |
| --- | --- | --- |
| Key ebook | https://play.google.com/store/books/details?id=0tQKEgAAQBAJ | 42 |
| Key audio | https://play.google.com/store/audiobooks/details?id=AQAAAECGxz6HqM | 53 |
| Witness ebook | https://play.google.com/store/books/details?id=2CQOEgAAQBAJ | 53 |
| Witness audio | https://play.google.com/store/audiobooks/details?id=AQAAAEBGaGkoPM | 53 |
| Voice in Studio Four ebook | https://play.google.com/store/books/details?id=YywXEgAAQBAJ | 53 |
| House That Counted Winter ebook | https://play.google.com/store/books/details?id=JNILEgAAQBAJ | 21 |

本次公开搜索读到 [House That Counted Winter 的 Google 页](https://play.google.com/store/books/details/K_R_Gannet_The_House_That_Counted_Winter?id=JNILEgAAQBAJ) 的身份和 AI 披露；工具无法打开 Voice/Witness audio 页面，故后两条状态依赖 P1 的原账户记录，不称本次独立公开复核通过。日期、地区及价格可变，后续实际启用时复核。

P2：旧数字站资料来源/公开 JSON 的既有核验见 `docs/C_ASSET_INVENTORY.md`，原出处 `https://karuu-digital-store.pages.dev/`（现行数字静态 Pages）及 `https://karuu-digital-store.netlify.app/`（历史可访问副本）；原源码来源记录 `D:\KARUU_Workspace\References\Media-Recovery\JOHN\20261012-original-record-readback.txt`。外链包括 Key Payhip `https://payhip.com/b/49sCR`、Last Room Payhip `https://payhip.com/b/dxCwG`、Last Room 英文 Kindle `https://www.amazon.com/dp/B0HK7128ZL`、Witness Kindle `https://www.amazon.com/dp/B0HK61VB5K`。已有 SKU 身份不证明这次本网站有销售权、账单或可迁移订单；Payhip 本次未走结账/下载。

P3：原可听音乐 URL `https://www.youtube.com/watch?v=i6mns_U5nxE` / `https://www.youtube.com/watch?v=bjaTO5DQl2M`；原中文连载 URL `https://fanqienovel.com/page/7694827775856741438` / `https://www.ximalaya.com/album/130061593`。网站分类/格式合并不能取消 AI 说明或把辅助创作夸大为纯生成，也不能给中文自建配音套上 Google Ava 身份。

## 游戏与 KRU：已存在的接口和实际未连接项

| 项目 | 可确认的工程 / 精确来源 | 商业接入结论 |
| --- | --- | --- |
| Xiaoju Escape | `D:\KARUU_Workspace\Projects\xiaoju-escape\STATUS.md`：2026-10-09 状态，Godot，小橘密室内含海湾工坊关卡，`MATURE_GAME_ACCEPTED=NO`，视觉人工门禁未通过 | 没有本次确认的生产账户/充值/点数 API。只能开发介绍，不能把本地存档余额作为服务器已付费权益 |
| 独立 Harbor Workshop | `D:\KARUU_Workspace\Projects\karuu-harbor-workshop\Docs\SERVICE_INTEGRATION.md`；`Assets\KARUU\Scripts\Economy\KruWallet.cs`；`Docs\GDD\ECONOMY_AND_ORDERS.md` | 是独立 Unity 工程。CloudSave/商城服务默认 Disabled/ReferenceOnly，参考 HTTP/SQLite 与测试不等于生产服务；需真实账号、TLS、官方支付验证、幂等 grant/query/refund、可靠账本及签名。现不能启用官网游戏充值 |
| Nordic Rush: Aurora Relay | `D:\KARUU_Workspace\Projects\nordic-rush-new\PROJECT_STATUS.md`；`docs\THIRD_PARTY.md`；实际原型 `docs\screenshots\02-gameplay.png`；构建 `D:\KARUU_Workspace\Builds\nordic-rush-new\NordicRushAuroraRelay.exe` | v0.1.0/独立 Godot3D，真实原型资产许可记录存在；人工键鼠/音频/完整版接受未完成。`offline.local.nordic-rush-new` 是离线 namespace，无本次已确认充值 API 或已授权公开试玩 URL |
| 链上 KRU | `D:\KARUU_Workspace\Projects\kru-listing\data\facts.json`；已核身份 Mint `MsVzWwgszumrq5bPUduhyj68UMmrrjzjidpVjqW3WX9`、Solana mainnet、Tokenkeg 程序、9 decimals、raw supply500000000000000000 | 地址不是缺项；500000000 是总供给，不是公司可支配奖励余额或流通量。主体/权限控制/资格/许可/可用预算/计价与退款规则/受控 signer/真实转账核验仍未落实；不能新造同名币替代或把数量当经济成本为0 |
| Harbor 内部 KRU | 上述 Unity `KruWallet.cs` 的 long Balance / KruEntry Ledger，经济文档限制不提现、不转账、不与公司其他产品积分互换 | 是本地内部点数，不是 Solana token；现无核实兑换关系，不合并其他游戏余额、不宣称链上到账 |
| 官网游戏/奖励服务 | `src/lib/server/core.ts` 的 `kruEligibility()`；`src/lib/server/commerce.ts` 的 status / catalog / checkout 条件；内部 points 后台仅自身账本 | 真实 KRU 发放/收款执行保持关闭；中国/未知市场均不获准。官网自身付费/赠送记录不证明接通上述游戏。普通法币书籍支付不依赖 KRU |

本节仅源码/已有状态读回，没有重新运行引擎、RPC、玩家服务器或链上操作。本次未读取种子、私钥、钱包身份 intake 或客户账本。KRU 已核身份可以继续沿用，但启用发奖/收款需要实际资格、预算和受控执行证据。

## 下一步可直接据此办理的事项

1. **先用真实候选资产准备私有交付**：F1–F5 可保持原文件/hash 逐件入内部资产盘点；以语言/版本/hash 新建唯一资产，验证授权访问和禁止公开下载。中文全本 F6 可技术准备，同时保留“未人审/未批准发行”。不用重写已恢复书籍或重新制作原平台音频。
2. **补每个候选作品的发行依据与价格源**：由经营者/媒体负责人对照现行发行版、平台排他状态、音频/生成服务许可及官网销售范围确认；已有平台 SEK 数据可作真实对照，不自动写入售价。配置正式正常价、需要时的活动价/窗口、组合价、升级价和目标市场。
3. **补完整成本/税务并再决定销售开关**：真实支付账户费、下载/邮件/支持、版权分成、内容制作分摊、固定运营分摊、获客、退款及奖励成本均有依据后，才判断完整管理结余与最低价；不开默认奖励，无活动时的实际 0 也须与“未知”区分。混合组合逐组件处理税务/费用分摊。
4. **资源/管理员/测试交易由本次主任务继续核实**：数据库、账户邮件、支付 test/live、私有媒体和 webhook 的实际状态在独立 provider/admin 工作流确认。10月14日已验真实受限数据库/Hyperdrive配置、Stripe凭据及签名入口；账户邮件、私有文件仍未接通，未创建管理员或提交测试订单。资源接通与 SKU 条件落实后，使用唯一测试订单验证付款服务器确认、精确权益、授权下载、重试/退款/撤销；不能拿页面或代码夹具通过替代这条链路。
5. **游戏和 KRU 不拖住可完成的普通交易**：待各实际服务提供合同/生产 endpoint 和市场规则，再验证唯一订单、签名、幂等发放、查询/补发/退款。无生产游戏服务/预算/受控 signer 的项目继续如实禁用。

商品盘点阶段完成的是以上文件、来源、成本假设和接入证据核对，没有将新的库存/平台条目自行公开。之后真实收款续接已在工作区修复 checkout 恢复与购物袋 key，并新增独立测试，具体状态见本文开头；没有修改价格或正式生产流量。ROOT已提交并发布审查站续作，当前数据库、商户及业务验收结果见最新回执。
