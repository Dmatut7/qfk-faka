# QFK 发卡系统 — 开发任务清单 (tasks)

> 规则(见 CLAUDE.md):每个任务 实现 → `composer test` 全绿 → 勾选 → `git commit`。
> 金额 / 卡密发放 / 支付回调相关:**先写测试再写实现**。
> 任务粒度尽量小、可独立测试。`★` 标记的为核心模块停顿验收点。

图例:`[ ]` 待办 · `[x]` 完成 · `(TDD)` 必须测试先行。

> **本期范围**(评审采纳的默认取舍,详见 spec §10.5 与 docs/blockers.md):仅易支付/MD5 渠道;游客下单;`max_buy`=单笔上限;卡密明文+去重;**退款编排、发货通知、买家账号、type=2 手动发货、卡密加密** 本期不实现(枚举/字段预留)。如需调整请告知。

---

## M0 — 项目骨架与测试框架 ✅(第一阶段已完成)
- [x] **T0.1** ThinkPHP 6.1 骨架 + Composer(think-orm / think-migration / phpunit ^9)。
  - 验收:`php think version` 正常;`composer install` 通过。
- [x] **T0.2** 双库与环境:创建 `qfk` / `qfk_test`,`.env`(dev)`.env.testing`(test,socket 连接)。
  - 验收:`php think migrate:status` 能连库;测试以 `qfk_test` 运行且有库名护栏。
- [x] **T0.3** 测试框架:`phpunit.xml` + `tests/bootstrap.php`(testing 环境、自动迁移、库名护栏)+ `tests/TestCase.php`(事务回滚隔离 + 模拟 HTTP)。
  - 验收:`composer test` 可运行。
- [x] **T0.4** 健康检查接口 `GET /health` + 集成测试。
  - 验收:返回 `{code:0,data:{status:ok,database:ok}}`,HTTP 200;`HealthTest` 通过。

---

## M1 — 通用基建(响应/异常/常量/基类)
- [x] **T1.1** 统一响应与错误码:`app/common.php` 助手 `apiSuccess($data)`/`apiError($code,$msg)`、错误码常量类 `app\common\Code`。
  - 验收:单元测试断言响应结构 `{code,msg,data}` 与各错误码常量值。✅ 7 tests green
- [x] **T1.2** 全局异常处理:验证异常 → 422+1001;业务异常 `BizException($code,$msg)` → 统一 JSON;404/500 统一格式。
  - 验收:Feature 测试:抛 `BizException` 返回对应 code;非法路由返回统一 404 JSON。✅
- [x] **T1.3** API 基类控制器 `BaseApiController` + 请求参数获取/校验封装。
  - 验收:子类继承可直接返回成功/失败;含一个示例路由的测试。✅(success/fail/params 白名单/validate)
- [x] **T1.4** 工具:`OrderNo` 生成器(唯一)、`Money`(bcmath 封装 add/sub/mul/cmp,scale=2)、`Token`(生成+哈希)。(TDD)
  - 验收:`Money` 单元测试覆盖加减乘与比较的精度;`OrderNo` 唯一性(批量生成无重复);`Token` 哈希可校验。✅ TDD 红→绿(3000 批量无重复、mul 半进位)

## M2 — 数据迁移与模型(基础表)
- [x] **T2.1** 迁移+模型:`system_settings`(字段 `setting_key`/`setting_value`,避保留字)、`admins`。
  - 验收:`migrate:run` 建表成功;模型 CRUD 测试通过;唯一索引生效(重复 setting_key/username 抛错)。✅(BIGINT UNSIGNED PK + utf8mb4)
- [x] **T2.2** 迁移+模型:`merchants`(含 balance/commission 等字段、唯一索引)。
  - 验收:建表与索引正确;模型测试:唯一 username/slug 冲突被拒。✅(DECIMAL 默认 0.00/0.0000、status 常量)
- [x] **T2.3** 迁移+模型:`categories`、`products`(外键、索引)。
  - 验收:外键约束生效(删商户级联);`uniq_merchant_sku` 生效。✅(categories CASCADE、products→merchants RESTRICT、category SET NULL 均验证)
- [x] **T2.4** 迁移+模型:`cards`(取卡索引 `idx_pick`、`uniq_secret`、状态机常量;`secret_hash` 用 `ascii_bin`)。
  - 验收:建表;`uniq(product_id,secret_hash)` 去重生效;状态常量定义。✅(ascii_bin 已确认、cards→products RESTRICT、idx_pick/idx_lock_expire)
