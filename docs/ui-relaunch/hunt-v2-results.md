# 第二轮对抗式深挖结果(资金/状态机/鉴权)

> 5 个子系统 finder × disprove 证伪,20 候选 → 8 确认。仅留对当前代码真实可复现的。
> 高价值方向:资金守恒、订单/卡状态机、支付回调边界、券促叠加、多租户越权。

## 确认并已修(6)

| # | 严重度 | 缺陷 | 处置 | 测试 |
|---|---|---|---|---|
| 1/2 | critical | 支付回调**跨单 trade_no 唯一冲突**:本单未入账却仍 PENDING → 被 order:clean 静默自动关单丢单(L18 修复遗留洞) | 该分支置订单 EXCEPTION 待人工再成功应答止重投 | `PaymentNotifyTest::testDuplicateChannelTradeNoAcksSuccessNotInfiniteRetry`(改断言 EXCEPTION) |
| 3/5 | high | **退款无视 frozen_balance**:有冻结中待审提现时退款,负欠与冻结返还重复计 → balance+debt 虚高 | settled 反向前 frozen>0 即拒退,要求先处置提现 | `RefundTest::testCannotRefundWhileWithdrawalPendingFrozen` |
| 4 | medium | 提现拒绝流水 balance_after 记物理 balance,与全局「逻辑净头寸」约定不一致 | 改记 balance-debt | 既有 AdminWithdrawTest 守绿 |
| 8 | medium | 投诉 `merchantReply` 经 `ownedActive` 无锁读改写(L29 同类残留) | 包 `Db::transaction` + `ownedActive($lock=true)` | 既有 ComplaintTest 守绿 |

## 评估为非缺陷 / 不修(2)

- **#6**(medium):`OrderService::reserve` 读商户状态未加行锁的 TOCTOU(刚冻结商户可能漏过一单)。**不修**:在下单热路径锁商户行会把同商户**所有商品并发订单**串行化(吞吐回归),而收益仅是冻结切换瞬间漏一单(低危),代价不值。
- **#7**(medium,**误报**):`MerchantWalletService::balance($merchantId)` 按传入 id 直查,$merchantId 来自鉴权中间件而非用户输入,不存在跨租户枚举;agent 给的「`if($m->id!==$merchantId)`」修法本身是恒真,自证误报。

> 方法:每条候选都经独立 agent 对抗式证伪(读实际代码+测试,默认怀疑)。其余 12 条候选在证伪阶段被否(已被守卫/测试覆盖或不可复现)。
