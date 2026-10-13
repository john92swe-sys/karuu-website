# C 方案后台、交易与交付操作

## 验证边界（2026-10-13）

当前生产官网未配置本次交易数据库、商户、私有文件服务或验证邮件服务。下面是同一 Next.js 14 工程内已编码的服务，不代表生产已启用。没有真实文件、发行权、价格、税务、完整成本和商户配置的 SKU 不接受本站付款。原平台购买继续由相应平台履约；没有取得或合并 Amazon / Google / Payhip 顾客、订单或账户。

`node --test scripts/test-commerce.mjs` 使用 PGlite 的 PostgreSQL WASM 引擎执行真实 SQL、唯一键、事务与磁盘重开。Stripe 签名验证使用实际 SDK，但 Checkout / refund / 查询、私有文件与邮件网络边界使用隔离 fixture。测试不向客户发邮件、不发生真实或 Stripe sandbox 资金流水、不生成链上记录。此数据库适配器将测试事务串行化，因此不是生产 PostgreSQL 多连接压力 / 锁等待验收。生产服务只使用 `pg` 连接 PostgreSQL，不把 Vercel 本地文件系统当数据库。

## 已完成并验证

- 重复执行 schema 与关闭/重开后账户仍保留。
- 邮件验证、scrypt 密码、HttpOnly 七日会话、单次密码重设与重设后全会话失效；客户 API 按账户隔离，管理 API 服务端验证 admin + 品牌权限，同源写请求防 CSRF。
- 实体需求真实落库、品牌归属、提交编号、同 key 同内容返回原记录，同 key 改内容拒绝；独立负责人未配置时拒绝 JKJ-Plus 收件。通知有持久队列，provider accepted 不冒充邮件到达。
- 商品与读听包按精确 asset IDs 授权；重复组件/已购全部组件拒绝，已购部分仅在配置精确 upgradePrices 时升级。购买时价格、版本、语言、税率、组成与即刻交付同意版本保存在订单 snapshot。
- 真实 Stripe 签名检查、可靠 merchant 查询、金额/币种/订单/账户/账单地区核验；延迟支付未到账不发权益；重复 event 与 session 不重复授权。
- 待付、已付待地区审核、退款处理中订单阻止同内容第二次付款。pending 不在 24 小时后自动释放；仅真实签名过期事件或管理员可靠查询 `expired + unpaid` 才关闭。订单报价与支付处理统一 user → order 锁顺序。
- 完整退款仅撤回该订单授予的许可，不影响其他订单；迟到 paid event 不恢复已退款权益。部分退款进入人工 review。已下载文件不能远程删除。
- 私有文件通过账户授权 + 五分钟 HMAC grant + 当前有效权益校验访问，支持单 byte range；文件服务故障保留付款记录、允许恢复，不重新扣款。
- 未知成本保留 null，完整结余、最低价与奖励上限保持 null；已知固定项为零与未知不同。成本按 minor units 保守计算，有符号 `rewardHeadroomRawMinor` 与 `targetMet` 保留亏损信息；`rewardHeadroomMinor` 是可用非负限额。最低价再次按相同 rounding 验算。
- CMS 作品、简介、分类、封面路径、平台链接、上下架与开发状态可在同一后台维护。draft/archived 不公开；外链必须精确作品地址与过去核验日期。公开输出白名单 bibliographic 字段，内部 evidence 不进入 HTML/client props。从未配置数据库时使用现有已核静态介绍；已配置数据库但无法读取时返回空目录并 status.publicCatalogAvailable=false，不用静态目录或跨实例不可靠缓存重新公布已下架内容。
- 普通价与活动价分开，活动价有明确有效期；读听包具有独立 SKU。已报价/已购 asset 的作品、格式、语言、版本、文件 SHA-256 不可换成另一作品；新版本新 asset ID。同 digest 的存储修复可有原因更新。
- KRU API 对中国、未知资格以及所有尚未启用配置拒绝。没有凭客户端市场声明发币的路径，没有把内部点数当链上余额。
- 游戏点数有内部 server-only 账本原语：已经核验的资金来源才可按该资金所承诺 units 贷记；paid/gift 分 lot，重复原资金不可再次贷记；explicit paid-first / gift-first 消费顺序，用户事务锁防透支，game_id 不自动合并；首资金活动同 user / original funds 不重复奖励，internal point quantity budget 事务预留。没有公开充值/发放 API，没有真钱币值或自动退款政策；测试 funding/campaign 均为隔离 fixture，不是现有游戏余额。

