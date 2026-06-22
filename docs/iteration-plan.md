# QFK 对标迭代计划(基于 fkdemo.jingsoft.com 实测）

> 来源:六面(product / shop / marketing / admin / seller / portal)待办汇总 + 代码库核验。
> 状态字段口径:`missing`=完全缺失;`partial`=已有部分基建,需补完;`dev_ready`=可直接排入开发(依赖已具备、需求清晰)。

---

## 一、概述:我们已具备 vs 还缺

经核对代码库,当前系统已具备**单一卡密商品**的完整交易闭环:商品/分类/卡密 CRUD、下单行锁预占(`OrderService.reserve` + `cards SELECT…FOR UPDATE`)、支付回调验签 + 金额校验 + 幂等 + 异常转人工(`NotifyService.settle`,已含 `STATUS_EXCEPTION` 落地)、自动/手动发货(`TYPE_AUTO/TYPE_MANUAL`、`deliverManually`、redeliver)、商户钱包与提现冻结、平台结算/佣金/报表、店铺前台(分类 Tab + 库存模糊分档 `show_stock_type` 后端字段 + `StockPill`)、商户自助注册(限流 + 邀请码)、公告与系统设置、操作日志基建(`SystemLog`)。**对标鲸发卡仍缺**四大块:(1)**商品类型化**——`products.type` 仅二元(自动/手动),无知识/资源/权益类型、无内容/文件/权益码子模型与差异化发货;(2)**营销体系**——优惠券、限时折扣、满折满减、阶梯价、组合优先级、退款反核销全部缺失,订单表无 `coupon_id/original_amount/discount_amount/final_amount`;(3)**售后与资金闭环**——投诉/仲裁、退款 API、卡密回库反向流水、转账代付、买家黑名单、风控记录均缺;(4)**门户与内容**——独立门户站(导航/首页/资讯/FAQ/禁售目录)、`articles` 模型、订单查询密码模式、联系方式格式化均缺或仅 partial。许多 partial 项(库存显示编辑入口、分类图、商品 `type` 字段下发、待支付重试入口、商户毛利)是**已有后端字段/逻辑、仅缺前端或一行映射**,属于低风险高性价比的"补完即得"。

---

## 二、待办分组(P0 → P3)

> 字段:id | title | 面 | 风险 | 状态 | dev_ready | conflict_domain | effort

### P0 — 资金/计价正确性优先(必须先于其依赖)

| id | title | 面 | 风险 | 状态 | dev_ready | conflict_domain | effort |
|---|---|---|---|---|---|---|---|
| shop-04 | API 返回商品 type 字段(store/product 响应补全) | shop | low | partial | ✅ | storefront-service,product-api | S |
| shop-26 | 结算页金额分解展示(原价/各优惠/应付)+ 服务端二次校验防篡改 | shop | high | partial | ✗ | buyer-checkout,payment-screen,order-model | S |
| shop-27 | 支付回调优惠核销 + 优惠后结算对账 | shop | high | partial | ✗ | payment-service,coupon-service,settlement-service,merchant-wallet,admin-reports | M |

### P1 — 对标核心能力(类型化地基 + 营销 + 门户骨架)

