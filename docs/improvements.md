# 持续改进日志(自驱循环)

> 每轮:并行审计找不合理/缺陷 → 挑高价值的修 → 验证(build + e2e)→ commit → 在此登记。
> 已修的记入「已完成」避免重复审;已知但暂不修的记入「待办池」。

## 已完成
（逐轮追加,含轮次/问题/修复/验证/commit)

## 待办池(已发现,按优先级)
（审计产出的待修项)

## 不改的(有意为之 / 超范围)
- 退款编排、发货通知、买家账号、支付宝/微信真实驱动:本期范围外(见 blockers.md)。

---
## 第1轮(2026-06-21):对标鲸发卡 + P0 地基
- **竞品研究**:无头浏览器实抓 fkdemo.jingsoft.com + 截获 shopApi 数据模型 → `docs/feature-gap.md`(完整对照+路线图)。
- **P0 迁移(已完成,257测试绿)**:products(image/market_price)、merchants(logo/cover/intro/announcement/contact_qq·wechat·mobile/deposit/verified/sales_count)、categories(image)。
- **进行中**:后端返回新字段 + 丰富演示数据 + 买家店铺页改版(店招/保证金/认证/客服/分类筛选/2列带图网格)。
- **并入的审计缺陷待修(wdhj9jhrl)**:支付方式造假、订单#id无名、补发无确认、渠道密钥明文、type=2卖不了、异常单无退款、对账时间口径、查单邮箱文案。

## 第2轮(2026-06-21):商城化 v2(对标鲸发卡 P0)— 已完成✅
- **后端**:StorefrontService 返回店铺装修/分类(带图+商品数)/商品(image/market_price/sales_count);MerchantService getShop/updateShop + merchant/Shop 控制器+路由;商品增改接受 image/market_price/category_id。257测试绿。
- **演示数据**:4 分类 + 8 带图商品(picsum + 划线价 + 归类)+ 64 卡密 + 店铺装修(保证金1万/认证/客服/公告)。
- **买家店铺改版**:店招(封面+头像+认证+联系客服)+ 🛡保证金统计 + 公告条 + 分类真筛选 + 2列带图网格(图/价/划线价/库存标签/已售)+ 客服弹窗;商品详情大图+划线价+公告;支付页改单聚合入口(修支付方式造假)。
- **商户控制台**:新增「店铺装修」页 + 商品表单加 图片/划线价/分类。
- **验证**:composer test 257绿 + vite build + 5 e2e 套件(login/14屏/money/flow/lookup)全绿。

## 第3轮(2026-06-21):缺陷修复 + 搜索 — 已完成✅
- 订单显示商品名(商户+平台,id→名映射)+ 补发/关单二次确认 Modal;渠道密钥脱敏(后端 list 掩码 key_mask/has_key + 前端 password 框留空不改,257测试绿)+ 商品搜索(店铺页客户端实时过滤)。
- 验证:257测试 + vite build + e2e(login/screens/flow/lookup)全绿。
- 并:实抓鲸发卡 admin 后台菜单 → feature-gap.md「平台后台对标」。

## 第4轮(2026-06-21):平台仪表盘 + 商户自助注册 — 已完成✅
- 后端:GET /admin/dashboard(商户/订单/成交额/待审核提现/商品/卡密聚合,Money 准);POST /merchant/register(公开,创建待审核商户,自动生成 slug,bcrypt)。新增 10 测试(AdminDashboardTest 2 + MerchantRegisterTest 8),composer test 267 全绿。
- 前端:admin 仪表盘页(StatCard);ConsoleApp 登录页加「我要开店」自助注册表单。
- 验证:267测试 + vite build + e2e(login/含仪表盘的14+1屏)+ 两接口实测全绿。

## 第5轮(2026-06-21):平台公告/内容管理 — 已完成✅
- 后端:announcements 表迁移 + Announcement 模型 + AnnouncementService + admin/Announcements CRUD;StorefrontService 增加 notices(status=1,sort,限5)。新增 9 测试,composer test 276 全绿。
- 前端:admin「内容管理」页(CRUD+二次确认)+ 买家店铺顶部平台公告条(可关闭/轮播/查看全部 Modal)。
- 验证:276测试 + vite build + e2e(login/含内容管理的16屏/buyer flow)+ /s/demo notices 实测全绿。

## 第6轮(2026-06-21):收尾验证 + 修仪表盘数据 bug
- **抓到并修复**:平台仪表盘所有数字显示 0——前端读扁平字段名(merchant_total...)而后端返回嵌套对象(merchants.total...),改为读嵌套结构。修后真实显示(商户2/订单17/成交额¥99/在售9/卡密72)。
- 全量 e2e 终验 5/5 全绿(console-login/screens/money/buyer flow/lookup)。

