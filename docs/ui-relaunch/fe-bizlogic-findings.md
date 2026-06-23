# 前端业务逻辑审计(5域+对抗证伪) — 14 条(crit0/high4/med8/low2)

## CRITICAL


## HIGH

### [H1] 降数量使已用券跌破门槛后,前端仍把失效券码塞进下单请求,导致整笔下单失败(且报错文案误导) <FE-结算价格计算>
- 场景: 1) 商品单价 50,某券 min_amount=80(满80可用)。2) 用户把数量调到 2(原价100≥80),输入券码点「验证」→ checkoutPreview 通过,appliedCoupon=券码,显示「优惠券已生效」。3) 用户把数量改回 1(原价50<80)。试算 useEffect 以 appliedCoupon 重新请求 → 后端 findUsable 抛「订单未达使用门槛」→ preview 被 catch 置 null,couponApplied 变 false,顶部「已生效」徽标消失,预计应付回落为不打折的 total(看起来像券被自动取消了)。4) 用户点「立即购买」。
- 前端错 vs 后端: 前端:试算失败时只把 preview 置 null(ProductDetail.jsx:142),从不清空 appliedCoupon;submit 仍带 couponCode: appliedCoupon(ProductDetail.jsx:242-243)。用户以为券已被去掉、应付已是全价,但请求里仍带着这张此刻不可用的券。后端真值:OrderService.create→PricingService.bestDiscount→CouponService.findUsable 对无效券直接抛 BizException(PricingService.php:26-30、CouponService.php:158-160),不容错,导致整笔下单 throw 失败。前端把该错码(PARAM_ERROR 2001)映射成「参数有误,请检查后重试」(api.js:25),与「券跌破门槛」毫不相关,用户无从知道是券的问题、也无法下单。
- 证据: 前端 frontend/app/src/screens/ProductDetail.jsx:140-142(试算失败只 setPreview(null),不清 appliedCoupon)、:242-243(submit 仍发 appliedCoupon);api.js:20-35(2001→「参数有误」)。后端 app/service/PricingService.php:26-30(findUsable 不容错)、app/service/CouponService.php:158-160(未达门槛抛 PARAM_ERROR)、app/service/OrderService.php:130(下单同样走 bestDiscount)。
- 修法: 试算 catch 中若是券导致的失败(或检测到 appliedCoupon 非空且 preview 失败),清空 appliedCoupon 并给出「优惠券已失效/不满足门槛,已为你移除」的提示;或在 submit 前以当前 safeQty 复验券,失败则清券后继续无券下单,而不是把已知失效的券原样发给后端令整单失败。

### [H2] 权益类(goods_type=4)前端按无限现货处理,后端却走码池受 stock 约束 —— 售罄仍可下单、超量被拒 <FE-数量库存限购门控>
- 场景: 1. 商户上架一个「权益」类商品(goods_type=4),其卡密码池(cards)仅剩 3 张,或已售罄(stock=0)。2. 买家打开该商品详情页。3. 前端徽标显示「现货」,数量 stepper 上限按 99(或 max_buy)计算,「立即购买」按钮始终可点。4. 买家把数量调到 5(>剩余3),或在 stock=0 时直接点「立即购买」。5. 前端放行提交 createOrder。6. 后端 OrderService.reserve 对 usesCardPool()=true 的权益类做 FOR UPDATE SKIP LOCKED 取卡,count(cardIds)<quantity → 抛 STOCK_NOT_ENOUGH「库存不足」。买家看到困惑报错(页面上明明写着「现货」)。
- 前端错 vs 后端: 前端:isCard 仅判 goods_type===1(ProductDetail.jsx:175 `const isCard = Number(p.goods_type ?? 1) === 1`),于是权益(4)被当作非卡密类——out 恒为 false(:176),stockBadge 恒为「现货」(:184),maxBuy 不含 stock(:194-196 走 `p.max_buy>0 ? p.max_buy : 99`),disabled 仅 `out`(:563)恒可点。后端真值:Product::usesCardPool() 对 [CARD(1), RIGHTS(4)] 均返回 true(Product.php:94-97),reserve 对权益类同样取卡并校验 count<quantity→STOCK_NOT_ENOUGH(OrderService.php:106-122),且 StorefrontService::product 对权益类返回真实 stock=cards 缓存(StorefrontService.php:151)。前端把后端真有库存约束的权益类当成了无库存约束,口径完全相反。
- 证据: 前端 /Users/a1/Desktop/qfk/frontend/app/src/screens/ProductDetail.jsx:175(isCard 只认 1)、:176(out=false)、:184-188(stockBadge=现货)、:192-196(maxBuy 不含 stock)、:563(disabled 仅 out);后端 /Users/a1/Desktop/qfk/app/model/Product.php:94-97(usesCardPool 含 RIGHTS=4)、/Users/a1/Desktop/qfk/app/service/OrderService.php:106-122(权益类同样取卡、不足报 STOCK_NOT_ENOUGH)、/Users/a1/Desktop/qfk/app/service/StorefrontService.php:151(返回真实 stock)
- 修法: 前端把「是否受 stock 约束 / 是否走码池」的判断与后端 usesCardPool 对齐,改为 goods_type ∈ {1,4}。即 ProductDetail.jsx 引入 `const usesPool = [1,4].includes(Number(p.goods_type ?? 1));` 并用它替换 isCard 在 out(:176)、stockBadge(:182-188)、maxBuy(:192-196)、试算 useEffect(:131-137)中的判断;保留 isCard 仅用于「自动发货/即时发货」文案等纯展示差异。这样权益类售罄时按钮禁用、上限按 stock 钳制,与后端一致。

