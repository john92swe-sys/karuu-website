# 官网服务器专用PostgreSQL角色准备

2026-10-14更新。用户已批准在选定Supabase项目 `gngdffjluzcsouzpvquq` 的新 `karuu_commerce` schema建立受限server账号并配置Cloudflare review资源。初始阶段22表/22RLS/version1及公开API角色零权限已核验；第二阶段增加56条server-only策略，既有public四表/private一表不变。

角色阶段已由ROOT通过官方迁移 `karuu_private_runtime_role_v1_20261013` 实际应用。原karuu_web持权角色保持NOLOGIN/NOBYPASSRLS/NOINHERIT、无外部业务权限、outbound组0；56策略仅TO该角色。10月14日增加独立LOGIN成员karuu_worker_login，继承=true、SET/ADMIN=false，所有五项安全GUC及连接上限10在登录角色单独设置。没有复制/放宽56策略。生成器仍仅用于首次创建，不回放既有角色。

## 实际文件与最小权限

- `scripts/lib/commerce-runtime-role.mjs`：固定role `karuu_web`，必须通过第一阶段原owner/来源/结构权限fingerprint；同名role已存在一律拒绝，不自行复用或修复。
- `scripts/prepare-commerce-runtime-role.mjs`：默认生成strict review SQL；显式 `--allow-existing-platform-statistics` 生成ROOT已批准的两视图例外版本。
- `scripts/test-commerce-runtime-role.mjs`：9项PGlite权限/RLS/SQL验证。
- `work/supabase/karuu-runtime-role-platform-statistics.sql`及同名JSON：ROOT已应用的SQL来源，SHA256 `7f4ce867a92cf8ab0beb86cbed0764d2e3b743d8e239fc7d4c51a77ac47b9b52`；没有任何secret。

角色stage为NOLOGIN、PASSWORD NULL、NOSUPERUSER、NOCREATEDB、NOCREATEROLE、NOINHERIT、NOREPLICATION、NOBYPASSRLS、connection limit=10。不拥有schema/表/函数/数据库，不授TRUNCATE、REFERENCES、TRIGGER、MAINTAIN或GRANT OPTION，不授任何组成员身份，不建默认privilege的自动未来表权限。明确只对karuu_commerce授予USAGE，search_path为 `karuu_commerce,pg_catalog,pg_temp`，row_security=on及短语句/锁/空闲事务超时。

22表都有SELECT策略；其余权限按当前server查询精确设置，共56条命令策略，**全部仅TO karuu_web**。这是可信服务器角色的全站交易权限，账号与品牌隔离仍由服务端已验证会话/管理员检查及查询条件执行；不会把DB角色/连接信息交给浏览器或Supabase Data API用户。

| 数据范围 | 额外写权限 |
| --- | --- |
| schema版本 | 无，仅SELECT |
| users | INSERT(id,email,display_name,password_hash)，UPDATE(password_hash,verified_at)；不能写role/brands/admin |
| sessions/verifications/password_resets | INSERT/DELETE；支持已编码验证/注销/重置 |
| rate_limits、assets、skus、creations、costs、orders、entitlements、inquiries、outbox | 当前业务所需INSERT/UPDATE，无DELETE |
| payment_events、audit、point_ledger、point_operations、game_reward_claims | INSERT追加，无UPDATE/DELETE |
| game_funding | UPDATE(id)仅满足FOR UPDATE锁权限，UPDATE政策USING(true)/WITH CHECK(false)，实际任何资金记录修改都拒绝；无INSERT/DELETE |
| game_campaigns | 只UPDATE(used_units)，无创建活动/改总预算 |
| kru_records | 只UPDATE(state)用于既有撤销语句，无新增记录/改钱包或数量 |

SELECT/INSERT/DELETE及常规UPDATE分别有对应的USING/WITH CHECK，避免RETURNING/upsert/锁查询因缺SELECT或UPDATE政策失效。余额原语获得所需SQL能力不代表公开游戏充值或KRU适配已经启用。

## 操作者治理与初始迁移边界

PostgreSQL16+非superuser CREATEROLE操作者会取得新角色的ADMIN edge。ROOT明确采用**仅creator→karuu_web ADMIN=true、SET=false、INHERIT=false**的治理边界，保留后续安全密码/LOGIN管理能力；runtime自身零outbound membership，不能继承/SET其他角色，尤其不授pg_monitor/pg_read_all_stats。这个incoming管理edge不向runtime增加其他业务权限。

生成器只在当前事务清空 `createrole_self_grant`，让非superuser创建得到ADMIN-only默认edge；superuser分支显式设置同样flags。不会对非superuser重新向自己GRANT ADMIN（PG会报0LP01）；本地真实非superuser fixture已验证创建、后续ALTER ROLE管理及最终权限图。角色guard拒绝任何其他incoming成员或任何outbound组关系。

两阶段均有事务/advisory lock/碰撞检查和实际失败rollback。runtime阶段保持原schema来源comment，不把增加策略后的fingerprint伪装成初始baseline；因此原v1 bootstrap有意拒绝后续回放。角色generator也只用于首次创建，碰到既有karuu_web即停止；正常更新/轮换需独立审核流程。

## 两个既有平台统计例外与实际核验

迁移前只读官方Supabase元数据表明：karuu_web当时未检出；PUBLIC对其他业务表没有已检出的DML；已有 `extensions.pg_stat_statements` 和 `extensions.pg_stat_statements_info` 是PUBLIC SELECT视图。ROOT允许精确保留这两个平台统计面，不更改其ACL，不允许整个extensions schema的例外。随后ROOT已建立karuu_web并按上述限制回读，不应把准备回执里的roleExists=false当作当前状态。