- [x] **T2.5** 迁移+模型:`buyers`、`orders`(索引、外键、状态常量)。
  - 验收:建表;`uniq_order_no` 生效;`idx_expire` 存在。✅(cards.order_id→orders SET NULL 补加成功、orders→merchants RESTRICT、status 增 5 异常态)
- [x] **T2.6** 迁移+模型:`payments`、`payment_channels`、`merchant_fund_logs`、`withdrawals`、`access_tokens`。
  - 含 FK:`merchant_fund_logs.order_id→orders`(SET NULL)、`.merchant_id→merchants`(RESTRICT)、`payments.merchant_id→merchants`(RESTRICT);`merchant_fund_logs` 加 `uniq(order_id,type)`;`token_hash` 用 `ascii_bin`。
  - 验收:建表;`uniq(channel,channel_trade_no)`、`uniq_token`、`uniq(order_id,type)` 等关键唯一索引生效;外键级联策略正确。✅ NULL 不去重语义、JSON config、账本只增已验证 —— **M2 完成(13 表全部建好)**

## M3 — 鉴权
- [x] **T3.1** Token 服务:签发(存哈希+过期)、校验、撤销。(TDD)
  - 验收:签发后可校验;过期/撤销后失效;错误 token 拒绝。✅(仅存哈希、revokeAllFor、purgeExpired)
- [x] **T3.2** 平台管理员登录/登出 + `AdminAuth` 中间件。
  - 验收:正确密码登录得 token;错误密码 2001;受保护路由无 token 返回 401。✅(含登出失效、禁用 403、坏 token 拒绝;修复测试harness路由/中间件按请求隔离)
- [x] **T3.3** 商户登录/登出 + `MerchantAuth` 中间件;冻结商户拒绝登录。
  - 验收:同上;`status≠1` 商户登录被拒;越权访问他人资源 403。✅(待审/冻结均 403、assertMerchantOwnership、bearer 提取抽为 trait)
- [x] **T3.4** 平台创建商户 / 商户初始账号 + 改密。
  - 验收:管理员可建商户;商户改密后旧密码失效。✅(建商户需 admin 鉴权、重名/弱密拒绝、改密吊销旧令牌)—— **M3 鉴权完成**

## M4 — 商品与卡密管理(商户后台)
- [x] **T4.1** 分类 CRUD(商户级,鉴权+归属校验)。
  - 验收:增删改查正常;操作他人分类 403。✅(开启 route_complete_match 修复 :id 路由被吞;列表仅本商户)
- [x] **T4.2** 商品 CRUD + 上下架 + 限购字段。
  - 验收:CRUD/上下架可用;字段校验(price>0、min/max 合法)。✅(分类归属校验、有卡商品禁删、越权403)
- [x] **T4.3** 卡密批量导入(文本分行)、列表筛选、作废、删除未售。(TDD: 去重与计数)
  - 验收:导入 N 行得 N 张未售卡;重复卡密按 `uniq_secret` 跳过并报告;`products.stock` 同步;作废/删除仅作用于未售卡。✅ TDD红→绿(行内+库内去重计数、stock 相对增减、仅未售可作废/删)—— **M4 完成**

## M5 — 买家前台浏览与下单(发卡核心) ★停顿点 1
- [x] **T5.1** 商店与商品浏览:`GET /s/{slug}` 商品列表、`GET /buyer/product/{id}` 详情(仅在售)。
  - 验收:仅展示在售商品与正确库存;下架商品详情 404/下架提示。✅(冻结店铺隐藏、下架商品 3001)
- [x] **T5.2 (TDD)** 下单 + **并发安全预占卡密**:`OrderService::create()`。严格按 **spec §10.3**:锁顺序 `products→cards→orders`(先 `SELECT products FOR UPDATE`)、`FOR UPDATE SKIP LOCKED` 取卡、`UPDATE ... WHERE status=0` 断言 affected_rows==qty、`stock` 相对扣减(GREATEST 下限0)、死锁(1213)有限次重试、取卡不足报 3002。写订单(expire_at=now+15min),卡 `0→1`,bcmath 算总额。
  - 验收:正常下单返回 `order_no`,卡 `status=1` 且 `order_id` 正确;库存不足 3002;超单笔限购(max_buy)3003;金额 bcmath;stock 相对扣减正确;模拟死锁可重试。✅ 单线程 7 用例绿(并发见 T5.3)
