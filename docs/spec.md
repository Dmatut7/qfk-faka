# QFK 发卡系统 — 规格说明书 (spec)

> 虚拟商品自动发货平台。多商户 SaaS 模式:平台方运营,商户入驻开店、上架商品与卡密,买家(可游客)下单付款后系统自动发货卡密。
>
> 技术栈:PHP 7.4 · ThinkPHP 6.1 · MySQL 9.x(InnoDB)· PHPUnit 9 · think-migration。

---

## 1. 架构与约定

### 1.1 总体架构
- 单应用(`app/`)+ 按角色划分控制器命名空间的 JSON API:
  - `app/controller/buyer/*` —— 买家前台 API(含游客下单、订单查询、商店浏览)
  - `app/controller/merchant/*` —— 商户后台 API
  - `app/controller/admin/*` —— 平台后台 API
  - `app/controller/pay/*` —— 支付异步回调入口(无鉴权,靠验签)
  - `app/controller/Health.php` —— 健康检查
- 业务逻辑集中在 `app/service/*`(Service 层),控制器只做参数校验与编排。
- 数据访问用 think-orm 模型(`app/model/*`)。
- 鉴权用中间件(`app/middleware/*`)。
- 入参校验用验证器(`app/validate/*`)。

### 1.2 目录结构
```
qfk/
├── app/
│   ├── controller/
│   │   ├── Health.php
│   │   ├── buyer/ merchant/ admin/ pay/
│   ├── model/            # think-orm 模型
│   ├── service/          # 业务逻辑(下单、发卡、支付、结算)
│   ├── middleware/       # 鉴权 / 限流 / CORS
│   ├── validate/         # 入参校验器
│   ├── BaseController.php
│   └── ...
├── config/               # 框架与业务配置
├── database/
│   ├── migrations/       # think-migration 迁移文件(库结构唯一来源)
│   └── seeds/            # 种子数据
├── route/app.php         # 路由
├── public/index.php      # 入口
├── tests/
│   ├── bootstrap.php      # 以 testing 环境启动,迁移测试库
│   ├── TestCase.php       # 基类(事务回滚隔离 + 模拟 HTTP)
│   ├── Unit/ Feature/
├── docs/                 # spec / tasks / blockers
├── .env / .env.testing   # 环境配置(dev=qfk, test=qfk_test)
└── phpunit.xml
```

### 1.3 统一 API 响应格式
所有 JSON 接口返回:
```json
{ "code": 0, "msg": "ok", "data": { } }
```
- `code`:`0` 成功;非 0 为业务错误码(见 1.4)。HTTP 状态码:成功 200;鉴权失败 401;无权限 403;资源不存在 404;参数错误 422;服务器错误 500。
- 失败时 `data` 可为 `null`,`msg` 为可读错误信息。

### 1.4 错误码约定(`app/common` 常量)
| 区间 | 含义 |
|------|------|
| 0 | 成功 |
| 1xxx | 通用/参数错误(1001 参数校验失败,1002 资源不存在,1003 状态非法)|
| 2xxx | 鉴权(2001 未登录,2002 token 失效,2003 无权限)|
| 3xxx | 商品/卡密(3001 商品下架,3002 库存不足,3003 超出限购)|
| 4xxx | 订单(4001 订单不存在,4002 订单已支付,4003 订单已关闭/过期,4004 金额不符,4005 订单异常待人工)|
| 5xxx | 支付(5001 验签失败,5002 渠道不可用,5003 重复回调-已处理,5004 支付单归属校验失败)|

### 1.5 金额与时间
- **金额**:数据库 `DECIMAL(10,2)`,单位元;所有加减乘除一律用 **bcmath**(`bcadd/bcsub/bcmul/bccomp`,scale=2),严禁浮点运算;比较金额用 `bccomp`。
- **时间**:模型自动时间戳 `create_time` / `update_time`(`datetime`)。业务时间点(`paid_at`/`delivered_at`/`expire_at`)显式 `datetime`。
- **订单号 / 单号**:`order_no` = `日期 + 13位` 全局唯一字符串;`payment_no` 同理。

### 1.6 鉴权
- 商户后台、平台后台:登录返回 Bearer Token(随机串,**SHA-256 哈希**后存 `access_tokens`,带过期),后续请求 `Authorization: Bearer <token>`。中间件校验并注入当前主体。
- 买家前台:默认游客模式(下单提交联系方式/邮箱);可选注册登录(同样 token)。订单查询用 `order_no + 联系方式` 或登录态。
- 支付回调:**无 token**,安全完全依赖**验签**(见第 7 节)。

