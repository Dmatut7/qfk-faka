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

---

# 第三轮深挖(CLI/下载签名/注入/未测并发)

4 finder × disprove,12候选 → 4「确认」,但经我二次研判:**仅 1 项为真实缺陷**。

## 确认并已修(1)

| # | 严重度 | 缺陷 | 处置 | 测试 |
|---|---|---|---|---|
| 3 | medium | `stock:reconcile` 资金自检比 `SUM(amount)` 与**物理 balance**,但流水 amount 记的是逻辑净头寸(balance-debt)增减(B1) → **有负欠时误报资金漂移** | 改比 `balance-debt`,docblock 同步 | `StockReconcileTest::testFundCheckUsesLogicalNetPositionUnderDebt`(含 positive control) |

## 二次研判为非缺陷 / 不修(3)

- **#1 下载签名未绑定买家**(agent 评 critical):**误报**。DownloadService 是标准签名 URL(HMAC-SHA256、`hash_equals` 时序安全、绑定 order_no+expires、校验 DELIVERED+资源类型、30min 时效、强制密钥无硬编码回退)。agent 的「绑定 buyer_email」修法无效——email 会落在 URL 里,泄露链接照样泄露 email;签名 URL 的 bearer 语义本就如此(同 S3 presigned / 网盘分享链)。
- **#2 order:clean × 回调竞态**(agent 评 high):**已正确处理**。`closeAndRelease` 在**行锁内重查状态**(OrderService.php:261)后才关单,且关单+释放卡+释放券在**同一事务原子完成**,不存在「半释放的 PENDING 单」;EXCEPTION 单保留 LOCKED 卡是供人工补发的有意设计。agent 描述的触发序列因事务原子性而不可能发生。
- **#4 下载缺参错误码**(agent 评 low):`expires` 缺省 0 → 返回 STATE_INVALID 而非 PARAM_ERROR,**无安全绕过**(agent 自述),纯错误码精度问题,不值改。

> 备注:本轮一个 hunt agent 经 Bash 在 tests/ 落了个引用不存在类的临时验证文件(未跟踪),已清理;真实覆盖以 StockReconcileTest 为准。
> **趋势**:三轮深挖确认真实缺陷数 backlog清零→6→1,边际递减,代码趋于干净。

---

# 第四轮深挖(前端/移动端显示 — 用户原始重点)

3 finder × disprove,15候选 → 4「确认」,二次研判:**2 项真实并已修**。

## 确认并已修(2)

| # | 严重度 | 缺陷 | 处置 |
|---|---|---|---|
| 1 | high | 详情页/支付页**底部 fixed 购买条/付条缺 safe-area-inset-bottom**,刘海屏(iPhone X+)home indicator 遮挡价格与购买按钮(主容器已处理 env,fixed 条漏了) | 两条内边距加 `calc(12px + env(safe-area-inset-bottom))`;支付页滚动容器预留也补 env | 
| 2 | high | 后台 Toolbar 内层 children 容器 `flex` **无 wrap**(仅外层 wrap),搜索栏固定宽输入框在窄屏被 flex-shrink 压扁至难用(admin/Orders 等) | ui.jsx Toolbar children 容器加 `flexWrap:'wrap'`,窄屏改为换行堆叠而非压缩(全后台 Toolbar 共享受益) |

## 二次研判为非缺陷 / 不修(2)

- **#3 StatCard 窄屏 2 列、大数字可能省略**(medium):**不修**。375px 下 2 列是可接受的响应式行为(非塌陷),仅极大金额才触发 nowrap 省略号,频率低;改 flex-basis 断点需动到全后台共用组件、收益边际,暂不动。
- **#4 店铺分类 tab 360px 需横滑**(low):**by-design**。tab 用 `flex:'none' + overflowX:auto`,横向滚动是有意降级,无截断/重叠(disprove agent 自行下调);非 bug。

> **趋势**:四轮深挖确认真实缺陷 **清零→6→1→2**,后端面已挖透,前端尚有 2 个真实移动端可用性 bug(safe-area / toolbar 压缩),已修。

---

# 第五轮深挖(安全收口:鉴权/IDOR/批量赋值/角色边界)

4 finder × disprove,9「确认」,二次研判:**3 类真实并已修,其余为误报/设计权衡/已被 #1 缓解**。

## 确认并已修

| # | 严重度 | 缺陷 | 处置 | 测试 |
|---|---|---|---|---|
| 1 | critical | `ExtractsBearerToken` 回退 `?token=` 查询参数 → 令牌泄漏进 URL/历史/access log/Referer(令牌 24h、无绑定,泄漏即重放) | 仅认 Authorization 头,移除回退(前端均用头,无兼容影响) | `MerchantAuthTest::testQueryParamTokenIsRejected` |
| 6/7/9 | high | `Order` 无 `$hidden`,买家查单密码 **bcrypt 哈希 query_password** 经 toArray 泄漏到商户/平台订单列表与详情 → 可离线爆破再冒充买家查单取卡 | `Order::$hidden=['query_password']`(模型属性访问不受影响,买家校验仍可用) | `MerchantOrderTest::testOrderResponsesDoNotLeakQueryPassword` |

## 二次研判为非缺陷 / 不修 / 已缓解

- **#2 商户卡列表返回明文卡密**(agent critical):**非越权**——是商户**自有**库存、已校归属,开源卡网(独角数卡)同样让商户看自己的卡密。真正的诉求是「卡密落库加密」(预留项),非列表脱敏。
- **#3 令牌进日志/Referer**(high):**已被 #1 修复缓解**——令牌不再出现在 URL,自然不入 access log/Referer。(可选再加 `Referrer-Policy` 头,低优。)
- **#4 令牌无 IP/UA 绑定**(high):**设计权衡不修**——IP 绑定会误杀移动端换网用户,UA 绑定形同虚设;业界 bearer 令牌靠 HTTPS+短时效,本系统 24h+仅头传输已合理。
- **#5 令牌无轮转/刷新**(high):**设计权衡**——24h 令牌对本类应用可接受;refresh token 是特性非缺陷,超出本期。
- **#8 平台裁决备注对买家可见**(high):**by-design**——admin_remark 是裁决说明,与 merchant_reply 一样本就该让买家看到处理结果,非泄漏。

> **五轮深挖收口**:真实缺陷 backlog清零→6→1→2→3。安全面收口后,确认问题集中在「敏感字段序列化暴露」(已修 query_password / 卡密门控),令牌传输已收紧。
