# UI 落地规格 · 新橙色"淘宝商业风"全面上线(spec)

> 目标:把真实 React 产品(四端 ~30 屏)从旧"信任蓝"残留**彻底落地为新橙色淘宝商业风设计系统**,对齐 `frontend/design-system` 的三套 UI Kit,做到**可交付**——没有半成品、没有残留蓝紫、四端视觉一致、整站能起能走通。
> 配套任务清单:`docs/ui-relaunch/tasks.md`。**本规格只管这次 UI 落地,不改后端、不碰业务逻辑。**

---

## 0. 现状与定调(已知,勿重复确认)

- **设计系统唯一来源**:`/Users/a1/Desktop/qfk/frontend/design-system/`(已是橙色版,readme.md 为权威风格规范)。
- **主色**:淘宝橙 `--brand #FF5000`;价格大红 `--price-accent #FA2C19`;语义 绿=有货/已付、琥珀=待支付、红=缺货/失败、teal=担保/加密。**禁止蓝/靛/紫当主色或强调。**
- **App 如何取色**:`frontend/app/src/main.jsx` 与 `console/main.jsx` 各 `import '../../design-system/styles.css'`;颜色全走 CSS 变量。**改 token 即全站变色**(已生效)。部分屏直接 import 了 design-system 的 `.jsx` 组件(Button/Input/PriceTag/CardKey/CheckoutSteps 等),橙色版 API 兼容(构建已验证)。
- **店铺主题**:`frontend/app/src/themes.js` 预设按 key 与后端 `Merchant::THEMES` 对齐;默认已设 `淘宝橙 #FF5000`。其余预设(emerald/rose/sky/violet…)是商户可选换肤,**保留**。
- **三套 UI Kit(落地对标目标)**:`design-system/ui_kits/{storefront,merchant,admin}/`;门户无 Kit,按 readme 风格规范对齐。

## 1. 落地范围(四端 + 共享)

| 端 | 真实代码 | 对标 Kit | 当前状态 |
|---|---|---|---|
| 买家商城 | `src/screens/{StorefrontHome,ProductDetail,OrderLookup,PaymentScreen}.jsx` `src/components/{TopBar,PlatformKefu}.jsx` | `ui_kits/storefront/*` + `components/commerce/*` | 色彩有残留蓝紫;商品卡结构待对齐(16:9→1:1 + 角标) |
| 门户站 | `src/screens/{Portal,Articles,Forbidden}.jsx` | 无 Kit,按 readme | Portal Hero 渐变残留蓝紫;Articles/Forbidden 已合规 |
| 商户后台 | `src/console/merchant/*.jsx` + `console/{ui.jsx,ConsoleApp.jsx}` | `ui_kits/merchant/*` + `components/console/*` | 外壳/表格已对齐;今日成交额缺 filled hero 卡 |
| 平台后台 | `src/console/admin/*.jsx` | `ui_kits/admin/*` + `components/console/*` | 外壳/表格已对齐;仪表盘问候卡 + 大屏 accent 残留蓝紫 |

## 2. "落地完成"的判定(每屏统一验收口径)

一屏算落地完成,需同时满足:
1. **无残留非品牌色**:不出现裸蓝/靛/紫/青当主色或强调;`var(--token,#fallback)` 的 fallback 不得是旧蓝值。语义色(危险红/成功绿/待处理琥珀/担保 teal)保留。
2. **结构对齐 Kit**:商城商品卡 image-led(1:1 主图 + 左上类型徽标 + 右上单角标 + 大红价 + 已售);后台用 双层侧栏 + 橙实底 hero StatCard + Panel/DataTable/Pill;门户与整体橙系一致。
3. **状态齐全**:列表/详情具备 加载骨架 / 空态 / 错误态。
4. **桌面 + 移动都成立**,不塌陷、不溢出。
5. **构建绿**:`cd frontend/app && npm run build` 通过。

## 3. 验收 / 验证设施

- **构建门槛**:`cd frontend/app && npm run build`(每个任务完成必跑,绿才算完成)。
- **视觉验收**:`npm run dev`(127.0.0.1:5173,前台 `/`、后台 `/console.html`)起服务,用 `e2e/*.mjs`(playwright-core)截图四端关键屏,人工对照 Kit。
- **流程走查**:首页→详情→下单→支付→取卡(卡密/知识/资源/权益四类型结果区)能走通,无报错。
- **后端回归**:本次不碰后端;收尾跑 `composer test` 确认仍全绿(未被波及)。

## 4. 非目标(本次不做)

- 不改后端 PHP / 数据库 / 业务逻辑 / 金额与卡密发放路径。
- 不新增功能页(门户已存在,不再造新 Kit 展示稿)。
- 不动商户换肤的其余预设主题(只确保默认=橙)。
- 不引入新依赖 / 不改构建工具链。
- 大屏 `BigScreen` 允许保留"数据可视化多色",但去掉蓝/靛/紫、收敛到橙+语义色(见 tasks U5,属设计判断,审时可调)。

## 5. 工作方式(RUN 阶段铁规矩)

- 在工作分支 `ui-orange-relaunch` 上做(不在 main 直接改、不主动 push)。
- 一个任务一个 commit,信息 `UI-Uxx: 简述`。
- 动手前先 explore 真实文件/行,**不臆造路径与行号**(审计给的行号仅参考,以实际为准;优先用"元素 + 旧 hex"定位)。
- 改动最小化,只动该任务相关。
- 打 `⚠` 的任务(删文件 / 改已提交文档定调)做到能安全做的部分后**停下问人**。
- 全部做完后整站起一遍、核心流程走通,再报交付。

## 6. 验收标准(整体可交付)

- 四端**同一套橙色设计语言**,无残留蓝紫;`grep` 不到旧蓝主色/旧蓝 fallback(语义色除外)。
- 商品卡、数据卡、表格、表单 饱满、对齐、不廉价;桌面+移动都成立。
- `npm run build` 全绿;`composer test` 全绿;dev 起站四端可访问、买家核心流程走通。
- 根目录无冗余设计系统副本;文档与现状(橙色)一致。
- `docs/DELIVERY-REPORT.md` 记录本次 UI 落地成果。