### 1.7 密码与密钥
- 登录密码:`password_hash()`(bcrypt)存储,`password_verify()` 校验。
- 卡密内容 `secret`:支持明文或对称加密存储(配置开关,密钥取自 `.env`);本期默认明文 + 唯一指纹 `secret_hash`(SHA-256)用于去重。
- 第三方支付密钥(商户私钥/平台公钥/MD5 key):存 `payment_channels.config`(JSON),`.env` 提供加密盐(可选)。

---

## 2. 数据模型

> 引擎统一 InnoDB,字符集 `utf8mb4_unicode_ci`。金额 `DECIMAL(10,2)`。所有表含 `create_time`、`update_time`(`datetime`,框架自动维护)。外键统一 InnoDB 约束,删除策略见各表。索引命名 `idx_*` / 唯一 `uniq_*`。

### 2.1 admins —— 平台管理员
| 字段 | 类型 | 约束/默认 | 说明 |
|------|------|-----------|------|
| id | BIGINT UNSIGNED | PK, AI | |
| username | VARCHAR(64) | NOT NULL, **uniq_username** | 登录名 |
| password | VARCHAR(255) | NOT NULL | bcrypt |
| nickname | VARCHAR(64) | NULL | |
| status | TINYINT | NOT NULL DEFAULT 1 | 1 启用 / 0 禁用 |
| last_login_at | DATETIME | NULL | |
| last_login_ip | VARCHAR(45) | NULL | 兼容 IPv6 |
| create_time / update_time | DATETIME | | |

索引:`uniq_username`。

### 2.2 merchants —— 商户
| 字段 | 类型 | 约束/默认 | 说明 |
|------|------|-----------|------|
| id | BIGINT UNSIGNED | PK, AI | |
| username | VARCHAR(64) | NOT NULL, **uniq_username** | 登录名 |
| password | VARCHAR(255) | NOT NULL | bcrypt |
| email | VARCHAR(128) | NULL, **uniq_email** | |
| phone | VARCHAR(32) | NULL | |
| store_name | VARCHAR(128) | NOT NULL | 店铺名 |
| store_slug | VARCHAR(64) | NOT NULL, **uniq_slug** | 店铺访问标识 `/s/{slug}` |
| status | TINYINT | NOT NULL DEFAULT 0 | 0 待审核 / 1 正常 / 2 冻结 |
| balance | DECIMAL(10,2) | NOT NULL DEFAULT 0.00 | 可提现余额 |
| frozen_balance | DECIMAL(10,2) | NOT NULL DEFAULT 0.00 | 冻结中(提现/未结算)|
| commission_rate | DECIMAL(5,4) | NOT NULL DEFAULT 0.0000 | 平台抽佣比例 0~1 |
| api_key | VARCHAR(64) | NULL, uniq | 商户 API key(可选)|
| api_secret | VARCHAR(128) | NULL | |
| last_login_at / last_login_ip | DATETIME / VARCHAR(45) | NULL | |
| create_time / update_time | DATETIME | | |

索引:`uniq_username`、`uniq_email`、`uniq_slug`、`idx_status`。

### 2.3 categories —— 商品分类(商户级)
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT UNSIGNED | PK, AI | |
| merchant_id | BIGINT UNSIGNED | NOT NULL, **FK→merchants.id** ON DELETE CASCADE | |
| name | VARCHAR(64) | NOT NULL | |
| sort | INT | NOT NULL DEFAULT 0 | 升序 |
| status | TINYINT | NOT NULL DEFAULT 1 | 1 显示 / 0 隐藏 |
| create_time / update_time | DATETIME | | |

索引:`idx_merchant_sort (merchant_id, sort)`。

### 2.4 products —— 商品
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT UNSIGNED | PK, AI | |
| merchant_id | BIGINT UNSIGNED | NOT NULL, **FK→merchants.id** ON DELETE CASCADE | |
| category_id | BIGINT UNSIGNED | NULL, **FK→categories.id** ON DELETE SET NULL | |
| title | VARCHAR(128) | NOT NULL | |
| sku | VARCHAR(64) | NULL | 商户内唯一 `uniq_merchant_sku` |
| description | TEXT | NULL | 富文本/说明 |
| price | DECIMAL(10,2) | NOT NULL | 售价 |
| type | TINYINT | NOT NULL DEFAULT 1 | 1 自动发卡 / 2 手动发货 |
| stock | INT | NOT NULL DEFAULT 0 | **可售卡密数缓存**,与 cards 表对账 |
| sales_count | INT | NOT NULL DEFAULT 0 | 累计销量 |
| min_buy | INT | NOT NULL DEFAULT 1 | 单笔最小购买数 |
| max_buy | INT | NOT NULL DEFAULT 0 | 单笔最大(0=不限)|
| delivery_message | TEXT | NULL | 发货附言(显示在卡密旁)|
| status | TINYINT | NOT NULL DEFAULT 1 | 1 在售 / 0 下架 |
| sort | INT | NOT NULL DEFAULT 0 | |
| create_time / update_time | DATETIME | | |

