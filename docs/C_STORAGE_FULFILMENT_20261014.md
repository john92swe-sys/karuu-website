# 私有文件、首批商品与交付通知接通记录

核对日期：2026-10-14。这里只记录实际资源与已核版本；不把文件入库、提供者接受邮件或本地测试记为真实收费完成。

## 已落地资源

- 用户已完成 R2 订阅。官网审查私有桶 `karuu-c-review-private-20261014` 位于 EU jurisdiction、Standard，公开访问 Disabled；没有启用 r2.dev 或公开域名。
- 两个正式署名 EPUB 通过官方临时远程预览写入这个桶。R2 原生 SHA-256、大小与条件完整读取再计算的 SHA 全部吻合；临时传输预览已停止，没有发布文件下载接口。
- 实际 Hyperdrive `karuu_worker_login` 连接读取上述资产记录并核 R2 对象；支持普通表锁的探针在回滚事务中通过，没有探针持久数据。缓存仍关闭，不使用不受支持的 advisory lock。
- `KARUU_DELIVERY_SIGNING_SECRET`、`KARUU_NOTIFICATION_JOB_SECRET` 新增为审查 Worker 的服务器 Secret。随机值只经 stdin 到官方命令行，未写聊天、文件、源码或 argv；原 Stripe 两项 Secret 保留。

| 资产 | 正式版 | 文件大小 | SHA-256 |
| --- | --- | ---: | --- |
| A Receipt for What Was Lost / EN EPUB | 1203-credit-7f750d8ceb5d3a3e，J.KARUU | 125370 B | `7018f78aa53eb4bc23dc21bab6f6a59a3ece58cf05e3dd8cbf7c7a849291002b` |
| 末班车的失物单 / ZH EPUB | 1203-credit-7f750d8ceb5d3a3e，J.KARUU | 103097 B | `3e51a1f89d91aaca6539b0ac65d6db8cf4a72bebb490d3ab96ef60a1639b3c96` |

实际证据：`work/r2-approved-ebook-proof.json`、`work/r2-hyperdrive-edition-proof.json`、`work/approved-edition-database-proof.json`。这些是本轮私有对象和数据库回读，不是原演示夹具。

## 首批配置

私有 `karuu_commerce` 中已登记两个 assets、两个 ebook draft SKU、两个 draft 作品与两份成本记录，附两条 bootstrap 审计。完整文件交付核验为 true；发行权最终核验保持 false，SKU/作品仍 draft，市场列表空、税规则空，各项未知成本为 null。没有新增公开作品、订单、用户或假管理员，也没有改变原 C 首页内容。

电子书 USD 1.99、音频 USD 2.99 与非独家广发意图来自媒体项目 `current-publishing-plan.json` 的用户确认（2026-10-13T12:28:29.607927+00:00）。英文正式 EPUB 对应 KDP ASIN B0HMWV1X5Z、KDP Select=false，平台核验时间2026-10-13T13:22:39.094157+00:00。该依据不能外推旧 Key / Last Room / Witness 的排他状态；整体平台/许可核验仍未完整。

中文与英文全本音频已经生成。固定 Qwen CustomVoice 模型 revision 与本机实际模型卡均有 Apache-2.0 许可；代码许可证一致，使用预设旁白而非声音克隆，样段效果有项目原创程序来源。不可沿用旧 SAPI 未清许可记录。最终音频 SKU 仍须关联这些现有来源并完成全本人听审（目前 false）；本轮没有激活音频或读听套餐收费。已确认价格不等于完整成本、市场税务或组合价。

## 交付通知行为

支付签名与实际 merchant / 订单 / 金额 / 币种 / 地区核对完成后，权益、paid 与唯一 `order_delivery` outbox 在同一事务提交。队列使用已绑定账户邮箱；通知入队失败则整次事务回滚，允许原事件可靠重试。客户端成功页不记账。

派发前重核已验证邮箱、账户收件人、paid 且无退款、完整有效权益及精确 HTTPS 账户 origin。正文仅给 `/account` 登录入口，作品名和订单号，不附私有对象地址或下载 grant。退款或权限不符不发通知；提供者接受不等于实际收件箱送达。

每次新认领一条、单轮最多十条；旧 lease 不覆盖新拥有者状态。原生邮件有十秒接受期限；超时可能已经发送，转人工核对，不自动重发。只有实际配置完整且独立确认提供者幂等的 HTTPS relay 可以重试。邮件接受后的数据库 ACK 失败保留审计以便核对。

本轮完整170项回归通过，类型及lint通过。新增原生workerd/R2测试覆盖61.5MB、78.2MB及90MiB完整流式上传/读回，wrong SHA、短长流、断流、并发创建、权限/版次变化与SQL失败恢复；R2 I/O在两次短事务之间，实际对象证明之后才确认delivery。大文件须预登记真实完整SHA；未实现超过90MiB的multipart。SMTP适配的真实workerd/Nodemailer TLS握手仅无凭据，不将它计为AUTH或收件验收。

## 待接通项

首位管理员邮箱已由用户选为 `john@karuu.net`；邮件尚未接通，因此账号注册/验证及精确 UUID 的管理员初始化尚未执行。密码由用户设置，没有默认密码或绕过验证的账户。

Cloudflare 原生 Email Service 向任意顾客发信要求 Workers Paid；Free 只支持账号中已验证的收件地址。Paid 最低 US$5/月，包含每月3000封，邮件超额US$0.35/1000封，其他 Workers 用量另按套餐计费。它是这个原生通道的条件，不是所有邮件方案都必须新增这笔固定月费。[官方邮件价格](https://developers.cloudflare.com/email-service/platform/pricing/)、[Workers 价格](https://developers.cloudflare.com/workers/platform/pricing/)

用户询问费用必要性后，明确选择先复用现有 PrivateEmail，未完成 Workers Paid 订阅。实际临时 Cloudflare Worker 对 mail.privateemail.com:465 的 TLS、EHLO、QUIT 已成功，没有使用凭据、AUTH 或发邮件；证据 work/private-email-worker-connectivity-proof.json。SMTP 应用认证与真实收件验收尚未执行。保留既有公司邮箱 root MX，不开收件路由来替换公司邮箱。Workers Free 的实际认证/邮件 CPU 等资源限额仍需测量，不能承诺整个业务永远无费用。

真实收款与付款通知接收端仍暂停，KRU/游戏资金入口仍关闭。完整成本与目标结余、市场/税务、最终发行许可/条款、提供者 sandbox 的账户—订单—权益—私有交付—退款联调尚未完成。live 目标已经授权，不重复把同一目标当待许可项。
