# 后端业务逻辑审计(7域高强度+对抗证伪) — 17 条(crit3/high6/med5/low3)

## CRITICAL

### [C1] 退款只冲减 balance、忽略 frozen/已打款,余额转负后被后续入账稀释,形成已提现+退款的重复套现，资金守恒被打破  <资金守恒与账目>
- 场景: 1) 订单 O 金额 100，商户佣金率 0.3。支付回调结算：merchant.balance += 70(net)，平台佣金 30（NotifyService::doSettle）。2) 商户对这 70 申请提现并被 approve 打款：balance 70→0、frozen 70→0，钱离开平台（AdminWithdrawService::approve 只做 frozen-=A）。商户实拿 70。3) 买家售后，管理员对 O 退款。RefundService::refund 第62行 afterIncomeReverse = balance(0) - income(70) = -70，第65行直接把 merchant.balance 写成 -70，完全不检查 frozen，也不检查这 70 是否已被提现打款。4) 平台此时既已把 70 打给商户、又要把 100 全额退给买家：商户账面 -70 但钱已落袋，平台净亏。5) 商户随后新订单入账 50→balance -20，再入账 30→+10，又可把 10 提现走——用新订单的钱稀释了本应追回的负欠，负欠被洗白且永远追不回。
- 错因: 资金：平台对已提现订单退款时凭空损失整笔货款，且负余额可被后续正常入账逐步抵消并再次提现，形成已提现+退款的重复套现通道。守恒不变量 balance+frozen == Σfund_log 在 approve 后已不再对应未结算订单净额，退款进一步把 balance 推负，平台无任何拦截或挂账科目，直接亏损。
- 证据: app/service/RefundService.php:59-65 仅 Money::sub(balance,$incomeSum) 写回 balance，无 frozen 检查、无已提现部分检查、无负值拦截；AdminWithdrawService.php:79-82 approve 只 frozen-=A 把钱付出平台；MerchantWalletService.php:68 申请提现仅校验 balance 足额，负欠被后续入账填平后即可再提；RefundService.php:20 注释自认已提现导致余额转负则商户负欠默认允许不可提现，但实现没有任何不可提现的负欠隔离。
- 修法: 退款时区分可冲回部分：对已结算订单，冲回额=min(income, 当前可冲回余额)；不足部分（已被提现打款）落入独立商户负欠/待追偿科目（新增 fund_log 类型或 merchant.debt 字段），并在 applyWithdrawal 里扣减负欠后才允许提现；严禁直接把 balance 写成负数而无隔离。负欠应阻断后续提现直至清偿。

### [C2] 退款把「已发货(SOLD)」卡密回库再售,同一卡密被卖两次且买家仍持有  <卡密一物一售与回库>
- 场景: 1) 买家A 下单买商品P的卡密C,支付成功:NotifyService.settle() 把卡C 置 SOLD 并写入 orders.delivered_content(买家A 已经看到/拿到卡C 的 secret)。2) 平台或投诉裁决对该已发货订单发起退款:admin/Orders::refund → RefundService::refund()。3) REFUNDABLE 包含 STATUS_DELIVERED,通过校验;RefundService.php:44-49 把 order_id=该单 且 status∈{LOCKED,SOLD} 的卡(含已售的 C)统一改回 status=UNSOLD、order_id=null、sold_at=null,并 products.stock+1。4) 卡C 重新回到可售池。5) 买家B 下单同商品,OrderService 取卡 FOR UPDATE SKIP LOCKED 拿到 C,支付后 C 的 secret 被发给买家B。
- 错因: 资金/超卖:一张卡密被两个买家同时持有(买家A 退款后没退回卡、delivered_content 未清空仍可见;买家B 正常付费拿到同一卡)。虚拟卡密发出即不可收回,回库等于无中生有再卖一次,商户/平台承担双重交付损失;并破坏 spec §6「一张卡至多归属一个订单」。spec §10.5 明确「本期不实现资金/卡密退款编排…虚拟卡密一般不可回收,退款定位为『资金退回』」,实现却对 SOLD 卡做了物理回库,直接违背规格。
- 证据: app/service/RefundService.php:24 REFUNDABLE 含 Order::STATUS_DELIVERED;:44-52 对 status∈{LOCKED,SOLD} 的卡一律改回 UNSOLD+order_id=null+sold_at=null 并 stock+restore;:89-94 订单置退款时未清空 delivered_content(买家端订单查询仍可见已发卡密)。对照 spec.md §10.5「虚拟卡密一般不可回收…本期不实现卡密退款编排」。
- 修法: 退款不应将 SOLD(已发货)卡回库重售。区分处理:仅 LOCKED(尚未交付)的卡可释放回 UNSOLD;SOLD 卡应置为一个终态(如 DISABLED/REFUNDED 专用态)并保持 order_id 归属,绝不回 UNSOLD;stock 仅对释放的 LOCKED 卡数回补,不含 SOLD。或按 spec §10.5 本期退款只做资金退回、不碰卡密。同时退款后应同步处理 delivered_content 展示口径。

