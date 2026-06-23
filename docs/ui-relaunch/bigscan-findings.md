# 大扫描发现(14 agent 全栈 + 对抗证伪) — 49 条(高7/中12/低30)

## 处理状态(截至本轮)
- **HIGH 7/7 已修**:H1 订单 codeNoun、H2 --color-text-muted、H3 风控级别枚举、H4 券超核销(条件原子自增+测试)、H5 折扣券 value 边界(+测试)、H6 CORS 去 Allow-Credentials、H7 知识/资源发货内容购前泄露(+测试)。
- **MEDIUM 12/12 已处理**:M1~M6/M9/M10/M12 已修(含测试);M11 前端"仅剩N件"已按 show_stock_type 门控(后端 JSON 彻底混淆需新增分桶字段=后续);M8 澄清为口径文档(非bug);**M7 退款跨时间窗对账口径=待产品拍板**(净额 vs 发生额,见 AdminReportService docblock)。
- **LOW**:已修 L2/L4/L11/L12(显示一致性);**L17 已修**(`OrderService::HARD_MAX_QTY=9999` 绝对上限护栏,见 OrderService.php:109-110);**L18 已修**(渠道交易号唯一冲突不再 failResponse 无限重投,改成功应答+转人工,含 TDD 测试 `testDuplicateChannelTradeNoAcksSuccessNotInfiniteRetry`)。其余为真实但低危的后端校验/信息可区分/限流/上传 MIME 等,列为**待办 backlog**(下方明细)。剩余重点候选:L16(商户订单详情对未支付/已关闭单也返回卡密明文)、L25(改密接口无限流)、L30(上传仅校验扩展名无 MIME)。
  > 注:原列「优惠券 used 无锁自增超发」一类并发问题已在后续迭代修复——占额改到下单 `reserve()` 事务内条件原子自增 `(total=0 OR used<total)->inc('used')`(OrderService.php:151-155),关单/超时释放 `dec('used')`(:286)。

## HIGH (7)

### [H1] {一致性/权益类硬编码「卡密」} frontend/app/src/console/merchant/Orders.jsx:227,324,326,428,473
- 问题: 订单同样区分商品类型:OrderService.php:137 把 goods_type 作为快照写入每个订单,MerchantOrderService 的 list/detail 都 toArray() 返回该字段,所以前端 r.goods_type / o.goods_type 可用。但 Orders.jsx 全程硬编码「卡密」:Panel subtitle『…对已支付/异常订单补发卡密』(227);ConfirmActionModal 标题『确认补发卡密』(324)与正文『将从库存分配 ${qty} 张新卡密并发货』(326);详情弹窗『补发卡密』按钮(428)与『卡密 (N)』分区标题(473)。对权益类订单(goods_type===4)这些文案全部错配——这正是 Cards.jsx:84『const codeNoun = isRights ? '权益码' : '卡密'』已修复、而 Orders 仍残留的同类兄弟缺陷。
- 修法: 按已有约定从订单 goods_type 派生称谓:在 Orders 与两个弹窗里计算 codeNoun = Number(goods_type)===4 ? '权益码' : '卡密'(ConfirmActionModal 用 confirm.order.goods_type,OrderDetailModal 用 o.goods_type),把上述 5 处「卡密」替换为 ${codeNoun}。

### [H2] {一致性 / 设计 token 误用} frontend/app/src/console/admin/Withdrawals.jsx:170,226,265,289
- 问题: 4 处使用了不存在的 CSS 变量 var(--color-text-muted)(设计系统只定义了 --text-muted,无 --color- 前缀,见 tokens/colors.css 与 _ds_manifest.json token 清单)。且未提供 fallback 值,CSS 自定义属性解析失败 → 这些元素拿不到预期的灰色「muted」样式,会回退继承父级(更深的正文色)。涉及:行操作「已处理」文案(170)、「共 N 笔」(226)、拒绝弹窗说明(265)、分页器(289)。兄弟文件 Merchants/Settlement 用的是正确的 var(--text-muted)。
- 修法: 把 4 处 var(--color-text-muted) 全部改为 var(--text-muted)。

### [H3] {显示bug-后端枚举裸渲染} frontend/app/src/console/admin/RiskRecords.jsx:32
- 问题: 「级别」列直接把后端原始英文枚举渲染给用户:`<Pill tone={r.level === 'error' ? 'danger' : 'pending'}>{r.level}</Pill>`。r.level 取值为 system_logs.level 的原始英文枚举 error/warning/info(后端 app/model/SystemLog.php:24-26 定义 LEVEL_INFO='info'/LEVEL_WARNING='warning'/LEVEL_ERROR='error';风控记录聚合 risk_event(level=warning,见 SystemLogService.php:66)与 settle_exception(level=error,见 NotifyService.php:158/196))。中文后台界面里药丸文字会显示成英文 'warning' / 'error',这是已修过的『把后端枚举直接渲染给用户』同类缺陷——同目录 Logs.jsx:7-11 已用 LEVEL 映射表把 error/warning/info 翻成『错误/警告/信息』,本文件漏做映射。
- 修法: 复用 Logs.jsx 的 LEVEL 映射(error→错误、warning→警告、info→信息),渲染 `{(LEVEL[r.level]||{label:r.level}).label}` 而非裸 `{r.level}`;tone 也建议一并由映射给出而非仅二元 error/其它判断(否则 info 也会被当作 pending)。

