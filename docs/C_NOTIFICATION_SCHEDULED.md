# Cloudflare 定时业务邮件处理入口

最初核对日期：2026-10-13；2026-10-14补正：审查站已接通 PrivateEmail SMTP、私有 R2 和数据库，`john@karuu.net` 已完成注册验证并真实登录管理员后台，job Secret 已保存到服务器。root 已通过官方 remote `--test-scheduled` 在实际 self binding 上执行空 outbox 处理成功；该探针没有生成或发送业务邮件，也没有发布或改变当时活动版本。

审查站配置 `KARUU_NOTIFICATIONS_SCHEDULED_ENABLED=true`、`triggers.crons=["*/5 * * * *"]` 已由root通过官方命令行发布。Cloudflare Cron Events实际记录 `2026-10-14T02:20:02Z`、`Success`、CPU `93.913ms`；这是正常定时触发，不是前述远程预览。空队列任务证明私有认证、self binding和数据库链路，未产生购买邮件。账号仍Free，单次成功不证明其持续CPU/负载容量。当前精确活动版本及证据见最新回执。

## 实现与边界

`cloudflare/worker.mjs` 是 `wrangler.jsonc` 的新 main，导入每次 OpenNext 构建生成的 `.open-next/worker.js`，保留默认 fetch 与其他 handler，并 `export *` 保留实际 Durable Object named exports。没有修改生成文件或 Next 路由。[OpenNext 官方 Custom Worker](https://opennext.js.org/cloudflare/howtos/custom-worker)明确提供这种包装方式；当前安装版 1.20.10 的生成入口只有 fetch，以及 DOQueueHandler、DOShardedTagCache、BucketCachePurge 导出。

新 `scheduled` 只有 `KARUU_NOTIFICATIONS_SCHEDULED_ENABLED === 'true'` 才执行。本轮审查站配置启用每 5 分钟处理；运行时开关为 false 或缺失时仍不调用私有任务。启用时还必须有 `WORKER_SELF_REFERENCE.fetch` 与合法的 `KARUU_NOTIFICATION_JOB_SECRET`（32–256 个可打印、无空白 ASCII 字符）；缺项返回固定配置错误且不调用接口。

目标保持 `karuu-c-review-20261013`，部署环境 `preview`，没有生产 routes。收款、真实商业批准、税务、发行及法律五个开关继续全部为 false。定时处理不授权收费、不创建付款，也不会激活商品。实际 Cloudflare 账号仍为 Free；如官方部署因账户 Cron 限额拒绝配置，应停止该发布并报告，不自动升级付费。

入口通过**现有私有 service binding**发送一次 POST 到固定 `https://karuu.internal/api/internal/notifications`，仅设置 Bearer job credential，不使用用户、事件或环境提供的 origin，也没有 global fetch、Cookie、请求参数或外网 fallback。`karuu.internal` 是内部请求的字面 hostname，**未创建 DNS、域名或公网服务**；service binding 决定实际执行 Worker。实际 Next route 是 `src/app/api/internal/notifications/route.ts`，仍由原 `deliverNotifications()` 负责 secret 校验、数据库领取、品牌路由与回执。

请求使用 manual redirect 与 5 分钟超时；不跟随重定向，不在包装入口内重试。`ctx.waitUntil` 记录同一任务，handler 同时等待完成；非 200、非法计数、失败或需人工 review 均为固定 `notification_job_failed`，不日志响应、收件人、品牌内容或密钥。[Cloudflare Scheduled Handler](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/)说明失败任务可在 Cron Past Events 中观察；[HTTP service binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/http/)规定通过绑定 `fetch(Request)` 调用目标，人工新建 Request 必须有完整 URL。

成功只表示该次私有处理的 provider-accepted 计数正常；**不宣称邮箱送达**。本轮已新增order_delivery并改为逐条认领，旧lease不能写新结果；未确认 provider idempotency 的品牌仍只尝试首次，超时/lease 过期后保持人工 review，不随 cron 自动重复发送。支持 dedupe 的品牌仍须自身配置 `MAIL_IDEMPOTENCY_CONFIRMED=true`；header 存在不会自动认定去重能力。

## 本地验证与线上缺项

`node --test scripts/test-notification-scheduled.mjs` 本轮 **10/10 通过**，使用实际 wrapper 源码和隔离 OpenNext/service fixtures，验证审查站精确目标、每 5 分钟 Cron 配置、五个商业开关关闭，以及 fetch 与 named exports、disabled/缺绑定/非法 secret、固定路径及 Bearer、无外网/重定向/内部重试、generic error、job count contract 和 review 状态。该测试加入 package test 列表。测试没有读取真实 process secrets，也不执行真实数据库或邮件接口。

root已完成官方发布、五项Secret与数据库/R2/self binding读回，并核对正常Cron事件Success。支付五门仍false，正式站流量保持原版本。远程空任务与正常空队列定时成功不能替代付款后的通知、任意客户域名投递或持续容量；这些仍须受控实测。两份不同触发方式的证据保留原时间与版本，不相互冒充。