### [H3] 取卡页:资源类已发货订单渲染崩溃(下载块引用了 OrderResult 作用域里不存在的 directMode/search/loading) <FE-订单支付取卡动作门控>
- 场景: 1) 买家购买资源类商品(goods_type=3)并付款成功;2) 之后到「取卡 / 查单」页,用订单号+邮箱(或查单密码)查询(即非 directMode 路径);3) 后端返回该已发货订单,且 BuyerOrderService 为资源类发货单签发 download_url;4) 前端进入 OrderResult 的资源下载块渲染。
- 前端错 vs 后端: 后端真值:DownloadService.issueLink 仅对 status=DELIVERED 且 goods_type=GOODS_TYPE_RESOURCE 的订单返回 download_url(DownloadService.php:42-43,65),BuyerOrderService 据此把 download_url 放进查单结果(BuyerOrderService.php:46-49)——即下载链恰恰应在「已发货资源单」上展示。前端 OrderResult 是模块顶层函数,形参只有 result/flashToast/contactEmail/contactPassword(OrderLookup.jsx:311),但下载块里引用了 directMode(:489,:497)、search(:490 onClick)、loading(:490 loading)——这三个标识符只存在于父组件 OrderLookup 作用域(directMode :71、search :81、loading :64),在 OrderResult 里未声明。渲染到此处会抛 ReferenceError,导致整条查单结果(含卡密/下载链)白屏崩溃。后果:资源类买家在正常取卡路径下根本拿不到下载链,下载动作在它唯一该工作的状态下被彻底打断。
- 证据: 前端 /Users/a1/Desktop/qfk/frontend/app/src/screens/OrderLookup.jsx:311(OrderResult 形参),:483-500(下载块),:489 `{!directMode && (`,:490 `loading={loading} onClick={search}`,:497 `{directMode ? ...}`;父作用域定义 :64,:71,:81。后端 /Users/a1/Desktop/qfk/app/service/DownloadService.php:42-43,:65;/Users/a1/Desktop/qfk/app/service/BuyerOrderService.php:46-49
- 修法: 把 directMode、search(刷新查单)、loading 通过 props 传入 OrderResult(<OrderResult ... directMode={directMode} onRefresh={search} refreshing={loading} />),并在下载块改用这些 props;或将「刷新下载链」按钮改为调用一个由父组件注入的回调。不修则资源类取卡页必崩。