## 第7-8轮(2026-06-21):审计新代码 + 修缺陷 — 已完成✅
- R7 审计抓出:注册并发TOCTOU→500、Button variant=solid/tone=danger 样式失效、图片破图无回退、起购>限购不可买、搜索分类计数错位、4002态卡死等。
- R8 全修:注册捕获1062→业务码(+pcntl并发测试)、商品起购/限购校验、Button variant 全修(grep验证)、破图 onError 回退、搜索时隐藏分类计数、公告轮播重置、详情失败提示、4002态。
- 验证:composer test 281绿(+5)、vite build、e2e 4/4 全绿。

## 第9轮(2026-06-21):平台客服 + 站点配置 + 查单风险提示 — 已完成✅
- 后端:GET /config 公开接口(site/kefu/order_query_tips,读 system_settings)。新增 5 测试,composer test 286 全绿。
- 买家:平台客服悬浮按钮(全局,QQ/微信/手机/二维码)+ OrderLookup 查单风险提示条(对标鲸发卡 order_query_tips)。
- 控制台:admin 平台配置改为友好表单(站点/客服/订单提示分组 + 兜底KV)。
- 验证:286测试 + vite build + e2e 4/4 + /config 实测全绿。

## 第10-11轮(2026-06-22):对标diff+审计 → 修缺陷 — 已完成✅
- R10 对标鲸发卡+深度查bug,R11 全修:注册限流(防灌库)、公告可清空内容、渠道验签按路径id、前端金额改整数分(守金额纪律)、分类id归一(防类型失配)、thumb稳定哈希、sticky顶栏变量、Withdrawals图标/可关错误条/Input图标、订单复制execCommand兜底。
- 验证:composer test 289绿(+3)、vite build、e2e 4/4。

## 第12轮(2026-06-22):商品详情对标(购买须知+库存显示方式)— 已完成✅
- 后端:迁移 products.purchase_notice/show_stock_type;StorefrontService/ProductService 返回+接受。290测试绿(+1)。
- 买家:库存按 show_stock_type 精确「库存N」或模糊「充足/少量/缺货」(修了模糊模式泄露精确库存);ProductDetail 购买须知块。
- 商户:商品表单加 购买须知 + 库存显示方式。
- 验证:290测试 + vite build + e2e 4/4。

## 第14-15轮(2026-06-22):全系统最终查bug → 修复 — 已完成✅
- R14 全系统(买家/商户/平台/后端)深度查bug,R15 全修:支付倒计时时钟偏差锁死(改不禁用主按钮,真过期靠后端4003)、商户统计浮点改Money、卡密/钱包列表加分页(超20条可见)、卡密作废删除二次确认、OrderLookup 2003邮箱不匹配文案、ProductDetail图片不再闪回emoji、pollDelivery失败退避防自触发限流、Settlement错误条prop、Channels验签传code、Withdrawals状态筛选补「已通过」+金额整数分。
- 验证:composer test 290绿、vite build、e2e 4/4。

## 第16轮(2026-06-22):邀请码管理 — 已完成✅
- 后端:invite_codes 表+模型+Service(生成/停用/删除/redeem 行锁防并发超用)+ admin CRUD;注册闸门(registration_require_invite 设置控制必填,redeem+建户同事务)。新增18测试,308全绿。
- 前端:admin 邀请码页(生成/停用/删除二次确认)+ 自助注册表单加邀请码字段。
- 验证:308测试 + vite build + e2e 4/4。

## 第17-18轮(2026-06-22):最后风险审计 → 修复 — 已完成✅
- R17 上线前风险审计抓出:平台提现审核页写死page:1无分页(超20笔无法审核打款,HIGH资金阻塞)、卡密删末页越界、冻结余额无下限守卫、冻结商户可提现等。
- R18 全修:提现审核页加分页+越界回退、卡密删末页回退、AdminWithdrawService 冻结余额≥提现额显式断言、applyWithdrawal 冻结商户禁提现(+测试)。CLOSED→EXCEPTION对账闭环记 blockers 待 owner。
- 验证:composer test 309绿(+1)、vite build、e2e 5/5。

## 第19-20轮(2026-06-22):安全审计 + 控制台对标重构 — 进行中
- R19 安全/越权审计:token失效卡死(HIGH)、登录/查单无限流、缺货数量、Merchants用alert、Orders确认无loading等。
- R20 控制台对标鲸发卡:**分组侧栏导航**(概览/商户管理/交易/财务/运营/系统)+**顶栏面包屑+用户菜单**+**富仪表盘**(问候卡/今日数据卡/待处理可点/常用功能快捷格);商户数据概览同样加问候卡+常用功能。修R19 token失效→自动登出(1001派发事件)。
- 验证:vite build + e2e 5/5(分组导航不破坏巡检)。R19其余安全项待R21修。