### [C3] 结算即入可提余额、无清算冻结期 + 退款冲账只减 balance 不减 frozen,商户可在退款窗口内提走货款,退款后把余额冲成负数,平台双向垫付、商户净赚一笔  <提现结算闭环与超额>
- 场景: 设商户佣金率 0(便于演算,任何费率同理)。
1) 买家下单并支付一笔 total=100 的订单,NotifyService.settle()→doSettle() 立即把 100 计入 merchants.balance(可提现余额),写 income +100 / commission -0 两条流水。订单 status=DELIVERED。
2) 商户立刻调用 merchant/Wallet::applyWithdrawal 提现 100。MerchantWalletService.applyWithdrawal() 仅校验 amount<=balance,通过:balance 0、frozen_balance 100,生成 PENDING 提现单。
3) 平台后台 AdminWithdrawService.approve():只校验 frozen_balance(100)>=amount(100),frozen-=100→0,withdrawal=PAID。真金 100 离开平台打给商户。
4) 买家投诉/平台判退(ComplaintService 或 admin/Orders::refund)→ RefundService.refund():wasSettled=true,afterIncomeReverse=balance(0)-incomeSum(100)=-100,把 merchants.balance 写成 -100,卡密回库。买家同时拿回 100。
最终账面:balance=-100,frozen=0。商户已落袋 100 现金,订单已退款不再有任何应收。商户弃号即可,-100 永远收不回。
- 错因: 资金/账目不平:平台对同一笔交易付出两次现金——给商户提现 100 + 退给买家 100——只收到买家 100,净亏 100。结算把『尚可能被退』的货款直接当作可提现余额放出,缺少 T+N 清算冻结期或『可提=已过退款窗口的已结算额』口径;退款冲账只作用于 balance,负余额对已离开平台的现金没有任何约束力(RefundService 注释自认『默认允许转负、商户负欠』,但没有任何机制阻止提现先于退款发生)。这让恶意商户可系统性套现:自买自卖→提现→退款,稳定净赚货款。
- 证据: app/service/NotifyService.php:248-258 doSettle 直接 merchants.balance += gross(可提现),无冻结/清算延迟;app/service/MerchantWalletService.php:68-75 applyWithdrawal 仅 amount<=balance 即放行,不区分资金是否已过退款窗口;app/service/AdminWithdrawService.php:76-85 approve 只校验 frozen_balance>=amount,不看 balance 是否为负即放款;app/service/RefundService.php:62-65 退款 afterIncomeReverse=Money::sub(balance,incomeSum) 可写出负 balance 且只动 balance、从不动 frozen_balance。
- 修法: 引入结算清算期:doSettle 时把净额计入 frozen_balance(或新增 pending/clearing 字段)而非 balance,过退款窗口(或人工放行)后再 frozen→balance;退款只冲 clearing/frozen 部分,使资金未离开平台前才可被冲回。提现申请校验应基于『已清算可提额』而非含未过窗口货款的 balance。AdminWithdrawService.approve 必须在 (balance - 已结算未清算应退敞口) >= 0 时才放款,balance 为负或敞口不足直接拒绝。退款发生在提现之后时,应优先冲减待打款的 frozen,无法冲减再转应收挂账并阻断该商户后续提现。


## HIGH