- [x] **T5.3 (TDD) 并发测试(核心)**:必须 **`$useTransaction=false`**(关闭事务隔离、真实提交)+ **多独立 PDO 连接** + **真实并行**(`pcntl_fork` 或并行 barrier 起跑)+ **多轮重复**(≥30 轮)。
  - 验收断言:对"仅剩 M 张"商品 N(>M) 并发下单 → 恰好 M 单成功;**无一卡双占**;`COUNT(cards.status=0)=初始-已占`;`products.stock` 终值==未售卡数;失败单报库存不足。✅ 30轮×8并发抢3卡 + 10轮×6并发各要2张(5卡→2单)全绿;**并发测试当场暴露并修复 OrderNo 跨进程撞号(fork 重置进程内序号→改用 PID 熵)**。"下单与超时释放并发"在 T5.4 验证。
- [x] **T5.4 (TDD)** 订单超时回收:`order:clean` 命令。按 **spec §10.3.6**:关单 `WHERE id=:oid AND status=0`、释放卡 `WHERE order_id=:oid AND status=1`(均校验 affected_rows)、stock 相对回补、行锁+状态重查保证幂等。
  - 验收:过期未付单 → 订单关闭、卡 `1→0`、stock 回补;**重复执行幂等**(第二次无副作用);**不误释放已被推进为 2 的卡**;**下单与超时释放真实并发安全**(15轮 fork:旧单关闭、至多一新买家接手、卡绝不双占)。✅
- [x] **T5.5** 买家订单查询:`order_no + 邮箱` 查状态与已购卡密(未发货不泄露)。
  - 验收:已发货返回卡密;待支付不返回卡密;邮箱不符 403/404。✅(+ 公开下单端点 /buyer/order;邮箱不符403、未知单404)—— **M5 卡密发放完成**

> **★ 停顿验收点 1 — 卡密发放模块**:运行全部测试(含并发测试)全绿后停止,等待人工验收。

## M6 — 支付对接(渠道抽象 + 回调) ★停顿点 2
- [x] **T6.1** 渠道抽象:`PayDriverInterface`(buildPay/verify/parse/success/fail)+ `PayManager`(按 code 取驱动+配置)。
  - 验收:接口与管理器单元测试;未知/停用渠道报 5002。✅(回调侧停用渠道仍可取)
- [x] **T6.2 (TDD)** 首个驱动:易支付/MD5 `EpayDriver`,实现 `buildPay`(签名)+ `verify`(验签)+ `parse`。
  - 验收:**验签测试**:构造正确签名验签通过;错误/缺失签名拒绝;签名算法与字段排序正确。✅ TDD红→绿(篡改/缺签/错误密钥全拒、buildPay 自洽验签)
- [x] **T6.3** 发起支付:`POST /buyer/order/{no}/pay` → 校验订单待支付+未过期 + **渠道 status=1** → 写 `payments`(待支付,唯一 payment_no)→ 返回跳转/二维码参数。
  - 验收:待支付订单可发起;已支付/已关闭/过期被拒(4002/4003);停用渠道不可发起(5002);生成唯一 `payment_no`。✅
- [x] **T6.4a (TDD)** 结算计算纯函数:`SettlementService::calc(total, commission_rate)` → {佣金=bcmul, 入账=bcsub},scale=2。
  - 验收:`commission_rate=0.0588` 等带小数比例下佣金/入账精度正确、佣金+入账==total(bccomp)。✅ TDD
- [x] **T6.4b (TDD)** 回调入口 `POST /pay/notify/{channel}`,严格按 **spec §10.4**:验签 → **归属校验**(order_id/merchant/channel/out_trade_no,不符 5004)→ 金额校验(实付==total 且 ≥amount,仅 CNY)→ 订单行锁内重查 → **发货数量守恒**(锁定卡数==quantity,affected_rows 断言)→ 原子发货 `1→2` + delivered_content + **结算(merchants 行锁 FOR UPDATE + bcadd,流水 uniq(order_id,type) 兜底)** → 正确应答。
  - 验收:成功回调 → 订单已发货、卡 `1→2`、`delivered_content` 写入、商户余额按佣金入账、流水两条且 balance_after 连续、返回成功应答。✅
