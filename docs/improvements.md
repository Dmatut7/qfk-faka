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