### [H4] 商城首页商品列表泄露精确库存,无视商户「模糊库存」设置(show_stock_type=0),且与商品详情口径矛盾 <FE-筛选计数与口径展示>
- 场景: 1) 商户把某商品「库存显示方式」设为模糊(show_stock_type=0),意在只对外显示 充足/少量/缺货,不暴露具体剩余张数。2) 买家打开店铺首页 StorefrontHome 的卡密商品网格(typeFilter=1)。3) 卡片右上角直接显示「仅剩 3」(stock 1-5 时)或「已售罄」,把商户想隐藏的精确库存暴露了。4) 买家点进同一商品的详情页 ProductDetail,徽标却只显示「库存少量/库存充足」,两个页面对同一商品给出不一致的库存口径。
- 前端错 vs 后端: 前端错:StorefrontHome 把后端原样下发的 stock 无条件传给 ProductCard,ProductCard 据 stock<=5 渲染「仅剩 N」、stock<=0 渲染「已售罄」,完全没读 show_stock_type。后端真值:StorefrontService::store()/product() 都下发 show_stock_type(0=模糊,1=精确),且前端 ProductDetail 已正确实现「仅 show_stock_type===1 才暴露精确『仅剩 N 件』,否则只给 充足/少量/缺货 模糊徽标」。列表页违背了同一规则。
- 证据: 前端列表(错):/Users/a1/Desktop/qfk/frontend/app/src/screens/StorefrontHome.jsx:676-696(stock=Number(p.stock);<ProductCard stock={stock} …/>,未判 show_stock_type);ProductCard:/Users/a1/Desktop/qfk/frontend/design-system/components/commerce/ProductCard.jsx:55-62(out=stock<=0→「已售罄」;low=stock<=5→「仅剩 {stock}」)。前端详情(对的口径):/Users/a1/Desktop/qfk/frontend/app/src/screens/ProductDetail.jsx:181-187 与 434-438(showExactStock=Number(p.show_stock_type)===1 才显示「仅剩 N 件」)。后端真值:/Users/a1/Desktop/qfk/app/service/StorefrontService.php:52(列表下发 show_stock_type)、160(详情下发)。
- 修法: StorefrontHome 卡密网格按 show_stock_type 决定传给 ProductCard 的库存信号:===1 才传真实 stock;否则只传一个布尔『是否售罄』(stock<=0)供「已售罄」,抑制 1-5 的「仅剩 N」。可给 ProductCard 增 hideExactStock 入参,模糊模式下不渲染「仅剩 N」,仅 stock<=0 时渲染「已售罄」,使列表与详情库存口径一致并尊重商户隐私设置。


## MEDIUM

### [M1] 「省¥X」按整数元四舍五入展示,夸大/虚报实际优惠额(与划线价-现价的真实差不一致) <FE-结算价格计算>
- 场景: 1) 商品 market_price/original=99.90,price(应收/折后)=89.95,真实每件省 9.95 元。2) 详情页价格区展示划线 99.90 与「省 ¥X」徽标。3) 徽标计算 (Math.round(99.90*100)-8995)/100 = 9.95,再 .toFixed(0) → 显示「省 ¥10」。
- 前端错 vs 后端: 前端:savedAmount 用 .toFixed(0) 把省额取整(ProductDetail.jsx:251),9.95 显示成 10、0.49 显示成 0(明明在打折却显示「省 ¥0」)、99.50 显示成「省 ¥100」(虚高)。划线价与现价本身按 .toFixed(2) 精确展示,省额却取整,三者对不上,误导用户对优惠力度的判断。后端真值:金额一律 DECIMAL(10,2)/bcmath(Money),原价与应收价都精确到分(StorefrontService 直接下发 effectivePrice 与 price/market_price 原值),不存在四舍五入到元。
- 证据: 前端 frontend/app/src/screens/ProductDetail.jsx:251(savedAmount=…/100).toFixed(0))、:319-324(划线价 .toFixed(2) 与「省 ¥{savedAmount}」并排展示)。后端 app/service/StorefrontService.php:143-147(price/original_price/market_price 均为精确金额)、app/model/Product.php:79-82(effectivePrice 字符串精度)。
- 修法: 省额改用 .toFixed(2)(或与现价同一精度),与划线价、现价口径一致;0.00 时不显示「省 ¥0」徽标。