索引:`idx_merchant_status (merchant_id, status)`、`uniq_merchant_sku (merchant_id, sku)`、`idx_category (category_id)`。
> `stock` 为冗余缓存,仅供展示与快速判空;**真正库存判定以 cards 表加锁查询为准**(见第 6 节)。

### 2.5 cards —— 卡密(库存核心)
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT UNSIGNED | PK, AI | |
| merchant_id | BIGINT UNSIGNED | NOT NULL, **FK→merchants.id** ON DELETE CASCADE | |
| product_id | BIGINT UNSIGNED | NOT NULL, **FK→products.id** ON DELETE CASCADE | |
| secret | VARCHAR(1024) | NOT NULL | 卡密内容(卡号+密码/兑换码/文本)|
| secret_hash | CHAR(64) | NOT NULL | SHA-256(secret),去重指纹 |
| status | TINYINT | NOT NULL DEFAULT 0 | **0 未售 / 1 已锁定 / 2 已售 / 3 作废** |
| order_id | BIGINT UNSIGNED | NULL, **FK→orders.id** ON DELETE SET NULL | 锁定/售出归属订单 |
| batch_no | VARCHAR(32) | NULL | 批次号(批量导入)|
| locked_at | DATETIME | NULL | 锁定时间(用于超时释放)|
| sold_at | DATETIME | NULL | 售出时间 |
| create_time / update_time | DATETIME | | |

索引:
- `idx_pick (product_id, status, id)` —— **取卡核心索引**(按 product+status 扫描可售卡,`id` 保证有序)。
- `uniq_secret (product_id, secret_hash)` —— 同商品内卡密去重。
- `idx_order (order_id)`。
- `idx_lock_expire (status, locked_at)` —— 释放超时锁定卡的扫描。

**状态机**:`0未售 →(下单预占)1锁定 →(支付成功)2已售`;`1锁定 →(订单超时/取消)0未售`;`0未售 →(商户作废)3作废`。

### 2.6 buyers —— 买家(可选账号)
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT UNSIGNED | PK, AI | |
| email | VARCHAR(128) | NOT NULL, **uniq_email** | 登录/收货标识 |
| password | VARCHAR(255) | NULL | 游客下单为空 |
| contact | VARCHAR(64) | NULL | QQ/手机等备用联系方式 |
| status | TINYINT | NOT NULL DEFAULT 1 | |
| create_time / update_time | DATETIME | | |

索引:`uniq_email`。
> 游客下单不强制建账号;订单冗余存 `buyer_email`/`buyer_contact`,`buyer_id` 可空。

### 2.7 orders —— 订单
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT UNSIGNED | PK, AI | |
| order_no | VARCHAR(32) | NOT NULL, **uniq_order_no** | 业务订单号 |
| merchant_id | BIGINT UNSIGNED | NOT NULL, **FK→merchants.id** ON DELETE RESTRICT | |
| product_id | BIGINT UNSIGNED | NOT NULL, **FK→products.id** ON DELETE RESTRICT | |
| buyer_id | BIGINT UNSIGNED | NULL, **FK→buyers.id** ON DELETE SET NULL | |
| buyer_email | VARCHAR(128) | NOT NULL | 收货邮箱 |
| buyer_contact | VARCHAR(64) | NULL | |
| quantity | INT | NOT NULL | 购买数量 |
| unit_price | DECIMAL(10,2) | NOT NULL | 下单时单价快照 |
| total_amount | DECIMAL(10,2) | NOT NULL | 应付总额 = unit_price × quantity |
| status | TINYINT | NOT NULL DEFAULT 0 | **0 待支付 / 1 已支付 / 2 已发货 / 3 已关闭 / 4 已退款 / 5 异常待人工** |
| pay_channel | VARCHAR(32) | NULL | 选择的支付渠道 code |
| delivered_content | MEDIUMTEXT | NULL | 发货卡密快照(发货时写入)|
| client_ip | VARCHAR(45) | NULL | |
| paid_at / delivered_at | DATETIME | NULL | |
| expire_at | DATETIME | NOT NULL | 未支付过期时间(默认下单 +15min)|
| remark | VARCHAR(255) | NULL | |
| create_time / update_time | DATETIME | | |

索引:`uniq_order_no`、`idx_merchant_status (merchant_id, status)`、`idx_buyer_email (buyer_email)`、`idx_expire (status, expire_at)`(扫描过期未付)、`idx_product (product_id)`。

