# CLAUDE.md — QFK 发卡系统 铁规则与操作手册

本文件是开发本项目时**必须遵守**的规则。任何一次改动都要先读这里。

---

## 一、铁规则(不可违反)

1. **任务闭环**:每完成一个任务,必须运行测试(`composer test`)**全绿**才算完成;然后勾掉 `docs/tasks.md` 对应 checkbox,并 `git commit`(一个任务一个提交,提交信息含任务号)。

2. **测试不许作弊**:测试不过就**修复实现或测试逻辑**。**严禁**为了让测试通过而:删功能、删/跳过断言(`markTestSkipped`/`@group` 排除)、注释掉测试、放宽断言到无意义、catch 后吞掉错误。测试反映真实行为;让真实行为正确,而不是让测试闭眼。

3. **关键路径 TDD**:涉及**金额、卡密发放、支付回调**的代码,**必须先写测试再写实现**(红→绿→重构)。对应任务在 `docs/tasks.md` 标了 `(TDD)`。

4. **两处安全硬约束**:
   - **卡密发放**必须并发安全的"一卡一售":用数据库事务 + 行级锁(`SELECT ... FOR UPDATE [SKIP LOCKED]`),保证一张卡至多归属一个订单、绝不超卖。
   - **支付回调**必须**验签**后才信任,并做**金额校验 + 幂等**(订单行锁内重查状态)。
   - 这两处实现完成后,**单独编写并发测试与验签测试**专项验证(见 tasks M5.3 / M6.5)。

5. **遇阻即停**:任务卡住、需求不明确、或发现 spec 与现实冲突,**不要乱猜着改**。把问题写入 `docs/blockers.md`(含上下文、卡点、备选方案)并**停止**,等待人工澄清。

6. **金额纪律**:金额一律 `DECIMAL(10,2)` + **bcmath**(`bcadd/bcsub/bcmul/bccomp`,scale=2)。**禁止浮点运算**比较或累加金额。

7. **库结构唯一来源是迁移**:任何表结构变更都通过 `database/migrations/` 新增迁移文件,不手改数据库;模型与迁移保持一致。

---

## 二、开发流程(每个任务)

> 关键路径任务把第 2、3 步顺序对调(先测试后实现)。

1. 读 `docs/tasks.md` 取**下一个未勾选任务**与其验收标准;读 `docs/spec.md` 对应章节。
2. 写实现(必要时新增迁移并 `php think migrate:run`)。
3. 写/补测试(`tests/Unit` 纯逻辑、`tests/Feature` 走 HTTP+DB)。
4. `composer test` → **全绿**。不绿则修,直到绿(不许作弊)。
5. 勾选 `docs/tasks.md` 该任务 checkbox。
6. `git add -A && git commit -m "Txx: <简述>"`。
7. 进入下一个任务。

## 三、第三阶段停顿点(必须停下等人工验收)

- **完成卡密发放模块(M5 全部任务)后** → 跑全测试(含并发测试)全绿,**停止**报告等验收。
- **完成支付对接模块(M6 全部任务)后** → 跑全测试(含验签/幂等/金额篡改)全绿,**停止**报告等验收。
- **命中 `docs/blockers.md` 记录的问题时** → 停止等澄清。
- **所有任务完成时** → 运行完整测试套件并报告结果。

---

## 四、命令速查

```bash
# 测试(测试库 qfk_test,bootstrap 自动迁移)
composer test                 # 全部
composer test-unit            # 仅 Unit
composer test-feature         # 仅 Feature
php vendor/bin/phpunit --filter testName

# 数据库迁移(开发库 qfk)
php think migrate:create CreateXxxTable   # 生成迁移
php think migrate:run                      # 执行
php think migrate:status / migrate:rollback

# 本地起服务 + 健康检查
php think run -H 127.0.0.1 -p 8765
curl http://127.0.0.1:8765/health
```

## 五、环境与约定

- **PHP 7.4.33**(故用 ThinkPHP 6.1 + PHPUnit 9;不可用 PHP8-only / PHPUnit10+ 语法)。
- **MySQL 9.x**,本地经 **unix socket** 连接(`HOSTNAME=localhost` + `SOCKET=/tmp/mysql.sock`,root 无密码)。生产用 `.env` 覆盖。
- 数据库:`qfk`(开发) / `qfk_test`(测试)。`tests/bootstrap.php` 有库名护栏,非 `qfk_test` 直接退出,绝不污染开发库。
- 环境文件:`.env`(dev,git 忽略)、`.env.testing`(test,入库)。
- 测试隔离:`tests/TestCase` 默认每用例事务回滚;**并发类测试须 `$useTransaction=false`** 并自行清理。
- API 响应统一 `{code,msg,data}`;错误码见 `spec.md §1.4`。
- 代码风格:控制器薄、逻辑入 `app/service`;入参用 `app/validate`;鉴权用 `app/middleware`。
- 提交信息:`Txx: 描述`;关键安全提交注明"含并发/验签测试"。

## 六、目录

`app/controller/{buyer,merchant,admin,pay}` · `app/model` · `app/service` · `app/middleware` · `app/validate` · `database/migrations` · `tests/{Unit,Feature}` · `docs/{spec,tasks,blockers}.md`。

> 规格细节(数据模型、流程、状态机)以 `docs/spec.md` 为准;任务与验收以 `docs/tasks.md` 为准。
