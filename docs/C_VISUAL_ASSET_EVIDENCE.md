# C 方案纠偏：实际素材与询盘测试证据

核验日期：2026-10-13。业务测试基准提交：`b7b2763600f855c8e14d9f5621cb2b53bdae006e`。本轮核对现有素材、执行隔离测试并编写本说明；后来按明确授权只转换两书封面编码与引用路径。未修改业务逻辑、未发布、未调用真实支付或客户邮件服务。

## 1. 需求与素材证据的区别

已完整读取用户最新纠偏附件 `C:\Users\Administrator\.codex\attachments\b340a71f-d520-4084-8880-e3ca590fc75d\已粘贴的文本.txt`。该附件要求恢复 C 的自然场景大图、薄荷绿实体区、淡紫数字区、真实封面及音乐/游戏入口，并分别检查桌面和手机构图。附件中的视觉方向与参考图不是杯壶型号、游戏成品、试听文件或第三方图片的授权证明。

以下文件确实存在并已目视检查。真实产品照片、真实书封、程序截图、音乐发行封面及氛围概念图分别记录；不将生成的模特、瓶身或插画描述成已经供货的 SKU/游戏成品。首页标题、按钮与导航仍应由 HTML 承载。

## 2. 可以沿用的现有公开素材

| 网站文件 | 实际内容与出处 | 本次判断 |
| --- | --- | --- |
| `public/images/products/kr01-0004/02-light-pink-lifestyle.webp` | KR01-0004 原官网目录照片；`src/data/products/kr01-0004.ts` 的同名 gallery 记录。完整面部、粉色运动裙、石墙背景 | 可沿用现有获准目录范围制作实体运动服卡片；不属于湖泊/山地横幅，也不应当作新摄影或户外拍摄证据 |
| `public/images/products/kr01-0001/07-light-pink-lifestyle.webp` | KR01-0001 原官网目录照片；室内自然窗光、粉色长袖套装。`src/data/products/kr01-0001.ts` 同名记录 | 真产品图；顶部白带/X及竖向构图需在展示时处理，不能直接冒充 C 参考的横向自然场景 |
| `public/images/products/kr01-0001/15-pink-lifestyle.webp` | 原官网目录粉色短构图，主体为上身 | 真产品图，但不适合继续作为本次大 Hero；使用仍受既有目录边界约束 |
| `public/images/products/kr01-0002/12-red-model.webp` | 原官网红色背心/阔腿裤模特照，竖向棚拍，头部被截 | 可作为对应产品图；不适合要求完整自然环境的 Hero |
| `public/images/products/kr01-0004/07-black-lifestyle.webp`、`13-white-lifestyle.webp` | 原官网网球裙照片，手机配件带第三方品牌字样 | 真产品图；本次优先选择不突出第三方配件品牌的 `02-light-pink-lifestyle.webp`，未更换/抹去原素材标记 |
| `public/images/creations/low-tide-cover.jpg` | *The Key Returned at Low Tide* 原 EPUB 封面，992×1586。源：`D:\KARUU_Workspace\Reports\Media\deliverables\restored-originals\books\low-tide-original-cover.jpg` | 可以准确介绍现有作品；不是 C 参考中的概念书名/封面。完整发行权、当前版本及站外售卖条件继续按 `C_ASSET_INVENTORY.md` 门禁处理 |
| `public/images/creations/last-room-cover.png` | *The Last Room on the Register* 原 V2 EPUB 封面，1009×1559。源：同目录 `last-room-v2-original-cover.png` | 同上；不能凭封面存在声称已有本书音频组合可交付 |
| `public/images/creations/nordic-aurora-relay-prototype.png` | 独立 Godot *Nordic Rush: Aurora Relay* v0.1.0 真实运行截图，1280×720、中文 HUD。源：`D:\KARUU_Workspace\Projects\nordic-rush-new\docs\screenshots\02-gameplay.png` | 可用于开发中的游戏卡片，并标示 Prototype / In development；不是已发布试玩或充值入口 |