**状态机**:`0待支付 →(回调成功)1已支付 →(发货完成)2已发货`;`0待支付 →(超时/手动)3已关闭`;`2已发货 →(售后)4已退款`。通常 1→2 在同一回调事务内一气呵成。

### 2.8 payments —— 支付单/支付流水
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT UNSIGNED | PK, AI | |
| payment_no | VARCHAR(32) | NOT NULL, **uniq_payment_no** | 平台支付单号(= 提交给渠道的 out_trade_no)|
| order_id | BIGINT UNSIGNED | NOT NULL, **FK→orders.id** ON DELETE RESTRICT | |
| merchant_id | BIGINT UNSIGNED | NOT NULL, **FK→merchants.id** ON DELETE RESTRICT | 冗余,便于对账;回调时校验 == order.merchant_id |
| channel | VARCHAR(32) | NOT NULL | 渠道 code(alipay/wxpay/epay)|
| amount | DECIMAL(10,2) | NOT NULL | 请求支付金额 |
| status | TINYINT | NOT NULL DEFAULT 0 | 0 待支付 / 1 成功 / 2 失败 |
| channel_trade_no | VARCHAR(64) | NULL | 第三方交易号 |
| paid_amount | DECIMAL(10,2) | NULL | 回调实付金额 |
| notify_payload | TEXT | NULL | 原始回调报文(留证)|
| notified_at / paid_at | DATETIME | NULL | |
| create_time / update_time | DATETIME | | |

索引:`uniq_payment_no`、`idx_order (order_id)`、`uniq_channel_trade (channel, channel_trade_no)`(**回调幂等去重**)、`idx_status`。

### 2.9 payment_channels —— 支付渠道配置
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT UNSIGNED | PK, AI | |
| code | VARCHAR(32) | NOT NULL, **uniq_code** | alipay / wxpay / epay |
| name | VARCHAR(64) | NOT NULL | 显示名 |
| driver | VARCHAR(64) | NOT NULL | 驱动类(如 `EpayDriver`)|
| config | JSON | NOT NULL | app_id/网关/密钥/sign_type 等 |
| status | TINYINT | NOT NULL DEFAULT 1 | 1 启用 / 0 停用 |
| sort | INT | NOT NULL DEFAULT 0 | |
| create_time / update_time | DATETIME | | |

索引:`uniq_code`、`idx_status`。本期渠道为平台级。

### 2.10 merchant_fund_logs —— 商户资金流水(余额账本)
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT UNSIGNED | PK, AI | |
| merchant_id | BIGINT UNSIGNED | NOT NULL, **FK→merchants.id** ON DELETE RESTRICT | 有流水不可硬删商户 |
| type | TINYINT | NOT NULL | 1 订单收入 / 2 平台佣金 / 3 提现 / 4 退款 |
| amount | DECIMAL(10,2) | NOT NULL | 正收入/负支出 |
| balance_after | DECIMAL(10,2) | NOT NULL | 变动后余额(对账)|
| order_id | BIGINT UNSIGNED | NULL, **FK→orders.id** ON DELETE SET NULL | 关联订单 |
| remark | VARCHAR(255) | NULL | |
| create_time | DATETIME | | |

索引:`idx_merchant (merchant_id, id)`、`idx_order (order_id)`、**`uniq_order_type (order_id, type)`**(结算幂等的数据库级兜底:同一订单同类型流水只许一条)。

### 2.11 withdrawals —— 商户提现单
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT UNSIGNED | PK, AI | |
| merchant_id | BIGINT UNSIGNED | NOT NULL, **FK→merchants.id** | |
| amount | DECIMAL(10,2) | NOT NULL | 提现金额 |
| fee | DECIMAL(10,2) | NOT NULL DEFAULT 0 | 手续费 |
| account_info | VARCHAR(255) | NOT NULL | 收款账户 |
| status | TINYINT | NOT NULL DEFAULT 0 | 0 待审 / 1 通过 / 2 拒绝 / 3 已打款 |
| processed_at | DATETIME | NULL | |
| create_time / update_time | DATETIME | | |

索引:`idx_merchant_status (merchant_id, status)`。

### 2.12 access_tokens —— 登录令牌(商户/平台/买家)
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT UNSIGNED | PK, AI | |
| owner_type | VARCHAR(16) | NOT NULL | admin / merchant / buyer |
| owner_id | BIGINT UNSIGNED | NOT NULL | |
| token_hash | CHAR(64) | NOT NULL, **uniq_token** | SHA-256(明文 token)|
| expires_at | DATETIME | NOT NULL | |
| create_time | DATETIME | | |