- [x] **T6.5 (TDD) 回调安全专项(必须全绿才算 M6 完成)**:
  - **验签**:错误/缺失签名 → 不改任何状态、返回失败应答(5001)。
  - **幂等**:同一成功回调投递两次 → 仅发货一次、仅结算一次、卡密不重复消耗、第二次直接成功应答(5003);并发双投同样幂等。
  - **金额篡改**:回调金额≠订单金额 → 拒绝发货并告警(4004)。
  - **归属攻击**:用 A 单回调顶 B 单 / 跨商户 / 渠道不符 → 5004 拒绝。
  - **超时后支付**:订单已超时关闭(status=3)却收到成功回调 → 订单转 4005 异常、payment 记成功、不重复占卡、返回成功应答。
  - **卡不足**:发货时锁定卡 < quantity(被释放/作废)→ 订单转 4005、payment 成功、返回成功应答(不无限重试)。
  - **停用渠道在途回调**:渠道已停用但 payment 已存在 → 回调仍正常验签处理(不拒绝)。
  - 验收:以上全部断言通过。✅(13 用例 + 8轮×6并发幂等)
- [x] **T6.6** 端到端发货链路 Feature 测试:下单 → 发起支付 → 模拟回调 → 前台查询拿到卡密。
  - 验收:全链路一次走通,状态与金额一致。✅

> **★ 停顿验收点 2 — 支付对接模块**:运行全部测试(含验签/幂等/金额篡改)全绿后停止,等待人工验收。

## M7 — 商户后台:订单/资金/统计
- [ ] **T7.1** 订单列表/详情/筛选(归属校验)+ 手动关闭/补发。
  - 验收:仅见本商户订单;补发走发卡服务并记录。
- [ ] **T7.2 (TDD)** 资金:余额、流水分页、申请提现(校验余额、冻结)、提现记录。
  - 验收:提现 `balance→frozen`(bcmath),**`balance+frozen` 总额守恒**;余额不足被拒;并发/重复提现不双花。
- [ ] **T7.3** 统计:销售额/订单数/热销商品(按时间区间)。
  - 验收:统计数与构造数据一致。

## M8 — 平台后台
- [ ] **T8.1a** 商户状态流转:审核(0→1)、冻结/解冻(1↔2)。
  - 验收:状态流转正确;冻结后该商户登录被拒。
- [ ] **T8.1b** 商户管理:改抽佣比例、重置密码、列表搜索。
  - 验收:改抽佣即时生效;重置后旧密码失效;搜索命中正确。
- [ ] **T8.2a** 支付渠道 CRUD + 启停。
  - 验收:渠道增删改;停用后**发起支付端不可选(5002)**,但**已存在 payment 的在途回调仍正常处理**(spec §10.4.6)。
- [ ] **T8.2b** 渠道密钥配置 + 验签自测工具。
  - 验收:配置密钥后可用样例报文自测验签通过/失败。
- [ ] **T8.3 (TDD)** 提现审核:通过/拒绝/打款,资金回滚(拒绝时解冻)。
  - 验收:通过则扣冻结、记流水;拒绝则 `frozen→balance` 解冻;`balance+frozen` 守恒;重复审核不双花。
- [ ] **T8.4a** 平台配置 `system_settings` 读写。
  - 验收:配置读写生效。
- [ ] **T8.4b** 对账报表:跨商户订单/佣金对账(口径:销售额=已支付订单 total 之和、佣金=fund_logs type=2 之和、按 create_time 半开区间)。
  - 验收:报表数额与流水一致(给定构造数据断言具体数值)。
- [ ] **T8.5** 平台跨商户**只读**视图:订单查询、商品查询(风控/客诉,带商户/状态筛选)。
  - 验收:可跨商户检索;非平台角色无权访问。

## M9 — 收尾与加固
- [ ] **T9.1a** 全局中间件:CORS、请求日志。
  - 验收:跨域响应头正确;请求日志记录方法/路径/耗时。
- [ ] **T9.1b** 基础限流(下单 `/buyer/order`、回调 `/pay/notify`)。
  - 验收:窗口内超阈值返回限流码/429(断言计数);正常流量不受影响。
- [ ] **T9.2** 库存/资金对账命令:`products.stock` 以 `COUNT(cards.status=0)` 重算修复;`fund_logs` 累加与 `merchants.balance` 一致性校验。
  - 验收:故意制造漂移后对账命令能检出并修复;一致时无变更。
- [ ] **T9.3** 种子数据:**默认管理员、示例支付渠道建议随 M2/M3 建表即提供**(供 M6 联调);演示商户/商品/卡密留此。
  - 验收:种子可重复执行(幂等);演示数据可下单走通。
- [ ] **T9.4** 文档:README 启动/部署/测试说明;API 简表。
- [ ] **T9.5** 全量测试套件运行并出报告(覆盖核心:发卡并发、回调验签/幂等/金额)。

---

### 进度备注
- 当前阶段:第一阶段(规划 + 骨架)已完成,等待进入第二/三阶段。
- 阻塞问题集中记录在 `docs/blockers.md`。