### [H1] EXCEPTION(异常)态不区分子类型，closed-then-paid 单可被商户 deliverManually 发货却永不结算，商户白发货  <资金守恒与账目>
- 场景: 两条 4005 路径(spec §10.4.9)都落到同一个 Order::STATUS_EXCEPTION=5，且 Order 表无任何异常原因/是否已结算字段。A) closed-then-paid(NotifyService.php:155-164)：payment 记成功、订单转 EXCEPTION、不结算（无 income/commission 流水），spec 要求走退款。B) card-shortage(NotifyService.php:193-203)：转 EXCEPTION 但结算照常。1) 取一张 closed-then-paid 异常单（A，买家已付 100，spec 要求退款而非发货）。2) 商户在后台对它调用 deliverManually(merchant/Order.php:41)。OrderService::deliverManually:290-295 只校验 status∈{PAID,EXCEPTION} 即发货，全程不调用 doSettle。3) 结果：商户把卡密发给了买家（货已交付），但 balance 永远没加这 100 的净额——商户白白交付货物却拿不到钱；同时这单本应退款给买家，现在却被发货，买家既付了钱又拿到货、平台收的款挂在 payment 上无人结算，账目三方都对不平。
- 错因: 账目：同一 EXCEPTION 态承载结算语义相反的两类单(一类已结算待补发、一类未结算待退款)，却无字段区分。deliverManually 对未结算的 closed-then-paid 单发货后既不补结算也不阻止，导致商户已交付货物却零入账、平台收款无对应商户入账、买家本应退款却被发货，资金账三方失衡。
- 证据: app/model/Order.php:31 仅一个 STATUS_EXCEPTION=5，无 exception_reason/settled 标志；NotifyService.php:155-164(closed-then-paid 不 doSettle) 与 193-203(card-shortage doSettle 照常) 都置同一状态；OrderService.php:276-332 deliverManually 接受 EXCEPTION 即发货且全程无 doSettle 调用(grep 证实 OrderService 内无 doSettle/SettlementService 引用)。
- 修法: Order 增加 exception_reason(closed_then_paid/card_shortage)或 settled 标志并在两条 NotifyService 异常分支写入；deliverManually 仅允许 card_shortage(已结算)子类型发货，对 closed_then_paid 子类型拒绝发货并引导走退款；或在 deliverManually 内对未结算单补 doSettle 后再发货，确保发货必伴随结算。

### [H2] closed_then_paid 异常单经商户「补发」后发货但永不结算 —— 商户白送货、买家货款挂账无人入账  <订单状态机与生命周期>
- 场景: 1) 买家对卡密/权益类(走码池)商品下单,生成 PENDING 单,预占卡 status=1。2) 15 分钟过期,定时任务 reclaimExpired→closeAndRelease 关单 status=3(CLOSED),释放卡回 UNSOLD。3) 渠道延迟回调到达且支付成功:NotifyService::settle 锁内重查 status==CLOSED,走 §10.4.3 分支(行 155-164):markPaymentSuccess + 订单转 EXCEPTION(5),但**刻意不调用 doSettle**(spec §10.4.9:closed_then_paid 货款应退、不入账)。4) 商户在后台看到该异常单,点击「补发」→ deliverManually(行 276-332)。该方法对 EXCEPTION 单放行(行 293),重新占卡→售出→订单置 DELIVERED(行 318-329),但**全程不调用 doSettle**。结果:卡已发给买家,订单显示已发货,但商户 balance 从未入账、也不会再入账;买家真实付的钱仍滞留在渠道/平台侧无对应账。
- 错因: 账目不平 + 资金挂账。这是一笔买家已付款、卡已交付的真实成交,却既没有 merchant_fund_logs 收入流水、也没有商户余额入账,平台佣金也未计提。商户实质上免费送出了卡密;买家的货款落入既不结算又不退款的灰色地带。spec §10.4.9 明确 closed_then_paid 的资金语义是「货款应退、待人工/退款」——一旦商户走『补发』把它变成已发货,退款路径(RefundService 依据结算流水反向,wasSettled=false)也不会给买家退任何钱,这笔款彻底失踪。
- 证据: app/service/NotifyService.php:155-164(CLOSED→EXCEPTION 不结算);app/service/OrderService.php:293(deliverManually 允许 EXCEPTION 单);OrderService.php:276-332(deliverManually 全程无 doSettle 调用);app/service/RefundService.php:55-57(wasSettled 依据 INCOME 流水,closed_then_paid 单无此流水→退款不退钱)。两条 EXCEPTION 路径结算语义不同(spec §10.4.9),但 deliverManually 对二者一视同仁。
- 修法: deliverManually 必须区分异常来源:对『卡不足』EXCEPTION(已结算)补发后不再结算;对『closed_then_paid』EXCEPTION(未结算)要么禁止『补发』(只允许退款),要么在补发成功后补调 doSettle 入账。可在订单上加标记字段(如 exception_reason)或在补发前检查该单是否已有 INCOME 流水:无流水的异常单走『补发即结算』或直接拒绝补发并提示走退款。

