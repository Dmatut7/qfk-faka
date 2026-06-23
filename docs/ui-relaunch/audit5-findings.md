# 第5轮审计(安全/并发/spec/数据完整性) — 14(crit0/high2/med6/low6)

## 处理状态(截至本轮)
- **HIGH 2/2 已修**:H2 XSS 净化器加固(协议白名单+实体解码,绕过全堵)+测试;H1 B2 券占额并入有效性校验(状态/有效期)。
- **MEDIUM**:M1 券删除守卫(有在途单禁删)+测试;M4/M5/M6 补 B1/B2/B3 测试缺口;L4 过时注释修正、M3 balance_after 语义文档化。
- **待协调(不在自动循环里冒险)**:
  - **M2** 恢复 fund_logs uniq(order_id,type)(spec §10.4.5 硬约束):需退款佣金回冲改独立 type + AdminReport 佣金口径同步 + 先清理 dev 库可能的重复行再迁移。应用层幂等(订单行锁+状态重查)为主防线已在,DB uniq 为兜底,故列为待协调而非紧急。
  - **L2** 对账销售额纳入已结算 EXCEPTION 单(与 M7/M8 报表口径决策一并定)。

## CRITICAL


## HIGH

### [H1] B2 占额自增不校验券状态/有效期,且与券编辑无并发协调 —— 可对已停用/已过期券占额并下单 <concurrency-新资金代码>
- 场景: 买家用券码下单:OrderService::reserve 通过 PricingService::bestDiscount→CouponService::findUsable 读取券(校验 status/有效期/门槛)算出 discount,但随后真正占额时只执行 `Db::name('coupons')->where('id',$couponId)->whereRaw('(total=0 OR used<total)')->inc('used')`,该 UPDATE 的 WHERE 仅含数量条件,完全不含 status / valid_from / valid_to / min_amount。在 bestDiscount 读取与 inc 之间,商户并发调用 CouponService::update 把券改成 STATUS_OFF / 改 valid_to 过期 / 抬高 min_amount / 降低 value,reserve 既不重读也不对 coupons 行加锁(reserve 全程未 lock 券行),inc('used') 仍成功,订单以旧 value 算出的 discount_amount 落库并占用一个名额。结果:已停用/已过期/不达门槛的券仍被成功使用,折扣金额与券现行条款不一致(total_amount 偏低、商户少收)。
- 证据: app/service/OrderService.php:147-153(inc('used') 的 whereRaw 只有 'total=0 OR used<total',无 status/有效期校验,且 reserve 全程未对 coupons 行 lock(true));app/service/PricingService.php:21-37(bestDiscount 调 findUsable 读取后即返回 discount/coupon_id,无锁);app/service/CouponService.php:54-87(update 可改 status/value/min_amount/valid_to,无事务、无行锁、不与在途占额协调)
- 修: 将券占额纳入 reserve 的串行化闸门:在条件自增中并入券有效性条件,例如 `->where('status',Coupon::STATUS_ON)->whereRaw('(valid_from IS NULL OR valid_from<=?)',[$now])->whereRaw('(valid_to IS NULL OR valid_to>=?)',[$now])->whereRaw('(total=0 OR used<total)')->inc('used')`,并在自增前对 coupons 行 `lock(true)` 重读 value/min_amount/type 重新计算 discount(以锁内真值为准),inc 影响行数<1 即抛'券不可用'回滚整笔;同时 CouponService::update 改 total/status 时纳入同一行锁。