### [H4] {并发/超发(券核销无上限重查)} app/service/CouponService.php:115-139 + app/service/NotifyService.php:271-274
- 问题: 优惠券 total 发放上限只在下单时由 findUsable() 做一次无锁只读检查(`used >= total` 抛错),而 used 计数器只在支付成功 NotifyService::doSettle() 用 `Coupon::where('id',$id)->inc('used')->update()` 自增,且自增时不重查上限、不加行锁。触发条件:商户配 total=1 的券,N 个买家在第一笔支付完成前同时下单(此刻 used 仍为 0,findUsable 全部放行),随后 N 单都支付成功 → used 自增到 N,远超 total=1。total 上限形同虚设,可被无限超发。修复需在结算事务内对 coupon 行 FOR UPDATE 重查 `used < total` 后再 inc(达上限则该单不再享券或按业务策略处理),与卡密「锁内重查 affected_rows」同构。
- 修法: 在 NotifyService::doSettle 的结算事务内,对 coupon 加行锁重查上限:`$c = Coupon::where('id',$order->coupon_id)->lock(true)->find(); if((int)$c->total>0 && (int)$c->used>=(int)$c->total){ /* 已用尽:按策略拒绝享券或记账告警 */ } else { Db::name('coupons')->where('id',$c->id)->where(...)->inc('used') }`;或用条件自增 `UPDATE coupons SET used=used+1 WHERE id=? AND (total=0 OR used<total)` 并校验 affected_rows。

### [H5] {校验/折扣边界(百分比券 value=0 → 近乎0元单)} app/service/CouponService.php:145-157 + app/controller/merchant/Coupon.php:22-25
- 问题: 折扣券(TYPE_PERCENT=2)的 value 语义是「折扣百分比,90=九折」,但创建校验只有 `value require|float egt:0`(允许 0),且 service 无范围校验。触发条件:商户建 type=2、value=0 的券。computeDiscount 走 rate=0.00 → pay=订单×0=0 → discount=全额,随后被「防0元单」夹到 订单额-0.01。结果买家用此券下单只需付 0.01,商品近乎白送。value 同样无上限/无 (0,100) 区间校验:value=100 表示不打折(无害),value 介于 1~99 任意,但 value=0 与未约束的边界使券被严重误配/被恶意/越权改券者利用。update() 路径(merchant/Coupon.php:29-33)完全无 validate,可把 value 直接 PATCH 成 0 或把 type 改成 2。
- 修法: 对 TYPE_PERCENT 强制 value ∈ (0,100](或 [1,99] 视业务),在 CouponService::create/update 的 normalizeType 后按 type 校验 value 区间,非法抛 PARAM_ERROR;merchant/Coupon::update 补 validate;同时 PERCENT 折扣率为 0 应直接拒绝建券。

### [H6] {鉴权/CORS 配置} app/middleware/Cors.php:23-32
- 问题: 全局 CORS 中间件把请求头里的 Origin 原样回显到 Access-Control-Allow-Origin,同时设 Access-Control-Allow-Credentials: true。这两者组合等于「允许任意源携带凭证跨域并读取响应」。触发条件:任何恶意站点 evil.com 让受害者浏览器发请求(fetch(..., {credentials:'include'}) 或带 ?token= 的 GET),浏览器会带上请求,而响应头因 Origin 被回显+Allow-Credentials:true 而被放行,evil.com 的脚本即可读取 /merchant/me、/merchant/wallet 等返回的余额、订单、店铺等数据。配合 ExtractsBearerToken 支持 ?token= 查询参数回退,GET 接口可被 <img>/<script> 或简单请求直接触发。这是教科书级的 CORS 凭证泄露,不是理论风险。
- 修法: 不要无条件回显 Origin。维护可信源白名单(平台后台/商户后台/前台域名),仅当 Origin 命中白名单时才回显该 Origin 并设 Allow-Credentials:true;否则不带 Allow-Origin(或不带 Allow-Credentials)。若 API 本就用 Bearer 头鉴权而非 Cookie,可直接去掉 Allow-Credentials:true。

### [H7] {信息泄露} app/service/StorefrontService.php:150
- 问题: 公开未鉴权接口 GET buyer/product/:id(route/app.php:29 → buyer.Shop/product → StorefrontService::product)无条件返回 delivery_message。对知识/资源类商品(goods_type=2/3),delivery_message 即「发货内容本身」——NotifyService.php:177 在发货时 delivered_content = (string)$product->delivery_message。因此付费内容(如网盘链接/提取码/知识正文)在购买前就被任何人免费读取。触发:商家把资源/知识商品的交付内容填进 delivery_message,任意访客请求 /buyer/product/{id} 即在响应 data.delivery_message 中拿到全部交付内容。
- 修法: 购前详情接口不应返回 delivery_message。仅对码池类(卡密)允许返回作为「发货附言」展示,或对知识/资源类一律剔除该字段;交付内容只在订单已发货后通过买家查单接口(BuyerOrderService)按订单归属返回。


## MEDIUM (12)

### [M1] {金额/一致性} frontend/app/src/screens/StorefrontHome.jsx:348
- 问题: 知识/资源/权益列表行 ProductListRow 把价格直接渲染为原始 Number,未做两位小数格式化:`const price = Number(p.price)`(行 335)后在行 348 渲染 `<span>¥</span>{price}`。于是 price=9.9 显示「¥9.9」、price=20 显示「¥20」、像 19.999 这类还会带长尾。与同文件 money()(行 13-16)以及卡密网格走的 ProductCard→PriceTag(始终 toLocaleString minimumFractionDigits:2,显示 ¥9.90/¥20.00)不一致:同一店铺切到卡密 Tab 看到 ¥9.90,切到知识/资源/权益 Tab 同价商品却变成 ¥9.9,格式割裂。
- 修法: 列表行价格也走两位小数格式化。最简单复用本文件已有的 money():`{price <= 0 ? '免费' : <><span style={{fontSize:13}}>¥</span>{money(p.price)}</>}`(money 已对 ¥ 符号外的数字补到两位),或直接用 PriceTag 与网格统一。

### [M2] {显示 bug / 图标缺失} frontend/app/src/console/admin/Settlement.jsx:51
- 问题: 「查询」按钮写成 <Button ... icon={<Icons.Search />}>,但 design-system 的 Button 组件只接受 iconLeft / iconRight(见 components/core/Button.jsx:59,76-78),不识别 icon prop。结果搜索图标被静默丢弃,该按钮不显示图标,与本项目其它按钮(均用 iconLeft)风格不一致。
- 修法: 改为 iconLeft={<Icons.Search />}(与 Merchants/Channels 等处一致)。

