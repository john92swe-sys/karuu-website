# C 业务邮件适配：实现与配置边界

核验日期：2026-10-13。已新增可选 Cloudflare 原生邮件适配器，保留 HTTPS endpoint/token relay 默认路径。当前 Wrangler 配置、邮件服务、DNS、计划和秘密均未修改，没有发送真实邮件；运行中的 review/production 不因本次未部署的代码而开通邮件。

## 品牌独立配置

| 配置 | KARUU | JKJ-Plus |
| --- | --- | --- |
| 选择原生提供者 | `KARUU_MAIL_PROVIDER=cloudflare` | `JKJ_MAIL_PROVIDER=cloudflare` |
| 精确发件地址 | `KARUU_MAIL_FROM` | `JKJ_MAIL_FROM` |
| 原生绑定名称 | `KARUU_EMAIL` | `JKJ_EMAIL` |
| 默认 relay | `KARUU_MAIL_ENDPOINT` + `KARUU_MAIL_TOKEN` | `JKJ_MAIL_ENDPOINT` + `JKJ_MAIL_TOKEN` |
| relay 去重能力确认 | `KARUU_MAIL_IDEMPOTENCY_CONFIRMED=true` | `JKJ_MAIL_IDEMPOTENCY_CONFIRMED=true` |

未设置 provider 或明确设置 `relay` 时沿用 relay；未知 provider、无合法 HTTPS relay 配置、原生无发件地址/绑定时保持未配置。JKJ 未配置时拒绝发送，不借用 KARUU 的提供者、绑定、发件地址或 relay token。账户验证与密码重置还要求 `KARUU_SITE_ORIGIN`；JKJ 询盘收件负责人仍独立使用 `JKJ_INQUIRY_EMAIL`。

`brandMailConfigured(brand)` 是异步配置能力检查：查提供者、对应品牌值和绑定的 `send` 方法，不发送探测邮件，不核验实际计划/DNS/收件箱。`auth.mailConfigured()`、注册/重置、询盘排队及 `commerce.status().accounts` 已使用其异步结果。实际配置就绪与真实发信验收分别记录。

## 官方原生接口与后续前提

本次依据 Cloudflare 新 Email Service 的结构化 `send({from,to,subject,text})`，成功返回 `messageId`；没有采用 legacy `EmailMessage` 路由方式。当前官方接口没有列出提供者幂等参数，适配器不添加自行假定的 idempotency 字段。[Workers API](https://developers.cloudflare.com/email-service/api/send-emails/workers-api/)（页面更新2026-09-16）。

后续用于账户客户邮件时，需选择仅限制发件人的 `allowed_sender_addresses` 绑定。只有名字、无限制属性的绑定只允许账号中已验证的目的地址，不能据此开通任意客户收件；`destination_address`/收件 allowlist 也不能当成客户邮件通道。[Send bindings](https://developers.cloudflare.com/email-service/configuration/send-bindings/)（页面更新2026-06-09）。

向任意客户地址发信要求 **Workers Paid** 及已在 Email Service 接入的发送域。当前账号是否已有合适计划、发送域/DNS状态、配额及计费责任仍须核验；本轮没有升级计划、开通服务或配置 DNS。[Pricing](https://developers.cloudflare.com/email-service/platform/pricing/)（页面更新2026-06-09）。

下面只是后续审核使用的绑定形状，示例地址不能直接当作已验证真实发件人。本轮没有把它写入 `wrangler.jsonc`：

```json
{
  "send_email": [
    {
      "name": "KARUU_EMAIL",
      "allowed_sender_addresses": ["noreply@karuu.example"]
    },
    {
      "name": "JKJ_EMAIL",
      "allowed_sender_addresses": ["noreply@jkj.example"]
    }
  ]
}
```

## 回执与自动重试边界

`sendBrandMail` / `auth.sendMail` 返回：

```ts
{ accepted: true, provider: 'relay' | 'cloudflare', messageId: string | null, providerIdempotency: boolean }
```

这是提供者接受回执，没有 `delivered` 声明。原生需有有效 `messageId` 才返回接受；提供者异常或 legacy/错误回执保持失败，不回退到其他品牌。relay 保留原 JSON payload 与可选 `Idempotency-Key` 请求头，但仅本品牌确认去重合同的开关为真才标记 `providerIdempotency:true`。原生及未知提供者始终为 false。

导出的同步 `brandMailSupportsIdempotency(brand)` 只检查品牌的 runtime 配置，用于通知消费者选择领取/重试策略。没有已确认提供者去重时，不能因发送后的 SQL 状态写入失败或 lease 过期而自动再次发送。通知消费者的领取规则由主任务单独处理，本适配任务没有编辑其文件或增加数据库状态枚举。未取得投递/收件证据前，通知状态只可表述为接受或待处理。

## 实际验证

独立 `scripts/test-mail-provider.mjs` 的16项通过：未配置门禁、relay 默认 payload/header、JKJ 独立配置、原生发件地址/绑定、四字段 structured API、错误/legacy回执、异常脱敏、无自动 retry、异步账户/SITE_ORIGIN门禁、accounts 布尔与询盘仅排队、显式每品牌去重开关。测试在 VM 中加载真实应用模块，使用隔离环境、mock CF binding/relay/SQL 边界，禁止外部网络；不读取真实进程秘密，也不是真实 SQL 持久化或邮件投递证明。

`tsc --noEmit --incremental false` 及四个相关服务文件的目标 lint 已通过；本子任务未跑第二次构建、未改 `test-commerce.mjs` / package 测试清单、未提交或部署。与主任务的 R2/数据库/通知消费者变化分别合并验收。
