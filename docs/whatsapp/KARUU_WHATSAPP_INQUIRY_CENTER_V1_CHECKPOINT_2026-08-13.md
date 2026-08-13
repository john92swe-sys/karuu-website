# KARUU WhatsApp询单中心 V1｜Checkpoint

日期：2026-08-13
状态：`EXTERNAL_META_ASSET_BLOCKED`
优先级：P0-C

## 当前资产盘点

- GitHub可用仓库：`john92swe-sys/karuu-website`（公开，默认分支main）；`john92swe-sys/kaos-openai-connector`（私有）。
- 本项目采用官网仓库独立分支：`agent/whatsapp-inquiry-center-v1`。
- Sales OS Staging：`karuu-sales-os-staging`，状态ACTIVE_HEALTHY。
- 已确认共享数据模型存在：accounts、contacts、customer_identities、customer_360、inbound_events、conversation_threads、messages、opportunities、suppression_list、channel_accounts。
- 未建立第二套客户数据库。
- 当前连接工具无法读取Meta Business Portfolio / Facebook Page / WhatsApp Business Account资产，因此无法确认现有KARUU Cloud API商务号码；未迁移John个人WhatsApp号码。

## 分支和Commit

- 分支：`agent/whatsapp-inquiry-center-v1`
- 已提交Webhook策略、Meta签名校验、24小时窗口、HOT_LEAD与STOP识别骨架。
- 完整最终Commit以本分支最新SHA为准。

## Preview地址

- 尚未生成可验收Preview。
- Vercel连接本轮返回上游502，未修改Production。

## Meta测试号码状态

- `BLOCKED_EXTERNAL_SETUP`
- 原因：当前无法读取或创建Meta Business Portfolio / WhatsApp Cloud API测试资产，也没有测试号码凭据。
- 未购买号码、未发生Meta付费。

## Webhook测试

已实现：
- GET verify token challenge；
- `X-Hub-Signature-256` HMAC-SHA256签名验证；
- 入站消息解析；
- provider message id作为幂等事件键的设计入口；
- 无签名/错误签名拒绝。

尚未完成真实Meta测试号码回调，因此验收状态：`PENDING_META_TEST_ASSET`。

## AI回复测试

已建立KARUU AI Sales Assistant系统规则：英文优先、可识别买家语言、产品链接、采购字段收集、人工接管，以及报价/MOQ/付款/合同/交期等禁止承诺边界。

OpenAI Responses API真实调用尚未启用，原因是当前阶段没有受保护Preview环境和测试号码链路；没有在代码中写入API Key。

## HOT_LEAD转交测试

已实现HOT_LEAD关键词判定核心，包括MOQ、报价、样品、规格/设计、交期、采购计划、RFQ、会议、供应商/OEM/ODM/private label等。

已确认Sales OS Staging具备opportunities、inbound_events、accounts、contacts等共享表，但本轮没有向Staging写入模拟客户数据，避免在Meta链路未建立前制造伪真实询盘。真实端到端转交状态：`PENDING_META_TEST_ASSET`。

## 去重与STOP测试

- 手机号规范化函数已建立。
- Meta provider message id作为重复Webhook幂等键。
- Sales OS已有accounts.dedupe_key、customer_identities.normalized_value及跨渠道字段，可用于手机号/域名/企业名/邮箱/历史触达去重。
- STOP / unsubscribe / no thanks / do not contact等意图已建立识别规则。
- Sales OS已有suppression_list及contacts/accounts do_not_contact字段，可作为共享抑制层。
- 数据库端真实写入与重复Webhook回放测试：`PENDING_META_TEST_ASSET`。

## 24小时窗口与人工接管

- 已实现客户最后入站时间 + 24小时的服务窗口计算。
- 超窗主动发送路径未建立；模板发送默认关闭。
- 人工接管固定入口：`Talk to John` / `john@karuu.net`。

## 安全边界

- 未在代码、报告或聊天中写入Access Token、App Secret、验证码或客户敏感信息。
- 未建立主动群发路径。
- 未修改Production。
- 未购买号码。
- 未产生付费。

## 当前结论

尚不能申请真实号码上线。唯一外部阻塞是Meta侧资产不可由当前连接直接盘点/配置，因此无法取得Cloud API测试号码并完成真实Webhook、AI回复、HOT_LEAD、STOP和重复Webhook端到端验收。

## John唯一下一步

请在Meta for Developers / WhatsApp Business Platform中创建或打开KARUU用于本项目的官方App，并进入 **WhatsApp > API Setup**，确认页面上已经出现Meta提供的**测试号码（Test number）**。完成后只需回复：`测试号码已出现`。

不要在聊天中发送Access Token、App Secret、验证码、Cookie或密码。

---

Encoding Validation: PASS
UTF-8 Decode: PASS
BOM: NONE
Mojibake Scan: PASS
Chinese Readability: PASS
Final Re-read: PASS
Encoding: UTF-8 (no BOM)