已重新计算以下公开文件 SHA-256：

| 文件 | SHA-256 |
| --- | --- |
| `kr01-0004/02-light-pink-lifestyle.webp` | `a6902953801066cf632ee580928ddcae41d8d81d25e5da00500b5b547b8f3848` |
| `kr01-0001/07-light-pink-lifestyle.webp` | `0f00f8d584c15708d1c8f967e147a72fbbfb93d529c4549d9ffd9907dc8c83f7` |
| `kr01-0001/15-pink-lifestyle.webp` | `00c79401890f99f8562ad70f3d2091af99e85e5a22cb7e82afaca70411680c3e` |
| `low-tide-cover.jpg` | `a0e8f89456b0da62c0ea335602083953ac661445f95c693021f9d0be0970ed47` |
| `last-room-cover.png` | `25d284459f6f18c85070397002e43a98ca575b5033d67d801a1d94e91b6406db` |
| `nordic-aurora-relay-prototype.png` | `b2cdfb57f46a3bcd3732442b64b0116b2b44282d1419f4cb6725e3e2706b098d` |

Nordic 许可来源已只读核对 `nordic-rush-new/docs/THIRD_PARTY.md`：基础代码 MIT，复用模型/贴图/音效按该项目记录为 CC0，Lilita One 字体 OFL，原创岛屿/桥梁/中继及声音有项目源码记录。Windows 系统字体不复制分发。截图不替代游戏最终品质/人工接受或引擎二进制分发许可要求。

### 原封面编码优化与保留

2026-10-13 `04:52:38 UTC`，使用已安装 sharp **0.35.5** / libwebp **1.6.0** 将两书原封面转换为 WebP（quality92、effort6、保留ICC），降低公开图片传输量。只改变编码，没有缩放、裁切、旋转、合成、生成或改字；两份原JPEG/PNG完整保留且SHA-256未变。WebP采用有损压缩，不声明解码像素与原图逐字节相同。转换前原图与转换后WebP均通过本机 `view_image` 实际查看，书名、作者、画面边界和构图保持，未见裁切或损坏文字。

| 新网站文件 | 尺寸保持 | 原文件→WebP字节 | 导出SHA-256 |
| --- | --- | --- | --- |
| `public/images/creations/low-tide-cover.webp` | 992×1586 | 763421→376470（减少50.69%） | `e0f74fa9516cf15a72fb6c86180f2a8e753b41e84ec3785c1d94fb5164be8303` |
| `public/images/creations/last-room-cover.webp` | 1009×1559 | 1825190→197254（减少89.19%） | `d4795ff59dd4ff459ba0cf2f5e887978d11dd691295be9c8d8b594b8c2db70e6` |

`src/data/creations.ts` 只将两处 `cover` 字面路径改为对应 `.webp`；书名、作者、简介、分类、平台链接及其他业务资料未变。完整原/导出SHA、尺寸、字节与编码设置保存于 `work/c-cover-encoding.json`。这不是重做已出版封面、改母EPUB或更换作品发行版，也不证明所有远程加载延迟已经解决。

## 3. 杯壶真图存在，但不能作为 JKJ-Plus 已批准照片使用

历史目录存在以下杯壶图片文件；本轮没有复制、恢复展示或重新授权它们：

| 历史路径 `public/images/products/` 下 | 现存文件 |
| --- | --- |
| `insulated-carry-bottle-1000ml/` | `01.webp`、`02.webp` |
| `handled-travel-tumbler-1200ml/` | `01.webp`、`02.webp`、`03.webp` |
| `quick-open-insulated-bottle-380ml/` | `01.webp`、`02.webp`、`03.webp` |
| `compact-insulated-coffee-tumbler-450ml/` | `01.webp`、`02.webp` |
| `slim-quick-open-insulated-bottle-450ml/` | `01.webp`、`02.webp`、`03.webp` |
| `carry-loop-insulated-bottle-530ml/` | `01.webp`、`02.webp` |
| `slim-quick-open-insulated-bottle-600ml/` | `01.webp`、`02.webp`、`03.webp` |
| `soft-spout-carry-bottle-multi-capacity/` | `01.webp`、`02.webp`、`03.webp` |