### [H3] 手动补发 deliverManually 不校验 goods_type,知识/资源类异常单被强行走发卡路径  <卡密一物一售与回库>
- 场景: 1) 商户有一个知识类(goods_type=2)或资源类(=3)商品,这类商品不占码池(Product::usesCardPool() 为 false,该商品 cards 表中无卡)。2) 买家下单该商品,订单超时被回收关闭(status=3)。3) 渠道延迟回调成功到达:NotifyService.settle() 在 STATUS_CLOSED 分支(NotifyService.php:155-164)把订单转 EXCEPTION——该分支在 goods_type 判断(:176)之前,对任何商品类型都触发。4) 商户在后台对这张 EXCEPTION 订单点「补发」:merchant/Order::redeliver → OrderService::deliverManually()。5) deliverManually 全程把订单当卡密单处理:按 quantity 去该 product 的 cards 池取未售卡(OrderService.php:300-314),知识/资源商品池为空 → need>0 且取不到 → 抛 STOCK_NOT_ENOUGH「无法补发」,商户永远补不了货;若该商品历史上恰有遗留卡,则会误把无关卡发出。
- 错因: 账目/交付:知识、资源类订单本应走内容发货(delivery_message),deliverManually 无视订单快照 goods_type,统一走码池取卡逻辑(下单 create() 和回调 settle() 都用 usesCardPool/goodsTypeUsesPool 路由,唯独补发漏判)。结果是非卡密的异常订单无法被商户正常补发(永久卡死转人工),或在有残留卡时错发,造成漏发/错发。
- 证据: app/service/OrderService.php:276-332 deliverManually 通篇按 cards 池处理,无任何 goods_type/usesCardPool 判断;对比 OrderService.php:106 下单用 usesCardPool 路由、NotifyService.php:176 回调用 goodsTypeUsesPool 路由。EXCEPTION 来源 NotifyService.php:155-164 的 closed→paid 分支位于 goods_type 判断(:176)之前,对所有类型生效。
- 修法: deliverManually 入口按订单快照判断:Product::goodsTypeUsesPool((int)$order->goods_type) 为 false 时走内容发货分支(delivered_content = 商品 delivery_message,直接置 DELIVERED),为 true 才走取卡补发逻辑,与 NotifyService.settle() 的路由口径保持一致。

### [H4] 限量券(total=N)实为无限量:下单不锁券/不占用量,核销时的条件自增只封顶计数器而非封顶折扣分发  <优惠体系经济正确性>
- 场景: 1) 商户建一张「仅前 1 名」单用券:type=满减,value=50,total=1,used=0。
2) 在 15 分钟内,100 个买家各自用同一券码对同一商户下单。每次走 OrderService::create → PricingService::bestDiscount → CouponService::findUsable,该方法只做无锁的 Coupon::find() 并判断 used(0) < total(1),100 笔全部通过,100 个订单的 total_amount 都减了 50。
3) OrderService::create 全程不锁 coupon 行、不写 used(grep 已确认 OrderService 无任何 Coupon 写操作)。
4) 100 笔全部支付成功,逐笔进入 NotifyService::doSettle。其条件自增 `Coupon::where(id)->whereRaw('(total=0 OR used<total)')->inc('used')` 只让第 1 笔把 used 0→1,其余 99 笔是 no-op。
5) 结果:100 笔订单都按减 50 入账结算(doSettle 用 order.total_amount),商户实际放出 100×50=5000 的折扣,而券面只授权 1 张。
- 错因: 账目/资金:限量券的「总量 total」是商户控制营销成本的唯一闸门,这里被架空——total=1 的券可被任意多笔订单同时享受,折扣分发量与 used 计数器彻底脱钩。商户按「1 张券最多让利 value」做的成本预算被无限放大,直接的让利资金损失。即便不并发,只要在第 1 笔结算前(订单 TTL 长达 15 分钟)有多笔 pending 订单,就必然超发。
- 证据: CouponService.php:138-162 findUsable 用无锁 Coupon::find(),仅比较 used<total;OrderService.php:130-158 下单只把 discount/coupon_id 写进订单,grep 确认全程不锁 coupon、不改 used;NotifyService.php:274-278 doSettle 用条件自增封顶 used,使超出 total 的核销静默丢弃但折扣已落在 total_amount 上。
- 修法: 把券的占用量提前到下单事务内并加锁:在 OrderService::reserve 事务里对 coupon 行 `lock(true)` 重查 used<total 后立即 `inc('used')`(占用语义),订单取消/超时回收(closeAndRelease)与支付失败时回补 used-1;doSettle 不再自增(改为已在下单时占用)。这样 total 在下单层即生效,杜绝同券多单超发。或至少在 settle 内对 coupon 加行锁并在 used>=total 时把该订单转异常/不予该折扣,而不是静默吞掉。