索引:`uniq_token`、`idx_owner (owner_type, owner_id)`、`idx_expire (expires_at)`。

### 2.13 system_settings —— 平台配置(KV)
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | BIGINT UNSIGNED | PK, AI | |
| setting_key | VARCHAR(64) | NOT NULL, **uniq_key** | 避开 MySQL 保留字 `key` |
| setting_value | TEXT | NULL | |
| create_time / update_time | DATETIME | | |

### 2.14 关系总览(ER)
```
admins ─(运营)─ merchants ─┬─ categories ─ products ─ cards
                            ├─ orders ─ payments
                            ├─ merchant_fund_logs
                            └─ withdrawals
buyers ─(可选)─ orders
payment_channels ─(渠道)─ payments
orders 1—1 active payment(成功后) ; orders 1—N cards(发货)
```

---

## 3. 三端功能清单

### 3.1 买家前台(`buyer/*`,游客可用)
- [展示] 商店首页:按 `store_slug` 看商户在售商品、分类。
- [展示] 商品详情:价格、库存、说明、限购。
- [下单] 创建订单:选商品+数量+邮箱+(可选)联系方式 → 校验上下架/库存/限购 → **预占卡密** → 返回 `order_no` 与待支付信息。
- [支付] 发起支付:选渠道 → 返回支付跳转链接/二维码参数。
- [发货] 支付成功后自动发货;前台轮询订单状态获取卡密。
- [查询] 订单查询:`order_no + 邮箱` 查看状态与已购卡密。
- [可选] 买家注册/登录/订单历史。

### 3.2 商户后台(`merchant/*`,需登录)
- [账号] 登录/登出、改密、查看店铺资料。
- [分类] 分类增删改查、排序。
- [商品] 商品增删改查、上下架、限购、排序。
- [卡密] 批量导入卡密(文本分行)、列表/筛选(按状态)、作废、删除未售卡、库存统计;`stock` 与 cards 对账。
- [订单] 订单列表/详情/筛选、查看发货卡密、手动补发/关闭。
- [资金] 余额、资金流水、申请提现、提现记录。
- [统计] 销售额、订单数、热销商品。

### 3.3 平台后台(`admin/*`,需登录)
- [账号] 管理员登录/登出/改密。
- [商户] 商户审核(待审→正常)、冻结/解冻、改抽佣比例、重置密码、列表搜索。
- [全局商品/订单] 跨商户查看订单、商品(风控/客诉)。
- [支付渠道] 渠道增删改、配置密钥、启停、测试验签。
- [资金] 审核提现(通过/拒绝/打款)、平台佣金统计、全站流水。
- [配置] `system_settings`:站点名、订单超时、默认抽佣、邮件/发货模板等。
- [对账] 卡密库存对账、订单-支付对账报表。

---

## 4. 状态机汇总
- **卡密 cards.status**:`0 未售 / 1 锁定 / 2 已售 / 3 作废`。
- **订单 orders.status**:`0 待支付 / 1 已支付 / 2 已发货 / 3 已关闭 / 4 已退款 / 5 异常待人工`(回调异常态,见 §10.4)。
- **支付 payments.status**:`0 待支付 / 1 成功 / 2 失败`。
- **商户 merchants.status**:`0 待审 / 1 正常 / 2 冻结`。

---

## 5. 核心流程:下单
1. 校验商品在售、`quantity` 在 `[min_buy, max_buy]` 内。
2. 生成 `order_no`,开启事务:
   - **加锁预占** `quantity` 张可售卡(见第 6 节),不足则回滚报 `3002 库存不足`。
   - 写 `orders`(status=0,expire_at=now+15min,total_amount 用 bcmath 计算)。
   - 被选中卡:`status=1 锁定`,`order_id` 指向该单,`locked_at=now`。
   - 提交事务。
3. 返回订单与可选支付入口。
4. **超时回收**:定时任务扫描 `orders(status=0 AND expire_at<now)`,在事务内关单并释放其锁定卡(`1→0`,清 order_id)。

---

## 6. 卡密发放并发安全设计("一卡一售")

**目标**:任意并发下,一张卡至多归属一个订单;库存不超卖。

**机制**:数据库事务 + 行级锁。预占发生在**下单**时;支付成功时把锁定卡置为已售(状态推进,无需再抢)。