### [M3] {显示 bug / 布局溢出 + 一致性} frontend/app/src/console/admin/Channels.jsx:215,246,331;Settings.jsx:137,391;Blacklist.jsx:77;Forbidden.jsx:72
- 问题: 把整句错误信息塞进 <Pill tone="danger">{err}</Pill> 渲染,而 Pill 组件带 whiteSpace:'nowrap'(ui.jsx:63)。错误文案多为长句(如「抽佣比例须为 0~1 之间的小数(最多 4 位)」或后端 ApiError 返回串),在 nowrap 的胶囊里不会换行;这些 Pill 又多处于 width:460 的 Modal 内(Channels 编辑/验签弹窗、Settings 编辑弹窗、Blacklist/Forbidden 弹窗),长错误会横向溢出弹窗被裁切或撑破布局。兄弟文件 Merchants/Withdrawals 用的是可换行的 ErrorBar(内部 span flex:1)。
- 修法: 错误信息改用 ErrorBar(已在 ui.jsx 导出并被 Merchants/Withdrawals 使用),或给这些 Pill 包一层并允许换行;不要用 nowrap 的 Pill 承载长句。短固定文案(如 Channels:360「验签未通过」、Settings:237「加载失败」、状态徽章)可保留 Pill。

### [M4] {一致性/显示bug(权益类硬编码卡密)} frontend/design-system/components/commerce/CardKey.jsx:121
- 问题: CardKey 支持 label 自定义(默认 '卡密',权益类商品 goods_type===4 应传 '权益码'/codeNoun),但屏幕阅读器 live region 把复制成功提示硬编码为「卡密已复制」:`<span role="status" aria-live="polite">{done ? '卡密已复制' : ''}</span>`。当 label='权益码' 时,可视区按钮文案随 label 变,但读屏播报仍念「卡密已复制」,语义错配。这正是已修复过的「权益类硬编码卡密」同类兄弟。
- 修法: 用 label 拼接播报文案,如 `{done ? `${typeof label==='string'?label:'卡密'}已复制` : ''}`;或新增 announceNoun/codeNoun prop。aria-label 第114行已正确用 `复制${label}`,此处应同步。

### [M5] {显示bug(缺nowrap逐字换行/裁切失效)} frontend/design-system/components/console/DataTable.jsx:48
- 问题: DataTable 单元格 td 设了 `maxWidth: c.width || 280, overflow:'hidden', textOverflow:'ellipsis'` 但**缺 whiteSpace:'nowrap'**(表头 th 第9行有 white-space:nowrap,td 没有)。textOverflow:ellipsis 仅在 nowrap 单行时生效;当前内容超过 maxWidth(默认280px 或列宽)时不会省略号截断,而是中文/词在窄列内逐字/逐词换行,正是已修复过的「列单元格缺 whiteSpace:nowrap 导致中文逐字换行」同类缺陷。订单号、商品名、邮箱等长字段列会被挤成多行/竖排。
- 修法: 给 td style 加 `whiteSpace:'nowrap'`(配合已有 overflow:hidden+textOverflow:ellipsis 实现单行省略);若个别列需换行,改由 column 配置 `wrap` 开关控制,默认 nowrap。

### [M6] {并发/库存(优惠券超核销)} app/service/NotifyService.php:272-273
- 问题: 限量优惠券(coupon.total=N)可被超额核销。下单时 PricingService->bestDiscount->CouponService::findUsable 在 OrderService.php:124 仅做一次性 used>=total 检查(无锁、无预占),券号写入订单快照;真正的 used+1 发生在支付结算 NotifyService.php:272-273,且 inc('used') 前不重查 used<total、不加行锁。触发条件:对 total=1 的券,买家A、买家B 几乎同时下单(此刻 used=0 都通过校验),随后两笔都支付成功 → 两次 inc('used'),used 变 2,券被用了 2 次,商户多让利。N 张券同理可被 N+ 次核销。
- 修法: 在 NotifyService::doSettle 核销券处对券行加锁并重查限额:Coupon::where('id',coupon_id)->lock(true)->find() 后,若 total>0 且 used>=total 则视为券已无效(此单不享受折扣或按规则转异常/不核销),并改用条件更新 UPDATE coupons SET used=used+1 WHERE id=? AND (total=0 OR used<total),affected!==1 时按超卖处理。或在下单 reserve 事务内对券做行锁预占计数。

### [M7] {对账口径/正确性} app/service/AdminReportService.php:61-77 (salesByMerchant) 与 commissionByMerchant:80-97
- 问题: 退款后销售额与佣金口径错位,导致对账报表出现「有佣金无销售」或反向不守恒。销售额仅统计 [PAID, DELIVERED] 状态订单(line 63),退款后订单变为 STATUS_REFUNDED(=4)被排除;但佣金统计的是 MerchantFundLog 中 type=TYPE_COMMISSION 的 amount 之和(line 85)。退款时 RefundService 写入正向回冲佣金流水(RefundService.php:72-76,amount=+A),它按 create_time 计入时间窗。触发条件:订单 T1 成交记佣金 -A、销售 +total;T2(可能跨报表窗口)退款,记佣金回冲 +A。若 settlementReport(start,end) 的窗口只覆盖 T1 不覆盖 T2:佣金合计=abs(-A)=A(平台佣金),但该订单已退款被剔除出 sales → 报表显示「佣金 A、对应销售 0」,平台佣金与销售额无法对账。即使同窗口,sales 因退款直接归零而 commission 净额为 0,二者不同步(sales 不含原始成交,commission 含成交+回冲),口径不一致。现有测试(AdminSettingReportTest)未覆盖退款场景。
- 修法: 统一对账口径:销售额按「净额」口径与佣金一致——要么 sales 也减去 TYPE_REFUND 流水(把退款订单原成交额冲回),要么佣金统计排除退款回冲、与「当前仍有效成交订单」对齐。明确文档化:报表是「净额对账」还是「期内发生额对账」,并在 RefundService 与 NotifyService 用同一时间锚点(建议都用成交订单的 create_time 或都用流水 create_time)避免跨窗错位。补退款场景的对账测试。