### [H5] 退款冲账与提现冻结互不感知,退款把 balance 冲负后仍能 approve 打款,冻结/可用总额(balance+frozen)不再守恒为真实欠款  <提现结算闭环与超额>
- 场景: 1) 商户 balance=100、frozen=0。
2) applyWithdrawal(100):balance=0、frozen=100、PENDING。
3) 该订单退款 RefundService.refund():wasSettled=true → balance=0-100=-100、frozen 仍=100(退款逻辑完全不触碰 frozen_balance)。此刻 balance+frozen=0,看似守恒,但 frozen 里的 100 是『马上要打款出去的钱』,而它对应的货款已被退款抽走。
4) AdminWithdrawService.approve():frozen_balance(100)>=amount(100) 校验通过 → frozen=0 打款 100。最终 balance=-100、frozen=0。
对称地,若先 approve 再退款,结果一致:平台多付 100。无论先后,系统都允许『对已被退款抹掉的货款执行打款』。
- 错因: 资金守恒被破坏:frozen_balance 的语义是『锁定待打款的可用资金』,退款抽走了它的资金来源却不冻结/不撤销对应提现单,approve 的 frozen>=amount 校验形同虚设(frozen 仍是申请时的旧值)。结算与退款对同一笔货款的提现状态不是幂等/不冲突的——退款没有把受影响的 PENDING 提现单驳回或扣减,导致平台对一笔已退的钱照常打款。
- 证据: app/service/RefundService.php:59-86 退款分支只 update merchants.balance,从不读写 frozen_balance,也不查询/驳回该商户 PENDING 的 withdrawals;app/service/AdminWithdrawService.php:76-79 approve 的唯一资金校验是 frozen_balance>=amount,与 balance 是否已被退款冲负完全解耦。
- 修法: 退款事务内对该商户加行锁后,应连带处理在途提现:若退款使 (balance) 不足以覆盖未打款的 PENDING 提现,应自动驳回/缩减对应 PENDING 提现单并把 frozen 退回再冲账,保持 frozen 永远有真实可用资金背书。approve 除校验 frozen>=amount 外,还须校验 balance>=0(或 balance - 在途退款敞口 >=0),负余额一律拒绝打款。

### [H6] 卡密类已发货订单可全额退款,卡密明文已交付却把卡回库再售 —— 买家白嫖卡密  <退款政策与买家滥用>
- 场景: 1) 买家下单买一张卡密类商品并支付,订单进入 STATUS_DELIVERED;2) BuyerOrderService::query 返回 delivered_content 卡密明文,买家已抄走卡密;3) 买家以「卡密无效」发起投诉 ComplaintService::file;4) 平台 adminResolve(refund=true) 或管理员直接 admin/Orders::refund;5) RefundService::refund 命中 STATUS_DELIVERED(在 REFUNDABLE 内),把 Card 从 SOLD 改回 UNSOLD、order_id 置空、stock+1,卡重新进入可售池;6) 买家拿到全额退款,卡密明文仍在手。
- 错因: 资金+超卖双重损失:虚拟卡密一经交付即不可回收(spec §11 明确『虚拟卡密一般不可回收』),把已交付卡密回库再售意味着同一张卡密会被卖两次(第二个买家拿到的是已被前一买家知晓的废卡/或前买家继续使用),且第一个买家全额退款=白嫖。RefundService 注释自称『卡密一般不可回收』但代码仍无条件回库,实现与策略矛盾。
- 证据: RefundService.php:24 REFUNDABLE 含 STATUS_DELIVERED;RefundService.php:44-52 对 Card::STATUS_SOLD 也无条件回 UNSOLD 并 stock+=restore,全程不检查 order->delivered_content 是否已交付明文、不区分卡密类 vs 资源类;BuyerOrderService.php:39-44 已发货即吐出卡密明文。
- 修法: 退款时区分商品类型与交付状态:卡密类一旦 STATUS_DELIVERED(delivered_content 非空)默认不回库、不恢复 stock(卡标记为 REFUNDED/作废而非 UNSOLD),仅做资金退回;是否回库应由管理员显式选择并默认关闭。或在 RefundService 增加参数 restock=false 作为卡密类默认。


## MEDIUM

### [M1] 限量优惠券在并发/超时回收下可被超核销或永久占额,total 配额账目不可信  <订单状态机与生命周期>
- 场景: 配额场景(超核销):某券 total=1、used=0。1) 买家A、买家B 几乎同时下单,均填该券:OrderService::create→reserve 里 PricingService.bestDiscount→CouponService.findUsable 仅做 used>=total 只读判断(行 155),两单都判定可用并都以折后价建单(下单阶段**不占用券额**)。2) A、B 先后支付成功,各自进入 NotifyService::doSettle(行 274-278)做条件自增 `(total=0 OR used<total) inc(used)`。该自增确实防止 used 顶破 total(并发安全),所以最终 used=1 封顶——但**第二单 B 已经按折后价收款发货,却没有占到券额**:即一张 total=1 的券实际被两笔订单享受了优惠,商户少收一份钱。占额场景:3) 买家C 下单填券建单(PENDING),券未核销;C 不支付,15 分钟后 reclaimExpired 关单——closeAndRelease(OrderService.php:222-262)只释放卡、回补库存,**完全不触碰券**,本来也无需(下单未占券)。但若商户依据『下单量』判断券热度则失真。核心问题是第1点。
- 错因: 资金/营销账目失真:限量券的『限量』在并发下不被尊重——下单阶段不预占券额、只在结算时封顶,导致同一张限量券可被超过 total 笔订单实际享受优惠(每超一笔商户就少收一份对应优惠额)。对 total 较小或高并发秒杀券,商户预期『只让利 N 份』却让利了 N+并发量份。
- 证据: app/service/CouponService.php:155(findUsable 仅只读判断 used>=total,无占用);app/service/OrderService.php:130-135(下单 bestDiscount 取券但不写 coupons.used);app/service/NotifyService.php:274-278(仅结算时条件自增、封顶 used);closeAndRelease(OrderService.php:222-262)关单不回滚券(因下单未占,逻辑自洽但放大了上面的下单-结算时间窗)。
- 修法: 两选一:① 下单时即对限量券做条件占用(coupons SET used=used+1 WHERE id=? AND (total=0 OR used<total),affected=0 则券已领完拒单),并在 closeAndRelease/refund 中对该单券做反向释放(refund 已有反核销,closeAndRelease 需补券释放);② 维持结算占用,但在结算封顶失败(inc 影响 0 行,说明券已售罄)时,对该订单**取消券优惠、按原价补差或转异常**,而不是闷声按折后价发货。当前实现两者都没做,等于限量约束形同虚设。