**取卡 SQL(核心)**:
```sql
START TRANSACTION;
SELECT id FROM cards
 WHERE product_id = :pid AND status = 0
 ORDER BY id
 LIMIT :qty
 FOR UPDATE SKIP LOCKED;          -- MySQL 8.0+/9.x:跳过已被其他事务锁住的行
-- 若返回行数 < qty → ROLLBACK,报库存不足
UPDATE cards
   SET status = 1, order_id = :oid, locked_at = NOW()
 WHERE id IN (:ids) AND status = 0;   -- 二次校验 status=0,affected 必须 = qty,否则回滚
-- 写订单、扣减 products.stock
COMMIT;
```
要点:
- `FOR UPDATE SKIP LOCKED` 让并发请求各自拿到**不同**的可售卡,既保证唯一占用又有高吞吐(避免互相阻塞)。
- `UPDATE ... WHERE status=0` 的 affected_rows 必须等于请求数量,作为锁内二次确认;不等则回滚(防御异常竞态)。
- 全程在**同一事务**内完成"选卡→标记→写单",杜绝 TOCTOU。
- `products.stock` 仅作展示缓存,**不作为发卡判据**;以 cards 加锁结果为准。

**支付成功发货**(第 7 节事务内):把本单锁定卡 `1→2 已售`、`sold_at=now`,把 `secret` 快照写入 `orders.delivered_content`,`orders→已发货`。

**专项测试(必须)**:并发开 N 个连接对"仅剩 M 张"的商品同时下单,断言:恰好 M 单成功且各自拿到不同卡、其余报库存不足、无一张卡被两单占用、`SUM(已锁定+已售)= 初始库存`。

---

## 7. 支付回调完整流程

**入口**:`POST /pay/notify/{channel}`(无鉴权,公开)。各渠道驱动实现统一接口 `PayDriverInterface`:`buildPay()`、`verify(request)`、`parse(request)`、`success()/fail()`(应答文案)。

**完整步骤**:
1. 按 `{channel}` 取渠道配置与驱动;渠道停用 → 记录并返回失败应答。
2. **验签**:用渠道配置的密钥/平台公钥验证回调签名(支付宝 RSA2、易支付/码支付 MD5、微信 v3 证书)。**验签失败立即终止**,记录日志,返回非成功应答(`5001`)。这是回调安全的**唯一信任根**。
3. 解析:`out_trade_no`(= `payment_no`)、`channel_trade_no`、回调金额、交易状态。
4. **定位**支付单与订单;支付单不存在 → 返回失败(疑似伪造)。
5. **金额校验**:`bccomp(回调金额, order.total_amount) === 0`,不符 → 标记异常、不发货、告警(`4004`,防篡改金额)。
6. **幂等**:
   - 利用 `payments.uniq(channel, channel_trade_no)` 去重;
   - 进入事务并 `SELECT ... FOR UPDATE` 锁定订单行,**锁内重查** `order.status`:若已是 `已支付/已发货` → 直接提交并返回**成功应答**(让网关停止重试),不重复发货(`5003`)。
7. 交易状态非成功(如未付/已关闭)→ 按渠道约定应答,不发货。
8. **核心事务**(订单行锁内一气呵成):
   - `payments`:status=成功、写 `channel_trade_no`/`paid_amount`/`notify_payload`/`paid_at`。
   - 订单:`status 0→1`(已支付)。
   - **发货**:本单锁定卡 `1→2 已售`,写 `orders.delivered_content`,`status 1→2`(已发货),`delivered_at=now`。
   - **结算**:佣金 = `bcmul(total, commission_rate)`;商户入账 = `bcsub(total, 佣金)`;更新 `merchants.balance`,写 `merchant_fund_logs`(订单收入 + 平台佣金两条,记 balance_after)。
   - COMMIT。
9. 返回渠道要求的**成功应答字符串**(如支付宝 `success`、易支付 `success`、微信 v3 JSON)。仅在处理成功后应答成功;任何失败返回非成功,促使网关重试。
10. 发货后触发通知(邮件/站内,异步,可失败重试,不阻塞应答)。

**安全清单**:验签(信任根)→ 支付单存在性 → 金额一致 → 订单行锁 + 状态幂等 → 原子发货结算 → 正确应答。

**专项测试(必须)**:
- 验签测试:正确签名通过;错误/缺失签名拒绝且不改任何状态。
- 幂等测试:同一成功回调投递两次 → 仅发货一次、仅结算一次、卡密不重复消耗、第二次直接返回成功。
- 金额篡改测试:回调金额 ≠ 订单金额 → 拒绝发货。

---

## 8. 安全要点
- 所有写接口入参用验证器;SQL 全部走 ORM 参数绑定(防注入)。
- 鉴权中间件校验 token 有效期与归属;越权访问他人资源返回 403。
- 支付回调仅信任验签结果,绝不信任回调内的金额/状态而跳过本地校验。
- 金额一律 bcmath + DECIMAL,禁止 float。
- 密码 bcrypt;token 仅存哈希;日志不打印明文密钥/卡密。
- 关键写操作(发卡、回调、结算)全部事务化并加行锁。

