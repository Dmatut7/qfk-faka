# 秒卡 MiaoKa · 发卡平台设计系统(淘宝商业风)

A four-surface design system for **秒卡 MiaoKa** — a virtual-goods / card-key auto-delivery platform (虚拟商品自动发货平台 · 发卡系统). Merchants open shops and sell digital goods; buyers order, pay, and are **auto-delivered** card secrets (卡密), knowledge articles (知识), resource downloads (资源), or entitlement codes (权益). The visual language is **淘宝商业风 (Taobao-commercial)**: warm orange brand, vivid red prices, dense promo-badged product cards on the buyer side; clean white, orange-accented, data-dense consoles on the back-office side.

> **Brand:** 秒卡 MiaoKa — "instant card." Tagline *虚拟商品 · 自动发货 · 即时到账.* The sample shop in the storefront kit is a fictional **极客发卡 · GeekCards**.

## Four surfaces
1. **买家商城 (storefront, C-end)** — responsive, mobile-first. Browse → detail/order → pay → 取卡. Taobao-style: image-led product grid, promo badges, red prices, bottom tab bar.
2. **门户官网 (portal)** — platform marketing site (not yet kitted — see TODO).
3. **商户后台 (merchant console, B-end)** — sellers manage their shop. Double-sidebar desktop + mobile drawer.
4. **平台运营后台 (admin console)** — platform operators manage everything. Data-dense desktop.

---

## Sources

This system was **rebranded from an existing trust-blue implementation to Taobao-commercial orange** at the user's direction (reference screenshot: a Taobao shop product-list page, `uploads/70e74e548361e3338e2996123bf02ca2.jpg`).

- **Codebase (read-only, mounted):** `qfk/` — a ThinkPHP backend + React 18/Vite frontend implementing all four ends (~30 screens).
  - `qfk/docs/design-brief.md` — the full UI/UX brief incl. exact token baseline, component specs, page list, state machines.
  - `qfk/frontend/design-system/` — the **prior** (trust-blue) design system this one is built on: tokens, core + commerce components, storefront UI kit, guideline cards. Copied in and reskinned.
  - `qfk/frontend/app/src/` — the real four-end product code. `screens/` = buyer storefront + portal; `console/merchant/*` + `console/admin/*` = the two back-office consoles; `console/ui.jsx` = console primitives (Panel, StatCard, DataTable, Pill, Modal…). The console UI kits + `components/console/*` are faithful, cosmetic recreations of these.
- **Competitive benchmark named in the brief:** 鲸商城PRO (`fkdemo.jingsoft.com`) — for information architecture only.

---

## Index / Manifest

**Root**
- `styles.css` — the single entry consumers link (`@import` lines only).
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `fonts.css`, `base.css`.
- `assets/` — `logo-mark.svg` (orange on white), `logo-mark-light.svg` (white/orange on color).
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing).
- `SKILL.md` — Agent-Skill wrapper for use in Claude Code.

**Components** (`components/`, namespace `window.MiaoKa_b7a409`)
- `core/` — `Button` (incl. `buy`/`cart` gradient CTAs), `Input`, `Badge`, `Card`, `PriceTag` (split-decimal red price), `QuantityStepper`.
- `commerce/` — `ProductCard` (image-led Taobao tile), `ProductListItem`, `CardKey`, `OrderStatusBadge`, `PaymentOption`, `CheckoutSteps`.
- `console/` — `ConsoleShell` (double-sidebar back-office layout), `StatCard`, `Panel`, `DataTable`, `Pill`.

**UI Kits** (`ui_kits/`)
- `storefront/` — buyer front, interactive: 店铺首页 → 商品详情/下单 → 支付 → 订单查询/取卡. Entry `index.html`.
- `merchant/` — 商户后台, interactive: 数据概览 · 商品管理 · 卡密管理 · 订单管理 · 钱包提现. Entry `index.html`.
- `admin/` — 平台运营后台, interactive: 仪表盘 · 商户审核 · 跨商户订单(含退款) · 投诉仲裁. Entry `index.html`.