已目视 `insulated-carry-bottle-1000ml/01.webp`：真实杯壶照片、浅蓝/淡紫瓶身、桌面背景，未见足以证明 JKJ-Plus 品牌身份的标记。文件处于 public 不证明当前展示许可或 JKJ 品牌归属。

`AGENTS.md` 要求保留历史 Hydration 公有安全门禁，不把曾公开视为重新授权；`src/config/catalog.ts` 当前 `HYDRATION_PUBLICLY_DISCOVERABLE=false`。历史 URL/data 被保留，不代表可用于新首页 JKJ 卡片。本机 `Projects/jkj-karuu-acquisition`、当前网站公开素材及此次 References 文件名范围检查未定位独立、已批准的 JKJ 杯壶真图；这不是对所有云端资产的穷尽搜索。当前不得把上述历史供应商图换名为 JKJ，也不得把概念瓶身作为可供货型号。需要品牌方正式产品照片/许可对应后才能作准确产品展示。

现有获准素材没有同时满足“湖泊/海湾、远山、自然光、右侧完整运动模特与杯壶”的横幅。新增氛围场景应单独记录生成/许可来源，作为品牌装饰，并避免编造现实产品型号、合作模特身份或实拍地点；本轮没有生成、购买或下载此类图片。

## 4. 音频、音乐与其他游戏素材

| 资料 | 实际检查与范围 |
| --- | --- |
| Key 有声书 | 同书真实封面可以标识音频格式；`src/data/creations.ts` 已保存 Google 精确有声页 `https://play.google.com/store/audiobooks/details/K_R_Gannet_The_Key_Returned_at_Low_Tide?id=AQAAAECGxz6HqM`。本轮未找到新增、已授权本站公开的母音频试听文件，不因封面而开放本站播放/下载 |
| Kitchen Floor Gravity / Neon Finds the Rain | 当前公开目录 `cover=null`；已有精确官方频道视频 `https://www.youtube.com/watch?v=i6mns_U5nxE` 与 `https://www.youtube.com/watch?v=bjaTO5DQl2M`。前轮同身份 oEmbed 核验见 `C_ASSET_INVENTORY.md`，本轮没有声称重新联网核验。可沿用准确平台入口；未将另一歌曲的封面或未核来源素材配给这些歌 |
| `D:\KARUU_Workspace\Reports\Media\deliverables\music-release-20261013\last-bus-cover-3000.jpg` | 已目视：3000×3000，J.KARUU / 末班车回站 / Return of the Last Bus 原创图形发行准备封面。该目录 `release-notes.md` 与 `release-manifest.json` 记录仅创建草稿、元数据阻塞、未提交/未发布；不冒称平台已上线。它与小说《末班车》的封面属于不同作品/格式 |
| 同目录 `second-bowl-cover-3000.jpg` | 已目视：3000×3000，J.KARUU / 第二副碗筷图形封面。发行准备记录称 John认可两候选并授权继续发布，但原音轨商用来源/法定作词署名等仍待核。这是已有准备资产，不是当前官网已售数字商品或已发行平台截图；本轮未移入 public |
| `D:\KARUU_Workspace\Projects\xiaoju-escape\screenshots\02_CAT_GAMEPLAY.png` | 已目视真实历史运行截图：英文 Clockwork Room HUD，箱子遮住猫，画面与后续港湾版本不等同。`docs/CLOUD_HANDOFF_20260930.md`、`docs/HARBOR_ASSET_PROVENANCE.md` 说明旧图/原猫照片/品质边界。不能用其代表当前成熟成品，故不推荐作本轮主卡；未复制到 public |
| `D:\KARUU_Workspace\Projects\karuu-harbor-workshop\Verification\R8Recovery20260910\harbor.png` | 已目视独立 Unity 游戏历史开发截图，含任务面板、“100 KRU”欢迎礼及 Development Build。与小橘内港湾关卡不同；不适合官网公共主卡，避免把内部游戏货币画面变成会员赠礼承诺。未复制到 public |

