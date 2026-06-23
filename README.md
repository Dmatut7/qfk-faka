# QFK 发卡系统

虚拟商品自动发货平台(多商户 SaaS)。买家(可游客)下单付款后,系统自动发货卡密。

**技术栈**:PHP 7.4 · ThinkPHP 6.1 · MySQL 9.x(InnoDB)· PHPUnit 9 · think-migration

---

## 核心特性

- **一卡一售(并发安全发卡)**:数据库事务 + 行锁 + `FOR UPDATE SKIP LOCKED`,任意并发下一张卡至多归属一个订单、绝不超卖。经 `pcntl_fork` 多进程真实并发测试验证。
- **支付回调三重保证**:① 验签防伪造 ② 金额严格一致防篡改 ③ 订单行锁 + 状态重查防重复(幂等)。重复/并发回调只发货一次、只结算一次。
- **金额安全**:全程 `bcmath`(`DECIMAL(10,2)`),禁止浮点。
- **三端**:买家前台(浏览/下单/查单)· 商户后台(分类/商品/卡密/订单/资金/统计)· 平台后台(商户/渠道/提现审核/对账/跨商户视图)。

---

## 快速开始

```bash
# 1. 安装依赖
composer install

# 2. 创建数据库(开发库 + 测试库)
mysql -uroot -e "CREATE DATABASE qfk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; \
                 CREATE DATABASE qfk_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 3. 配置环境(已提供 .env 示例;生产请覆盖)
#    .env        → 开发库 qfk(本机经 unix socket 连接)
#    .env.testing→ 测试库 qfk_test(测试自动使用,有库名护栏)
cp .example.env .env   # 按需修改

# 4. 执行迁移建表
php think migrate:run

# 5. 灌入演示数据(默认管理员/渠道/商户/商品/卡密;幂等)
php think db:seed

# 6. 启动开发服务器
php think run -H 127.0.0.1 -p 8765
curl http://127.0.0.1:8765/health     # {"code":0,...,"database":"ok"}
```

> 本机 MySQL 经 unix socket 连接(`HOSTNAME=localhost` + `SOCKET=/tmp/mysql.sock`,root 无密码);生产用 `.env` 覆盖为 TCP + 独立账号。

---

## 测试

```bash
composer test                                   # 全量(含 fork 并发测试)
composer test-unit                              # 仅 Unit
php vendor/bin/phpunit --filter Concurrency      # 一卡一售 / 回调幂等 并发证明
php vendor/bin/phpunit --filter PaymentNotify    # 支付回调三点保证 + 验签
```

测试以独立测试库 `qfk_test` 运行,`tests/bootstrap.php` 自动迁移并有库名护栏(非 `qfk_test` 直接退出);用例默认事务回滚隔离,并发类用例真实提交并自清理。

---

## 命令行任务(建议 cron)

```bash
php think order:clean       # 回收过期未支付订单(关单 + 释放锁定卡 + 回补库存),建议每分钟
php think stock:reconcile   # 库存/资金对账(重算 products.stock、核对余额)
php think db:seed           # 灌入/补齐演示数据(幂等)
```

---

## 目录结构

```
app/
  controller/{Health, buyer, merchant, admin, pay}/   # 四类 JSON API
  service/                # 业务逻辑(下单/发卡/支付/回调/结算/钱包/统计…)
  service/pay/            # 支付渠道驱动(PayDriverInterface / EpayDriver / PayManager)
  middleware/             # 鉴权(AdminAuth/MerchantAuth)、CORS、限流、请求日志
  model/                  # think-orm 模型(13 张表)
  command/                # 控制台命令(order:clean / stock:reconcile / db:seed)
database/migrations/      # 库结构唯一来源
docs/                     # spec.md(规格)/ tasks.md(任务)/ blockers.md(决策)
tests/{Unit,Feature}/     # 测试
```

---

## API 简表

统一响应:`{ "code": 0, "msg": "ok", "data": {...} }`。鉴权用 `Authorization: Bearer <token>`。

### 买家前台(公开)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/s/{slug}` | 店铺在售商品 |
| GET  | `/buyer/product/{id}` | 商品详情 |
| POST | `/buyer/order` | 下单(预占卡密)|
| POST | `/buyer/order/{no}/pay` | 发起支付(返回跳转参数)|
| POST | `/buyer/order/query` | 订单号+邮箱查单(已发货返回卡密)|
| *    | `/pay/notify/{channel}` | 支付异步回调(靠验签)|

### 商户后台(MerchantAuth)
登录 `/merchant/login`;分类 `/merchant/categories`、商品 `/merchant/products`、卡密 `/merchant/cards/import` 等、订单 `/merchant/orders`、钱包 `/merchant/wallet`、统计 `/merchant/stats/summary`。

### 平台后台(AdminAuth)
登录 `/admin/login`;商户 `/admin/merchants`(审核/冻结/抽佣/重置)、渠道 `/admin/channels`、提现审核 `/admin/withdrawals`、配置 `/admin/settings`、对账 `/admin/reports/settlement`、跨商户 `/admin/orders`、`/admin/products`。

---

## 设计文档

- **规格**:`docs/spec.md`(数据模型/状态机/并发发卡设计 §6·§10.3/支付回调 §7·§10.4)
- **任务与验收**:`docs/tasks.md`
- **范围决策**:`docs/blockers.md`(本期默认:仅易支付/MD5,游客下单,退款/通知/买家账号预留)
- **开发铁规则**:`CLAUDE.md`

## 本期范围

仅实现 **易支付/MD5** 渠道(支付宝/微信预留驱动接口);游客下单;卡密明文+去重。发货通知、买家账号、卡密加密为预留项。**退款闭环、负欠隔离、限量券下单即占额、异常单处置等已实现**;真实经网关退款给买家、多支付渠道等需接入对应外部能力(见 `docs/blockers.md`)。

## 快速开始 / 贡献

搭建、跑测试、开发规约见 **[CONTRIBUTING.md](CONTRIBUTING.md)**。简版:`composer install` → `cp .env.example .env`(改库连接)→ `php think migrate:run` → `php think db:seed` → `composer test` 全绿。

> ⚠ 演示账号(`admin/admin123`、`demo_merchant/demo123456`)与 demo 支付密钥仅供本地体验,**部署前务必修改**。

## 协议

本项目代码采用 [MIT](LICENSE) 协议;依赖的 ThinkPHP 框架遵循 Apache-2.0。欢迎提 Issue / PR 一起维护。
