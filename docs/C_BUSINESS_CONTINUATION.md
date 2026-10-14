# C 方案业务续作实际回执（2026-10-14）

用户已明确授权真实收款。本文记录实际完成与接通缺口，不把源码、授权或本地测试当成已发生真实交易。

## 实际云端完成

- 已恢复用户指定的 Supabase `gngdffjluzcsouzpvquq`（原 `john92swe@gmail.com's Project`），没有升级计划。
- 官方迁移 `karuu_private_commerce_v1_20261013` 已建立私有 `karuu_commerce`：22表、22RLS、schema version 1。
- 官方迁移 `karuu_private_runtime_role_v1_20261013` 已建立 `karuu_web`：NOLOGIN、NOBYPASSRLS、NOINHERIT，无创建数据库/角色/超级用户权限，连接上限10；56策略仅授该角色。
- 最新官方SQL读回：既有 public 4表、private 1表不变；运行角色对既有业务表有效权限0、外部可执行SECURITY DEFINER 0、outbound组0；anon/authenticated对官网schema USAGE=false。未导入客户、价格、商品或资金记录。
- Stripe正式商户为 `acct_1UDS18JtfLuLpt8R`。用户已完成开户提交、正式凭据授权及本人验证。10月13日15:31 UTC服务器API已核charges_enabled/payouts_enabled/details_submitted=true。7项权限的受限live密钥已创建；live密钥与Webhook签名Secret已实际保存到审查和正式Worker，正式Worker保持暂存、未激活。
- 10月14日（柏林）已创建 `karuu-c-review-commerce-live` 接收端：Your account/Live/Snapshot，API `2026-09-30.endive`，8项Checkout/退款事件。接收端保持暂停，等待数据库与交付验收。审查站已激活匹配的live模式与两项Secret；本地签署的无业务检查事件返回200并忽略，错误签名返回400。不是Stripe实际事件交付、订单或扣款验收。
- 10月14日官方迁移 `karuu_private_worker_login_v1_20261014` 已建立独立 `karuu_worker_login`，仅继承 `karuu_web` 权限，SET/ADMIN=false；原持权角色仍为NOLOGIN。密码在服务器随机生成，经已有Supabase Vault临时加密传递给已授权的Cloudflare连接；临时Vault副本已精确清除，未写本地凭据文件或迁移文本。
- 已建立并绑定Hyperdrive `karuu-c-review-commerce`（`dc1f294919fa401db0a5ff90d969eb04`），缓存关闭、连接池软上限5。实际远程Worker连接确认database=postgres、session_user=current_user=karuu_worker_login、RLS开启、继承/SET/ADMIN=true/false/false；13项越权SQL均以42501拒绝。没有使用owner连接后SET ROLE冒充登录。原有public/private数据未读取或修改。
- 审查站状态已为database=true/publicCatalogAvailable=true/inquiries=true；邮件、支付、私有文件仍false。空业务内容库保留原12项公开作品及其顺序，不导入未经核验的价格、客户、SKU、发行权或管理员。6个页面GET及4个受保护入口拒绝检查通过。
- 10月14日重新核对Cloudflare登录账号，R2仍未订阅，当前应付$0、含免费额度、超额按量收费及自动续订；订阅确认仍待用户办理。此计费待办没有暂停数据库和Hyperdrive接通。

## 已实现的业务代码

- 独立私有schema选择、服务器最小权限角色生成器、默认dry-run的首管理员初始化；不创建默认管理员或公共提权接口。
- 原生私有R2读取：SHA-256、条件etag、单Range、错误文件/版次拒绝；账户授权和五分钟链接保持生效。
- 管理后台真实文件上传：原始文件流、服务器SHA-256、审计、对象key防碰撞、版本不可替换；只验证交付，不自动确认发行权。单文件上限32MiB，较大全本音频上传仍待补。
- KARUU/JKJ独立邮件relay或EmailService适配；未确认去重能力的provider仅自动尝试一次，未知结果转人工复核。
- OpenNext scheduled包装保留fetch和全部named exports，通过私有self binding处理通知。无真实cron，调度开关false。
- 创建Checkout失败、返回丢失或数据库保存失败后，安全恢复同一订单与同一Stripe幂等key；跨刷新保留请求key。超过23小时或权利/报价/币种改变时要求原款项核对，不自动解除订单。尚未绑定的订单会重新核对锁内读取的SKU币种；已绑定的Session保持原订单币种并允许恢复。
- 新单暂停后保留旧款项处理；核当前Session、PaymentIntent、Charge及完整Refund历史，防退款先到误授权益、重复退款与旧响应覆盖新状态。完整退款撤销对应权益；部分/失败状态进入审核。已下载文件不能远程收回。

## 实際验证与边界

10月13日业务代码 `npm test` 131/131、TypeScript、ESLint与OpenNext构建通过；真实Edge五尺寸C视觉基线5/5通过。10月14日配置恢复后的Wrangler dry-run与Secret辅助脚本PowerShell语法解析通过。数据库绑定阶段增加远程真实身份/RLS/13项拒绝检查、6页GET和4个入口拒绝检查；新增打包辅助环境仅为OpenNext本地平台代理提供loopback占位，不把真实DB密码交给本机构建。3项环境选择检查和脚本语法检查通过。未改变业务代码或视觉资产，未重标历史浏览器验收。

数据库行为使用隔离PGlite真实SQL和专用角色，R2读写使用本地Miniflare实际存储，Stripe签名使用真实SDK；商户/邮件网络为fixture。没有真实sandbox/live扣款、退款、客户邮件、链上操作或生产域名切换。线上绑定与provider端到端验收须另行记录。

## 待接通及未完成

1. 数据库受限登录、Hyperdrive绑定及缓存关闭已验收；尚无真实verified用户/管理员、本站SKU/价格/完整成本数据，备份恢复演练与多连接压力仍待分别验证。
2. R2订阅、私有桶、Worker绑定、真实母文件上传；大于32MiB的全本音频上传路径。
3. 邮件发件域/通道、通知job Secret与实际cron、用户验证邮件及首管理员实际初始化。
4. Stripe受限live密钥、签名Secret及8项事件接收端已经配置；尚待数据库/履约接通后启用接收端、测试环境实际付款/退款联调以及正式生产兼容发布。签名入口检查不替代这些验收。
5. 首批实际本站SKU的发行依据、正式价格、地区、税率、完整成本和组合/升级价；示例49SEK不作为售价。详见 [准备矩阵](C_BUSINESS_READINESS.md)。
6. 真实游戏服务器适配和KRU受控签名/预算/发放仍未实现，不影响将来具备条件的普通法币图书购买。

正式生产版本仍须独立恢复/兼容验证与发布回执。审查站更新只是部署已验证工程，不代表真实收款或正式生产升级完成。
