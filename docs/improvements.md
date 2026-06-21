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
