# Cloudflare 定时询盘通知入口

最初核对日期：2026-10-13；2026-10-14补正：包装已部署审查站，job Secret已新增到服务器版本。Cron仍未配置，开关false，没有实际发送邮件；当前版本和凭据接通状态见最新回执。

## 实现与边界

`cloudflare/worker.mjs` 是 `wrangler.jsonc` 的新 main，导入每次 OpenNext 构建生成的 `.open-next/worker.js`，保留默认 fetch 与其他 handler，并 `export *` 保留实际 Durable Object named exports。没有修改生成文件或 Next 路由。[OpenNext 官方 Custom Worker](https://opennext.js.org/cloudflare/howtos/custom-worker)明确提供这种包装方式；当前安装版 1.20.10 的生成入口只有 fetch，以及 DOQueueHandler、DOShardedTagCache、BucketCachePurge 导出。

新 `scheduled` 只有 `KARUU_NOTIFICATIONS_SCHEDULED_ENABLED === 'true'` 才执行。当前公开配置为 `false`，未添加 `triggers`；即使误触定时事件也不自动处理询盘。启用时还必须有 `WORKER_SELF_REFERENCE.fetch` 与合法的 `KARUU_NOTIFICATION_JOB_SECRET`（32–256 个可打印、无空白 ASCII 字符）；缺项返回固定配置错误且不调用接口。

入口通过**现有私有 service binding**发送一次 POST 到固定 `https://karuu.internal/api/internal/notifications`，仅设置 Bearer job credential，不使用用户、事件或环境提供的 origin，也没有 global fetch、Cookie、请求参数或外网 fallback。`karuu.internal` 是内部请求的字面 hostname，**未创建 DNS、域名或公网服务**；service binding 决定实际执行 Worker。实际 Next route 是 `src/app/api/internal/notifications/route.ts`，仍由原 `deliverNotifications()` 负责 secret 校验、数据库领取、品牌路由与回执。

请求使用 manual redirect 与 5 分钟超时；不跟随重定向，不在包装入口内重试。`ctx.waitUntil` 记录同一任务，handler 同时等待完成；非 200、非法计数、失败或需人工 review 均为固定 `notification_job_failed`，不日志响应、收件人、品牌内容或密钥。[Cloudflare Scheduled Handler](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/)说明失败任务可在 Cron Past Events 中观察；[HTTP service binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/http/)规定通过绑定 `fetch(Request)` 调用目标，人工新建 Request 必须有完整 URL。

成功只表示该次私有处理的 provider-accepted 计数正常；**不宣称邮箱送达**。本轮已新增order_delivery并改为逐条认领，旧lease不能写新结果；未确认 provider idempotency 的品牌仍只尝试首次，超时/lease 过期后保持人工 review，不随 cron 自动重复发送。支持 dedupe 的品牌仍须自身配置 `MAIL_IDEMPOTENCY_CONFIRMED=true`；header 存在不会自动认定去重能力。

## 本地验证与线上缺项

`node --test scripts/test-notification-scheduled.mjs` **10/10 通过**，使用实际 wrapper 源码和隔离 OpenNext/service fixtures，验证 fetch 与 named exports、disabled/缺绑定/非法 secret、固定路径及 Bearer、无外网/重定向/内部重试、generic error、job count contract 和 review 状态。该测试加入 package test 列表。Node 语法检查与入口 targeted ESLint 也通过。没有读取真实 process secrets，也不执行真实数据库或邮件接口。

真正启用仍需要 ROOT 统一完成 OpenNext build/dry-run，核对 self binding 精确指向部署本体、Worker 数据库与独立品牌邮件通道接通、受控 job secret、试验询盘持久化与 accepted/review 回执及失败监控。然后在明确运营配置中设置 schedule flag 和实际 Cron Trigger；**本轮没有做这些线上操作**。两个 Worker 的现有资源边界与正式站原版本仍以正式读回为准。
