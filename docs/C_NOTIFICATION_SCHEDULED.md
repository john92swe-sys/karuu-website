# Cloudflare 定时业务邮件处理入口

最初核对日期：2026-10-13；2026-10-14补正：审查站已接通 PrivateEmail SMTP、私有 R2 和数据库，`john@karuu.net` 已完成注册验证并真实登录管理员后台，job Secret 已保存到服务器。root 已通过官方 remote `--test-scheduled` 在实际 self binding 上执行空 outbox 处理成功；该探针没有生成或发送业务邮件，也没有发布或改变当时活动版本。

本轮仅把审查站配置改为 `KARUU_NOTIFICATIONS_SCHEDULED_ENABLED=true`、`triggers.crons=["*/5 * * * *"]`，供 root 统一发布。**配置文件中的启用不证明 Cron 已在云端生效；正式 Cron 传播和定时事件实测仍须 root 发布后核验。** 当前线上版本、发布结果及凭据接通状态见最新回执。

## 实现与边界

`cloudflare/worker.mjs` 是 `wrangler.jsonc` 的新 main，导入每次 OpenNext 构建生成的 `.open-next/worker.js`，保留默认 fetch 与其他 handler，并 `export *` 保留实际 Durable Object named exports。没有修改生成文件或 Next 路由。[OpenNext 官方 Custom Worker](https://opennext.js.org/cloudflare/howtos/custom-worker)明确提供这种包装方式；当前安装版 1.20.10 的生成入口只有 fetch，以及 DOQueueHandler、DOShardedTagCache、BucketCachePurge 导出。

新 `scheduled` 只有 `KARUU_NOTIFICATIONS_SCHEDULED_ENABLED === 'true'` 才执行。本轮审查站配置启用每 5 分钟处理；运行时开关为 false 或缺失时仍不调用私有任务。启用时还必须有 `WORKER_SELF_REFERENCE.fetch` 与合法的 `KARUU_NOTIFICATION_JOB_SECRET`（32–256 个可打印、无空白 ASCII 字符）；缺项返回固定配置错误且不调用接口。

目标保持 `karuu-c-review-20261013`，部署环境 `preview`，没有生产 routes。收款、真实商业批准、税务、发行及法律五个开关继续全部为 false。定时处理不授权收费、不创建付款，也不会激活商品。实际 Cloudflare 账号仍为 Free；如官方部署因账户 Cron 限额拒绝配置，应停止该发布并报告，不自动升级付费。

入口通过**现有私有 service binding**发送一次 POST 到固定 `https://karuu.internal/api/internal/notifications`，仅设置 Bearer job credential，不使用用户、事件或环境提供的 origin，也没有 global fetch、Cookie、请求参数或外网 fallback。`karuu.internal` 是内部请求的字面 hostname，**未创建 DNS、域名或公网服务**；service binding 决定实际执行 Worker。实际 Next route 是 `src/app/api/internal/notifications/route.ts`，仍由原 `deliverNotifications()` 负责 secret 校验、数据库领取、品牌路由与回执。

请求使用 manual redirect 与 5 分钟超时；不跟随重定向，不在包装入口内重试。`ctx.waitUntil` 记录同一任务，handler 同时等待完成；非 200、非法计数、失败或需人工 review 均为固定 `notification_job_failed`，不日志响应、收件人、品牌内容或密钥。[Cloudflare Scheduled Handler](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/)说明失败任务可在 Cron Past Events 中观察；[HTTP service binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/http/)规定通过绑定 `fetch(Request)` 调用目标，人工新建 Request 必须有完整 URL。

成功只表示该次私有处理的 provider-accepted 计数正常；**不宣称邮箱送达**。本轮已新增order_delivery并改为逐条认领，旧lease不能写新结果；未确认 provider idempotency 的品牌仍只尝试首次，超时/lease 过期后保持人工 review，不随 cron 自动重复发送。支持 dedupe 的品牌仍须自身配置 `MAIL_IDEMPOTENCY_CONFIRMED=true`；header 存在不会自动认定去重能力。

## 本地验证与线上缺项

`node --test scripts/test-notification-scheduled.mjs` 本轮 **10/10 通过**，使用实际 wrapper 源码和隔离 OpenNext/service fixtures，验证审查站精确目标、每 5 分钟 Cron 配置、五个商业开关关闭，以及 fetch 与 named exports、disabled/缺绑定/非法 secret、固定路径及 Bearer、无外网/重定向/内部重试、generic error、job count contract 和 review 状态。该测试加入 package test 列表。测试没有读取真实 process secrets，也不执行真实数据库或邮件接口。

root 负责本轮发布及正式读回：核对 self binding 精确指向部署本体、数据库/R2/品牌邮件与 job Secret 均保留、五个商业开关继续关闭，再检查 Cron 配置传播及真实定时事件的成功/失败记录。空 outbox 远程 scheduled 探针已通过，但它不证明付款后交付邮件、定时事件传播或实际邮件送达；这些仍需要各自受控实测和回执。**本子任务没有执行部署、浏览器、数据库或凭据操作。** 两个 Worker 的现有资源边界与正式站原版本仍以正式读回为准。
