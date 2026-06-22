# 设计系统变更记录(DESIGN-SYSTEM-CHANGELOG)

> 现行设计系统的**权威来源**:`frontend/design-system/`(readme.md 为风格规范)。
> 本文件记录设计语言的重大迁移,供对照历史文档时参考。

---

## 2026-06-22 · 信任蓝 → 淘宝商业橙(全面落地)

**变更**:整套设计语言从「信任蓝 `#2F6BFF` · 金融级克制」改为「淘宝商业橙 `#FF5000` · 电商促销可信感」,并**全面接入真实四端**(不再只是设计稿)。

**为什么**:业主在 Claude Design 中以淘宝商品页为参考,明确将品牌方向定为淘宝商业橙,要求"整个前端都用新设计、包括后台、不要老的"。

**主色基线(现行,以 `frontend/design-system/tokens/colors.css` 为准)**:
- 品牌 `--brand #FF5000`(hover `#E64600` / active `#C23A00`),软色 `--brand-soft #FFF3EC`
- 价格大红 `--price-accent #FA2C19`;CTA 渐变 `--cta-gradient-buy`(红→橙)
- 语义:有货/已付=绿 `#00B578`,待支付=琥珀 `#FF9000`,缺货/失败=红 `#FA2C19`,担保/加密=teal `#0FA9A0`
- 中性暖灰阶;页底 `--bg-page #F5F5F6`

**落地范围(四端 + 共享,全部已接入真实 React 产品)**:
- 买家商城:`StorefrontHome / ProductDetail / OrderLookup / PaymentScreen / TopBar`(淘宝风:image-led 商品卡、红价、促销角标、店招三联统计、底部 sticky 购买条)
- 门户站:`Portal`(橙色 Hero + 数据卡 + 入口宫格)
- 商户后台 / 平台后台:双层侧栏外壳 + `Panel/StatCard(橙实底 hero)/DataTable/Pill` + 大屏(橙+语义 accent)
- 共享:`frontend/design-system/`(tokens + core/commerce/console 组件 + 三套 UI Kit);店铺默认主题 → 淘宝橙

**验证**:`npm run build` 绿;买家端到端流程(下单→支付回调→取卡)通过;`composer test` 430 测试全绿(后端未改);四端截图见 `frontend/app/e2e/newui/`。

**历史文档说明**:`docs/design-brief.md` 是给设计师的**初始需求**(写于迁移前,主色仍记为信任蓝 `#2F6BFF`),作为历史保留;现行主色以本变更与 `frontend/design-system` 为准。

**回退**:迁移前的蓝色设计系统在 git 历史(提交 `1d8e22a` 之前的 `frontend/design-system`)中可追溯。