### [M2] 权益类 max_buy=0(不限购)时前端默认上限 99 与后端「上限=可售卡数」冲突 <FE-数量库存限购门控>
- 场景: 1. 权益类商品(goods_type=4)设置 max_buy=0(不限购),码池剩 10 张可售卡。2. 买家进入详情页,前端因非 isCard 走 `maxBuy = p.max_buy>0 ? p.max_buy : 99`(ProductDetail.jsx:196),effMax=99。3. stepper 允许加到 99,「仅剩 N 件」提示也不出现(:435-441 仅对 isCard 暴露)。4. 买家选 20 件提交。5. 后端 max_buy=0 跳过限购校验(OrderService.php:101),但取卡 count(cardIds)=10<20 → STOCK_NOT_ENOUGH。前端无任何预警。
- 前端错 vs 后端: 前端对权益类 max_buy=0 用硬编码 99 作上限,完全不看 stock。后端对权益类 max_buy=0 不限购但仍受 cards 实际数量约束(OrderService.php:101-122)。前端的 99 是凭空上限,真正上界是可售卡数。
- 证据: 前端 /Users/a1/Desktop/qfk/frontend/app/src/screens/ProductDetail.jsx:196(`p.max_buy>0 ? p.max_buy : 99`)、:435-441(库存提示仅对 isCard);后端 /Users/a1/Desktop/qfk/app/service/OrderService.php:101-122
- 修法: 同上修复:权益类纳入 usesPool 分支后,maxBuy 走 `p.max_buy>0 ? Math.min(p.max_buy, p.stock) : p.stock`,99 兜底仅保留给真正无库存概念的知识(2)/资源(3)类。

### [M3] 库存被并发吃光的瞬间,前端 disabled 判断滞后于后端真值(对码池类通用,权益类尤甚) <FE-数量库存限购门控>
- 场景: 1. 卡密或权益类商品 stock=1,买家 A 与 B 几乎同时打开详情页(前端拿到的 stock 快照=1)。2. A 先下单成功,后端 stock→0、cards 被锁。3. B 的前端仍持旧快照 stock=1,out=false,按钮可点。4. B 点「立即购买」,后端取卡 count=0<1 → STOCK_NOT_ENOUGH。这是 SKIP LOCKED 瞬态/已售空的既定权衡,但前端在最常见的「点击提交后」路径上没有把后端的 STOCK_NOT_ENOUGH 翻译成「重新拉取库存并刷新 out 状态」,只把原始错误文案塞进 submitErr(:246)。
- 前端错 vs 后端: 前端 out/disabled 完全基于打开页面那一刻的 stock 快照(ProductDetail.jsx:176, :563),提交失败后不重拉商品、不更新 stock,用户可能反复点击反复撞 STOCK_NOT_ENOUGH。后端真值是实时 cards 加锁结果(spec.md:158/391「真正库存判定以 cards 加锁查询为准」,OrderService.php:119-121)。
- 证据: 前端 /Users/a1/Desktop/qfk/frontend/app/src/screens/ProductDetail.jsx:176、:232-249(submit 失败仅 setSubmitErr,不重拉)、:563;后端 /Users/a1/Desktop/qfk/app/service/OrderService.php:119-121、/Users/a1/Desktop/qfk/docs/spec.md:158,391
- 修法: 在 submit 的 catch 中,当 ApiError.code 命中库存不足码(spec §1.4 的 3002/STOCK_NOT_ENOUGH)时,调用 load() 重新拉取商品详情以刷新 stock 与 out/disabled,并给出「库存已变化,请重新选择数量」提示,而非把原始报错直接抛给用户后仍保持可点。