---

## CONTENT FUNDAMENTALS

**Voice:** confident, plain, reassuring — but in a **commercial, promotional** register on the buyer side (Taobao energy), and **calm and precise** on the consoles. Speak to the buyer as **你/您** (lean 您 at payment). Every buyer-facing line either *removes hesitation* or *drives the deal*.

- **Tone:** concrete promises over hype on trust ("自动发货 · 秒到账"), but lean into deal language on merchandising ("超级立减", "补贴后", "首单价", "限时", "已售 2304"). No exclamation marks; urgency comes from badges and price, not punctuation.
- **Casing & punctuation:** Chinese primary; Latin/numbers in Manrope. Chain short phrases with a middle dot ` · `.
- **Trust vocabulary (reused verbatim):** 平台担保交易 · 自动发货 · 秒到账 · 非人为问题包补 · 假一赔十 · 7×24 在线客服 · 保证金.
- **Promo vocabulary (buyer side):** 超级立减 · 政府补贴 · 补贴后 · 首单价 · 限时 · 立减N% · 已售N · 仅剩N.
- **Status words are canonical** (don't paraphrase): 有货 / 缺货 / 已售罄 / 待支付 / 已支付·发货中 / 已发货 / 已退款 / 已关闭 / 异常待人工.
- **Money:** `¥` + two decimals, **tabular** figures; integer big, decimals smaller (Taobao). Show savings via a struck original price. Price is the loudest thing on a product card.
- **Card secrets (卡密):** the hero noun. Before payment: "支付完成后自动显示"; after: "卡密已发放,请尽快复制并妥善保管". Back-office lists are **脱敏** (`NFLX-8K2D-···-9F1A`).
- **Emoji:** used **only** as product/type thumbnails (🎬 🤖 🎮 📚 📦 👑) where no real art exists — never in body copy. Replace with real product art in production.
- **Console copy:** greeting cards ("您好,极客发卡 👋 · 又是元气满满的一天"); muted labels; destructive actions (退款/冻结/作废) always confirm.

---

## VISUAL FOUNDATIONS

**Overall vibe:** a busy, trustworthy Chinese e-commerce shop on the buyer side; a clean fintech-grade back office on the console side. Both float white surfaces on a neutral off-white page (`--bg-page #F5F5F6`).

- **Color:** **淘宝橙 `--brand #FF5000`** for primary actions, active states, brand surfaces. Warm-neutral grays for text/borders/backgrounds. **Price is a vivid red `--price-accent #FA2C19`** — always red, always loud. Semantics: green = 有货/已支付/政府补贴, amber = 待支付/立减, red = 缺货/失败/价格, teal = 担保/加密. **No purple, no rainbow gradients.**
- **Gradients (used sparingly, only on CTAs & hero):** `--cta-gradient-buy` (red→orange) for 立即购买; `--cta-gradient-cart` (gold→orange) for 加入购物车; `--brand-gradient` for the store avatar, the filled hero StatCard, the console icon-rail mark. Backgrounds are otherwise flat fills.
- **Type:** `Manrope` (Latin/UI) + `Noto Sans SC` (CJK) + `JetBrains Mono` (card keys, order ids). Headings bold/extrabold, tight tracking (`-0.02em`); body 15px / 1.55. Money & ids always monospace-tabular for unambiguous copying.
- **Spacing:** 4px grid. Product cards pad 10–11px (dense, Taobao); console cards/panels pad 18px; screen gutters 16px. Buyer grid: 2 columns mobile, auto-fill ≥168px desktop. Page max-width 1120; consoles cap main at 1180.
- **Corner radii:** medium-to-large but **product cards are tighter (`--radius-md 12`)** for a packed grid feel; panels/cards `--radius-lg 16`; pills/badges `999`; promo mini-badges 3–4px.
- **Cards:** white, `1px` border, `--shadow-xs/sm`. Buyer product cards are **image-led** — full-bleed 1:1 media (emoji + warm gradient placeholder when no art), type badge top-left, one corner badge top-right (限时/仅剩N/已售罄), promo-prefixed 2-line title, red price + label, subsidy/promo chips, sold + round gradient cart button. Hover lifts `-2px` to `--shadow-md`. No colored left-border accents.
- **Shadows:** soft, low-opacity (`rgba(17,20,24,.04–.12)`). Primary/buy buttons carry a warm brand shadow (`--shadow-brand`, orange-tinted) so the CTA pops. Focus = 3px orange-tinted ring.
- **Borders:** `1px` separators/cards, `1.5px` interactive controls (inputs, buttons, selectable chips/rows).
- **Buttons:** primary = solid orange + brand shadow; `buy` = red→orange gradient; `cart` = gold→orange gradient; secondary = white + orange outline; neutral = white + gray outline; ghost = text; danger/success solids. Heights 36/44/52 — min 44 on mobile. Press = `translateY(1px) scale(.992)`.
- **Motion:** quick & calm. `--ease-out (cubic-bezier(.22,1,.36,1))`, 120–280ms. Fades, small lifts, gradient brightness on hover. No bounces, no infinite loops. Copy confirms with a 1.8s "已复制"; toasts auto-dismiss ~1.8s.
- **Transparency & blur:** sticky top bar, sticky sort row, and bottom tab bar use `backdrop-filter: blur` over ~90% white so content scrolls under cleanly.
- **Consoles (signature pattern):** **double sidebar** = 60px icon rail (one button per nav group, active group = orange-soft) + 224px grouped text menu (active item = orange-soft + orange text). 56px top bar with breadcrumb + user + 退出. Collapses to hamburger drawer < 860px. KPIs use white StatCards with one **filled orange-gradient hero card** (今日成交额). Tables are flush in Panels with muted headers, hairline rows, orange-soft row hover. Status via `Pill`.
- **Trust scaffolding (buyer side):** announcement bar, store header (cover + avatar + 已认证 + 三联统计 + trust chips), 4 sales-type cards, and the **CardKey** payoff — locked/blurred before payment, monospace + one-tap copy after.

---

## ICONOGRAPHY

- **System:** [Lucide](https://lucide.dev) — clean 2px-stroke, round-cap line icons. Match the calm, modern tone.
- **Implementation:** each kit inlines the needed Lucide glyph paths as tiny components in `Icons.jsx` (`<Icons.ShieldCheck size={18} />`) so kits are offline-safe. The console kits use a superset (adds AlertTriangle, Inbox, Megaphone, QrCode, Wallet, Tag, Plus…). In production swap to `lucide-react` — keep stroke 2, round caps.
- **Stroke vs fill:** stroke only. Never mix filled icon sets.
- **Emoji:** product/type thumbnails only (see Content). Not an icon system.
- **No hand-drawn SVG illustration.** The only bespoke SVG is the logo mark (`assets/logo-mark.svg`): a rounded card + lightning bolt = "card + instant," now orange.

---

## ⚠️ Substitutions & open questions (please confirm)

1. **Fonts** — no brand fonts supplied; substituted **Manrope / Noto Sans SC / JetBrains Mono** from Google Fonts (`@import` in `tokens/fonts.css`). For production, **self-host** and replace with local `@font-face`. The compiler currently reports 0 `@font-face` rules because fonts load via `@import` — switch to `@font-face` if you want them shipped as binaries.
2. **Icons** — substituted **Lucide**. Confirm or name your preferred set (阿里图标/iconfont?).
3. **门户官网 (portal)** — **not yet built as a UI kit.** The codebase has `screens/Portal.jsx` & `Articles.jsx`; say the word and I'll add a portal kit (Hero + 数据卡 + 入口宫格 + 资讯列表).
4. **Color intensity** — I went full Taobao orange on the buyer side and kept consoles clean white + orange accent (matching real merchant backends). Want the consoles louder, or the storefront calmer? Easy to retune.
5. **Promo density** — buyer cards carry the full Taobao kit (超级立减 / 政府补贴 / 补贴后 / 已售 / 限时). Dial up or down per your real promo model.