### [M8] {对账口径/一致性} app/service/AdminReportService.php:63 vs app/service/AdminViewService.php:43
- 问题: 同为平台后台的销售额,两处口径不一致。AdminReportService::salesByMerchant 用 whereIn('status',[PAID,DELIVERED])(line 63、21);而 AdminViewService 仪表盘销售额只统计 STATUS_DELIVERED(line 43-51)。AdminReportService 文件头 docblock(line 13)宣称「口径与 MerchantStatsService 一致」,但 MerchantStatsService 的今日/昨日/本月销售额也只用 DELIVERED(MerchantStatsService.php:31-33、79-85),仅 headline sales 用 PAID+DELIVERED。结果:管理员在「结算报表」看到的总销售额(含 PAID 未发货)会大于「仪表盘」总销售额(仅 DELIVERED),同一平台两个页面数字对不上,运营对账困惑。触发条件:存在已支付但未发货(PAID 状态)的订单时两数即不等。
- 修法: 统一全平台「销售额」口径(建议明确选定 PAID+DELIVERED 或仅 DELIVERED),让 AdminReportService、AdminViewService、MerchantStatsService 三处用同一常量/同一私有方法,并修正/对齐 docblock 描述。

### [M9] {校验/折扣边界(满折促销 value=0 / 无 (0,100) 约束)} app/service/PromotionService.php:102-120 + app/controller/merchant/Promotion.php:22-25
- 问题: 满折促销(TYPE_FULL_DISCOUNT=2)value 为折扣百分比,但创建校验仅 `value require|float gt:0`(允许如 0.01、150 等),update() 无 validate,service 无 (0,100) 区间约束。触发条件:商户建 type=2、value=0.5 的活动 → rate=0.005 → 应付≈0,discount 被夹到 amount-0.01,等于把全店满 threshold 的订单近乎清零(0.01 成交)。与券同类,属订单金额一致性/折扣边界缺陷,可由误配或越权改活动触发。
- 修法: 对 TYPE_FULL_DISCOUNT 校验 value ∈ (0,100](满折)或在 discountOf 前按 type 限定区间;merchant/Promotion::update 补 validate;满减(TYPE_FULL_REDUCE)value 仅需 gt:0 即可(已被 amount-0.01 封顶)。

### [M10] {信息泄露/用户枚举} app/service/AdminService.php:18-21 与 app/service/MerchantService.php:19-22
- 问题: 登录里 `if (!$admin || !password_verify(...))` 短路:用户名不存在时根本不执行 password_verify(bcrypt),用户名存在但密码错时才跑一次 bcrypt 校验。两条路径耗时差异显著(bcrypt 数十毫秒),攻击者可用响应时间做用户名枚举(timing oracle)。配合登录限流仅按 IP 10 次/分,可低速探测有效用户名。
- 修法: 用户名不存在时也对一个固定的 dummy bcrypt 哈希做一次 password_verify(恒定时间),再统一返回「用户名或密码错误」,消除耗时分支差异。

### [M11] {信息泄露/功能缺陷} app/service/StorefrontService.php:44
- 问题: store() 与 product()(第148行)无条件把精确 stock 下发到前端,完全无视 show_stock_type。商家选择 show_stock_type=0(模糊显示:充足/少量/缺货)时,后端仍把真实库存数字发给浏览器,前端 ProductDetail.jsx:434/436 直接渲染「仅剩 N 件」、第195行 Math.min(max_buy, stock) 也暴露具体值,使「隐藏精确库存」开关被彻底架空。触发:商家设 show_stock_type=0,买家打开商品详情即从响应/页面读到精确库存。
- 修法: 在后端按 show_stock_type 决定下发口径:show_stock_type=0 时不返回精确 stock,改为返回模糊枚举(充足>20/少量1-20/缺货0)或仅返回 has_stock 布尔;前端「仅剩 N 件」与限购上限计算改用后端给出的脱敏值,不依赖原始 stock。

### [M12] {鉴权/状态机} app/service/StorefrontService.php:128
- 问题: product(int $id) 只校验 Product::STATUS_ON,未校验所属商户状态。store() 列表会用 Merchant::STATUS_ACTIVE 过滤(第23行),但按 id 直取的详情接口不过滤;且 OrderService::reserve(OrderService.php:84-90)同样只检查 product->status、不检查 merchant->status。因此被平台冻结(Merchant::STATUS_FROZEN=2)或待审核(STATUS_PENDING=0)商户名下仍处于上架(STATUS_ON)的商品,可被直接 /buyer/product/{id} 浏览并下单购买,绕过冻结处置。触发:平台冻结某违规商户,其未下架商品仍可被买家通过商品ID直链下单付款。
- 修法: product() 与下单 reserve() 均需联表/补查商户状态:商户非 STATUS_ACTIVE 时,商品视为不可见/不可购(抛 PRODUCT_OFF 或 NOT_FOUND)。


## LOW (30)

### [L1] {健壮性/字段泄漏} frontend/app/src/screens/OrderLookup.jsx:324
- 问题: 查单结果商品名缺省时把后端 product_id 直接拼进面向用户的文案:`const prodName = prod ? prod.name : (r.product_name || \`商品 #${r.product_id ?? ''}\`)`。当商品已下架/详情补拉失败且后端未回 product_name 时,用户会看到「商品 #137」这种暴露内部自增 ID 的字样;若 product_id 也缺失则更退化成「商品 #」(井号后空白)。
- 修法: 缺省文案改为不暴露内部 ID 的中性表述,如「该商品」或「商品信息获取中」;`r.product_id` 缺失时不要渲染出孤立的「#」。例如:`prod ? prod.name : (r.product_name || '该商品')`。