## 配置顺序

1. 使用公司适当授权的 PostgreSQL 数据库，先做 backup，再显式执行 `db/001-commerce.sql`。SQL 可重复，无示例商品/价格 seed。使用 TLS、最小数据库权限与服务端 secret；不要把已有不相关销售/个人数据库混入官网。
2. 配置验证邮件与公司域名。注册验证邮件仅发送登录/重设所需内容，不订阅营销。测试用独立发送环境及指定测试邮箱。`KARUU_MAIL_ENDPOINT` 是接受 `{to,subject,text,brand}` 的 HTTPS 邮件 relay，Bearer token 鉴权；不是已经存在的已接通服务。provider 应执行 `Idempotency-Key`。
3. 自行注册并验证初始管理账户，数据库所有者在受控事务里把这一个已验证用户 role 改为 admin、brands 设为其实际权限，再添加明确原因的 `commerce_audit` 记录。没有默认账号或内置管理员密码。一般 staff 不持有商户或签名密钥。
4. 在 `/admin` 先维护作品公开资料，再添加 assets 和 draft SKU。文件从授权母文件上传到适合的私有对象存储；计算真实 SHA-256 填入 contentSha256。这里实现的是文件访问与对象 relay 接口，没有运营者上传界面，不能把公开平台有声页当已取得音频母文件。
5. 逐 SKU 确认本站发行权 / KDP Select、语言版次、正常价、套餐组成、活动有效期、适用市场与组件税务。对混合 VAT 包逐 asset 配置 taxByMarket 和 10000 basis points 价格分摊。商户 tax rate 必须 inclusive、active、国家与实际税率匹配；付款时核实际账单国家，不自动对全球套税。
6. 填完整 costs；可以直接给 per-order 分摊，也可给 contentTotal/contentOrders、operatingTotal/operatingOrders 自动向上分摊。数量 0 被拒绝，缺任何源数据保留未知。`reward` 是奖励内容/服务成本，**不含**另记的 `networkFee`，不得把同一网络费算两次。vatRate 的运行报价取组件实际税率计算有效值；后台单税率测算只是该输入口径。
7. 使用独立 Stripe sandbox 开通并核税务、商户及付款方式；配置必需 webhook `/api/payments/stripe`，订阅 completed、async_payment_succeeded、async_payment_failed、expired、charge.refunded。`integration_identifier` 是已安装 Stripe SDK OpenAPI 支持的字段。SDK 将 API version 与当前依赖匹配，升级前重做 sandbox 业务验收。
8. 实际 provider sandbox 测试：直接法币付款、付款取消、延迟到账、重复通知、故障交付恢复、退款、错误账户、价格/地区不符；核私有对象 range 及权限。当前自动测试不能替代这些 provider 验收。
9. live 收款还需要 `KARUU_LIVE_COMMERCE_APPROVED=true`、`KARUU_TAX_CONFIG_APPROVED=true`、`KARUU_DISTRIBUTION_APPROVED=true`、`KARUU_LEGAL_APPROVED=true`，并确认即时履约、消费者权利、退款、隐私及实际市场文本。代码提交不是这四项批准的证据。

## 后台合同与操作

`GET /api/admin?view=` 支持 status、inquiries、orders、catalog、works、assets、costs、audit、points、kru。客户不能读取。JKJ-Plus 管理员仅能访问其品牌询盘，不读取 KARUU 数字订单与成本。`GET /api/admin/export?view=…` 下载当前权限内 JSON（当前视图上限 200 条；不是全量财务历史导出）。

