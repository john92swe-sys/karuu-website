# 首次管理员授权工具与真实运营缺口

2026-10-13，基于 `ada2b5173fee8c3f3bc4d3d89ad0669bf98e3430` 的现有PostgreSQL schema/auth/admin实现补齐。没有更换D1、建立账户、连接真实DB、发邮件、付款、部署或开启商业批准。C页面/图片/布局不变。

## 已独立实现

原操作说明要求数据库所有者手写UPDATE和audit，容易漏审计、错品牌或保留旧会话。新增：

- `scripts/commerce-admin-bootstrap.mjs`：受控数据库操作CLI，无公开HTTP端点。
- `scripts/lib/commerce-admin-bootstrap.mjs`：输入校验及同一连接上的事务；无Next/Worker运行时依赖。
- `scripts/test-commerce-admin-bootstrap.mjs`：独立8项真实PGlite SQL/CLI测试。

默认dry-run只返回**实际已有账号UUID**、已有/拟授予角色与品牌、待撤销会话数量，不改数据库。必须提供已完成正常邮箱验证的账号、明确品牌（`karuu`、`jkj-plus`或两者）、operator与不少于10字符的授权原因。首次管理员之外的staff增加/撤销/多角色维护不在这个工具范围；只要已有任何admin，就拒绝再次bootstrap。

Apply还必须 `--apply --confirm-user-id` 指定dry-run里的真实UUID。操作先获得固定namespace的事务级advisory lock，检查schema与已有admin，再锁定target user。更新admin/brands、撤销该账号全部旧session、记录 `admin_bootstrap` 审计后共同commit。审计保存operator、数据库连接角色、变更前后品牌、原邮箱验证时间、撤销会话数量；operator文本是经营者注记，不是额外的身份认证。数据库所有者权限才是执行边界。任何已编码步骤失败均rollback；提交响应中断属于结果未知，应查角色/audit，不宣称“肯定没修改”。

支持 `KARUU_DATABASE_SCHEMA`，事务内固定 `目标schema,pg_catalog,pg_temp`，目标标识符严格校验，预览/audit记录schema。兼容历史public fixture；用户选定的Supabase项目必须明确设置 `KARUU_DATABASE_SCHEMA=karuu_commerce`，禁止复用现有private/Reflex20表。

工具**不创建账号、密码或邮箱验证，不生成登录会话**；授权后通过正常verified账号登录。品牌显式指定且精确保存；例如JKJ-only不同时授予KARUU数字订单/成本后台权限。该事务锁只协调遵守工具合同的调用，不约束数据库所有者绕过工具手工执行SQL。

## 使用方式

先让真实注册/验证邮件正常工作，完成schema与backup，再由适当授权的数据库操作者执行。测试/商用数据不得混用。实际邮箱和UUID来自真实已有记录；不能把公用联系邮箱当作已经存在的管理员账号。

`KARUU_ADMIN_DATABASE_URL` 只在受控操作者环境配置，**不回退到应用KARUU_DATABASE_URL，也不得加入Worker、NEXT_PUBLIC变量、源码或命令参数**。远程DSN必须明确 `sslmode=verify-full` 并配置供应商证书信任；工具没有关闭证书验证选项。权限限于现有schema读取、用户role/brands更新、目标session删除及audit写入，不执行建库、migration或schema seed。

```powershell
node scripts/commerce-admin-bootstrap.mjs --help

# 以下.test仅展示语法；替换成已经正常验证的真实账号后才能预览。
$env:KARUU_DATABASE_SCHEMA = 'karuu_commerce'
node scripts/commerce-admin-bootstrap.mjs --email 'operator@example.test' --brands karuu --operator 'Authorized company operator' --reason 'Initial administrator authorization for the verified company account.'

# 检查dry-run的UUID/品牌，再补--apply和--confirm-user-id真实UUID。
# 此说明不包含可复制成实际管理员的默认账号、密码或预置UUID。
```

成功apply返回auditId、sessionsRevoked与applied=true；默认预览返回applied=false。它不会批准收款、SKU分销/税务/法律、私有文件或KRU，不修改现有商业批准false。数据库连接错误只输出固定安全错误，不打印DSN、密码、SQL/provider响应；CLI拒绝credential URL参数。操作脚本不会向外部邮件或支付服务发请求。

## 已执行测试及限度

`node --test scripts/test-commerce-admin-bootstrap.mjs`：**8/8通过**，覆盖默认预览零修改、真实fixture UUID确认、未验证/不存在账号拒绝、JKJ精确品牌、其他账号会话保留、实际SQL audit约束失败的完整rollback、竞争调用与重复拒绝、磁盘重开持久化、TLS/参数边界及CLI错误去敏。数据库在D工作区 `work/commerce-admin-tests/bootstrap-*` 创建并已清理。

PGlite适配器按单引擎串行排队；测试验证实际SQL/事务结果并执行advisory lock语句，但不等于真实PostgreSQL多连接锁等待/压力验收。没有对真实DB执行授权，也没有取得真实verified账号或UUID。provider和数据库恢复后，经营者应先dry-run核对，再按其既有授权实际执行。

## 当前真实运行仍需要的事项

| 领域 | 从代码到真实服务的缺口 |
| --- | --- |
| 数据库/身份 | 用户已选择gngdffjluzcsouzpvquq，ROOT恢复后官方status=ACTIVE_HEALTHY；官网专用karuu_commerce第一阶段迁移已由ROOT官方应用并确认22RLS、version1、公开角色零权限；既有public/private业务不变。10月14日已接通独立受限登录/Hyperdrive并验收缓存关闭、身份/RLS和13项拒绝；backup恢复仍待核验。邮箱验证链路应先工作，bootstrap只能授予既有verified账号 |
| 邮件/询盘通知 | 当前抽象HTTPS relay需要真实provider鉴权/发送域名及指定测试邮箱；私有self-binding的scheduled包装和provider适配已发布，实际发件绑定、job Secret/cron和失败监控仍未配置；provider accepted不等于送达。此工具不重写邮件代码 |
| 私有文件 | 已有账户授权/短时grant/range读取，32MiB内operator上传代码已发布，但真实R2私有对象/版本/哈希、权利与故障恢复联调仍需落实。ROOT负责R2适配；不得把公开书页或封面当母音频/完整文件 |
| 商户/商品 | 正式商户、受限live key/签名及暂停的接收端已配置；独立测试环境真实交易/webhook/退款仍待验收；逐SKU母文件/发行权/KDP Select/价格/市场/税/成本及四项live批准；已有fixture不替代provider验收 |
| 后台持续运维 | 首位admin本轮已可审计授权；后续staff角色维护、全量分页财务导出/退款部分金额、通知scheduler与持续备份恢复仍未由本工具实现 |
| 游戏/KRU | 真实服务器grant/refund合同、签名治理、适用资格及数量/SOL/现金/履约预算；当前资格门与内部点数原语不代表实际发行/兑换器，继续关闭 |

10月13日09:26 UTC的历史官方资源审查表明当时review版本仅有ASSETS、self-reference及公开门禁vars，没有已绑定Hyperdrive/R2/mail/queue/secret。当前OAuth对相关资源list返回API10000，不能据此说账号内资源不存在；需适当权限的拥有者确认可复用资源。这里只记录已核绑定与调用边界，不创建账户/资源或扩大权限。

10月14日当前审查Worker已绑定HYPERDRIVE_COMMERCE及两项Stripe Secret，数据库可用；R2/mail仍未绑定，尚无真实verified用户或管理员。历史绑定检查不得作为当前未接数据库的依据。
