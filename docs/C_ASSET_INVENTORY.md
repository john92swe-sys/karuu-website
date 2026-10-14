# C 方案真实数字资料与素材清单

核验日期：2026-10-13（Europe/Berlin）。此文档与 C 网站工作副本关联。盘点者仅只读媒体、代币与游戏工程；本次只复制三张真实图至网站 public/images/creations，没有复制完整付费 EPUB、音频或游戏构建到 public，没有登录销售账号、发邮件、支付、签名、转币或修改游戏账本。

## 1. 数字站实际位置与迁移边界

| 对象 | 本次实际发现 | 状态 / 边界 |
| --- | --- | --- |
| KARUU 主站现行部署 | 本次后台及官方 Wrangler CLI 已核：Worker `karuu-production`，active version `5abbde92-a504-4a86-9d6a-34d0689a2b88`（number 1），deployment `8b611224-1961-40d1-9726-b6cda2e4fe74`，100%；创建 `2026-09-17T20:42:35.821555Z`；source Wrangler、triggered_by upload；自定义域名 `www.karuu.net`、`karuu.net`；workers.dev `https://karuu-production.john92swe.workers.dev` | 现网归属已确认是 Cloudflare，撤回此前将 Vercel 记录当成现网对应关系的结论。version/deployment annotations 无 Git commit；仍未证明对应 `5994198` 或取得可恢复原制品 |
| 现行 Worker 运行配置 | 仅有 `ASSETS` binding，但存在 `fetch` script handler；etag `1f778ebcdd9d6d3ff9a5bacd98a082519716b22e25dc58cbc5f887ce917800db`；assets `serve_directly:true`，`static_routing.user_worker` 与 `raw_run_worker_first` 均为 `/api/*`，HTML drop-trailing-slash、404-page；compatibility date `2026-09-17`；后台无环境变量 / 数据库 binding | `ASSETS` 是唯一 binding 不等于没有 JS。实际配置是 assets 与 fetch Worker 配合，API 路径优先脚本；原 API 是否处理邮件草稿、持久发送或委托其他服务，须读回原脚本，现阶段不能仅凭 binding 猜。不能据此认定新动态交易后端可直接运行；C 源码适配的构建/runtime 验证另列 |
| 同账号 Cloudflare Pages | `karuu-website`：`No Git`、界面显示 `25d ago`；`karuu-digital-store`：`No Git`、显示 `2d ago` | 数字 Pages 当前域名、部署及公开内容已另行读回，详见下一行；两个 Pages 名称不证明与主站 Worker 使用同一制品或 Git 提交 |
| 数字 Pages 当前生产部署 | deployment `eab7a056-9701-44b4-abee-713bfcef96c4`，Success；后台显示 `Oct 10, 9:27 AM`，UI 时区未核；生产仅 `karuu-digital-store.pages.dev`；6 个静态 assets（404、favicon、index、release、robots、sitemap）；环境变量 0 | 已读到 16 条公开作品记录，主线内容与历史 Netlify 副本一致；该部署没有订单数据库。未取得源码提交对应、平台客户资料或订单导出资格，不推断外平台无订单 |
| 本次升级 Git 起点 | `john92swe-sys/karuu-website`；Git 基线 `5994198f63e840cceb0d2226b1f15214ee5a522c`；隔离分支 `codex/karuu-c-store-20261013` | `5994198` 仅证明现有 Git 工程起点，尚未证明对应 Cloudflare active 版本；旧 Vercel 部署记录不能代替该对应核验 |
| C 独立审查部署 | Worker `karuu-c-review-20261013`，版本 `acc84001-1b28-4a91-8e64-6f70f39e3593`；[审查地址](https://karuu-c-review-20261013.john92swe.workers.dev)；运行来源 commit `649dc7968b75d9980c9fd429d0d63812384c7ebd` / tree `c44a23f08fece825b412f78cc413e1b9e14bd55d` | 已部署，主要桌面页面及内容/禁用状态检查完成，未提交联系表或付款；status 被客户端阻止、独立 HTTP 403，远程接口仍未验证。390 视口覆盖未生效，不能称远程手机通过。生产 after 仍是 `5abbde92…` 100%；DB/付款/邮件/私有媒体/KRU 未接通，32 项通过仅为本地检查 |
| https://discover.karuu.net/ | 本机 HTTP 200，HTML title `Europe–China Market Access · KARUU`；JS `/assets/index-BflE123c.js`、CSS `/assets/index-BM40w8Vi.css` | 当前是欧洲—中国市场服务 SPA，不能当作数字作品商店整站替换或全部重定向 |
| https://karuu-digital-store.netlify.app/ | 本机 HTTP 200；title `KARUU Digital Store — Books, Audio & Xiaoju World`；页面内商品 JSON version `1.0.1`、mode `public-platform-store`、`paymentsEnabled: false` | 历史部署的当前可访问副本，提供英文/中文内容、平台入口、筛选、搜索和本机收藏；本次迁移资料来源之一，不再认定为当前正式数字站部署 |
| 数字站原源码位置 | JOHN 原机 `D:\KARUU_Data\Projects\karuu-digital-store` | 来源为已恢复 `PUBLICATION_RECORD.json` 读回；本机没有把该路径冒充当前已拉取 Git 工程 |
| Netlify 原部署记录 | project `karuu-digital-store`，site_id `b1eabea7-6381-49a6-9103-fc25274c337d`，release `1.0.1` | 与本次可读历史副本页面版本一致；本次未操作 Netlify 账号，GitHub 搜索未定位此名称仓库；不是 Cloudflare 新 Pages 当前源码/发布证据 |
| 账户 / 历史订单 | Netlify 历史副本公开说明无注册、无本站收款；Saved 使用 localStorage 保存当前浏览器书签。当前 Cloudflare 数字 Pages 已核为静态部署、没有订单数据库 | 书签不能迁移为已购权益；没有取得 Amazon、Google、Payhip 客户订单数据或其导出资格，不推断外平台不存在历史订单 |
| 旧站外链问题 | 页面 JSON 有 Amazon / Fanqie / Ximalaya 条目，但脚本 safeExternal 仅允许 Google / YouTube / Payhip | 内容数据存在不等于现有每个按钮可工作；迁移应逐条核身份及新 allowlist |

来源：本会话 Cloudflare 后台及当前数字 Pages 公网页面实际读回、`D:\KARUU_Workspace\References\Media-Recovery\JOHN\20261012-original-record-readback.txt`、`20261012-media-source-locations.json`，及上述历史副本本次 HTTP/JSON 读回。下文“旧站”商品资料主要指初次读取的 Netlify 历史副本；当前数字 Pages 的 16 条公开记录已确认主线内容一致。工作副本合并了 12 项适用作品，同书电子书/音频按格式归并，开发/未来项目不变成可售 SKU；仍需完成逐记录来源及旧 URL 对照，不移入不存在的本站订单库或未经许可的平台客户资料。

现网只读 CLI 证据：`wrangler versions view 5abbde92-a504-4a86-9d6a-34d0689a2b88 --name karuu-production --json` 与 `wrangler deployments status --name karuu-production --json`。已在本工作副本 `work/cloudflare-production-evidence/` 保存去除作者邮箱等不必要字段的 JSON，无 token/密钥。官方 Wrangler 4.148.0 `init --from-dash` 默认会委托 C3，C3 2.73.4 现行代码仍转回 `--no-delegate-c3` 下载路径，该路径明确不支持 Workers with Assets。本次仅运行其已核纯读取分支：`init --from-dash karuu-production --no-delegate-c3 --yes`，工具实际返回“Unable to fetch bindings, routes, or services metadata”，下载目录没有文件。原模块/原资产尚未恢复，不能把元数据 SHA 或 script etag 冒充已备份代码 SHA。没有触发 login、修改资源/权限或部署。

## 2. 已复制的网站真实素材

| 网站文件 / 使用位置 | 源文件 / 作品 | 语言、版本、尺寸 | 来源与权利状态 |
| --- | --- | --- | --- |
| `public/images/creations/low-tide-cover.jpg`；首页主推/目录/Key 详情 | `D:\KARUU_Workspace\Reports\Media\deliverables\restored-originals\books\low-tide-original-cover.jpg`；The Key Returned at Low Tide | 英文；原 EPUB `EPUB/cover.jpg`；992 × 1586 | 已亲眼检查书名、作者 K. R. Gannet、KARUU AB；原书资产复用；完整素材授权档案和当前平台版对齐待核，不据此认定可以站外直售 |
| `public/images/creations/last-room-cover.png`；首页主推/目录/Last Room 详情 | 同目录 `last-room-v2-original-cover.png`；The Last Room on the Register | en-GB；原 V2 EPUB `OEBPS/cover.png`；1009 × 1559 | 已亲眼检查书名、作者 K. R. Gannet；原书资产复用；完整素材授权档案和当前平台版对齐待核，不据此认定可以站外直售 |
| `public/images/creations/nordic-aurora-relay-prototype.png`；可用于 Nordic 开发介绍 | `D:\KARUU_Workspace\Projects\nordic-rush-new\docs\screenshots\02-gameplay.png` | 实际程序 Viewport 渲染；v0.1.0；1280 × 720；中文 HUD | 已查看真实原型，不是概念图；使用时标明 Prototype screenshot / In development。代码 MIT、复用模型/音效 CC0、字体 OFL 来源见游戏 docs/THIRD_PARTY.md；截图不表示最终商品/人工验收完成 |

SHA-256（本次复制后独立计算，与源清单一致）：

- low-tide-cover.jpg：`a0e8f89456b0da62c0ea335602083953ac661445f95c693021f9d0be0970ed47`
- last-room-cover.png：`25d284459f6f18c85070397002e43a98ca575b5033d67d801a1d94e91b6406db`
- nordic-aurora-relay-prototype.png：`b2cdfb57f46a3bcd3732442b64b0116b2b44282d1419f4cb6725e3e2706b098d`

C 附图的两本概念封面、带 KARUU 标记的 JKJ-Plus 瓶身、猫与游戏插画没有当作正式资产复制。本清单不包含实物图权限核验；沿用官网获准实物素材及既有公有安全门禁。

## 3. 电子书与音频真实库存

| 作品 | 本次身份/文件核验 | 本站直接交付状态 |
| --- | --- | --- |
| The Key Returned at Low Tide | 原 EPUB OPF：title 同名，creator K. R. Gannet，publisher KARUU AB，language `en`，date `2026`；25 章。恢复文件 `D:\KARUU_Workspace\Reports\Media\deliverables\restored-originals\books\The_Key_Returned_at_Low_Tide.epub`，906536 bytes | 母 EPUB已找到；原技术报告 EPUBCheck 0 errors / 0 warnings；当前平台文件版本、KDP Select 参加/期限及站外发行权未取得证据；直售不可仅凭找到 EPUB 开启 |
| The Last Room on the Register | 原 V2 OPF：title 同名，creator K. R. Gannet，publisher KARUU AB，language `en-GB`；34 章。恢复文件同目录 `KDP_Last_Room_Register_V2.epub`，1961029 bytes | 母 EPUB已找到；原技术报告 EPUBCheck 0 errors / 0 warnings；最新平台版对齐、KDP Select/站外发行条件未知 |
| Key 有声书 | [Google 有声页](https://play.google.com/store/audiobooks/details/K_R_Gannet_The_Key_Returned_at_Low_Tide?id=AQAAAECGxz6HqM) 本次复核：K. R. Gannet / Karuu AB；Ava (from Google)；AI-narrated；5 hr 28 min；Unabridged | 平台存在已验证；完整母音频、站外再发行权及当前后台版本未核；Google履约，不承诺本站完整下载或平台书库同步 |
| Last Room 有声书 / 读听组合 | 本地本次范围未定位对应正式完整音频或平台 SKU | 可以编码精确组合/权益结构，但当前不能开启无文件组合收款；没有从其他作品音频拼装 |
| A House for the Witness | [Google 电子书页](https://play.google.com/store/books/details/K_R_Gannet_A_House_for_the_Witness?id=2CQOEgAAQBAJ) 本次复核 K. R. Gannet / Karuu AB / ebook 369 pages；英文悬疑作品，Amazon 精确书页也已核 | 本地第三本完整原稿/EPUB/正式封面尚未恢复；保留平台入口与真实介绍 |

完整文件 SHA-256（只记录，不公开分发）：

- Key EPUB：`9fc2802424a305e357d4215a28313b6daafc4474af93ce439520484e5f14cae5`
- Last Room V2 EPUB：`284483dac5ac3d080f6138a1c0bfea8ae4a8aad145a3d60d0d29b3bb0cb92c59`

电子书状态依据媒体专用工程 `MEDIA_STATE.json`、原恢复 `original-recovery-qa-1840.json`、本次只读 OPF。已有技术报告不是本次重新执行 EPUBCheck，也不证明消费者实际阅读验收或最新在售版本完全一致。

作品简介以原数字站现有资料与公开平台同身份页面交叉核对；没有编造星级、销量、奖项。K. R. Gannet 是 KARUU AB 使用的英文出版笔名。两本原文及封面使用生成式 AI 的公开披露应保留；Key Google 说明小说使用 OpenAI ChatGPT、封面使用 OpenAI image generation；Key音频使用 Google 合成人声，不冒充真人演播。

## 4. 准确平台入口及本次验证范围

| 作品/版本 | 精确链接 | 本次结果 |
| --- | --- | --- |
| Key 电子书 | https://play.google.com/store/books/details/K_R_Gannet_The_Key_Returned_at_Low_Tide?id=0tQKEgAAQBAJ | Google正文读取通过；作者/出版方匹配，ebook199 pages；US English 页面当次 $3.99。不是本站 SEK 价格 |
| Key 电子书 Payhip | https://payhip.com/b/49sCR | 当前旧数字站 JSON与恢复资料准确匹配；本次供应商页 HTTP403，未测试该平台结账/实际下载 |
| Key 平台预览 | https://payhip.com/preview/49sCR | 已取得旧站准确预览链接；本次未验证试听/预览内容，不称本站样章已完成 |
| Key 有声书 | https://play.google.com/store/audiobooks/details/K_R_Gannet_The_Key_Returned_at_Low_Tide?id=AQAAAECGxz6HqM | Google正文读取通过；AI Ava / 5h28m / unabridged；US页面当次 $4.99，不作为本站组合价 |
| Last Room 电子书 Payhip | https://payhip.com/b/dxCwG | 当前旧数字站 JSON与恢复资料准确匹配；本次供应商页 HTTP403，未测试该平台结账/下载 |
| Last Room 英文 Kindle | https://www.amazon.com/dp/B0HK7128ZL | 本次 HTTP200，title明确 The Last Room on the Register / Gannet,K.R.；该链接在旧站中文版本条目内，但实际是英文 Kindle，不当作中文版售书链接 |
| Witness Kindle | https://www.amazon.com/dp/B0HK61VB5K | 本次 HTTP200，title明确 A House for the Witness / Gannet,K.R. / Kindle Store |
| Witness Google 电子书 | https://play.google.com/store/books/details/K_R_Gannet_A_House_for_the_Witness?id=2CQOEgAAQBAJ | 本次正文读取通过；US页面 $4.99，只记录平台/区域/格式，不能推断 Kindle 同价 |
| Key Kindle | 未取得 | 保持该入口关闭；不使用 Amazon 首页、搜索、其他书页或 Payhip 伪代 |

以上价格仅为核验记录，不构成本站正式售价、折扣原价、跨区域价格比较或消费者最终税额。ASIN/链接核身份不等于查到了 KDP Select 状态。直售启用前由经营者/媒体项目负责人提供当前书架、排他期限及母文件/许可对应信息。

## 5. 音乐与后来新增作品

| 作品/系列 | 当前真实入口或本地资料 | 发布与交付边界 |
| --- | --- | --- |
| Kitchen Floor Gravity | https://www.youtube.com/watch?v=i6mns_U5nxE；本次 YouTube oEmbed title `J.KARUU - Kitchen Floor Gravity (Official Audio)`，author_name `JKARUU Music` | 可主动线上收听；本站没有已确认可销售的完整下载包/商用许可，词曲作者及法律发行人未知，不编造 |
| Neon Finds the Rain | https://www.youtube.com/watch?v=bjaTO5DQl2M；本次 oEmbed title `J.KARUU - Neon Finds the Rain (Official Audio)`，同一频道 | 同上；公开频道 https://www.youtube.com/@JKARUUMusic |
| 第二副碗筷 | 媒体恢复 B 校准两个原候选 M4A均210秒，原文件哈希和解码技术报告已恢复；本地生成参数 `published:false` | 当前旧站为 project、无链接；媒体当前状态原服务商许可、投稿ID/词曲署名及平台回执待核。保留原B方案/一次生成双候选；不重发、不当作已正式销售作品 |
| Return / Last Bus cue | 本地 MIDI/MusicXML/MP3原型与新作《末班车》推广配乐记录 | 未发布评审素材，未取得最终人耳验收/销售许可；不自动作为主站正式商品 |
| 她说，死的不是她 | https://fanqienovel.com/page/7694827775856741438；https://www.ximalaya.com/album/130061593；旧站记录中文笔名江墨染流年、AI辅助文字/语音合成披露 | 精确链接已从当前旧站取得，本次未登录后台确认最新集数/合同/收入；不迁移为本站订单，不自动站外销售完整连载文件 |
| 登记簿上的最后一间房 | 旧站记录是 Last Room 中文授权翻译，笔名江墨染流年；制作完成/国内发行安排中 | 旧条目误易使人以为Amazon英文链接是中译售书链接；新站须准确区分语言，不声称当前中文购买开放 |
| 万灵山河 | 旧站 project：初稿6章、约21128汉字；126章规划，publication ready为否 | 这是旧站生产记录，未核现有最新稿量；不能把规划章节当完成书，不开放预售/直售 |
| Xiaoju World 动漫/头像/壁纸/漫画包/NFT | 旧站概念/开发条目 | 无本次已落实可售正式包；保留扩展，不铸造NFT、不出售概念周边 |

## 6. 三个游戏项目与充值服务

| 稳定工程 | 实际本地状态/证据 | 本站接入方式 |
| --- | --- | --- |
| Xiaoju Escape | `D:\KARUU_Workspace\Projects\xiaoju-escape`，Godot；STATUS最新2026-10-09 CI127记录仍有冻结吊机视觉门禁，MATURE_GAME_ACCEPTED=NO；海湾工坊是此游戏内关卡 | 介绍/In development。脚本范围未发现真实HTTP账户/付款/点数服务；不能启用充值或把本地存档当服务器账本 |
| 独立 Harbor Workshop | `D:\KARUU_Workspace\Projects\karuu-harbor-workshop`，Unity；与小橘关卡完全不同；存在CloudSaveClient、AuditedPurchaseCoordinator、UnityIapV5Bridge接口，默认全部关闭/ReferenceOnly | `Docs/SERVICE_INTEGRATION.md` 明确无production cloud/live store/real player service；参考服务不可承接真实资金。要沿用接口合同，但生产账户/endpoint/商店验证/退款后端和实际游戏接入仍缺 |
| Nordic Rush: Aurora Relay / 极光接力 | `D:\KARUU_Workspace\Projects\nordic-rush-new\game`，独立Godot3D新工程；karuu/aurora-relay，commit `0bcb15df0721ed24b0e31e01c9575fcf17decd66`，v0.1.0可玩核心；实际Windows EXE118363080 bytes存在；自动物理/实GPU截图证据已记录，人工键鼠声音/完整版接受待完成 | 介绍/原型图/In development；账号namespace `offline.local.nordic-rush-new`，无游戏充值API或公开试玩URL。旧 Nordic Rush 索引path=null仅未定位，不能说它不存在或拿新工程冒充旧发布 |

Harbor Unity 的 `KruWallet.cs` 是本地 long Balance + KruEntry Ledger（Tutorial/Order/Purchase/Refund/AdminMigration等来源），不是链上钱包；其现行经济合同 KRU不提现、不转账、不与公司其他产品积分互换。不得将这个内部货币与下节Solana Mint直接绑兑换。接口所需唯一订单/平台环境/applicationId/productId/transactionId/grant audit等须保留，可靠生产服务部署前保持充值关闭。

游戏 source read不等于本次重新跑引擎、构建或试玩；本次没有启动/停止他人游戏进程或修改工程。可用真实源码/构建路径不是已授权公开分发链接。

## 7. 真实链上 KRU

- 已定位专项 `D:\KARUU_Workspace\Projects\kru-listing`，facts/status中区分链上身份、游戏内部点数、未知项目主体/治理/市场。
- 官方Solana主网RPC `https://api.mainnet-beta.solana.com` 本次 getAccountInfo jsonParsed / finalized 只读核验时间 `2026-10-13T01:16:47.2005893Z`，slot `456257261`。
- Mint `MsVzWwgszumrq5bPUduhyj68UMmrrjzjidpVjqW3WX9`；owner/token program `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`；initialized=true，decimals=9，supply raw `500000000000000000`（500000000当前总供给，不是流通量、上限或公司可支配奖励余额）。
- mintAuthority公开地址 `A8cshc7UNpgkkaVq6z72oVo1iaYbveRgZNNYSJQsDjaX`存在，freezeAuthority=null。专项2026-10-12的匹配Metaplex核验记录名称KARUU Token / KRU、metadata可修改，本次没有把历史metadata检查称重新检查。
- 项目主体/司法辖区、权限地址实际控制、多签/治理、奖励资金来源与可用余额、分配/锁仓、真实计价/流动性、支付供应商接受范围、目标市场资格、活动预算与退款规则未落实。本次不输出私钥、不读种子/钱包身份存储、不签名、不发币、不转币。
- 普通内容支付/实体询盘须独立运行；KRU的真实发放/收款保持服务端关闭直到上述条件验证，不能再把已核实Mint列为“尚未提供地址”。市场资格未知不发，中国业务无前端/API间接KRU通道。

## 8. 外部缺项与继续动作

| 缺项 | 影响 | 提供/确认者 | 精确下一步 |
| --- | --- | --- | --- |
| 当前 Cloudflare Worker 版本对应源码、可恢复制品及 Next.js 服务端运行路径 | 主站准确续作、Cloudflare 预览/发布与可执行回退 | 原站维护者/经营者 | 从 `karuu-production` active `5abbde92` 核部署制品与来源；保留域名/流量/配置快照；已在独立审查工程完成服务端适配与本地验证，仍需核实当前源码制品、真实服务和数据库/环境绑定；不能把 Git `5994198` 当现网版本 |
| 当前数字 Pages 源码制品与逐记录映射 | 可复现数字迁移、完整旧入口对应 | 原站维护者/经营者 | 域名、deployment ID、16 条公开记录和无订单数据库已核；取得当前部署制品及源码对应，完成同书格式合并和开发/未来项目的逐记录映射；外平台订单须另取得合法导出资格 |
| 每书当前发行版、KDP Select状态/期限、站外销售条件与素材授权档案 | 本站电子书直售及平台准确版本对齐 | 经营者/媒体负责人 | 对照现有完整EPUB哈希、当前书架及有效合同，记录可售语言/版本/期限；无需重复制作现有完整书 |
| Key完整母音频/站外授权；Last Room音频正式SKU | 本站音频、读听组合收款履约 | 媒体负责人 | 从合法母文件与许可记录定位，上传私有存储；缺项期间保留Google合法购买试听 |
| Key Kindle准确ASIN | Key View on Kindle按钮 | 出版负责人 | 对照当前KDP书架/精确公开页，不能用搜索页替代 |
| Witness本地完整书/真实封面 | 第三本本站商品/素材 | 媒体恢复负责人 | 延续原恢复工程查母文件；已有正确Google/Amazon身份可独立展示 |
| 音乐直售母文件/署名/发行许可/既有投稿回执 | 音乐包收费、下载许可 | 音乐负责人 | 不重复投稿，核原平台许可与记录；两首YouTube可独立线上收听 |
| 真实游戏账户、服务器grant/query/refund签名合同和生产endpoint | 游戏充值/点数发放 | 各游戏负责人 | 在既有隔离项目服务上实现，不能由官网伪发本地余额 |
| KRU市场/供应商/签名治理/可用预算与报价规则 | 链上奖励、KRU付款/兑换 | 经营者/KRU负责人 | 复用已核Mint，补规则后测试隔离环境；钱包连接不算收款完成 |
| 历史数字副本原源码、现行数字站部署源码对应及平台导出资格 | 实际切域/替换数字站与适用平台订单迁移 | 经营者/原站维护者 | 从 JOHN 原工程核 Git，与已核 Cloudflare Pages deployment/域名对应；两公开目录已读取、当前 Pages 无订单数据库，但尚未取得平台客户订单；discover 当前另有真实业务需保留 |

以上区分已核实素材、工作副本已实现、待配置与待外部材料。当前数字 Pages 的域名/部署、16 条公开目录和无订单数据库已核；Cloudflare 适配、本地 Workers 验证、独立审查部署与主要桌面页面检查已完成。远程接口仍受客户端阻止/HTTP 403 限制；手机覆盖尝试未生效，六视口证据归前次本地检查。现网源码提交映射、数字记录/旧 URL 完整映射及生产发布未完成，生产 after 读回没有替换现行版本。本清单不能替代真实 DB/支付/交付接通测试或正式生产部署验收。