所有写操作 `POST /api/admin` 必须带不少于 10 字符原因：

- `save_creation`: publicationStatus 与完整 creation。每条平台链接 sourceUrl 必须等于 exact URL，verifiedAt 为实际核验日期。素材目前仅支持已经部署的 `/images/creations/…` 合法图片路径；没有文件上传后台。
- `save_asset`: id、workSlug、title、format、language、objectKey、editionVersion、contentSha256、rightsVerified、deliveryVerified。verified delivery 必须真实 hash。换作品/语言/版本新 id；不要原 id 指向不同书。
- `save_sku`: sku 含 id、slug、title、kind、status、currency、normalPriceMinor（兼容 priceMinor）、promotionPriceMinor / promotionStart / promotionEnd、saleStart / saleEnd、rightsVerified、markets、components、taxByMarket、upgradePrices。法币商品不以 KRU 开关为前提。
- `save_cost`: skuId、inputs；未知填 null，不填示例 zero。
- `update_inquiry`: id、status。brand 来自被保存的询盘，并按 staff brands 授权，不相信客户端指定目标品牌。
- `reissue_access`: userId、assetId。只对已存在有效购买权益记录支持；客户回 My creations 重新拿五分钟链接，不给 staff 悄悄造免费购买权益。
- `request_refund`: orderId。真实退款 API 与 merchant idempotency key 已编码；实际执行会转移资金，须由合法有权 operator 在已配置商户操作。本轮没有运行此操作到真实服务。
- `close_expired_checkout`: orderId。只有 merchant query 已确认 expired + unpaid 才释放该订单；不能把仍可能到账的延迟付款人工标失败来重复收钱。

询盘 notification job `/api/internal/notifications` 需要私有 Bearer job secret，逐批 10 个队列，SKIP LOCKED + lease，最多 5 次 provider 尝试。可由已配置的私有 scheduler 调用 POST。当前没有创建真实 scheduler，也没有把邮件 provider acceptance 标成最终送达。

## 尚未编码与外部依赖

- 实际游戏服务器发放/查询/补发/退款/兑换券签名适配、各平台站外支付规则与年龄/地区资格。
- 真实付费余额充值、预付义务会计、游戏 merchant/发行平台接入、gift 有效期业务配置、服务间签名与退款/兑换合同、经营者 campaign 编辑 UI。内部原语的 funding / rules / campaign 只供未来验证适配器使用；普通作品订单不会隐式生成余额，internal point quantity cap 不等于 KRU/SOL/现金/内容履约经济预算。
- KRU campaign 管理、并发数量/SOL/现金/履约预算预留、受控 signer、链上支付报价/收款/奖励确认/重试及退款政策。当前只做禁用资格门和独立状态记录结构，不存在可用发币或收款执行器。
- 历史数字站账户、订单和权益的可验证导出及真实身份迁移；没有进行同名账户合并，也没有从外平台推断本站权益。
- 运营者私有文件上传、多角色 staff 权限维护界面、完整财务历史导出/分页及退款部分金额 UI；目前适用人工授权的最小规模运营。
- 公司法律/税务批准、真实商户 sandbox/live 参数、私有对象服务、验证邮件 relay、真实母文件及分销权，均由相应经营者/服务所有者提供和核验。

## 备份与回退

迁移前做 PostgreSQL backup；live 后持续数据库与私有对象版本备份。回退部署只回滚应用，不还原旧库覆盖新订单；v1 schema 是增量表，旧官网可继续使用原产品页与邮件草稿。已收款订单须继续保留 webhook/退款/交付 worker 的可用版本，不能因回退页面丢弃资金记录。审计与支付 event IDs 保留，不通过删除 event 来强行重复履约。

技术：Next.js 14 / pg / Stripe SDK / Node crypto；PGlite 为开发测试依赖。没有新增 CMS 托管或数据库付费账户。数据库、支付、邮件、私有流量的实际持续费用未取得经营者账户费率，因此未知。