### [L2] {一致性} frontend/app/src/components/TopBar.jsx:76
- 问题: 店名兜底默认值为「极客发卡」(`title || shopName || '极客发卡'`),与平台品牌「秒卡 / 秒卡发卡」不一致。App.jsx:95 以 `shopName={shop?.name}` 传入,在 shop 接口返回前(或 name 为空时)买家顶栏会短暂显示「极客发卡」。该串源自 design-system demo 的示例店名(design-system/ui_kits/*/data.js)与 app/index.html 的 <title>,属残留;Portal.jsx:11 同位置的兜底用的是 `'秒卡发卡'`,两处兜底品牌名不一致。
- 修法: 将兜底统一为平台品牌(如 '秒卡发卡' 或留空只显示 logo),与 Portal.jsx:11 的默认值保持一致;同时建议核对 app/index.html 的 <title> 是否也应改为平台品牌。

### [L3] {健壮性} frontend/app/src/screens/Articles.jsx:39-50,109-116
- 问题: 打开详情失败时(openDetail catch)只 setError 而 detail 仍为 null、detailLoading 归 false,列表视图的渲染分支 `error ?` 命中后用整屏错误块替换掉已经成功加载的列表(line 111-116),用户原本的资讯/FAQ 列表被清空。虽然「重试」按钮会调用 load 重载列表可恢复,但「点某条详情加载失败」却把整张列表也吞掉,属可见的 UX 退化。
- 修法: 详情加载失败应使用独立的局部错误态(如 toast 或 detailError),不要污染列表级 error;或在 catch 里不改 error、改为弹出轻提示,保留列表原样。

### [L4] {一致性(权益类硬编码卡密)} frontend/app/src/console/merchant/Products.jsx:301
- 问题: 商品总览的「库存合计」统计卡 sub 文案硬编码 sub="以卡密加锁查询为准"。该卡是跨全部商品类型的聚合(rows.reduce 累加所有 r.stock,包含 goods_type=2知识/3资源/4权益),而权益类商品的码池称谓应为「权益码」(同文件其他处及 Cards.jsx 用 codeNoun 区分)。对只售权益/知识/资源的商户,这句「以卡密加锁查询为准」是错误术语,与全局 codeNoun 一致性约定冲突,命中『权益类处硬编码卡密』的已知模式。
- 修法: 聚合卡跨类型,sub 不应绑定单一码种术语。改为类型中立表述,如 sub="以码池/卡密加锁查询为准" 或直接 sub="实时加锁查询为准",避免对非卡密店错配「卡密」字样。

### [L5] {金额/JS 浮点做金额加减} frontend/app/src/console/merchant/Stats.jsx:96,109,122
- 问题: 成交额/毛利的『今日 vs 昨日』差额走 ui.jsx 的 Delta 组件:Delta 内部 a=Number(today)、b=Number(yesterday) 后 diff=a-b、text=`¥${Math.abs(diff).toFixed(2)}`(ui.jsx:38-43)。后端 MerchantStatsService.php 返回的是 bcmath 字符串金额(Money::add 规整),前端却用 JS 浮点做减法再 toFixed,违反金额纪律,极端值(如 0.1/0.2 类)会出现浮点尾差。sales_today/yesterday(96)、profit_today/yesterday(122)均为金额;orders_today(109)是计数,可不计。
- 修法: Delta 的金额模式不要用浮点相减:对金额差用整数分(Math.round(a*100)-Math.round(b*100) 再 /100 格式化)或复用后端/字符串 bcmath 口径;或由后端直接下发差额字符串,前端只渲染。

### [L6] {健壮性/错误吞掉无反馈} frontend/app/src/console/merchant/Promotions.jsx:107
- 问题: confirmDelete 里 `catch { /* 静默 */ }`——删除活动失败时既不提示用户也不打日志,且 setRemoving(null) 仅在 try 成功路径调用,失败时弹窗不关、列表不刷新、无任何错误态,用户只会以为按钮没反应。对照同文件 submit() 与 Coupons.jsx:142 的删除都做了 setFormErr/ApiError 提示,此处是一致性与健壮性缺口。
- 修法: 与 Coupons.deleteCoupon 一致:catch (e) 时 setErr(e instanceof ApiError ? e.message : '删除失败,请重试'),保持弹窗打开以便重试;成功后再 setRemoving(null)+reload。

### [L7] {健壮性/缺『全部』筛选 + 计数误导} frontend/app/src/console/merchant/Complaints.jsx:27,28,75
- 问题: status 默认 '0' 且 FILTER_OPTIONS(17-23)只有 0~4 五个具体状态、没有『全部』项,后端 complaints({status}) 始终带 status 过滤(后端 status==='' 才不过滤,但前端永远不传空),导致商户无法一屏查看全部投诉。同时 Toolbar『共 {items.length} 条投诉』(75)统计的是当前单一状态下的条数,文案却像总数,易误导(切到『已解决』时会显示成总投诉数)。
- 修法: 在 FILTER_OPTIONS 头部加 { value: '', label: '全部' } 并把默认 status 视需求决定;或把计数文案改为带状态限定(如『当前筛选 N 条』),避免把分状态条数当总数展示。

### [L8] {健壮性 / 重复错误态} frontend/app/src/console/admin/Settlement.jsx:82,141-144
- 问题: 加载出错时会同时渲染两处错误:顶部 <ErrorBar message={report.error} onRetry={report.reload} />(82),以及 DataTable 内部因收到 error={report.error} 又自渲染一个 ErrorBar(DataTable 在 error 时 return ErrorBar,ui.jsx:150)。同一错误重复出现两条红条,且此时上方三张 StatCard 仍展示 ¥0.00,观感上像「有数据又报错」。
- 修法: 二选一:要么去掉顶部 82 行的 ErrorBar 交给 DataTable 内部展示,要么给 DataTable 传 error={undefined} 由顶部统一展示;错误态下可隐藏/置灰 StatCard。

### [L9] {金额} frontend/app/src/console/admin/Dashboard.jsx:65
- 问题: 「平台利润」卡的 Delta 对金额做浮点加减:Delta 内部 (ui.jsx:38-43) 执行 a-b 后 toFixed(2)。Dashboard 把 profit.today/profit.yesterday(DECIMAL 金额)传入 money 模式,违反 CLAUDE.md 铁规则六(金额禁止浮点运算)。当后端金额含小数(如 0.3-0.1)时会产生浮点尾差,虽多被 toFixed(2) 四舍五入掩盖,但属规则禁止的金额浮点比较/相减。同处 BigScreen 不调用 Delta,故仅 Dashboard 命中。
- 修法: 金额涨跌差改为整数分相减或字符串/ bcmath 等价方式计算后再格式化,避免对 DECIMAL 金额直接做 JS 浮点 a-b;或后端直接下发已算好的 delta 字段。

### [L10] {健壮性} frontend/app/src/console/admin/Dashboard.jsx:59-66
- 问题: 「平台利润」主数值用 profit.today ?? commission.today 做了兜底,但同卡 Delta 与「昨日」只读 profit.today/profit.yesterday(无 commission 兜底)。当后端只返回 commission 不返回 profit 时,主数字正确显示佣金,但右侧 Delta 退化为 0-0 → 显示「→ ¥0.00 持平」,与上方非零数值自相矛盾,误导运营。
- 修法: Delta 与「昨日」同样走 profit.* ?? commission.* 兜底,或在 profit 缺失时不渲染 Delta(返回 null),保持卡片内口径一致。

### [L11] {一致性} frontend/app/src/console/admin/Orders.jsx:219
- 问题: 退款确认弹窗硬编码「卡密回库重新可售」。后台跨商户退款覆盖全部 goods_type(含 goods_type=4 权益,其码池在商户侧称『权益码』,见 merchant/Cards.jsx:84 codeNoun)。权益类订单退款时文案仍称「卡密」,与权益码语义不符。Complaints.jsx:137/142 的『卡密回库/卡密确有问题』同样硬编码。注:merchant/Orders.jsx 亦沿用此约定,属既有惯例,故仅低危。
- 修法: 若弹窗能拿到该订单 goods_type,按 goods_type===4 切换为『权益码』;若 admin 列表确无 goods_type 字段,则改为中性表述如『库存回库重新可售』,避免对权益类用户显示『卡密』。

### [L12] {显示bug-窄列逐字换行} frontend/app/src/console/admin/OperationLogs.jsx:41
- 问题: 「操作员」列 width=90,渲染 `管理员#{ctxOf(r).actor_id ?? '—'}`(如『管理员#123』约 6-7 个字符,12.5px),且 render 的 span 未设 whiteSpace:'nowrap'。DataTable 默认单元格样式(ui.jsx:166)对非 nowrap 列只给 maxWidth/overflow:hidden/textOverflow:ellipsis 而不锁定 nowrap,90px 宽度下中文『管理员#』+数字可能折行成两行,属已修过的『窄列缺 nowrap 逐字/折行』同类风险。相邻『时间』列 width=170 则较充裕无此问题。
- 修法: 给操作员列 render 的 span 加 whiteSpace:'nowrap'(并按需 overflow:'hidden'、textOverflow:'ellipsis'),或适度放宽 width。