| id | title | 面 | 风险 | 状态 | dev_ready | conflict_domain | effort |
|---|---|---|---|---|---|---|---|
| product-01 | 商品类型四分法 goods_type 数据模型与枚举 | product | high | missing | ✗ | product-type-system,migration-goods-type,product-service,order-service | L |
| shop-01 | 商品销售类型系统 product_type 字段与数据模型 | shop | high | missing | ✗ | migration-product-type,product-service,product-model | XL |
| seller-01 | 商品多类型系统 + 差异化发货 | seller | high | missing | ✗ | product-type-system-order-delivery | XL |
| product-02 | 下单与发货按类型路由(跳卡密预占 + delivered_content JSON 化) | product | high | partial | ✗ | order-service,notify-service,product-delivery-service | L |
| shop-02 | 商品类型差异化发货逻辑(deliver 按 type 分流) | shop | high | partial | ✗ | order-service,payment-callback,card-service,knowledge-service,resource-service,rights-service | XL |
| product-03 | 非卡密虚拟库存模型(inventory_type) | product | medium | partial | ✗ | product-inventory,order-service-reserve,card-service | M |
| shop-10 | 按类型适配的库存语义与展示 | shop | medium | partial | ✗ | product-service,order-service,storefront-service | M |
| product-04 | 店铺首页按商品类型分组 Tab(图标+计数+筛选) | product | low | partial | ✅ | buyer-shop-api,storefront-service,storefront-home-ui | M |
| shop-03 | 店铺页按销售类型分组 Tab + 计数 | shop | low | missing | ✗ | storefront-buyer,storefront-service,api-contract | M |
| seller-02 | 店铺商品按类型 Tab 分组陈列 + 计数 | seller | low | partial | ✗ | storefront-service-type-grouping | M |
| product-06 | 知识文章多章节内容管理(product_chapters CRUD/排序/发布) | product | high | missing | ✗ | migration-chapters,chapter-service,merchant-product-console | XL |
| product-07 | 知识/资源发货内容下发与访问权限(临时签名链接) | product | high | missing | ✗ | notify-service-delivery,order-content-auth,buyer-order-service | L |
| product-08 | 资源下载商品:文件上传/存储与下载服务(防盗链) | product | medium | missing | ✗ | migration-files,resource-upload-service,download-link-service,merchant-product-console | L |
| product-11 | 商品详情页按类型差异化展示与购买流程提示 | product | low | partial | ✗ | buyer-product-detail,product-service,frontend-product-screen | M |
| shop-05 | 商品详情按类型差异化展示(ProductDetail type 感知) | shop | medium | missing | ✗ | storefront-product-detail,product-model | L |
| product-12 | 商户后台商品表单按类型切换编辑区块 | product | low | partial | ✗ | merchant-product-form-ui,product-service | M |
| shop-06 | 商户后台按类型分组管理商品(type 选择器 + 条件字段) | shop | medium | missing | ✗ | console-merchant-product,product-service | L |
| product-13 | 发货邮件/通知模板按类型差异化 | product | medium | missing | ✗ | notify-service,migration-email-templates,admin-config | M |
| product-14 | 发货追踪与日志(delivery_items/logs + 失败重试) | product | high | partial | ✗ | order-service,migration-delivery-logs,notify-service,merchant-order-console | M |
| product-16 | 非卡密商品补发 type-aware | product | medium | missing | ✗ | merchant-order-service,notify-service | S |
| product-17 | 库存模糊分档逻辑统一与完善(show_stock_type 阈值) | product | low | partial | ✅ | product-service,product-detail-screen,buyer-shop-ui | S |
| product-18 | 商品富文本详情编辑器(图文/媒体) | product | low | partial | ✅ | product-editor,merchant-product-form,product-detail-screen | M |
| seller-03 | 商品搜索(关键词 + 分类 + 类型组合筛选) | seller | low | missing | ✅ | storefront-service-search | M |
| seller-04 | 商品富文本详情(HTML 编辑器 + XSS 净化) | seller | medium | partial | ✅ | product-rich-text-detail | M |
| shop-12 | 分类图展示(买家端 Tab)+ 商户分类表单加 image 字段 | shop | low | partial | ✅ | merchant-categories-form,storefront-buyer | S |
| shop-13 | 库存显示方式(精确/模糊)商户编辑入口 | shop | low | partial | ✅ | console-merchant-product,buyer-shop-stock-display | S |
| shop-21 | 待支付订单查单页支付重试入口 | shop | low | partial | ✅ | buyer-order-query,buyer-paymentscreen | S |
| shop-22 | 优惠券体系(模型+验证+下单应用) | shop | high | missing | ✗ | coupon-service,order-service,buyer-checkout | M |
| shop-23 | 优惠券商户后台管理 + 有效期自动禁用任务 | shop | low | missing | ✗ | merchant-console-marketing,coupon-service,command-task | M |
| shop-25 | 优惠组合规则(互斥/叠加)定义与上限 | shop | medium | missing | ✗ | coupon-service,promotion-service,order-service | S |
| marketing-01 | 优惠券数据模型与迁移(coupons/coupon_items/buyer_coupons) | marketing | high | missing | ✗ | coupon-data-model | M |
| marketing-02 | 优惠券类型与计算规则(面值/折扣/满减) | marketing | medium | missing | ✗ | coupon-type-rules | M |
| marketing-03 | 商户侧优惠券 CRUD 与上下线 | marketing | medium | missing | ✗ | coupon-merchant-create | M |
| marketing-04 | 买家侧优惠券领取与展示 | marketing | high | missing | ✗ | coupon-buyer-apply | M |
| marketing-05 | 下单前优惠券校验接口 POST /buyer/coupons/validate | marketing | medium | missing | ✗ | coupon-api-validate | S |
| marketing-06 | 订单优惠券核销与结算集成(orders 字段扩展) | marketing | high | missing | ✗ | coupon-order-settlement | L |
| marketing-14 | 商户营销管理后台(导航+统一控制台) | marketing | low | missing | ✗ | console-merchant-nav | M |
| marketing-16 | 买家前台优惠展示与结算交互 | marketing | low | missing | ✗ | buyer-checkout-ui | M |
| seller-05 | 优惠券系统(建表/CRUD/下单/核对/退款回滚/防篡改) | seller | high | missing | ✗ | promotion-coupon-system | XL |
| seller-07 | 商户营销工具后台页面(优惠券/折扣/满赠/统计 Tab) | seller | low | missing | ✗ | console-merchant-marketing-page | M |
| seller-11 | 商户数据概览补充毛利(profit:今日/昨日/本月) | seller | low | partial | ✅ | MerchantStatsService-profit-calc | M |
| seller-17 | 订单查询密码(密码查单替代邮箱验证) | seller | low | missing | ✅ | order-query-password | S |
| seller-18 | 买家联系方式格式灵活化(QQ/手机/邮箱/其他) | seller | low | partial | ✅ | order-contact-type | S |
| seller-22 | 平台公告/内容管理增强(文章/FAQ + 订单查询防诈提示) | seller | low | partial | ✅ | announcement-article-system | M |
| seller-23 | 商户自助入驻前端「我要开店」页 | seller | low | partial | ✅ | merchant-register-ui | M |
| shop-14 | 门户站导航栏 + config 下发 nav 菜单 | shop | low | missing | ✗ | buyer-nav,config-service,system-settings,admin-nav-management | M |
| shop-15 | 门户内容系统(文章/FAQ/禁售目录:模型+分类+状态) | shop | low | missing | ✗ | articles-model,articles-service,content-visibility | L |
| shop-16 | 门户内容管理后台(admin 多类型 CRUD + 富文本/XSS) | shop | high | partial | ✗ | console-admin-content,articles-service,xss-security,admin-ui | M |
| shop-18 | 常见问题(FAQ)买家页(分类 tab + 搜索) | shop | low | missing | ✗ | buyer-pages-faq,articles-service | M |
| shop-19 | 订单查询密码模式(order_no + 密码) | shop | medium | missing | ✗ | order-model,buyer-order-query,merchant-product-settings | M |
| shop-20 | 联系方式格式支持(QQ/邮箱/手机/任意) | shop | medium | partial | ✗ | product-model,order-model,buyer-checkout | M |
| portal-01 | Article 内容模型与迁移(articles 表) | portal | low | missing | ✅ | article-model | M |
| portal-02 | 门户公开 API:/index/* 命名空间重构与文章接口 | portal | low | partial | ✅ | portal-route,index-api-controller | S |
| portal-03 | 后台资讯管理 CRUD(admin.Articles) | portal | low | missing | ✅ | admin-article-crud | M |
| portal-07 | 门户前端骨架:Portal 入口·导航·路由 | portal | low | missing | ✗ | frontend-portal,portal-navbar,routing | M |
| portal-08 | 门户首页内容区:统计卡片+最新资讯+开通小店 CTA | portal | low | missing | ✗ | frontend-portal,portal-homepage | M |
| portal-09 | 门户文章列表与详情页 | portal | low | missing | ✗ | portal-articles,frontend-portal | M |
| portal-10 | 常见问题(FAQ)门户页与后台 | portal | low | missing | ✗ | portal-faq,article-category | S |
| portal-12 | 门户『开通小店』入口集成自助注册 | portal | low | partial | ✅ | merchant-register-form,portal-homepage | S |
| admin-01 | 仪表盘利润指标补全(month/today/yesterday/all_profit) | admin | low | missing | ✅ | admin-view-service,admin-dashboard-service,dashboard-api | M |
| admin-03 | 商品审核流程(verify_status + 平台审核 + 上架限制) | admin | medium | missing | ✗ | migration-product-verify,product-service,admin-products-controller,merchant-product-service | L |
| admin-04 | 投诉管理全链路(表/状态机/平台判决+前端) | admin | high | missing | ✗ | complaint-model,complaint-service,admin-complaint-controller,merchant-complaint-controller,buyer-complaint-api,order-model,complaint-migration | XL |
| admin-08 | 充值订单体系(运营/保证金/货源点 + 回调结算) | admin | high | missing | ✗ | orders-table,order-service,payment-service,notify-controller,merchant-fund-log,admin-orders-controller | XL |

### P2 — 增强与售后/资金闭环

| id | title | 面 | 风险 | 状态 | dev_ready | conflict_domain | effort |
|---|---|---|---|---|---|---|---|
| product-05 | type=2 手动发货前端闭环(立即发货 UI) | product | medium | partial | ✗ | console-merchant-order,order-service,merchant-order-controller | M |
| product-09 | 数字权益类商品:权益码库存与发放/兑换 | product | high | missing | ✗ | migration-equity,equity-service,card-service-generalize,product-type-routing | L |
| product-10 | 异常订单退款闭环(退款/补货 + 卡密回库 + 反向流水) | product | high | missing | ✗ | refund-service,admin-order-management,payment-service,settlement-service | XL |
| product-15 | 商户报表与发货统计按类型分组 | product | low | missing | ✅ | merchant-stats-service,merchant-order-console | S |
| shop-07 | 知识文章类型内容管理后台(章节/富文本) | shop | medium | missing | ✗ | console-merchant-knowledge,knowledge-service,xss-security | L |
| shop-08 | 资源下载类型文件管理后台(上传/外链 + 元信息) | shop | medium | missing | ✗ | console-merchant-resources,resource-service,file-upload | L |
| shop-09 | 数字权益类型权益池管理(激活码 一权一售) | shop | high | missing | ✗ | console-merchant-rights,rights-service,right-pool | L |
| shop-11 | 商户后台按类型的订单管理(type 列/筛选 + 差异操作) | shop | low | missing | ✗ | console-merchant-order | S |
| shop-17 | 禁售目录页(买家端展示 + 禁售商品标记/原因) | shop | medium | missing | ✗ | buyer-pages-article,migration-products-ban,product-service,buyer-storefront | M |
| shop-24 | 限时折扣 + 满折满减规则 | shop | high | missing | ✗ | product-service,discount-service,promotion-service,order-service | L |
| marketing-07 | 限时折扣规则(时间段降价) | marketing | medium | missing | ✗ | discount-service-timed | L |
| marketing-08 | 满折规则(订单满额阶梯打折) | marketing | high | missing | ✗ | discount-service-threshold | M |
| marketing-09 | 满减规则(订单满额减固定金额) | marketing | high | missing | ✗ | reduction-service-threshold | M |
| marketing-10 | 多件优惠/阶梯价(按购买数量定价) | marketing | medium | missing | ✅ | product-tiered-pricing | M |
| marketing-12 | 优惠券/订单退款反核销 | marketing | high | missing | ✗ | coupon-refund-logic | M |
| marketing-13 | 优惠与库存冲突校验 | marketing | medium | missing | ✗ | order-checkout-inventory | S |
| marketing-15 | 平台营销审核后台(跨商户审核/下线) | marketing | low | missing | ✅ | console-admin-nav | S |
| marketing-17 | 营销数据统计与报表(商户+平台仪表盘) | marketing | low | missing | ✗ | marketing-analytics | M |
| seller-06 | 限时折扣 + 阶梯价 + 满减满赠营销规则 | seller | high | missing | ✗ | promotion-discount-rules | L |
| seller-08 | 优惠使用统计与分析(聚合 + 可选导出) | seller | low | missing | ✗ | marketing-stats-service | S |
| seller-09 | 投诉/售后系统(买家发起→商户响应→平台仲裁→退款联动) | seller | high | missing | ✗ | complaint-refund-system | XL |
| seller-10 | 投诉仪表盘计数 + 商户/平台投诉菜单入口 | seller | low | missing | ✗ | complaint-dashboard-nav | S |
| seller-12 | 商户操作日志/审计(细粒度 + 查询筛选页) | seller | low | partial | ✅ | SystemLogService-expand-merchant | M |
| seller-13 | 异常日志查看器 + 任务计划可视化 | seller | low | partial | ✅ | admin-logs-cron-visualization | M |
| seller-14 | 商户店铺主题模板系统(theme_params + 渲染) | seller | medium | partial | ✗ | merchant-theme-system | L |
| seller-15 | 商户通知/消息中心(系统消息 + 未读红点) | seller | low | missing | ✅ | notification-system | M |
| seller-16 | 商户账户安全(登录日志/失败锁定/新 IP 提醒) | seller | medium | partial | ✅ | merchant-security | M |
| seller-19 | type=2 手动发货完整链路(待发货状态 + 表单) | seller | medium | partial | ✗ | manual-delivery-flow | M |
| seller-20 | 退款链路(异常单转人工 + 退款审核 + 资金回流) | seller | high | missing | ✗ | complaint-refund-system | L |
| seller-21 | 转账渠道/代付(提现自动打款) | seller | high | missing | ✗ | transfer-channel-payout | L |
| seller-24 | 风控/反诈信息展示(登录归属地 + 异常标记 + 风控日志) | seller | medium | missing | ✗ | risk-control-system | L |
| seller-25 | 货源对接/寄售(平台货源库 + 三方分账) | seller | high | missing | ✗ | consignment-system | XL |
| admin-02 | 仪表盘待处理计数补全 | admin | low | partial | ✗ | admin-view-service,admin-dashboard-service,product-model,buyer-model | M |
| admin-05 | 投诉通知与数据统计 | admin | medium | missing | ✗ | complaint-notification-service,notify-service,admin-report-service | M |
| admin-06 | 投诉赔付/退款关联(本期标记态) | admin | high | missing | ✗ | complaint-service,refund-service,merchant-wallet-service | L |
| admin-07 | 买家黑名单管理(后台 UI + 下单拦截) | admin | high | missing | ✗ | buyers-table,orders-service,admin-blacklist-controller,admin-blacklist-page | M |
| admin-09 | 转账渠道/代付配置(表+驱动框架+前端) | admin | high | missing | ✗ | payment-channel-model,transfer-service,pay-driver,admin-transfer-page,migration-payment-channel | L |
| admin-10 | 自动代付执行+回调验签+异常处理 | admin | high | missing | ✗ | withdrawal-service,transfer-service,withdrawal-model,pay-notify-controller,merchant-fund-log,task-schedule | L |
| admin-12 | 操作日志(平台对商户业务操作审计) | admin | low | partial | ✗ | operation-log-db,system-logs-table,merchant-service,admin-userOplog-controller | M |
| admin-13 | 风控记录(商户风险事件日志) | admin | medium | missing | ✗ | migration-risk-control,risk-control-service,admin-risk-control,merchants-table | M |
| admin-14 | 主题模板管理(预设库 + 商户选主题 + 前台渲染) | admin | low | missing | ✗ | shop-themes-table,theme-service,merchants-table,storefront-service,merchant-shop-ui | L |
| admin-15 | 货源名片(平台商品池/寄售对接) | admin | low | missing | ✗ | admin-goods-pool,goods-pool-service,product-model | M |
| portal-04 | 站点配置扩展(systemConfig 门户字段) | portal | low | partial | ✅ | system-settings,admin-system | S |
| portal-05 | 平台统计聚合公开 API(/index/platformStats) | portal | low | partial | ✅ | platform-stats,cache-strategy | S |
| portal-06 | 禁售目录模型与门户接口(forbidden_items) | portal | low | missing | ✗ | forbidden-items-model,admin-forbidden,portal-forbidden | M |
| portal-11 | 独立门户订单查询页 | portal | low | partial | ✅ | portal-order-query,buyer-order-service | S |

### P3 — 后置/待评估

| id | title | 面 | 风险 | 状态 | dev_ready | conflict_domain | effort |
|---|---|---|---|---|---|---|---|
| marketing-11 | 营销规则冲突处理与优先级(取最优/互斥/叠加) | marketing | medium | missing | ✗ | promotion-rules-engine | L |
| marketing-18 | 优惠券分销/推广员佣金(本期暂缓) | marketing | medium | missing | ✗ | coupon-promoter-link | M |
| seller-26 | 推广分销/推广员体系 | seller | medium | missing | ✗ | distributor-system | L |
| seller-27 | 子账号/员工权限体系(RBAC + 财务/支付权限隔离) | seller | high | missing | ✗ | merchant-staff-rbac | XL |
| admin-11 | 进件审核(支付渠道签约申请+审批) | admin | high | missing | ✗ | migration-channel-checkout,merchant-channel-service,admin-channel-sign-controller,merchant-channel-form,payment-channel-model | XL |
| admin-16 | 系统更新/版本授权信息 | admin | low | missing | ✗ | system-version-table,system-license-table,admin-system-controller,license-service | M |
| admin-17 | 任务计划/后台任务可视化 | admin | low | missing | ✗ | system-job-model,admin-task-mgmt,scheduler-service | L |

---

## 三、🚦 需业主拍板(needs_clarification / high risk)

以下项在排期前必须由业主确认,否则会反复返工或写错状态机。每条列出待确认问题:

1. **商品类型四分法的最终口径(product-01 / shop-01 / seller-01)** — 三个面给出两套字段名(`goods_type` 五值 vs `product_type` 四值)。
   - 确认:最终类型是 **4 类(卡密/知识/资源/权益)还是 5 类(再分出 type=2 手动发货)**?字段名 `goods_type` 还是 `product_type`?现有 `TYPE_AUTO/TYPE_MANUAL` 如何并入(手动发货是"发货方式"还是"商品类型")?——这是所有类型化任务的地基,必须先定。

2. **优惠券支持哪些类型与叠加规则(shop-22/25, marketing-01/02/11, seller-05)**
   - 确认:支持哪几种券型(面值固定额 / 折扣率 / 满减)?是否支持**指定适用商品/分类**?优惠券与限时折扣、满折、满减、阶梯价之间是**互斥取最优 / 可叠加 / 按优先级**?**单笔最大优惠上限**是多少?是否有**最低成交金额**(防 0 元单)?

3. **知识/资源类如何发货与防盗链(product-06/07/08, shop-07/08)**
   - 确认:知识文章用**站内章节阅读**还是**外链**?资源文件存**本地 / OSS**(走哪家)?下载链接**有效期多久、限下载次数**?是否需要**水印/单设备绑定**?访问鉴权用 `order_no+token` 是否够,还是要登录态?

4. **数字权益类的库存与兑换语义(product-09, shop-09)**
   - 确认:权益码是否复用 `cards` 表(加 goods_type)还是独立 `equity_codes`?权益是"激活码兑换"还是"账号直冲"?是否有**有效期 / 续费**概念?一权一售是否同样要 `FOR UPDATE SKIP LOCKED`?

5. **退款闭环与资金回流(product-10, seller-20, marketing-12, admin-06)**
   - 确认:退款是否**原路退回支付渠道**(需各支付驱动实现 `refund` 接口,确认哪些渠道支持)?退款时**卡密回库(2→0)+ 库存回补 + 反向佣金流水**的口径?**已结算给商户的钱**如何回冲(从余额扣 / 转负 / 限制提现)?部分退款是否支持?

6. **投诉/仲裁状态机与赔付(admin-04/05/06, seller-09/10)**
   - 确认:投诉状态机节点(待审/受理/处理中/已解决/驳回)是否定稿?**谁能发起**(仅买家?)、**举证方式**(图片上传走哪个存储)、**平台判决赔付**时是否立即触发真实退款(依赖第 5 条)还是仅标记?

7. **充值订单体系的三类业务(admin-08)**
   - 确认:**运营充值 / 保证金 / 货源点**分别入哪个账户(balance / deposit / credits)?保证金充值订单**是否纳入支付回调统一结算**还是走独立通道?三类是否都需要 admin 审核还是回调即到账?

8. **转账代付/进件审核(seller-21, admin-09/10/11)**
   - 确认:代付走哪家渠道(与收款同渠道还是独立)?提现审批通过后**自动打款还是人工确认后打款**?商户绑卡信息存储与加密要求?进件审核本期是否做(P3,可暂缓)?

9. **门户导航与内容(shop-14/15/16/17, portal-06)**
   - 确认:门户导航菜单项最终清单与顺序?**禁售目录**是平台级统一(`forbidden_items`)还是商户级标记商品(`products.is_banned`)还是两者都要?富文本 XSS **后端 sanitize 用哪个库**?

10. **订单查询密码 + 联系方式格式(shop-19/20, seller-17/18)**
    - 确认:查单**默认邮箱还是密码**模式,是否商户可配?`buyer_email` 改可空后,通知渠道如何按 QQ/手机/邮箱选择(短信网关是否就绪)?

11. **分销/推广员 + 子账号 RBAC(marketing-18, seller-26/27)**
    - 确认:本期是否纳入分销?**几级分销、各级返佣比例**?子账号权限粒度到模块还是到按钮?——建议本期记入 `docs/blockers.md` 暂缓(已标 P3)。

12. **主题模板系统(seller-14, admin-14)** — 确认:模板是**平台预设库供商户选**还是商户自由配色?`theme_params` 字段范围?

---

## 四、✅ 建议首批并行开发(dev_ready 且 conflict_domain 互不冲突)

从 `dev_ready=true` 且需求清晰的项中,挑选 **冲突域两两互不重叠** 的 11 条作为首批并行开发批次。这些多为"已有后端字段/逻辑、补前端或一行映射"的低风险高性价比项,可分配给不同开发者并行推进而不互相阻塞:

| # | id | title | conflict_domain(各异) | effort |
|---|---|---|---|---|
| 1 | shop-04 | API 返回商品 type 字段 | storefront-service,product-api | S |
| 2 | shop-13 | 库存显示方式商户编辑入口 | console-merchant-product,buyer-shop-stock-display | S |
| 3 | shop-12 | 分类图展示 + 商户分类表单 image 字段 | merchant-categories-form,storefront-buyer | S |
| 4 | shop-21 | 待支付订单查单页支付重试入口 | buyer-order-query,buyer-paymentscreen | S |
| 5 | seller-11 | 商户数据概览补充毛利(profit) | MerchantStatsService-profit-calc | M |
| 6 | seller-17 | 订单查询密码 | order-query-password | S |
| 7 | seller-23 | 商户自助入驻前端「我要开店」页 | merchant-register-ui | M |
| 8 | admin-01 | 仪表盘利润指标补全 | admin-view-service,admin-dashboard-service,dashboard-api | M |
| 9 | portal-01 | Article 内容模型与迁移(articles 表) | article-model | M |
| 10 | portal-03 | 后台资讯管理 CRUD(admin.Articles) | admin-article-crud | M |
| 11 | seller-16 | 商户账户安全(登录日志/失败锁定/新 IP) | merchant-security | M |

**并行性说明:**
- 上述 11 条冲突域**两两不重叠**——例如 shop-04 只动 `StorefrontService` 读路径、seller-17 只动 `orders.query_password` + 查单端点、admin-01 只动 `AdminViewService.dashboard`,互不踩同一函数。
- portal-01 与 portal-03 看似都涉 articles,但 portal-01 是**建表+模型**(`article-model`)、portal-03 是 **admin CRUD**(`admin-article-crud`)——可由 portal-01 先合入模型,portal-03 紧随;若强求完全无依赖,可将 portal-03 移入第二批,用 portal-02(`/index/*` 路由)替补。
- product-04 / product-17 / product-18 / seller-03 / seller-04 / portal-04 / portal-05 / portal-11 等也为 dev_ready,但部分与首批存在 storefront/product-service 写域交叉,留作**第二批并行**。
- **不入首批**:所有 `high risk` 与类型化地基(product-01/shop-01)——它们需先经第三节业主拍板。