已读取**view定义、函数/extension metadata**，没有读取统计行值或任何客户/其他用户query文本：extension `pg_stat_statements`=1.11；视图只依赖自身和对应同名C函数；函数security-invoker、native library `$libdir/pg_stat_statements`，stats入口 `pg_stat_statements_1_11`、info入口 `pg_stat_statements_info`；stats/info有既有PUBLIC EXECUTE，reset函数没有。生成SQL进一步要求函数精确签名/entrypoint/extension成员及视图只具这些依赖；同名自建/被替换的业务视图、其他namespace对象、其他统计写权限都拒绝。若平台升级extension或对象变化，必须重新核验。

依据[PostgreSQL pg_stat_statements官方说明](https://www.postgresql.org/docs/current/pgstatstatements.html)，普通非superuser且不具pg_read_all_stats权限的角色能看统计，但其他用户query text/queryid会被隐藏。这里确认的是官方行为合同和现有元数据，**未通过读取真实query文本做实测**。pg_stat_statements不是“毫无可见统计信息”；不宣称所有系统目录或PUBLIC基础能力为零。PUBLIC对public schema的USAGE及数据库通常的CONNECT/TEMP不能通过单角色REVOKE取消，未改这些共享权限；新role的显式persistent授权仅在官网schema。

外围guard仅排除实际PG系统namespace，**不把pgmq/pgsodium等业务/extension schema当系统绕过**；检查target外table/column/sequence有效权限、CREATE/ownership、可执行SECURITY DEFINER及公共统计reset，所有额外业务权限fail closed。对PUBLIC的table/sequence默认grants也拒绝，避免以后自动开放新对象；不改变共享defaults。迁移前只读核验曾遇MCP HTTP transport错误，恢复后重读确认：外部PUBLIC table-like权限仅上述两统计视图SELECT；PUBLIC外部sequence、可达definer、persistent schema CREATE及table/sequence defaults均为0，角色当时尚未建立。原生函数签名/record返回/1.11成员也吻合。ROOT随后实际应用时事务guard再次完整检查，并已回读应用成功的角色和权限。

## 已验证与下一实际操作

`node --test scripts/test-commerce-runtime-role.mjs` **9/9通过**：固定参数/不含凭据、56精准角色策略/属性/权限图/无所有权、真实account upsert/验证/session/catalog/inquiry/order/entitlement/audit SQL、管理员列与财务记录篡改拒绝、funding lock与不可写、最小campaign/KRU列、role/membership碰撞与baseline漂移拒绝/实际失败rollback、外部表/列/sequence/CREATE/definer/defaults（含pgmq）拒绝、未来表无自动权限、非superuser CREATEROLE治理、同名统计伪装拒绝。数据库为D工作区临时PGlite PostgreSQL-WASM，已删除本次创建的精确目录。这9项隔离用例不连接Supabase；真实角色资源已由ROOT另外应用和回读，但真实Postgres密码认证、Hyperdrive、pg_stat_statements C运行/redaction及多连接压力仍未在这些用例中实测。

10月14日官方迁移 `karuu_private_worker_login_v1_20261014`（源码 `db/002-review-worker-login.sql`）实际完成新登录身份。数据库内生成256位随机密码、SCRAM存储，通过已存在的Supabase Vault临时加密保存，使用不回显的内存通道传给用户已确认的Cloudflare Hyperdrive。迁移文本、命令参数、源码、本地文件与回执没有凭据值；保存成功并验证数据库后，仅删除本次专名Vault bootstrap副本。原karuu_web没有改为LOGIN。

已建立Hyperdrive dc1f294919fa401db0a5ff90d969eb04并绑定HYPERDRIVE_COMMERCE，查询缓存关闭、软池上限5；默认require TLS由Cloudflare验证服务器证书。[Cloudflare TLS说明](https://developers.cloudflare.com/hyperdrive/reference/supported-databases-and-features/)。真实远程Worker同一事务确认database=postgres、session_user=current_user=karuu_worker_login、五项GUC、RLS及继承/SET/ADMIN=true/false/false；读取schema version1成功。SET ROLE父角色/owner、其他public/private表/Vault读取、管理员列修改、订单/事件删除、audit修改、建表、关闭RLS、建角色、授父角色共13项全部42501拒绝，并回滚。证据 `work/hyperdrive-runtime-identity-proof.json`，测试预览进程已停止；没有持久测试账号、订单或其他项目行。

本机严格TLS直连未通过，不计入成功；已验证的是Cloudflare边缘实际Hyperdrive连接。统计C函数运行/redaction、压力及备份恢复仍待另行验收。建立真实verified账号后，首管理员仍需精确UUID和审计，不由runtime提权。账户系统没有与Supabase Auth/外平台身份合并。

参考[PG角色创建](https://www.postgresql.org/docs/current/sql-createrole.html)、[PG权限](https://www.postgresql.org/docs/current/ddl-priv.html)、[PG createrole_self_grant](https://www.postgresql.org/docs/current/runtime-config-client.html#GUC-CREATEROLE-SELF-GRANT)、[Supabase角色](https://supabase.com/docs/guides/database/postgres/roles)。数据库登录/邮件/文件/支付联调及现有商用条件仍分别核验，支付批准false与游戏/KRU关闭状态不变。