### [L13] {健壮性(运行时崩点 undefined.x)} frontend/design-system/components/console/ConsoleShell.jsx:55
- 问题: 图标栏 nav.map 中 `onClick={() => select(g.items[0].key)}`,以及第26行 `flatten` 的 `g.items` 与第53行 `g.items.some(...)` 均假设每个分组 items 非空。若某个 nav 分组 items 为空数组(后端/配置返回空组),`g.items[0]` 为 undefined,点击图标即 `undefined.key` 抛错崩溃。
- 修法: 渲染前过滤空组,或取首项时空值守卫:`const first = g.items && g.items[0]; if(!first) return null;` 并在 onClick 内判空。

### [L14] {金额(缺两位小数/￥格式)} frontend/design-system/components/core/PriceTag.jsx:22
- 问题: parts(n) 仅当 `typeof n === 'number'` 时用 toLocaleString 补足两位小数;当 amount/original 传入字符串(如后端返回的 DECIMAL 字符串 '29.9' 或 '45')时直接 `{int:String(n), dec:''}`,原样渲染为「¥29.9」「¥45」——缺两位小数、且无 __dec 小数样式。发卡系统金额按规范是 DECIMAL 字符串,极易触发。
- 修法: parts() 增加字符串数字分支:对可解析为金额的字符串走两位小数格式化(整数分/字符串补零,勿用 parseFloat 引入浮点误差),保证 ¥xx.xx 一致格式。

### [L15] {状态机/发货路由(补发误用)} app/service/OrderService.php:270-326
- 问题: deliverManually 未按订单快照 goods_type 判定是否走码池,对非码池订单(知识 goods_type=2 / 资源=3,order.goods_type 快照存在)也会执行发卡路径:lockedIds 必为空 → need=qty → 试图从该商品 cards 池锁 qty 张可售卡,而知识/资源商品本无 cards,直接抛 STOCK_NOT_ENOUGH(4005),商户无法对这类异常订单补发。与 NotifyService.php:176 用 Product::goodsTypeUsesPool((int)order->goods_type) 做路由的口径不一致。触发条件:知识/资源类订单进入 STATUS_EXCEPTION(如超时关闭后支付)后商户点补发。
- 修法: deliverManually 开头按 Product::goodsTypeUsesPool((int)$order->goods_type) 分支:非码池类直接用商品 delivery_message 写 delivered_content + 置 DELIVERED(与 NotifyService 非码池分支一致),仅码池类走现有发卡逻辑。

### [L16] {信息泄露(卡密未脱敏)} app/service/MerchantOrderService.php:38
- 问题: detail() 对任意状态订单无条件返回全部卡密明文:Card::where('order_id')->column('secret'),包括 STATUS_PENDING(卡仅 LOCKED 预占、买家尚未付款)与 STATUS_CLOSED/已关闭单。订单详情接口因此在未支付/已关闭时也吐出锁定卡的明文 secret。触发条件:商户调用订单详情查看一个待支付或已关闭订单。虽为商户查看自有库存,但与 BuyerOrderService 仅 DELIVERED 才返回卡密、且以 delivered_content 快照为唯一真相源的收敛原则不一致,扩大了明文暴露面。
- 修法: detail() 仅在 (int)order->status===Order::STATUS_DELIVERED 时返回卡密,且优先读 order->delivered_content 快照而非实时查 cards;非发货态返回空数组或对 secret 做脱敏(保留前后若干位)。