### [M4] 售后入口门控漏掉「已支付(PAID)」订单,与后端可投诉状态不一致 <FE-订单支付取卡动作门控>
- 场景: 1) 买家下单付款成功,但因卡密临时不足/发货延迟,订单仍处于 status=PAID(1,已支付·发货中)而非已发货;2) 买家到取卡页查询此单,想就「迟迟未发货」申请售后;3) 前端不展示任何「申请售后 / 查看售后进度」入口。
- 前端错 vs 后端: 后端真值:ComplaintService.COMPLAINABLE = [STATUS_PAID, STATUS_DELIVERED, STATUS_EXCEPTION, STATUS_REFUNDED](ComplaintService.php:19),即已支付未发货的订单后端是允许投诉的。前端 canComplain = [STATUS.DELIVERED, STATUS.EXCEPTION, 4(REFUNDED)](OrderLookup.jsx:318),独独漏了 STATUS.PAID(1)。于是 PAID 单的 ComplaintBox 完全不渲染,买家在「已付款但没发货」这一最需要申诉的场景下被前端门控掉,无法发起投诉。
- 证据: 前端 /Users/a1/Desktop/qfk/frontend/app/src/screens/OrderLookup.jsx:318 `const canComplain = [STATUS.DELIVERED, STATUS.EXCEPTION, 4].includes(statusNum);`;后端 /Users/a1/Desktop/qfk/app/service/ComplaintService.php:19,:26-27
- 修法: 把 STATUS.PAID(1)加入 canComplain:`[STATUS.PAID, STATUS.DELIVERED, STATUS.EXCEPTION, STATUS.REFUNDED].includes(statusNum)`,与后端 COMPLAINABLE 对齐。

### [M5] 满减券:前端拦了后端允许的「减免额>使用门槛」配置 <FE-后台表单与后端规则一致>
- 场景: 商户进优惠券 → 新建满减券 → 使用门槛填 50,减免金额填 60(或任意 value>min_amount,门槛>0)→ 点保存。前端直接红字「满减券的减免金额不能超过使用门槛」拒绝提交,根本发不出请求;但这是后端完全合法的券。
- 前端错 vs 后端: 前端额外加了「减免额不得超过门槛」的硬校验(仅当 min>0 时触发),把一类合法券挡在门外。后端 CouponService::validateValueByType 的满减分支只要求 value>0,从不校验 value 与 min_amount 的关系;且 computeDiscount 会把优惠额封顶到「订单额-0.01」防 0 元单,所以满50减60 在后端是允许且安全的(实付≥0.01)。前端比后端更严,导致商户无法创建本应允许的券。
- 证据: 前端 /Users/a1/Desktop/qfk/frontend/app/src/console/merchant/Coupons.jsx:116-119(else 分支:const min=Number(form.min_amount)||0; if(min>0 && v>min){setFormErr('满减券的减免金额不能超过使用门槛');return;});后端 /Users/a1/Desktop/qfk/app/service/CouponService.php:96-100(满减分支仅 if Money::cmp(value,'0')<=0 抛错)+ 90-101 整个 validateValueByType 无 value vs min_amount 校验;封顶逻辑 CouponService.php:182-189
- 修法: 删除 Coupons.jsx:116-119 中 value>min_amount 的拦截(后端不存在该约束)。若产品确实想要该约束,应先在 CouponService::validateValueByType 加同样的后端校验再保留前端,使两端一致;否则当前是前端单方面误拦。

### [M6] 提现「手续费」前端展示与口径让用户误以为会扣费,实则后端始终 0 且 withdraw_fee_rate 永不生效 <FE-后台表单与后端规则一致>
- 场景: 管理员在平台配置里把『提现手续费率』withdraw_fee_rate 设为 0.01(1%);商户申请提现 100 元,Wallet/二次确认弹窗显示提现金额 100,提现记录与后台审核列表都有「手续费」列。商户与管理员据此以为提现会扣 1% 手续费,但实际打款全额 100、手续费恒为 0。
- 前端错 vs 后端: 前端 Settings 提供 withdraw_fee_rate 配置并以『当前 1%』强提示其会被用于提现扣费;Wallet/Withdrawals 都渲染 fee 列暗示存在手续费扣减。但后端 MerchantWalletService::applyWithdrawal 写死 fee='0.00',审核 AdminWithdrawService 通过/拒绝时也只按 amount 扣冻结/退回、完全不读取 withdraw_fee_rate、不计算 fee。即前端把一个后端从未实现的费率口径展示为生效,误导双方对到账金额的预期。
- 证据: 前端 /Users/a1/Desktop/qfk/frontend/app/src/console/admin/Settings.jsx:328-336(withdraw_fee_rate 配置项,rate 提示生效)+ Wallet.jsx:206-212(手续费列)+ Withdrawals.jsx:131-134(手续费列);后端 /Users/a1/Desktop/qfk/app/service/MerchantWalletService.php:78('fee' => '0.00')与 AdminWithdrawService.php:75-90、105-129(approve/reject 仅用 amount,无 fee/withdraw_fee_rate 计算)
- 修法: 二选一保持一致:① 若手续费应生效,后端 applyWithdrawal 读取 withdraw_fee_rate 计算 fee 并据此调整到账/冻结,前端再展示;② 若本期不收手续费,前端应在二次确认弹窗明确『手续费 ¥0.00,全额到账』或隐藏费率配置/费用列,避免展示一个不生效的费率误导用户对到账金额的判断。