### [M2] 支付时不复验券与限时折扣的有效性:订单创建后券过期/停用/折扣窗口结束,仍按旧折扣价收款并核销过期券  <优惠体系经济正确性>
- 场景: 1) 商户券 valid_to = 12:05;限时折扣窗口 discount_end = 12:05。
2) 买家 12:00 下单(订单 TTL 15 分钟,到 12:15)。OrderService 用 effectivePrice(now=12:00) 取折扣单价、bestDiscount 取券折扣,total_amount 锁定为折后价。
3) 买家 12:10 才付款。NotifyService 金额校验只比较实付 == 冻结的 order.total_amount(NotifyService.php:98-102),通过;settle 走 doSettle,对已过期券仍执行 used+1(NotifyService.php:274-277);商品限时折扣此时也早已结束(effectivePrice 在结算路径根本不再调用)。
4) 结果:12:05 已失效的券/折扣,在 12:10 的付款里照常生效,过期券的 used 被记一次。
- 错因: 账目/营销越权:券的 valid_to、status=停用、限时折扣窗口都是商户对让利时间的硬约束。下单到支付有最长 15 分钟窗口,买家可在临界点下单、卡到失效后再付,稳定地把已结束的促销/已停用的券变现。商户在 12:05 主动停用一张被滥用的券,也对 12:00~12:15 的存量 pending 订单完全无效——停用形同虚设。属于「状态机有洞」:券/折扣的有效性只在下单瞬间判定,支付确认环节不复验。
- 证据: OrderService.php:125-135 下单一次性冻结 unit_price/discount/total_amount;NotifyService.php:99-102 支付仅校验实付==冻结 total_amount,不重判券有效期/状态/折扣窗口;NotifyService.php:274-277 doSettle 对券无条件(除 used<total 外)自增,无 valid_to/status 复核;RefundService 同样无复核。
- 修法: 在 settle 事务内(已持有商品/订单行锁)对带 coupon_id 的订单复验券有效性:若券已停用/过期/在结算时已不满足条件,按业务策略处理(常见做法:仍按已锁价发货以保护已付款买家,但记风控日志并阻止 used 计入,或转人工)。对限时折扣同理记录快照口径。关键是让「失效后付款」不再静默享受折扣并污染 used 计数,使商户的停用/到期动作对存量 pending 订单可控。

### [M3] 提现状态机缺『通过(已审/待打款)』中间态:approve() 把 PENDING 直接跳到 PAID 并即刻释放冻结,STATUS_APPROVED(1) 成死代码,审批通过=钱已离开账面无可回退点  <提现结算闭环与超额>
- 场景: spec §2.11 定义 withdrawals.status:0 待审 / 1 通过 / 2 拒绝 / 3 已打款,Withdrawal 模型也定义 STATUS_APPROVED=1。但 AdminWithdrawService.approve() 一步把 status 从 PENDING(0) 写成 STATUS_PAID(3),并在同一事务里 frozen-=amount 视为钱已付出。
1) 平台点『审核通过』→ 系统立即认为已打款、释放 100 冻结。
2) 但实际银行/三方打款可能尚未发起或失败。此时没有 APPROVED 中间态,无法表达『已审核但钱还没出』;一旦实际打款失败,frozen 已被清零、没有干净的回退状态,只能人工改库。
- 错因: 状态机有洞:把『审批通过』与『资金实际打出』两个本应分离的事件压成一个原子动作,且 approve 在打款尚未确认前就释放冻结,违背 spec 定义的四态机。STATUS_APPROVED 永远写不进数据库(死状态),对账时无法区分『已批未打』与『已打』,实际打款失败缺乏可回滚的中间态,易造成 frozen 与真实银行流水对不平。
- 证据: app/service/AdminWithdrawService.php:84-85 approve 直接 update status=Withdrawal::STATUS_PAID;app/model/Withdrawal.php:21-24 定义了 STATUS_APPROVED=1 但全代码库无任何写入(grep 仅见定义);spec.md:276 明确 status『1 通过 / 3 已打款』为两个独立状态。
- 修法: 拆分为 approve(PENDING→APPROVED,frozen 维持锁定)与 markPaid(APPROVED→PAID,确认银行打款成功后才 frozen-=amount)两步;或在 approve 释放冻结前确有打款回执。打款失败提供 APPROVED→REJECTED 回退路径并把 frozen 退回 balance,保证冻结余额始终对应真实在途资金。