### [L17] {校验边界(数量无上界)} app/service/OrderService.php:91-97 — ✅ 已修
- 问题: quantity 仅有下界校验:控制器 buyer/Order.php:19-22 只校验 integer|egt:1,服务内 min_buy 下界 + max_buy 上界仅在 max_buy>0 时生效。当商户设 max_buy=0(不限购)时,买家可传入超大 quantity(如 2_000_000_000)。码池类会在 cards 库存不足处被拦(count<quantity → 4005,无超卖);但非码池类(知识/资源)无任何库存/数量约束 → 直接以超大 quantity 建单,original=Money::mul(unitPrice,quantity) 产生天文金额订单,并发批量提交可制造垃圾订单/放大下游计算。
- 修法: 在 OrderService::reserve 或下单校验处对 quantity 设硬上界(如 max(min_buy, 1) ≤ quantity ≤ 一个平台级合理上限,例如 9999),非码池类也强制校验该上限。
- ✅ 已修:`OrderService::HARD_MAX_QTY = 9999` 绝对上限护栏(OrderService.php:109-110),不限购(max_buy=0)时仍拦截畸形巨量。

### [L18] {幂等/可用性} app/service/NotifyService.php:113-120 — ✅ 已修(含 TDD)
- 问题: settle() 内非死锁的 PDOException(含唯一约束 uniq_channel_trade 冲突)被归类为 SERVER_ERROR 并返回 driver->failResponse(),促使支付网关无限重试。触发条件:同一笔 payment 行因故未走幂等分支(例如订单状态被并发改动后又有第二条携带相同 channel_trade_no 的成功回调到达,或网关复用 trade_no),markPaymentSuccess/卡更新触发 uniq_channel_trade 冲突 → 永远 fail 应答 → 网关持续重投。虽然正常时序由订单行锁+状态重查兜住,但唯一约束冲突场景下会陷入‘永远失败应答’而非幂等成功应答。
- 修法: 在 catch(PDOException) 中区分唯一约束冲突(SQLSTATE 23000 / errno 1062):命中 uniq_channel_trade 时视为重复回调,重查订单状态若已支付/发货则返回 successResponse()+DUPLICATE_NOTIFY 终止网关重试,而非 SERVER_ERROR+failResponse。
- ✅ 已修:新增 `isDuplicateTradeNo()` 判定(1062 + uniq_channel_trade);命中时重查订单——已支付/发货/异常→幂等成功应答(DUPLICATE_NOTIFY);仍未入账→记 settle_exception 转人工并成功应答止重试。TDD 红→绿:`PaymentNotifyTest::testDuplicateChannelTradeNoAcksSuccessNotInfiniteRetry`。

### [L19] {金额纪律} app/service/RefundService.php:55-56
- 问题: 反向资金依据 MerchantFundLog->sum('amount') 的返回值,ThinkPHP/PDO 对 DECIMAL 聚合在部分驱动下返回 float,经 Money::s()(对 float 走 number_format($n,12))再 bcadd 到 scale=2。单条收入行场景精确,但当同一 order_id 存在多条 INCOME/COMMISSION 流水累加时,float 求和的二进制表示误差可能在 number_format 截断前引入亚分位偏差。属代码库已知‘金额走 sum() 浮点’模式,当前由单行流水掩盖,但口径不够硬。
- 修法: 反向冲账金额改为以原始结算流水行的字符串 amount 逐条 Money::add 累加(或在 SQL 层用 CAST(SUM(amount) AS CHAR)/SUM 后立即 (string) 且确保驱动返回字符串),避免 float 中转;与 doSettle 写入口径保持整数分/字符串一致。

### [L20] {校验} app/service/pay/EpayDriver.php:53-61
- 问题: parse() 返回的 currency 恒为字符串(默认 'CNY'),NotifyService.php:89 处 ($parsed['currency'] ?? 'CNY') 的 ?? 分支为死代码;另 verify() 通过后 parse() 不再校验 trade_status 之外的异常态(如 TRADE_CLOSED/REFUND)只简单映射 success=false,正常但对 epay 退款通知/部分状态缺乏显式区分。非安全缺陷,属健壮性/可读性。
- 修法: 移除 NotifyService.php:89 的冗余 ?? 'CNY';如后续接入 epay 退款回调,parse() 显式区分 trade_status 各态并在 NotifyService 中分流处理,避免退款通知被当作普通失败静默 success 应答。

### [L21] {状态机/死代码} app/model/Withdrawal.php:22 与 app/service/AdminWithdrawService.php:85
- 问题: Withdrawal::STATUS_APPROVED(=1,注释「通过」)在全仓库无任何使用(grep 仅命中定义处)。审核打款 approve() 直接把状态从 PENDING(0)置为 PAID(3),跳过 APPROVED。状态机实际只有 0→3 与 0→2,常量 1 是误导性死定义。若未来前端/筛选按「1=通过」过滤提现单会永远查不到记录,或开发者误用 STATUS_APPROVED 做审核落库导致状态语义错乱。
- 修法: 删除未用的 STATUS_APPROVED 常量,或明确状态机为 PENDING→PAID/REJECTED 并在注释中说明无独立 APPROVED 态;如需「已通过待打款」两段式,则补全 approve→APPROVED、打款→PAID 的流转与对应资金处理。

### [L22] {校验/边界} app/service/MerchantWalletService.php:50-54
- 问题: applyWithdrawal 仅校验金额为正(line 52),无最小提现额、无金额上限(regex 允许任意位数,如 '999999999.99' 超出 DECIMAL(10,2) 量级,虽被余额不足拦下但语义上无业务护栏)。也未对 accountInfo 内容做校验(仅控制器层 max:255),空白/纯空格收款账户可入库,后续人工打款拿到无效账户。balance() 在 line 23 对 Merchant::find 结果未判空,商户不存在时 $m->balance 触发 fatal(虽走鉴权中间件一般存在,但被冻结/删除后边界仍可能命中)。
- 修法: 增加最小提现额与单笔上限的业务校验(配置化);trim 校验 account_info 非空白;balance() 对 find() 结果判空抛 NOT_FOUND,与 applyWithdrawal 内的判空保持一致。