### [M7] 店铺首页分类计数 goods_count 与「全部」计数不随当前销售类型 Tab 联动,点进去数量对不上 <FE-筛选计数与口径展示>
- 场景: 1) 某店同一分类下既有卡密又有知识(分类 X:3 张卡密 + 7 篇知识 = 后端记 10 件)。2) 买家进首页,销售类型 Tab 默认停在「卡密」(typeFilter=1)。3) 顶部分类筛选条里「分类 X」chip 显示计数 10,「全部」chip 显示全店总数(含所有类型)。4) 买家点「分类 X」,网格因同时叠加 typeFilter=卡密,只显示 3 条;chip 标的 10 与实际可见 3 条对不上,买家以为有 7 件商品消失了。
- 前端错 vs 后端: 前端错:分类 chip 计数直接用后端 goods_count、「全部」chip 用 list.length(全类型),但商品网格永远叠加了一个 typeFilter(默认卡密)再过滤;计数口径(跨全部 goods_type)≠ 列表口径(限当前 type),翻类型 Tab 时计数也不变。后端真值:StorefrontService 的 countByCat 按 category_id 统计的是该分类下全部在售商品(不区分 goods_type),后端并不知道前端会按类型再切一刀。
- 证据: 前端:/Users/a1/Desktop/qfk/frontend/app/src/screens/StorefrontHome.jsx:391-392(allCount=list.length;tabs 含 {全部,goods_count:allCount});405-407(byCat 再 byType 叠加 typeFilter 过滤);590-606(分类 chip 渲染 c.goods_count,不随 typeFilter 重算)。后端:/Users/a1/Desktop/qfk/app/service/StorefrontService.php:57-63(countByCat 不区分 goods_type)、73-80(goods_count 下发)。
- 修法: 分类 chip 与「全部」chip 的计数应基于当前 typeFilter 过滤后的列表在前端重算(对 byType 之前的同类型集合按 category_id 计数),而不是直接用后端跨类型的 goods_count;或在每个 Tab 切换时重新计算分类计数。使 chip 数字与点击后网格实际条数一致。

### [M8] 商户统计「成交额」卡:累计销售额(已支付+已发货)与今日/昨日销售额(仅已发货)口径混用,同卡内不可比 <FE-筛选计数与口径展示>
- 场景: 1) 商户有一笔订单已支付但尚未发货(status=已支付/PAID),total_amount=100。2) 商户进入「数据」页 Stats,「今日成交额」主卡:今日/昨日数字只算已发货(DELIVERED),这笔 PAID 不计入今日成交额。3) 同一张卡右下「累计 ¥X」用的是 s.sales,后端口径是 已支付+已发货 合计——这笔 100 被计入了累计。4) 于是「今日+历史每日成交额」之和 ≠ 卡上「累计」,商户用累计减今日做心算对账时对不上,且不知差异来自口径切换。
- 前端错 vs 后端: 前端错:Stats 把 sales_today/sales_yesterday(后端 DELIVERED-only)与 sales(后端 PAID+DELIVERED)放在同一张「今日成交额/累计」卡并列展示,当作同一指标的不同时段,实际两者统计口径不同,不可加减比较。后端真值:MerchantStatsService::summary 中 sales=rangeQuery(PAID_STATUSES=PAID+DELIVERED)->sum,而 sales_today/yesterday/month=deliveredQuery(仅 DELIVERED)->sum,二者口径刻意不同。
- 证据: 前端:/Users/a1/Desktop/qfk/frontend/app/src/console/merchant/Stats.jsx:87-99(同卡:value=sales_today,sub 含『累计 sales』『昨日 sales_yesterday』并对 today/yesterday 算 Delta)。后端:/Users/a1/Desktop/qfk/app/service/MerchantStatsService.php:21(sales 用 rangeQuery=PAID+DELIVERED)、31-33(sales_today/yesterday/month 用 deliveredQuery=DELIVERED-only)、17(PAID_STATUSES 定义)。
- 修法: 统一同卡口径:要么把累计也用 DELIVERED-only(给后端加 deliveredQuery 不限时间的累计,前端改用之),要么后端把 sales_today/yesterday 也改成 PAID+DELIVERED 与 sales 一致。前端层面至少在累计旁标注口径差异;最干净是让后端 summary 内『成交额』系列字段统一为同一状态口径,前端无需混搭。


