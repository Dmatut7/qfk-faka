# UI 落地任务清单 · 新橙色淘宝商业风(tasks)

> ✅ **全部完成(2026-06-22,分支 `ui-orange-relaunch`)**。M1 的"补色"由"买家前台整屏 port 成新 UI"替代实现(直接接入新设计,而非在老屏上补色);四端截图见 `frontend/app/e2e/newui/`,成果见 `docs/DELIVERY-REPORT.md`。
>
> 规格见 `docs/ui-relaunch/spec.md`。一个任务一个 commit(`UI-Uxx: …`),完成必跑 `cd frontend/app && npm run build` 绿。
> `⚠` = 不可逆/改已提交定调/需你拍板,做到安全处停下问人。审计给的行号仅参考,动手前以实际为准、不臆造。
> 定位旧蓝值统一用这组 grep(命中即待清):`#2563eb|#4f46e5|#4338ca|#6366f1|47,107,255|#eef3ff|#e9ecff|#f1ecff|#d6e2ff|#e5484d|#60a5fa|#a78bfa|#22d3ee`(语义红/绿/琥珀除外)。

---

## M0 · 地基(已完成,记录在案)
- [x] **U0a** design-system 蓝→橙整体替换(tokens+组件),App 四端跟随变色;`npm run build` 绿。
- [x] **U0b** 店铺默认主题 → 淘宝橙 `#FF5000`(`themes.js`,后端 THEMES key 未动)。
- [x] **U0c** 修 `PaymentScreen` 未定义 `--brand-solid`(回退蓝)→ `--brand`。

---

## M1 · 残留蓝紫清理(高优先,小改动,一改即明显)
> 判据通则:改完该屏 `grep` 不到上面那组旧蓝值;`npm run build` 绿;dev 截图该屏为橙系无蓝紫。

- [x] **U1 店招封面渐变改橙** — `src/screens/StorefrontHome.jsx` 店招 banner 现为浅蓝→淡紫渐变(`#EAF1FF/#E9ECFF/#F1ECFF`)。改为橙系(参考 Kit `ui_kits/storefront/storefronthome.js` 的 `radial-gradient(... #FF7B33 #FF5000 #C23A00)`)。
  - 判据:店招顶部为暖橙渐变;无 `#EAF1FF/#E9ECFF/#F1ECFF`。
- [x] **U2 首页其余 fallback 旧蓝清扫** — 同文件:公告条 `var(--brand-soft,#eef3ff)`、头像阴影 `rgba(47,107,255,.35)`、限时角标 `var(--danger-solid,#e5484d)` 等 fallback 改成对应橙/语义新值或删 fallback。
  - 判据:`StorefrontHome.jsx` grep 不到旧蓝 fallback;限时角标用 `--promo-solid/#FA2C19`。
- [x] **U3 平台仪表盘问候卡渐变改橙** — `src/console/admin/Dashboard.jsx` GreetingCard 渐变硬编码 `#2563eb/#4f46e5/#4338ca` → `var(--brand-gradient)`(或橙阶 `--orange-400/500/600`)。
  - 判据:问候卡橙色实底渐变;无蓝紫硬编码。
- [x] **U4 门户 Hero 渐变改橙** — `src/screens/Portal.jsx` Hero(`var(--secure-solid,#2563eb) → var(--brand,#4f46e5) → var(--brand-active,#4338ca)`)改为橙系(`--brand-gradient` 或橙阶),fallback 一并换橙。
  - 判据:门户首页 Hero 橙色;无 `#2563eb/#4f46e5/#4338ca`。
- [x] **U5 ⚠ 大屏 accent 收敛橙+语义** — `src/console/admin/BigScreen.jsx` 数据卡多彩 accent(蓝 `#60a5fa`、紫 `#a78bfa`、青 `#22d3ee`、logo 渐变 `#6366f1→#22d3ee`)去蓝/靛/紫,收敛到橙+语义色。**大屏是否保留多色属设计判断,改前确认口径**(默认:去蓝紫、留橙+绿+琥珀+teal)。
  - 判据:无裸蓝/靛/紫;大屏整体橙/语义调;`npm run build` 绿。
- [x] **U6 全仓残留旧蓝兜底清扫** — 对 `frontend/app/src` 跑通则 grep,U1–U5 之外仍命中的逐个改橙或删 fallback(语义色不动)。
  - 判据:全量 grep 仅剩语义色;`npm run build` 绿。

## M2 · 结构对齐 Kit(中优先)
- [x] **U7 商品卡 image-led 1:1 + 三角标** — `src/screens/StorefrontHome.jsx` 商品卡(及详情主图)对齐 `components/commerce/ProductCard.jsx`:1:1 主图占位(无图给暖橙底+emoji,别留白块)、左上类型徽标、右上单角标(优先级 限时折扣 > 仅剩N/已售罄)、两行截断标题、大红现价 + 划线原价、底部"已售N"。
  - 判据:商品卡为 1:1 image-led;有 现货/缺货/已售罄 角标态;空店铺/无搜索结果态在;dev 截图对照 Kit 一致。