### [M4] 投诉无次数/频率限制 + 终结后可无限重开,买家可对同一单反复刷投诉与申请介入  <退款政策与买家滥用>
- 场景: 1) 买家对订单发起投诉,平台 adminReject 驳回(STATUS_REJECTED);2) file() 的去重只查 Complaint::ACTIVE(OPEN/REPLIED/INTERVENE),REJECTED/RESOLVED 不算 active;3) 买家立即对同一单再发起一条全新投诉;4) 商户/平台再次被迫处理;5) 无限循环,每轮都能再 escalate 申请平台介入。复诉/伪造邮箱枚举:verifyOrder 仅按 order_no+邮箱核验,投诉记录无 buyer_id 绑定、无频率限制。
- 错因: 运营/资源滥用面:同一买家可对同一已驳回订单无限次重开投诉并反复申请人工介入,平台无法终结纠纷;数据库 complaints 表也无 (order_id) 唯一约束(migration 仅 idx_order 普通索引),无任何兜底。商户被持续骚扰,平台人工成本被买家单方拉爆。
- 证据: ComplaintService.php:29 去重条件 whereIn('status', Complaint::ACTIVE) 只覆盖 ACTIVE=[OPEN,REPLIED,INTERVENE](Complaint.php:41),REJECTED(4)/RESOLVED(3)后可再 file();file() 全程无每邮箱/每订单投诉计数或时间窗限制;migration 20260622130000 仅 addIndex(['order_id']) 非 unique。
- 修法: file() 增加每订单总投诉数上限与冷却窗;对已 RESOLVED/REJECTED 的订单禁止再次发起(或要求新投诉必须是不同 type 且有限次);对枚举/刷量加每邮箱+IP 限频。

### [M5] 拉黑买家时不处理其在途订单 —— 已下未付/已支付未发货订单照常推进  <退款政策与买家滥用>
- 场景: 1) 买家邮箱 a@x.com 已有一笔 STATUS_PENDING 待支付订单(或 STATUS_PAID 待发货);2) 平台 BuyerBlacklistService::add('a@x.com') 拉黑;3) add() 只写入 buyer_blacklist 一行,isBlocked 只在 OrderService::create 下单入口被调用;4) 该买家原有待支付订单完成支付 → 回调照常发货,黑名单形同虚设。
- 错因: 风控失效:拉黑的语义应是『阻断该买家继续交易』,但只拦新下单、不动在途单。被拉黑的诈骗/盗刷买家仍能让其已建订单走完支付+发货拿到卡密。spec 把黑名单定位为下单前拦截,但在途订单的处置是策略缺口(应关闭待支付/标异常待人工)。
- 证据: BuyerBlacklistService.php:24-41 add() 仅 upsert 黑名单行,无任何对 orders 的扫描/关闭;isBlocked 仅被 OrderService.php:42 在 create 入口调用,支付回调/发货链路无二次黑名单校验。
- 修法: add() 时将该邮箱的 STATUS_PENDING 订单关闭(STATUS_CLOSED),STATUS_PAID 未发货订单转 STATUS_EXCEPTION 走人工/退款;并在支付回调发货前再次 isBlocked 兜底。


## LOW

