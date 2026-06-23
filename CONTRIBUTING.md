# 贡献指南

欢迎一起维护 QFK 发卡系统!本文档帮助你快速上手并提交高质量改动。

## 环境要求

- **PHP 7.4.x**(项目刻意停留在 7.4,勿用 PHP8-only 语法)+ 扩展:`pdo_mysql`、`bcmath`、`pcntl`(并发测试用)、`gd`/`fileinfo`(上传校验)
- **MySQL 8/9.x**(InnoDB)
- **Composer**、**Node 18+**(前端构建)

## 本地搭建

```bash
git clone <repo-url> && cd qfk
composer install
cp .env.example .env            # 按本机改数据库连接

# 建库:开发库 qfk、测试库 qfk_test
mysql -uroot -e "CREATE DATABASE qfk DEFAULT CHARACTER SET utf8mb4; CREATE DATABASE qfk_test DEFAULT CHARACTER SET utf8mb4;"
php think migrate:run            # 迁移开发库(测试库由测试 bootstrap 自动迁移)
php think db:seed                # (可选)灌入演示数据:admin/admin123、demo_merchant/demo123456

# 前端
cd frontend/app && npm install && npm run build

# 起服务 + 健康检查
php think run -H 127.0.0.1 -p 8765
curl http://127.0.0.1:8765/health
```

> 演示账号密码仅用于本地体验,**部署前务必修改**。

## 跑测试(必须全绿才提交)

```bash
composer test          # 全部(测试库 qfk_test,bootstrap 自动迁移+库名护栏)
composer test-unit     # 仅 Unit
composer test-feature  # 仅 Feature
php vendor/bin/phpunit --filter SomeTest
```

## 开发铁规则(见 `CLAUDE.md` 完整版)

- **金额纪律**:一律 `DECIMAL(10,2)` + `bcmath`(`Money` 工具),**禁止浮点**比较/累加。
- **关键路径 TDD**:涉及**金额 / 卡密发放 / 支付回调 / 退款 / 提现**的改动,先写测试再写实现(红→绿)。
- **两处安全硬约束**:① 卡密「一卡一售」必须事务 + 行锁(`FOR UPDATE SKIP LOCKED`);② 支付回调必须验签 + 金额校验 + 幂等(行锁内重查状态)。
- **不许作弊测试**:测试不过就修实现/测试逻辑,严禁删断言/跳过/注释掉测试。
- **库结构唯一来源是迁移**:表结构变更只通过 `database/migrations/` 新增迁移,不手改库。

## 提交规范

- 一个逻辑改动一个 commit,信息写清「做了什么/为什么」。
- PR 前自测:`composer test` 全绿 + `cd frontend/app && npm run build` 通过。
- 涉及业务/资金/安全的改动,请在 PR 描述里说明影响面与已加的测试。
- 不确定的设计/口径分歧,记入 `docs/blockers.md` 并在 PR 里 @维护者讨论,别擅自猜。

## 目录速览

`app/controller/{buyer,merchant,admin,pay}` · `app/service`(业务逻辑) · `app/model` · `app/middleware` · `app/validate` · `database/migrations` · `tests/{Unit,Feature}` · `frontend/app`(React 前端) · `frontend/design-system`(橙色设计系统) · `docs/`(规格/任务/审计追踪)。