### [L23] {性能/可维护} app/service/AdminWithdrawService.php:51-54
- 问题: 待审金额合计用 ->column('amount') 把全部待审提现的金额逐条拉回 PHP 再 Money::add 累加,待审单量大时一次性载入全部行且 O(n) bcadd 循环。MySQL 对 DECIMAL 的 SUM 是精确无浮点误差的,本可直接 ->sum('amount') 既精确又高效(同文件外 AdminViewService.php:53 正是用 ->sum)。当前实现纯属冗余,且与同仓另一处口径写法不一致。
- 修法: 改用 (string) Withdrawal::where($pendingWhere)->sum('amount') 再 Money::add(.,'0') 规整两位小数,删除 column+foreach 累加。

### [L24] {时间窗一致性(促销时间窗用字符串比较且无 start<=end 校验)} app/service/PromotionService.php:128-147 + app/service/CouponService.php:125-131
- 问题: 促销 withinWindow 与券有效期均用 `trim((string)$x)` 直接和 `date('Y-m-d H:i:s')` 做字符串 `<`/`>` 比较。datetime 列由 ThinkPHP 返回 'Y-m-d H:i:s' 格式时比较正确;但 normWindow/create 对 start_at/end_at 不做格式归一与「start_at <= end_at」一致性校验,商户可传非标准格式(如 '2026/6/1 9:0:0' 或仅日期 '2026-06-01')→ 字符串比较口径与 'Y-m-d H:i:s' 错位,导致活动该生效不生效或该失效仍生效(时间窗判断失真)。同理券 valid_from/valid_to 不校验先后。
- 修法: normWindow 用 strtotime 解析并统一格式化为 'Y-m-d H:i:s' 落库(解析失败抛 PARAM_ERROR);create/update 校验 start_at<=end_at、valid_from<=valid_to;比较前对 DB 值也按同格式归一,避免字符串口径不一致。

### [L25] {鉴权/暴力破解} route/app.php:134 (merchant/change-password) 与 app/service/MerchantService.php:222-236
- 问题: 商户改密接口对 old_password 做 password_verify 校验,但该路由(merchant/change-password)未挂任何 RateLimit,且 changePassword 不限制尝试次数。持有有效 token 的会话(或被盗 token)可在改密接口上对 old_password 无限次撞库;另外新密码未校验是否等于旧密码,也未限制最大长度(bcrypt 72 字节静默截断)。
- 修法: 给 change-password 路由加 RateLimit(如 5 次/分);changePassword 中校验 new !== old,并对密码做合理上限(如 <=72 字节)校验。

### [L26] {信息泄露} app/service/AdminService.php:19-23
- 问题: login 先验密码再判状态:对「密码正确但账号已禁用」返回 '账号已禁用'(FORBIDDEN),对密码错误返回 '用户名或密码错误'。攻击者据此可确认某禁用账号的明文密码仍有效(凭证泄露确认)。MerchantService.login 同样模式(待审核/已冻结分别返回不同文案)。
- 修法: 对未通过登录的所有情形统一返回模糊错误,或在确认凭证前不要暴露账号状态差异;至少不要因密码是否正确而泄露账号存在/状态。

### [L27] {并发/限流正确性} app/middleware/RateLimit.php:22-33
- 问题: 固定窗口限流为「读 Cache::get → 判断 → set/inc」非原子操作,存在 TOCTOU:高并发同一窗口内多个请求同时读到 count<limit 后各自放行,实际可超出阈值;且首请求 set 后由 inc 续增,inc 是否保留窗口 TTL 依赖缓存驱动(file 驱动 inc 为读改写,行为与注释假设的「保留剩余 TTL」未必一致,可能造成窗口被意外延长或计数漂移)。对登录/注册防爆破场景,阈值可被并发突破。
- 修法: 用原子自增并在首次自增时设置 TTL(如 Redis INCR + 首次 EXPIRE,或 Lua/原子计数器),避免读改写竞态;确认所用缓存驱动 inc 的 TTL 语义。

### [L28] {信息泄露} app/service/ComplaintService.php:171
- 问题: verifyOrder 对「订单不存在」(Code::ORDER_NOT_FOUND,第172行)与「邮箱与订单不匹配」(Code::FORBIDDEN,第175行)返回可区分的错误,允许通过订单号枚举判断某订单号是否真实存在。订单号(app/util/OrderNo.php)由 YmdHis+PID+5位随机+自增序构成,随机段仅 5 位,在已知大致下单时间时存在被探测的可能。触发:攻击者用同一邮箱对一批猜测订单号调用买家投诉/查单接口,据错误码区分订单是否存在。
- 修法: 订单不存在与邮箱不匹配统一返回同一模糊错误(如「订单不存在或邮箱不匹配」),避免存在性预言机。

### [L29] {并发/事务} app/service/ComplaintService.php:54
- 问题: escalate() 在事务外、无行锁地读 status 再 save(第57-64行),两个并发请求可同时通过 OPEN/REPLIED 校验后都写 INTERVENE。状态机为幂等写(都置同一目标态)故危害很小,但与项目「状态变更入口加锁」的纪律不一致;同理 adminReject(第159行)也无事务/锁,而 adminResolve 已用 Db::transaction。
- 修法: escalate/adminReject 改为 Db::transaction + lock(true) 重查状态后再写,统一状态机入口的并发安全口径。

### [L30] {上传安全} app/service/UploadService.php:34
- 问题: store() 仅按扩展名白名单(EXTS)与大小校验,未做真实内容/MIME 校验(如 getimagesize / finfo)。攻击者可上传内容非图片但扩展名为 .png 的文件(图片伪装/polyglot)。当前危害有限:svg 不在白名单、文件落 public/uploads 由静态服务直出不会被 PHP 执行,故主要是伪装文件占位与潜在客户端解析风险,而非 RCE。
- 修法: 在扩展名白名单基础上增加内容校验:getimagesize()/finfo 确认 MIME 属于图片白名单且与扩展名一致后再 move,拒绝无法解析为图片的文件。
