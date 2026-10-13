# C 方案业务续作实际回执（2026-10-13）

用户已明确授权真实收款。本文记录实际完成与接通缺口，不把源码、授权或本地测试当成已发生真实交易。

## 实际云端完成

- 已恢复用户指定的 Supabase `gngdffjluzcsouzpvquq`（原 `john92swe@gmail.com's Project`），没有升级计划。
- 官方迁移 `karuu_private_commerce_v1_20261013` 已建立私有 `karuu_commerce`：22表、22RLS、schema version 1。
- 官方迁移 `karuu_private_runtime_role_v1_20261013` 已建立 `karuu_web`：NOLOGIN、NOBYPASSRLS、NOINHERIT，无创建数据库/角色/超级用户权限，连接上限10；56策略仅授该角色。
- 最新官方SQL读回：既有 public 4表、private 1表不变；运行角色对既有业务表有效权限0、外部可执行SECURITY DEFINER 0、outbound组0；anon/authenticated对官网schema USAGE=false。未导入客户、价格、商品或资金记录。
- Stripe沙盒父商户为 `acct_1UDS18JtfLuLpt8R`。已按用户指示填写公司类型、公司资料、数字图书类别、业务说明和账单描述符；本人资料与银行开户由用户完成。尚未读到真实收款已启用的API证明，也未保存live密钥或收款。
- Cloudflare已登录账号的R2页面确认尚未订阅，当前应付$0、含免费额度、超额按量收费及自动续订；已停在订阅确认按钮前等待用户办理。本页事实不证明R2桶已经建立。

## 已实现的业务代码

- 独立私有schema选择、服务器最小权限角色生成器、默认dry-run的首管理员初始化；不创建默认管理员或公共提权接口。
- 原生私有R2读取：SHA-256、条件etag、单Range、错误文件/版次拒绝；账户授权和五分钟链接保持生效。
- 管理后台真实文件上传：原始文件流、服务器SHA-256、审计、对象key防碰撞、版本不可替换；只验证交付，不自动确认发行权。单文件上限32MiB，较大全本音频上传仍待补。
- KARUU/JKJ独立邮件relay或EmailService适配；未确认去重能力的provider仅自动尝试一次，未知结果转人工复核。
- OpenNext scheduled包装保留fetch和全部named exports，通过私有self binding处理通知。无真实cron，调度开关false。
- 创建Checkout失败、返回丢失或数据库保存失败后，安全恢复同一订单与同一Stripe幂等key；跨刷新保留请求key。超过23小时或权利/报价改变时要求原款项核对，不自动解除订单。
- 新单暂停后保留旧款项处理；核当前Session、PaymentIntent、Charge及完整Refund历史，防退款先到误授权益、重复退款与旧响应覆盖新状态。完整退款撤销对应权益；部分/失败状态进入审核。已下载文件不能远程收回。

## 实際验证与边界

最终 `npm test` 129/129；TypeScript与ESLint通过；Cloudflare OpenNext构建及Wrangler dry-run通过。真实Edge五尺寸的C视觉基线回归5/5通过，保持已验收的C设计。

数据库行为使用隔离PGlite真实SQL和专用角色，R2读写使用本地Miniflare实际存储，Stripe签名使用真实SDK；商户/邮件网络为fixture。没有真实sandbox/live扣款、退款、客户邮件、链上操作或生产域名切换。线上绑定与provider端到端验收须另行记录。

## 待接通及未完成

1. 专用数据库角色口令/LOGIN、Hyperdrive实际连接及缓存禁用；数据库结构已存在，Worker仍未接到该角色。
2. R2订阅、私有桶、Worker绑定、真实母文件上传；大于32MiB的全本音频上传路径。
3. 邮件发件域/通道、通知job Secret与实际cron、用户验证邮件及首管理员实际初始化。
4. Stripe商户最终激活及charges-enabled证明、live受限密钥与Webhook Secret、必需事件订阅、真实provider联调。
5. 首批实际本站SKU的发行依据、正式价格、地区、税率、完整成本和组合/升级价；示例49SEK不作为售价。详见 [准备矩阵](C_BUSINESS_READINESS.md)。
6. 真实游戏服务器适配和KRU受控签名/预算/发放仍未实现，不影响将来具备条件的普通法币图书购买。

正式生产版本仍须独立恢复/兼容验证与发布回执。审查站更新只是部署已验证工程，不代表真实收款或正式生产升级完成。