本次编码优化前 `public/images/creations/` 的三张文件分别是两本真书封与 Nordic 真原型截图；现新增两份对应WebP，三份原文件继续保留。音乐本地准备资料、Xiaoju/Harbor 开发图存在并不自动满足当前主站公开发布资格。没有用卡通概念图代替运行画面，没有在缺母文件时播放无关声音。

## 5. 已执行的隔离询盘与业务验证

在本工作副本执行：

```powershell
$env:KARUU_INQUIRY_EMAIL='karuu-inquiry-test@example.test'
$env:KARUU_TEST_DIR='D:\KARUU_Workspace\Worktrees\karuu-c-store-20261013\work\commerce-tests'
node --test scripts/test-commerce.mjs
npm run check:public-safety
node --test scripts/test-hydration.mjs
```

结果：Commerce **18/18**，Hydration/catalogue **10/10**，public-safety 通过。Commerce 使用真实 PostgreSQL SQL 的 PGlite WASM 磁盘数据库并核关闭重开持久化，pg/Stripe/mail/私有存储边界为 fixture。测试对其他网络地址直接报错；未连接真实 PostgreSQL/Hyperdrive、真实邮件、Stripe 商户或 Stripe sandbox。测试库在 D 的 `work/commerce-tests` 下创建，本轮结束已清理。历史 Hydration 测试名“publishes eight”仅核八个原 data ID，后续断言实际要求禁止发现/noindex；不能把该名字作为新发布授权证据。公有安全检查不是所有图片权利的法律认证。

为核本次要求的实际表单处理路径，又在 `work/visual-evidence-inquiry.mjs` 建立独立本地 fixture，直接调用现有 `src/app/api/inquiries/route.ts` 的 `POST`，包括 JSON 和原生 FormData，不修改路由/服务逻辑。验收时间 `2026-10-13T03:59:02.975Z`，只供本地复核的回执保存为 `work/visual-asset-evidence/inquiry-fixture-receipt.json`（work 为本地证据，不随 Git 提交）：

| 断言 | 实际结果 |
| --- | --- |
| KARUU JSON 请求 / JKJ FormData 请求 | 各返回 201，`KARUU-243537F7` / `JKJ-8D04DA3C` |
| 同键同内容重试 | 相同 id，`duplicate=true`，没有新增记录/通知 |
| 同键更改内容 / 外 Origin | 分别 409 `idempotency_conflict` / 403 |
| 关闭重开数据库 | 两品牌记录的 id/reference/状态一致，持久化成立 |
| 通知 job | 两条通知由本地 `.test` fetch stub 返回202，代码记为 `provider_accepted`；第二次处理0条 |
| 实际通知对象 | 仅 `karuu-inquiry-owner@example.test` 与 `jkj-inquiry-owner@example.test`，未发送给客户或实际商家邮箱 |
| 支付 / 清理 | 数据库订单0条；fixture 禁止加载 Stripe；测试库已经删除，保留无密钥回执 |

以上证明现有路由/服务在本地 SQL fixture 的入库、重试、品牌及通知状态处理。`provider_accepted` 在此是本地假服务接受，不能称真实到达收件箱。没有浏览器或远程 Worker HTTP 表单成功入库验收，也没有线上真实数据库/邮件接通证据；缺配置时页面与 API 应如实返回未配置，不显示伪成功。桌面/手机视觉 QA 和部署须以本轮另行实际检查为准，本说明不沿用前次视口检查作为此次通过。
