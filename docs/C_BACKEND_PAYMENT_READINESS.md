# 付款、退款与履约核验

2026-10-14接续更新：本地服务端修复和隔离回归已完成，未向Stripe创建付款或退款、未向客户发信。用户已完成开户与本人验证；10月13日15:31 UTC真实商户API确认收款/提现能力已启用。受限live密钥和签名Secret已保存到两台Cloudflare Worker，正式Worker仅暂存；审查站已激活匹配配置并通过正确/错误签名入口检查。接收端仍暂停，真实订单与交付联调尚未完成。

## 已实现的边界

- 新Checkout仍经过当前支付、市场、权利、完整成本、税务与live批准门。处理已有资金的服务使用 `stripeClient({existingPayments:true})`，暂停新销售不再意外停掉已有支付事件、退款或商户确认的过期订单关闭；仍要求匹配的test/live密钥和事件模式。
- `payments.ts`保留原导出路径，实际实现位于 `payment-reconciliation.ts`。原始请求体通过Stripe SDK异步签名校验、300秒时间容忍与SubtleCrypto provider；不会按浏览器成功返回记账。
- 商户Session的mode、environment、order/user metadata、client_reference_id、金额和币种必须匹配不可变订单；还核PaymentIntent身份、succeeded/amount_received和已paid/captured的Charge及capture金额。正确签名事件可恢复丢失的Session数据库绑定，不能覆盖另一个已绑定Session。
- 查完整分页Refund资源，仅累计 `succeeded` 金额；`pending` / `requires_action` 为待处理，`failed` / `canceled` 为复核，未知状态或不一致资源拒绝。退款先到或晚到的付款事件不为已退款/待退款/复核订单新发权益。只有已确认累计全额退款才撤销该订单的精确权益；部分退款和失败退款保留已有权益等待经营者处理。
- 收款与退款使用相同user→order锁顺序。事务前读取的订单 `updated_at::text` 与锁后版本必须相同，保留微秒精度；旧商户快照不能覆盖同金额的新pending、较新的全额退款，或银行后来退款失败后的review。拒绝时回滚事件去重记录，允许重试。已审计成功的具体Refund后来失败可使累计金额减少，但不会自动恢复已撤销下载权限。
- 管理员 `request_refund` 先核商户现有资源；已全额退款/已有pending会在同一锁定事务同步本地状态再返回，不再次创建退款。新尝试以审计里的稳定requestKey和金额调用Stripe；响应未知在23小时内重用原参数/原key，超过窗口拒绝并要求对账。只有原Refund明确failed/canceled才能新建尝试key。后到API错误或失败响应仅在该尝试key及写入后版本都没变化时标review，不覆盖较新webhook或新尝试。
- 管理员关闭过期Checkout同样核merchant环境、Session精确订单/账号/金额/币种，确认expired+unpaid后依user→order锁核当前仍为原Session的pending订单；已改变状态时拒绝，不误报告cancelled。
- 所有退款状态停止该订单仍未执行的KRU记录。没有新增链上签名、游戏充值、资金兑换或跨账户权益。

## 必需的商户事件配置

Webhook endpoint是 `/api/payments/stripe`。除Checkout `completed`、`async_payment_succeeded`、`async_payment_failed`、`expired` 和 `charge.refunded` 外，还必须订阅 `refund.created`、`refund.updated`、`refund.failed`。既有收款未结清时必须保留匹配环境的server-only密钥、Webhook secret与服务可用性。只暂停新Checkout，不能删除事件/audit来重放履约。

Stripe官方说明退款可能pending、requires_action或失败，成功的退款也可能因银行后续反馈失败，因此Charge累计数或退款创建API返回不能代替完整生命周期确认。[Stripe refunds](https://docs.stripe.com/refunds)；支付履约需要服务器事件和幂等处理，包括延迟付款。[Stripe Checkout fulfillment](https://docs.stripe.com/checkout/fulfillment)

## 实际验证

`node --test scripts/test-payment-reconciliation.mjs`：**17/17通过**。测试建立原始22表专用schema与56条server-only策略，应用程序真实SQL通过 `SESSION AUTHORIZATION karuu_web` 执行；采用实际Stripe SDK HMAC生成/异步校验签名。覆盖暂停销售、重复事件、精确权益、丢失绑定、退款先到、退款五种状态、完整分页、部分/全额退款、银行失败、三种旧快照并发、稳定key恢复/过期拒绝、管理员现有退款同步、同key/不同key的API延迟响应，以及精确过期订单关闭。

`node --test scripts/test-commerce.mjs`：**18/18通过**。原provider fixture补全Session/PaymentIntent/Charge/Refund真实字段与查询接口；保留重载购物袋对同一pending订单的安全复用，不增加create次数。TypeScript与修改的三份server文件ESLint通过。

所有数据库在D工作区 `work/payment-reconciliation-tests/payment-*` / `work/commerce-tests/isolated-*` 的隔离PGlite PostgreSQL-WASM目录，本轮已清理。SESSION AUTH用于权限测试，不是Supabase密码登录或真实多连接压力验收。Merchant、邮件、文件服务资源均为fixture，付款新测试禁止全部外网。**没有真实Stripe sandbox/live扣款、退款或外部Webhook验收**。已加入 `npm test`，独立命令 `npm run test:payment-reconciliation`。

## 尚待实际运行验证

主任务已经在选定Supabase真实项目建立22表私有schema与受限NOLOGIN角色，见 [schema说明](C_BACKEND_SCHEMA_MIGRATION.md) 和 [runtime角色说明](C_BACKEND_RUNTIME_ROLE.md)。这不等于Worker身份登录、Hyperdrive缓存、商户或媒体链路接通。

商户能力、受限Stripe服务器凭据和签名接收端已经配置；仍须完成数据库受限登录/Hyperdrive与文件/发件绑定、启用已暂停接收端、测试环境实际交易/退款；逐商品核价格、完整成本、发行权/版次/真实母文件SHA、私有交付与税务。法律、税务、发行与新销售开关保持既有核验要求。签名检查使用本地签署的未订阅检查事件，正确签名200并忽略、错误签名400，未产生商户订单或资金流；不作为Stripe官方交付或业务数据库验收。