### [H2] 富文本 XSS 净化器 Html::sanitize 可被绕过 → 章节/资讯存储型 XSS <注入与输入校验>
- 场景: 恶意商户在「知识类商品章节」正文(或管理员在「资讯文章」正文)提交以下任一 payload,经 Html::sanitize 写库后,买家阅读时由前端 dangerouslySetInnerHTML 原样渲染并执行:
(1) 未加引号的危险协议:<a href=javascript:alert(document.cookie)>领取</a> —— 第 28-38 行的协议中和正则要求属性值带引号 ("|') ,未加引号的 javascript: 完全不被处理;实测 OUT 原样输出。
(2) HTML 实体编码协议:<a href="java&#115;cript:alert(1)">x</a> —— 净化器不解码实体,&#115; 原样留存,浏览器渲染时解码为 's' 得到 javascript: 并在点击时执行;实测 OUT 原样输出。
章节正文是商户可控(ChapterService::create/update),买家购买知识类商品后在 OrderLookup 阅读即触发,属跨租户存储型 XSS;资讯正文为管理员可控。前端无任何 DOMPurify/二次净化。
- 证据: app/util/Html.php:28-38 协议中和正则 '/\b(href|src)\s*=\s*("|\')(.*?)\2/is' 强制要求引号,且不处理 HTML 实体;app/util/Html.php:24 用 strip_tags 白名单(<a><img> 在内);实测 php 运行 Html::sanitize('<a href=javascript:alert(1)>x</a>') 输出未变,Html::sanitize('<a href="java&#115;cript:alert(1)">x</a>') 输出未变。注入点:app/service/ChapterService.php:40、:51(content=Html::sanitize)与 app/service/ArticleService.php:104。渲染汇:frontend/app/src/screens/OrderLookup.jsx:561 与 frontend/app/src/screens/Articles.jsx:78 均为 dangerouslySetInnerHTML={{__html: content}};frontend/app/package.json 及 src 下无 DOMPurify/sanitize 依赖。
- 修: 放弃 strip_tags+正则的黑名单式净化,改用成熟 HTML 净化库(服务端 ezyang/htmlpurifier 白名单解析,或前端渲染前 DOMPurify.sanitize)。若暂留现实现,至少:协议中和需同时覆盖无引号属性值,并先做 html_entity_decode 再判协议,且对 <a>/<img> 的 href/src 改为仅允许 http(s):// 与相对路径的白名单(allowlist)而非危险协议黑名单。建议前端 dangerouslySetInnerHTML 处统一 DOMPurify 兜底,做到纵深防御。


## MEDIUM

### [M1] 优惠券硬删除/降 total 与在途占额无协调,孤立 closeAndRelease 的 dec('used') <concurrency-新资金代码>
- 场景: 存在 PENDING 订单占用了某限量券(used>0)时,商户调用 CouponService::delete 直接 `->delete()` 物理删除该券行(coupon_id 在 orders 表无外键约束,见迁移)。随后该 PENDING 单超时 → OrderService::closeAndRelease 执行 `Db::name('coupons')->where('id',$order->coupon_id)->where('used','>',0)->dec('used')`,目标行已不存在 → 静默 no-op,占额统计与订单引用全部丢失;若改为 update 把 total 降到低于 used,则 used>total 长期成立,该券对外永久显示'已领完'但实际占用者可能已关单。delete 也使历史订单 coupon_id 指向不存在的券。
- 证据: app/service/CouponService.php:103-105(delete 无在途占额/关联订单校验,直接 ->delete());database/migrations/20260622111000_add_coupon_to_orders.php:10(orders.coupon_id 无外键约束);app/service/OrderService.php:279-282(closeAndRelease 对已删券 dec('used') 静默 no-op)
- 修: delete 前校验是否存在引用该券的未结订单(参照 spec §452 '有交易记录禁止硬删'口径),有则拒绝硬删、仅允许停用(status=OFF);update 降 total 时不得低于当前 used,或改为软停用。

### [M2] 删除 merchant_fund_logs 的 uniq(order_id,type) 索引,违反 spec §2.10/§10.4.5「结算幂等数据库级兜底」硬约束 <spec合规>
- 场景: spec §2.10 明确要求 merchant_fund_logs 建 `uniq_order_type (order_id, type)`,§10.4.5 写明结算「依赖 uniq(order_id, type) 防重复入账」,作为「结算幂等的数据库级兜底」。迁移 20260622120500_drop_fundlog_uniq_order_type.php 在 up() 中无条件 removeIndexByName('uniq_order_type'),把唯一索引降级为不存在(连普通索引都没补——注释说『改为普通索引』,但 up() 只删不加)。删除原因是 RefundService 需要对同一 order_id 写第二条 TYPE_COMMISSION(回冲),与原唯一约束冲突。后果:① spec 规定的数据库级幂等兜底完全消失,结算幂等此后只剩 NotifyService::settle 的『订单行锁+status 重查』单点保证,任何绕过该锁/状态机的写入(如未来新增入账路径、手工补数据、并发非常规路径)都不再被 DB 拦截,可重复入账;② 与 spec 文字直接冲突。
- 证据: database/migrations/20260622120500_drop_fundlog_uniq_order_type.php:16-18 删除 uniq;NotifyService.php:265-274 doSettle 写 INCOME+COMMISSION 两条;RefundService.php:75-84 对同一 order_id 再写一条 TYPE_COMMISSION(amount=+commission)回冲,正是与原 uniq 冲突的写入。spec.md §2.10『uniq_order_type … 结算幂等的数据库级兜底:同一订单同类型流水只许一条』、§10.4.5『依赖 uniq(order_id, type) 防重复入账』。
- 修: 恢复 uniq(order_id,type) 唯一索引,并为退款回冲使用独立 type(如新增 TYPE_REFUND_COMMISSION=5 / TYPE_REFUND_INCOME),使 (order_id,type) 在 settle 与 refund 间不再重复,从而既满足 spec 的 DB 级幂等兜底,又支持退款反向流水。或至少在迁移 up() 内按注释补回普通索引并在 spec/blockers 中正式记录该硬约束的调整。

### [M3] merchant_fund_logs.balance_after 在负欠(debt)结算/退款时记录的是「逻辑净头寸」(可为负),与实际 merchants.balance(下限0)不一致,账本审计口径错乱 <数据完整性>
- 场景: 商户已把某笔货款提现后该订单被退款,触发 B1 负欠逻辑:RefundService 把差额落入 debt、balance 保底 0。但写入的 REFUND/COMMISSION 流水 balance_after 用的是 afterIncomeReverse/afterCommReverse(逻辑净头寸,可能为负数),不等于落库后的真实 merchants.balance。后续正常入账(doSettle 先抵欠)同样:INCOME/COMMISSION 流水 balance_after = preLogical±… 也是逻辑头寸,与真实 balance(floored 0)脱节。商户在资金流水页看到的 balance_after 序列与其真实余额对不上,且可能出现负值。
- 证据: app/service/NotifyService.php:257-272(afterIncome/afterCommission 为逻辑头寸,直接当 balance_after 写入,而真实 balance 在 260-263 被 floor 到 '0.00');app/service/RefundService.php:68-82(afterIncomeReverse/afterCommReverse 同样为逻辑头寸,71-73 真实 balance floored 0)。balance_after 列见 database/migrations/20260621044232_create_merchant_fund_logs_table.php:22(无消费方做逻辑判断,grep balance_after 仅写入)。
- 修: 明确 balance_after 的语义:要么改为记录「真实可提现余额(floored)」以与 merchants.balance 一致,要么新增一列(如 logical_after / debt_after)单独记录逻辑头寸/负欠,避免同一列在有无 debt 两种场景下语义漂移。两条 INCOME/COMMISSION 流水建议同时落 debt_after 以便对账。

### [M4] 手动关单(cancelPending)释放占用券额的分支无独立测试 <测试覆盖与边界>
- 场景: closeAndRelease() 同时服务两条路径:超时回收(reclaimExpired,requireExpired=true)与商户手动关单(cancelPending,requireExpired=false)。券额释放逻辑(OrderService.php:279-282)对两条路径共享,但只有超时回收路径被测(CouponOrderTest::testUnpaidCloseReleasesCouponSlot 用 reclaimExpired);手动关单路径(MerchantOrderTest::testCloseReleasesCards)只断言卡释放与库存回补,完全没有'带券下单后手动 /close 再断言 used 回 0、名额可复用'。若将来有人误改 requireExpired 分支或把券释放挪进 reclaim 专属逻辑,手动关单会静默泄漏限量券名额而测试仍全绿。
- 证据: app/service/OrderService.php:240-285(券释放在 279);tests/Feature/MerchantOrderTest.php:78-90 testCloseReleasesCards 仅断言卡/库存无券;tests/Feature/CouponOrderTest.php:114-128 仅覆盖 reclaimExpired 路径
- 修: 在 MerchantOrderTest 新增 testManualCloseReleasesCouponSlot:带 total=1 限量券下单(断言 used=1)→ POST /merchant/orders/:id/close → 断言订单 CLOSED、Coupon used 回 0、且第二个买家可再用该券下单成功。

### [M5] closed_then_paid(未结算异常单)退款未断言商户余额零变动,真实生命周期端到端未覆盖 <测试覆盖与边界>
- 场景: RefundService 的 REFUNDABLE 含 EXCEPTION。closed_then_paid 异常单(CLOSED→支付成功→NotifyService.php:155-164 转 EXCEPTION,记 payment 成功但无 income 流水)退款时 $wasSettled=false,不做任何资金反向,只翻状态为 REFUNDED(货款在网关由平台退买家)。现有 testRefundReleasesLockedButDisablesSoldCards 手工 update 成 EXCEPTION 后退款,但只断言卡状态,没有断言商户 balance/debt 保持不变;也没有从真实链路(下单→过期回收 CLOSED→真实回调转 EXCEPTION→退款)端到端验证。这意味着'未结算异常单退款误冲商户余额'这类退化无法被现有测试发现。
- 证据: app/service/RefundService.php:24,58-87(EXCEPTION 可退、wasSettled 判定);app/service/NotifyService.php:155-164(closed_then_paid 不入账);tests/Feature/RefundTest.php:96-111(仅断言卡,无余额断言)
- 修: 新增 testRefundUnsettledExceptionDoesNotTouchBalance:走真实链路构造 closed_then_paid 异常单(下单→改 expire_at 过期→reclaimExpired 关单→构造合法签名回调→断言 EXCEPTION 且 payment SUCCESS、merchant balance/debt 仍为 0)→退款→断言订单 REFUNDED、MerchantFundLog 中 type=REFUND/COMMISSION 计数为 0(未产生任何资金反向)、merchant balance/debt 仍为 0。

### [M6] B1 负欠'部分抵欠'与'佣金参与抵欠'边界缺测(唯一负欠测试用 commission_rate=0 且整额清欠) <测试覆盖与边界>
- 场景: doSettle/refund 的负欠逻辑(NotifyService.php:255-263 入账先抵欠、RefundService.php:68-73 退款落欠)是 B1 核心。唯一覆盖它的 testDebtIsolationOnRefundAfterWithdrawal 全程把 commission_rate 置 0,且 O2=20 恰好整额清掉 debt=10、余额=10——即只测了'新入账≥负欠、债务清零'这一条干净路径。从未覆盖:① 新入账只能部分抵欠(入账<debt,抵欠后 debt 仍>0、balance 保底 0);② 佣金非零时抵欠口径(afterCommission=preLogical+gross-commission 仍为负 → debt 取其相反数、balance=0);③ 退款冲账后剩余正头寸(部分已提现:差额一部分落 debt、一部分仍在 balance)。这些 Money::cmp 分支(>=0 取 balance / <0 取 debt)各只测到一侧。
- 证据: app/service/NotifyService.php:257-261(afterCommission>=0?balance:debt);app/service/RefundService.php:68-72(同一三元判定);tests/Feature/RefundTest.php:114-155(commission=0、整额清欠,未测部分抵欠/佣金抵欠)
- 修: 新增两个用例:(a) testPartialDebtOffsetOnSettle:制造 debt=20,随后一笔净入账 12(quantity/price 使 gross-commission=12)→ 断言 debt=8、balance=0(部分抵欠,余额保底 0,不写负 debt 抹零错误);(b) testDebtOffsetWithCommission:commission_rate=0.1、debt=10,gross=20(net 18)→ 断言 debt=0、balance=8(=18-10),验证佣金参与逻辑净头寸计算;(c) testRefundSplitsBetweenBalanceAndDebt:已提现一部分使退款冲账后头寸恰好跨 0,断言 balance 与 debt 同时非零且 balance+? 守恒。


## LOW

### [L1] 结算/退款流水的 balance_after 在 debt!=0 时与真实 balance 列不符,审计对账误导 <concurrency-新资金代码>
- 场景: NotifyService::doSettle 写 INCOME 流水 balance_after=afterIncome(=preLogical+gross,即 balance-debt+gross),COMMISSION 流水 balance_after=afterCommission(逻辑净头寸,可能为负);但 merchants.balance 列实际写的是 max(afterCommission,0)。当商户存在 debt 时,流水里记录的 balance_after 是'逻辑净头寸'而非账上 balance,可能为负数,与 merchants.balance(保底 0)及 debt 列不可直接对账。RefundService:77/82 同样把 afterIncomeReverse/afterCommReverse(逻辑头寸,可能为负)写入 balance_after。这不破坏守恒,但流水 balance_after 字段语义从'账上余额'悄然变成'逻辑净头寸',对账/导出会误读为余额转负。
- 证据: app/service/NotifyService.php:257-274(balance_after 用 afterIncome/afterCommission 逻辑头寸,而 merchants.balance 列写 newBalance=max(...,0));app/service/RefundService.php:68-83(balance_after 用 afterIncomeReverse/afterCommReverse 逻辑头寸,可为负)
- 修: 明确 balance_after 语义:要么统一记真实 balance 列值(max(...,0)),要么新增 debt_after/net_after 字段记录逻辑头寸,避免同一字段在 debt=0 与 debt>0 时语义漂移。

### [L2] 对账销售额口径漏统计 card_shortage 异常单,与佣金流水口径不一致(spec §3.3 对账) <spec合规>
- 场景: AdminReportService 销售额只统计 status∈{PAID,DELIVERED}(PAID_STATUSES),而『卡不足』异常单(NotifyService settle 中 card_shortage 路径)被置为 STATUS_EXCEPTION(5) 却『结算照常』(doSettle 已写 INCOME/COMMISSION 流水,spec §10.4.9 刻意如此)。于是 commissionByMerchant(基于 fund_logs 求和)把这类异常单的佣金算进去,salesByMerchant(基于订单状态)却把其销售额排除,产生『有佣金无销售』。同理超时后付款(closed_then_paid,EXCEPTION 但未结算)也不在销售口径内。spec §3.3 要求平台后台提供『订单-支付对账报表』,该报表自身两腿口径不自洽。
- 证据: AdminReportService.php:26 PAID_STATUSES 仅含 PAID/DELIVERED;:68 salesByMerchant whereIn(PAID_STATUSES);:87-93 commissionByMerchant 对全部 COMMISSION 流水求和(含 EXCEPTION 单的佣金);NotifyService.php:193-203 card_shortage 单 status=EXCEPTION 但 doSettle 照常入账。
- 修: 对账销售额口径纳入『已结算的 EXCEPTION 单』(以是否存在 TYPE_INCOME 流水为准),或改为以 fund_logs 的 INCOME 流水为销售额唯一来源,使销售额与佣金同源同口径;并在 spec 中明确异常单的对账归属。docstring 已记此限制但未修复。

### [L3] B1 负欠下 fund_logs.balance_after 记的是逻辑净头寸而非 merchants.balance,违背 spec §2.10『变动后余额(对账)』语义 <spec合规>
- 场景: spec §2.10 定义 balance_after 为『变动后余额(对账)』,意即应等于该流水后 merchants.balance 列的真实值,供账本与余额列对账。B1 改造后 doSettle/RefundService 把 balance_after 写为『逻辑净头寸』(balance-debt 演算中间值 afterIncome/afterCommission),当商户存在 debt>0 时,这些值与实际落库的 merchants.balance(被 clamp 到 >=0)不相等。导致按 spec 语义用 balance_after 与 merchants.balance 做对账时对不上。当前代码无任何处读取 balance_after(grep 确认),故仅为潜在/对账期暴露,暂不可直接利用。
- 证据: NotifyService.php:257-267 balance_after=afterIncome(逻辑头寸)而 merchants.balance 写的是 newBalance(:260,:263 clamp 到 0);RefundService.php:69-77 同样以 afterIncomeReverse 作 balance_after;spec.md §2.10『balance_after … 变动后余额(对账)』。
- 修: 明确 balance_after 语义二选一并落到 spec:要么记真实 merchants.balance(clamp 后),要么新增 debt_after 字段同时记两科目;并在对账报表中按新口径核对,避免账本与余额列在有 debt 时永久对不平。

### [L4] MerchantFundLog 模型 docblock 与 NotifyService.doSettle 注释仍宣称存在 uniq(order_id,type) 结算幂等兜底,但该唯一索引已被迁移删除——误导后续维护、留下重复入账隐患 <数据完整性>
- 场景: 迁移 20260622120500_drop_fundlog_uniq_order_type 已删除 uniq(order_id,type)。但 MerchantFundLog 模型类注释与 NotifyService::doSettle 行内注释仍写「uniq(order_id,type) 兜底结算幂等」。若日后有人据此注释认为 DB 层仍有去重兜底,新增一条绕过订单行锁的入账路径(如后台手工补账、对账补偿任务),将不再有任何 DB 级防重,直接产生同一订单重复 INCOME/COMMISSION 流水、商户余额超发。
- 证据: app/model/MerchantFundLog.php:9-11 注释「uniq(order_id,type) 保证同一订单同类型至多一条(结算幂等)」;app/service/NotifyService.php:247、276-277 注释「uniq(order_id,type) 兜底结算幂等」;但 database/migrations/20260622120500_drop_fundlog_uniq_order_type.php:13-19 已 removeIndexByName('uniq_order_type')。当前幂等仅靠 NotifyService::settle 的订单行锁+状态重查(NotifyService.php:146-169)。
- 修: 更新两处注释为真实现状(幂等仅靠订单行锁+状态重查,DB 无唯一兜底);或如确需 DB 兜底,改为对 (order_id,type) 仅约束 INCOME/WITHDRAW 等单次型类型(排除可成对出现的 COMMISSION),而非整体删除。

### [L5] 优惠券可被商户硬删除,而 orders.coupon_id 无外键约束,产生悬挂引用并使关单释券(dec used)静默失效 <数据完整性>
- 场景: 商户创建限量券(total=5),买家下单 → OrderService::reserve 原子 inc used、orders.coupon_id 落该券。随后商户调用 CouponService::delete 物理删除该券。该买家订单超时 → OrderService::closeAndRelease 执行 dec('used') 命中已删除行,静默 no-op;订单仍持有指向已不存在券的 coupon_id(孤儿引用)。因 coupons 表与 orders.coupon_id 均无外键(coupons 为后加表),删除不被 RESTRICT 阻挡。
- 证据: app/service/CouponService.php:103-106 delete() 直接 findOwned()->delete(),未校验是否有 pending 订单占额;database/migrations/20260622111000_add_coupon_to_orders.php:9-14 仅 addColumn coupon_id,无 addForeignKey;database/migrations/20260622110000_create_coupons_table.php 无被引用方约束;释放路径 app/service/OrderService.php:279-282 dec('used') 对已删行无效。
- 修: 删除券前校验是否存在引用该券的待支付订单(coupon_id=? 且 status=PENDING),有则禁止删除或改为停用(status=OFF);或给 orders.coupon_id 加指向 coupons 的外键 ON DELETE RESTRICT。订单展示已用快照字段(coupon_code/discount_amount)故对买家无影响,严重性低。

### [L6] 提现申请对 debt 字段为 null(历史商户/迁移前数据)的边界未测 <测试覆盖与边界>
- 场景: applyWithdrawal 的负欠拦截 Money::cmp((string)$m->debt,'0')>0(MerchantWalletService.php:78)依赖 debt 非 null;balance() 用 $m->debt ?? '0.00' 兜底,但 applyWithdrawal 处 (string)null=''→Money::cmp('','0') 行为未验证。若存在迁移前 debt 为 NULL 的历史商户,(string)null 经 bcmath 比较的结果无测试保障。所有现有提现/负欠测试都通过 makeMerchant 创建带默认 debt=0.00 的商户,从未构造 debt=NULL 的商户走提现。
- 证据: app/service/MerchantWalletService.php:78((string)$m->debt 无 null 兜底);app/service/MerchantWalletService.php:30(balance() 处有 ?? 兜底,提现处无);tests/Feature/MerchantWalletTest.php(均用默认 debt)
- 修: 新增 testWithdrawWithNullDebtTreatedAsZero:直接 Db::name('merchants')->update(['debt'=>null]) 后申请提现,断言不因 null 误判为'存在未清偿负欠'而被拒(STATE_INVALID),正常进入余额校验路径。
