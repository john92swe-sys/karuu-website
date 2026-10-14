# 已选 Supabase 项目的官网专用 schema 预演

2026-10-13。用户已明确选择 `john92swe@gmail.com's Project`（`gngdffjluzcsouzpvquq`）。ROOT通过已有官方连接恢复该Free项目，未升级计划。第一阶段已由ROOT通过官方 `supabase_apply_migration` 应用 `karuu_private_commerce_v1_20261013` 并回读验证成功。本文保留初始迁移核验，10月14日ROOT已追加实际受限登录和Hyperdrive接通结果。

## 实际读取结果

官方 `get_project` 返回 **ACTIVE_HEALTHY**。`list_tables` 和仅SELECT的系统目录查询确认：

| 既有schema | 已有表 | RLS |
| --- | --- | --- |
| public | social_connections、social_publish_logs、reflex20_scores、reflex20_events | 四表均开启 |
| private | reflex20_revoked_tokens | 开启 |
| karuu_commerce | 迁移前未检出；ROOT应用后22表 | 22表全部开启 |

没有读取业务行值、账号密码或连接密钥。列表的rows=0属于数据库估计，不能据此断言不存在客户记录。`private`属于已有Reflex20业务，不复用。其schema当前允许anon/authenticated USAGE；public默认ACL有6条，均限定public、来自postgres/supabase_admin的表/序列/函数权限，未检出全局default ACL条目。这些现有对象、ACL及默认权限不在官网迁移的改动范围。

现有API exposed schemas配置、备份恢复保障、Worker适用连接方式/最小权限角色及凭据仍未核实；metadata健康不等于官网数据库已接通。

## 可审阅的实际SQL

执行 `node scripts/prepare-commerce-schema.mjs` 只写文件，不导入数据库客户端，也不接受服务URL：

- `work/supabase/karuu-commerce-schema.sql`：待ROOT审阅/执行的完整SQL。
- `work/supabase/karuu-commerce-schema-manifest.json`：目标、22表、4业务索引、source/SQL SHA256及未应用声明。
- `scripts/lib/commerce-schema-migration.mjs`：只允许专用 `karuu_commerce` 目标，固定审核过的版本1源码hash；base变化必须另行审核，不能自动包装新DDL。

本轮base `db/001-commerce.sql` SHA256为 `b4e894abf4e983cccd4632721aba21129a864b5eb0718fab7fed2d62cd1f56b6`；最终SQL SHA256为 `99a4583a8019aba2e10cea84d3200516eb4b81e891f7942ffe1009a397417ada`。ROOT已应用该SQL，官方migration名称为 `karuu_private_commerce_v1_20261013`；工作区文件保留作为同内容的review证据。

ROOT实际上云后的单次只读verification确认：目标22表、22个RLS=true、version=1、anon/authenticated schema USAGE=false、公开API角色表权限计数0、策略计数0；既有public四表/private一表不变。该结果证明第一阶段私有schema建立成功，**不证明Worker连接、真实账号或交易已经运行**。

SQL将原版外层BEGIN/COMMIT替换成一个事务：先固定 `pg_catalog,pg_temp` 搜索路径、短锁等待/语句超时及迁移advisory lock；确认目标不存在后建专用schema，再以 `karuu_commerce,pg_catalog,pg_temp` 路径执行原22表/4索引与version=1。显式把pg_temp置后，防止临时同名对象优先解析；路径不含public。全部FK保持在目标schema，无catalog/价格/用户/文件seed。

随后撤销PUBLIC及存在的anon/authenticated对目标schema、全部表/序列/函数的权限，并为迁移owner撤销该schema范围的同类default权限。22张表启用RLS，**零公开或运行角色策略**，不FORCE RLS。操作者owner可以迁移/检查；普通非owner角色默认拒绝。没有更改public/private或全局default ACL，没有SECURITY DEFINER函数/公开视图/新角色。若迁移owner存在向PUBLIC/anon/authenticated授予的显式全局default ACL，整事务拒绝，交由操作者审查，不能借官网迁移修改其他系统默认权限。