## 9. 测试策略
- **单元测试**(`tests/Unit`):Service 纯逻辑(金额计算、签名、状态机判定)。
- **功能/集成测试**(`tests/Feature`):走 HTTP 内核(路由+控制器+DB),用例事务回滚隔离。
- **并发测试**:发卡用例关闭事务包裹,开多 PDO 连接真实并发,验证一卡一售。
- **测试库**:`qfk_test`,bootstrap 自动迁移;CLAUDE.md 规定金额/卡密/回调相关代码**先写测试再写实现**。

---

## 10. 设计加固说明(评审采纳,具约束力)

> 本节是对 §2/§5/§6/§7 的**强制补充**,实现以本节为准。来自第一阶段对抗式设计评审。

### 10.1 删除策略(防数据孤儿)
- **有交易记录的商户/商品禁止硬删**,只能冻结/下架。`products→merchants`、`cards→products` 的物理删除在应用层先校验"无已锁定/已售卡(status∈{1,2})、无关联订单",否则拒绝。
- `cards.order_id→orders` 用 `ON DELETE SET NULL`;`merchant_fund_logs.order_id→orders` 用 `SET NULL`(账本必须保留);其余资金/订单外键用 `RESTRICT`。
- `categories` 等纯配置表可随商户 `CASCADE`。

### 10.2 唯一索引与可空列语义
- MySQL 唯一索引**不约束 NULL**。`uniq(channel, channel_trade_no)`、`uniq_email`、`uniq_secret`、`api_key` 等含可空列的唯一索引**仅在该列非空时去重**。
- 因此**回调幂等的唯一可信根是"订单行锁 + 锁内重查 order.status"**(§10.4),`uniq(channel, channel_trade_no)` 只作二级兜底;`channel_trade_no` 为空的回调一律拒绝进入成功分支。
- 纯 hex/ASCII 列(`secret_hash`、`token_hash`)迁移时显式 `CHARACTER SET ascii COLLATE ascii_bin`,保证精确二进制比对、省空间。

### 10.3 卡密发放并发(对 §5/§6 的强制约束)
1. **统一锁顺序 / 串行化闸门**:**所有触碰某商品 cards/orders 的写路径,事务起手都必须先 `SELECT * FROM products WHERE id=:pid FOR UPDATE` 锁该商品行**。该商品行锁是同一商品所有并发写的唯一串行化闸门 —— 正因如此,下单(product→cards→orders)与超时回收(product→orders→cards)虽对 cards/orders 的加锁后缀顺序不同,也不会构成死锁环。新增任何写卡/写单路径(如支付回调发货)必须复用此闸门:先锁 product 行。
2. **取卡 + 二次校验**:`SELECT ... FOR UPDATE SKIP LOCKED` 取卡后,`UPDATE cards SET status=1,order_id=:oid,locked_at=NOW() WHERE id IN(:ids) AND status=0`,**断言 affected_rows == qty**,否则回滚。
3. **stock 一律相对增减**,禁止"读后写绝对赋值":扣减 `UPDATE products SET stock=stock-:qty WHERE id=:pid AND stock>=:qty`;回补 `stock=stock+:qty`;均在同一事务内。`stock` 仍仅作展示;**判库存以 cards 加锁结果为准**;T9.2 对账以 `COUNT(cards.status=0)` 重算修复。
4. **死锁重试**:发卡相关事务捕获 MySQL 死锁(1213/40001)后有限次(如 3 次)重试。
5. **SKIP LOCKED 瞬态不足**:高并发瞬间可能对"实际仍有库存"的请求返回库存不足(被其他未提交事务持锁的卡被跳过)。下单接口对"取卡不足"做**有限次短重试**后再报 3002;此为可接受权衡,需在 T5.3 区分"确定性不足"与"瞬态不足"。
6. **超时释放幂等**:关单 `UPDATE orders SET status=3 WHERE id=:oid AND status=0`;释放卡 `UPDATE cards SET status=0,order_id=NULL WHERE order_id=:oid AND status=1`;均校验 affected_rows;`order:clean` 加单实例锁防重入。