## LOW

### [L1] 试算未返回/失败时,预计应付回落为不含订单级促销(满减/满折)的全价,展示高于实际扣款 <FE-结算价格计算>
- 场景: 1) 商户配置自动满减(满100减10),商品单价50。2) 用户打开详情、数量=2(原价100达门槛,后端会自动减10,应付90)。3) checkoutPreview 请求尚在途中、或瞬时失败(网络抖动/限流)→ preview=null。4) 此刻底部购买条与金额分解里「预计应付」显示 total=100,而真实下单会自动减到 90。
- 前端错 vs 后端: 前端:payable = preview ? final_amount : total(ProductDetail.jsx:210),preview 缺失时回落到 priceCents*qty 的纯单价×数量,既不含自动满减/满折也不含券;且此分支下 hasDiscount=false,优惠行整段不渲染(:208-209、:522),用户看到的是无任何订单级优惠的全价。后端真值:下单 OrderService.create 无条件走 bestDiscount 叠加自动促销(OrderService.php:130-135、PromotionService.bestPromotion),即使买家没填券也会自动满减,实际扣款低于前端此刻展示。
- 证据: 前端 frontend/app/src/screens/ProductDetail.jsx:208-210、:522-527(preview 为空则 payable=total 且不显示优惠行)。后端 app/service/OrderService.php:130-135、app/service/PromotionService.php:95-122(自动满减/满折,无需券)。
- 修法: preview 在途/失败时,「预计应付」标注为加载中或保留上一次有效试算,避免在有自动促销时短暂展示偏高的全价误导用户(实际扣款更低,方向偏保守,故 low)。

### [L2] 折扣券/满折:前端 1~99 整数区间拒绝了后端允许的小数与边界折扣值 <FE-后台表单与后端规则一致>
- 场景: 商户新建折扣券(或满折活动),折扣百分比填 99.5(99.5折)或 0.5。前端校验 `v>=1 && v<=99` 直接拒绝(券:红字「折扣值需在 1~99 之间」;满折:input max=99 + 提交时 value>0 不拦但 UI 暗示 1~99)。
- 前端错 vs 后端: 前端把折扣 value 当作闭区间 [1,99] 校验。后端 CouponService/PromotionService::validateValueByType 用的是开区间 (0,100):value>0 且 value<100 即合法,允许 0.5、99.5、99.99 等小数。前端 v>=1 拒绝了 (0,1) 区间,v<=99 的整数感拒绝了 (99,100) 区间的小数,这些在后端均合法。前端比后端窄。
- 证据: 前端 /Users/a1/Desktop/qfk/frontend/app/src/console/merchant/Coupons.jsx:114-115(if Number(form.type)===TYPE_PERCENT){ if(!(v>=1 && v<=99)){setFormErr('折扣值需在 1~99 之间')...}});Promotions.jsx:166(Input min="1" max="99");后端 /Users/a1/Desktop/qfk/app/service/CouponService.php:92-94(Money::cmp(value,'0')<=0 || Money::cmp(value,'100')>=0 才抛错)与 PromotionService.php:75-78 同
- 修法: 把前端区间改成与后端一致的开区间:`v>0 && v<100`(允许小数),并去掉 input 的 max="99"/min="1" 误导,改为 step 允许小数。或后端收紧到整数 1~99——但需两端统一,当前是前端单方面与后端口径不符。