目标已存在时，只有同owner、同base来源comment、同结构/权限fingerprint及精确version=1才允许回放；schema/table ACL、列/类型/default/not-null、约束、索引、RLS/FORCE及策略漂移都拒绝。未认识的表/视图/函数/独立类型/索引、缺表、错误owner同样拒绝。fingerprint是漂移检查，数据库所有者仍有能力故意改对象及comment；它不声称约束数据库所有者。这个迁移只用于初始bootstrap，**不是正常幂等维保**；下一阶段专用server role的合法ACL/策略会改变fingerprint，旧bootstrap会有意拒绝回放，应使用独立的新迁移。

PostgreSQL有内建的全局PUBLIC函数EXECUTE默认值，**单schema default REVOKE不能删除它**。本base没有函数；未来新增函数必须在同一迁移事务显式撤销该函数的PUBLIC执行权限。当前schema USAGE撤销仍阻止anon/authenticated调用私有函数；不能把本脚本说成永久消除了全局函数默认权限。

## 已执行验证

`node --test scripts/test-commerce-schema.mjs`：**9/9通过**。覆盖22表/4索引/owner/FK、RLS与零策略、public/private同名业务数据及ACL/default权限保留、安全回放、PUBLIC/anon/authenticated有效拒绝、未来表与函数default边界、非owner即使fixture授予表权限仍被RLS拒绝、陌生schema碰撞/显式全局default/实际SQL失败的整体rollback、临时commerce及pg_namespace/pg_roles影子表、结构/索引/策略/RLS/权限漂移拒绝，以及管理员工具仅针对配置schema。

管理员CLI已支持 `KARUU_DATABASE_SCHEMA=karuu_commerce`，事务内固定安全搜索路径，预览与审计记录schema。`node --test scripts/test-commerce-admin-bootstrap.mjs`重新运行 **8/8通过**；未真实授权任何账号。

所有数据库是D工作区 `work/commerce-schema-tests/schema-*` 与 `work/commerce-admin-tests/bootstrap-*` 的隔离PGlite PostgreSQL-WASM，测试结束已清理。本轮不等于真实Supabase PostgreSQL多连接、PostgREST、安全连接、Hyperdrive缓存、服务角色或Stripe test mode验收。

## ROOT可继续的步骤与仍关闭的范围

第一阶段已经应用并回读。第二阶段ROOT也已通过官方 `karuu_private_runtime_role_v1_20261013` 建立受限NOLOGIN角色并回读56条仅TO karuu_web策略、22RLS、外部既有业务权限0及匿名schema拒绝，见[专用服务器角色说明](C_BACKEND_RUNTIME_ROLE.md)。10月14日新增独立karuu_worker_login受限成员，原角色NOLOGIN保留，已实际建立缓存关闭的Hyperdrive并绑定审查Worker；同一远程事务身份/RLS和13项越权拒绝通过。专用schema保持不暴露给public Data API，备份恢复仍待核验。

运行配置应显式 `KARUU_DATABASE_SCHEMA=karuu_commerce`。真实Worker使用独立karuu_worker_login密码登录并继承karuu_web，仅INHERIT=true，SET/ADMIN=false；不是schema owner/postgres连接后SET ROLE。56条server-only命令策略与列级权限已由ROOT实际应用；9/9本地隔离测试与ROOT fresh元数据回读均通过。登录与绑定的当前事实以10月14日ROOT回执为准。第一阶段SQL本身不给运行角色权限，第二阶段才增加受限服务权限。现有自建邮箱密码账户仍是独立账户系统，没有与Supabase Auth、平台或外站身份合并。

真实DB绑定已验收；邮件验证/通知、私有文件、SKU权利/价格/完整成本/税、真实Stripe沙盒交易/webhook/退款及既有live批准条件继续分别验证。商业批准false、游戏充值与KRU实际执行均未由这次迁移准备开启。

已读本轮[Supabase changelog](https://supabase.com/changelog)、[Securing your API](https://supabase.com/docs/guides/api/securing-your-api)、[RLS官方说明](https://supabase.com/docs/guides/database/postgres/row-level-security)及[PostgreSQL default privileges说明](https://www.postgresql.org/docs/current/sql-alterdefaultprivileges.html)。2026-10-12 changelog中的HTTP TLS CBC cipher退役不改变该DDL合同；实际服务连接仍需独立验证。