### 10.4 支付回调(对 §7 的强制约束)
1. **归属校验**(验签后、发货前,任一不符 → 5004 拒绝):`payment.order_id` 指向的订单即本单;`payment.merchant_id == order.merchant_id`;`payment.channel == 回调入口 {channel}`;`out_trade_no == payment.payment_no`。
2. **金额校验**:`bccomp(解析出的实付金额, order.total_amount) === 0` 且实付 ≥ `payment.amount`。本期**仅支持 CNY**,渠道回调若含币种字段必须等于 CNY,否则拒绝。
3. **主幂等**:进入事务后 `SELECT * FROM orders WHERE id=:oid FOR UPDATE`,**锁内重查 status**:
   - 已支付/已发货 → 直接提交并返回**成功应答**(不重复发货,5003)。
   - 已关闭(status=3,超时)却收到成功支付 → **不丢弃**:订单转 `4005 异常(已支付待人工/退款)`、payment 记成功、告警,返回成功应答停止重试;走人工/退款。(把订单超时 15min 设得远大于渠道最长回调延迟以降低概率。)
4. **发货数量守恒**:发货前校验本单 `status=1` 锁定卡数 == `order.quantity`;发货 `UPDATE cards SET status=2,sold_at=NOW() WHERE order_id=:oid AND status=1` 断言 affected_rows == quantity。若卡不足(被超时释放/作废)→ **不可无限返回失败**(否则网关重试风暴 + 永久漏发):订单转 `4005 异常`、payment 记成功、结算照常、返回成功应答、转人工补发。`delivered_content` 取本次置为已售的同批卡 secret 快照,与 cards 同事务原子写入。
5. **结算防丢失更新 + 幂等**:`SELECT balance FROM merchants WHERE id FOR UPDATE` 后用 bcmath 计算 `balance_after`;写 `merchant_fund_logs`(收入 + 佣金两条),依赖 `uniq(order_id, type)` 防重复入账。
6. **渠道停用语义**:停用渠道只阻止**发起新支付**(T6.3);对**已存在 payment 的在途回调**仍正常验签处理,不得因渠道停用而拒绝(否则买家已付款却永久漏发)。
7. **应答与通知**:仅核心事务成功后返回渠道要求的成功应答;失败返回非成功促重试(但见 §10.4.4 卡不足例外)。**回调链路任何未预期异常(含约束冲突等非死锁 DB 异常)一律捕获并返回受控的失败应答(不裸抛 500、不泄露堆栈),记日志待排查**。**通知(邮件/站内)必须在事务 COMMIT 之后异步投递**,失败仅记录重试,**绝不阻塞应答**。
8. **成功回调前置校验**:成功回调必须带**非空渠道交易号**(空 `channel_trade_no` 无法作为 `uniq(channel,channel_trade_no)` 二级幂等去重,一律拒绝);**仅 CNY**,含其它币种字段则拒绝;金额必须**良构**(`^\d+(\.\d{1,2})?$`),防空/非数值被 bcmath 静默当 0。
9. **两条 4005 异常路径的结算差异(刻意,需人工兜底)**:`已关闭→收到成功支付`(§10.4.3)记 payment 成功但**不结算**(货款应退,待人工/退款);`卡不足`(§10.4.4)**结算照常**(商户实际成交,待人工补发)。二者结算语义不同,均落入 `4005`,须由对账/人工流程跟进,避免资金长期挂账。

### 10.5 本期范围(已采用的默认取舍,可调整 → 见 blockers.md)

> **⚠ 实现进度更新(以下多项原标"延后/预留"现已实现,以 `docs/blockers.md` 末尾「实现进度」与 `CHANGELOG.md` 为准)**:✅ 退款闭环(负欠隔离)、✅ 发货邮件通知(可配 SMTP)、✅ 买家账号(可选)、✅ 卡密落库加密(`CARD_SECRET_KEY`)、✅ 多商品类型(卡密/知识/资源/权益)、✅ 商户开放 API 均已落地。**仍预留**:支付宝/微信原生驱动(易支付已聚合二者收款)。下列为原始设计取舍记录。

- **支付渠道**:本期仅实现**易支付/MD5**;支付宝 RSA2、微信 v3 仅保留驱动接口。
- **退款流程**:本期**不实现**资金/卡密退款编排;保留 `orders.status=4`/`fund_logs.type=4` 枚举占位,异常订单先入 `4005` 转人工。虚拟卡密一般不可回收,退款定位为"资金退回"后续专项。
- **发货通知**:本期**预留**(接口与异步约定已定义),邮件模板与投递实现延后。
- **买家账号**:本期默认**游客下单**;`buyers.password`/buyer token 为预留。
- **限购语义**:`max_buy` 为**单笔上限**;"每买家累计限购"本期不做(如需,在下单事务内按 `buyer_email` 计数)。
- **手动发货商品**(`products.type=2`):本期主线为 `type=1` 自动发卡;type=2 分支(支付后转待商户手动发货)延后。
- **卡密加密存储**:本期默认**明文 + secret_hash 去重**;对称加密开关延后。