### [L1] 订单状态 1(已支付)为不可达态,多处统计把它当『有效成交』计数,口径偏差  <订单状态机与生命周期>
- 场景: 1) 全代码检索 STATUS_PAID(=1)的写入点:无任何路径会把 orders.status 置为 1。回调 settle 对正常单直接 PENDING(0)→DELIVERED(2)一步到位(NotifyService.php:178-221),spec §6/§7 也明确『1→2 在同一回调事务内一气呵成』。2) 因此 status=1 在 orders 表中永不出现。3) 但 AdminViewService::orders 统计有 'paid'=>count(status=1)(恒为0)、AdminReportService/MerchantStatsService 的 PAID_STATUSES=[1,2]、RefundService::REFUNDABLE/ComplaintService::COMPLAINABLE 也含 1。
- 错因: 非资金安全问题,但状态机有『可定义不可达』态,导致后台统计存在恒为 0 的死计数(如平台后台『已支付』卡片永远显示 0),易误导运营;且把 1 纳入可退款/可投诉集合属于防御性冗余,掩盖了『正常成交只会是 2』这一事实,后续若有人真把单写成 1 会绕过为 2 设计的发货校验。
- 证据: 全仓 grep 显示 orders.status 无 =1 写入;NotifyService.php:150 与 178(PENDING 直达 DELIVERED);app/service/AdminViewService.php:67('paid'=>status=1 恒 0);AdminReportService.php:26 / MerchantStatsService.php:17(PAID_STATUSES 含 1)。
- 修法: 二选一:① 若产品上确实需要『已支付未发货』中间态(如异步发货),应在 settle 里先落 status=1 再发货置 2,使该态真实可达;② 若确认发货永远同事务完成,则从对外统计移除 status=1 的死计数(或注释说明其为占位),避免后台展示恒 0 的『已支付』卡片误导运营。

### [L2] 提现无最小额/上限/手续费口径:fee 字段恒为 0、spec 的 fee 列形同虚设,且无最小提现额限制,商户可高频提取极小额制造海量打款工单与潜在三方手续费倒挂  <提现结算闭环与超额>
- 场景: 1) 商户 balance=0.03。
2) applyWithdrawal('0.01',...):服务端仅校验金额为正且 <=balance,无最小额下限 → 通过,生成 0.01 的 PENDING 提现单,fee 硬编码 '0.00'。
3) 可重复申请 0.01、0.01、0.01……每笔都需平台 approve 打款。withdrawals.fee 列在 spec §2.11 存在却永不被写入,平台无法对提现计收手续费,真实三方代付每笔有固定成本时即出现『手续费 > 提现额』的倒挂。
- 错因: 资金/运营口径缺失:spec 设计了 fee 字段(手续费)但实现恒置 0,平台无法回收代付成本;同时没有最小提现额与单笔/单日上限,商户可拆分成大量微额提现,既放大打款工单与三方手续费成本,也为前述套现/骚扰留出空间。属设计层口径遗漏而非显示 bug,单测难发现(每笔单独看都合法)。
- 证据: app/service/MerchantWalletService.php:52-53 仅校验 ^\d+(\.\d{1,2})?$ 且 >0,无最小额/上限;app/service/MerchantWalletService.php:78 与控制器 app/controller/merchant/Wallet.php:32-35 均未设下限;Withdrawal 创建处 fee 恒为 '0.00'(MerchantWalletService.php:78),spec.md:274 定义 fee 列但无任何写入逻辑。
- 修法: 在 system_settings 增加 withdraw_min_amount / withdraw_max_amount / withdraw_fee_rate,applyWithdrawal 校验金额落在 [min,max] 并按费率计算 fee 写入 withdrawals.fee,打款实际到账=amount-fee,流水如实记录手续费,避免空有字段不计费与微额刷单。

### [L3] 复合投诉退款幂等依赖订单状态而非投诉记录,多条并存投诉的 refunded 标记账目失真  <退款政策与买家滥用>
- 场景: 1) 买家对一订单发起投诉 A,平台 adminResolve(A, refund=true) → RefundService 把订单退款、A.refunded=1;2) 因『终结后可重开』缺陷买家再发起投诉 B;3) 平台 adminResolve(B, refund=true);4) adminResolve 中 order->status 已是 STATUS_REFUNDED,走 refunded=1『已退仅标记』分支不重复退钱(资金正确),但 B.refunded=1 在账面上记成『B 触发了退款』,与实际(退款由 A 触发)不符。
- 错因: 账目归因失真而非直接资损:同一笔退款被多条投诉各自标 refunded=1,审计/对账时退款笔数与投诉退款标记数对不上,无法据 complaints.refunded 统计真实退款金额。资金本身因订单状态重查未二次退款(这点是对的),但 refunded 字段语义被污染。
- 证据: ComplaintService.php:138-143 adminResolve 以 Order::find 的 status===REFUNDED 判定『已退仅标记 refunded=1』,refunded 标记不与触发退款的那条投诉绑定;RefundService 幂等正确(:39 状态重查拒绝二次退),但 complaint.refunded 无去重。
- 修法: refunded 标记仅赋给真正调用 RefundService 成功的那条投诉;『已退仅标记』分支可用单独标志(如 refund_linked)区分『本投诉触发退款』与『订单已被他途退款』,保证 sum(refunded) 与实际退款笔数一致。