- [x] **U8 商户今日成交额 filled hero 卡** — `src/console/merchant/Stats.jsx` 今日成交额 StatCard 加 `filled`(橙实底渐变 hero),其余保持白卡。
  - 判据:今日成交额为橙实底 hero,其余白卡;对照 Kit `ui_kits/merchant` / `components/console/StatCard.jsx`。

## M-C · 后台全面对齐新设计(商户后台 + 平台后台)
> 现状(已读证实):后台外壳 `console/ConsoleApp.jsx`(双层侧栏)+ 共享原语 `console/ui.jsx`(Panel/StatCard 含 filled 橙 hero/DataTable/Pill/Modal/空错态)**已全部走橙色新设计系统**,25 个后台屏共用它们 → 天生新风。剩余仅个别屏旧色残留 + 对齐 Kit 富度。
- [x] **UC1 平台仪表盘问候卡橙化** — `console/admin/Dashboard.jsx` 问候卡渐变(teal→蓝紫)→ `var(--brand-gradient)`,去 `#2563eb/#4f46e5/#4338ca`。判据:问候卡纯橙;grep 无蓝紫。
- [x] **UC2 商户今日成交额 filled hero** — `console/merchant/Stats.jsx` 今日成交额 StatCard 加 `filled`(橙实底渐变),其余白卡。判据:对照 merchant Kit,hero 卡为橙实底。
- [x] **UC3 大屏 accent 橙+语义** — `console/admin/BigScreen.jsx` 数据卡 accent(`#60a5fa/#a78bfa/#22d3ee/#6366f1`)→ 橙+语义色;logo 渐变橙化。判据:无裸蓝/紫/青;大屏整体橙/语义调。
- [x] **UC4 后台逐屏对照 Kit 验收** — `npm run dev` → `/console.html`,商户/平台后台逐屏对照 `ui_kits/merchant`、`ui_kits/admin` 截图,补齐富度差(数据卡/待处理/宫格/榜单),清任何残留旧色。判据:两后台截图对照 Kit 无明显偏差/旧色;桌面+移动抽屉态都看过。

## M3 · 逐端视觉验收(交付保障,会回触 M1/M2/M-C 修剩余偏差)
- [x] **U9 四端关键屏截图验收** — `npm run dev` 起站,用/补 `e2e/*.mjs` 截图:前台(首页/详情/取卡/支付)、门户、商户后台(概览/商品/订单)、平台后台(仪表盘/商户/订单/大屏)。逐张对照 Kit,残余偏差回 M1/M2 修。
  - 判据:截图存档于 `e2e/`;四端无明显蓝紫/塌陷/溢出;桌面+移动两态都看过。
- [x] **U10 买家核心流程走查** — 首页→详情→下单→支付→取卡,四类型结果区(卡密列表+复制 / 知识阅读器 / 资源下载链 / 权益码)正常。
  - 判据:流程无报错;四类型交付区可见且复制/入口可用。

## M4 · 交付收尾
- [x] **U11 ⚠ 清理根目录冗余** — 删 `秒卡 MiaoKa 设计系统/`、`秒卡 MiaoKa 设计系统.zip`、`frontend/_design-system-original.zip`(准已在 `frontend/design-system`)。**删除前核对内容已并入,确认后再删。**
  - 判据:根目录无重复设计系统副本;`frontend/design-system` 完好;`npm run build` 绿。
- [x] **U12 ⚠ 文档同步现状(橙)** — `docs/design-brief.md` 主色蓝(34/215/222 等)与 `DELIVERY-REPORT.md` 旧蓝表述与现状冲突。**确认口径**:就地改成橙基线,或新增 `docs/DESIGN-SYSTEM-CHANGELOG.md` 记录蓝→橙迁移并指向 `frontend/design-system/readme.md` 为权威源(默认:新增 changelog + brief 顶部加迁移提示,保留历史)。
  - 判据:文档不再把"信任蓝 #2F6BFF"当现行主色;有清晰的"现行=淘宝橙"指向。
- [x] **U13 终验** — `cd frontend/app && npm run build` 全绿;`composer test`(后端未动)全绿;dev 起站四端可访问。
  - 判据:两处构建/测试绿;应用能起、四端可打开。
- [x] **U14 交付报告** — 更新 `docs/DELIVERY-REPORT.md`:记录本次 UI 落地(橙色四端 + 关键截图 + 已知遗留)。
  - 判据:报告含落地范围、验收结果、截图引用。

---

### 依赖关系
- M1 各项相互独立,可并行;U6 依赖 U1–U5(收尾扫描)。
- M2 独立于 M1(结构),但建议 M1 后做(色对了再看结构)。
- M3 依赖 M1+M2(有东西可验收);U9 与 U10 会回触修复。
- M4:U11/U12 独立;U13 依赖前面全部;U14 依赖 U13。

### 停顿点(必停等人工)
- **U5 / U11 / U12**(`⚠`)动手前确认口径/确认删除。
- **M3 截图验收发现需要你拍板的视觉取舍**时停下问。
- **全部完成**:整站走查后报交付,等验收。
