# 秒卡 MiaoKa · 发卡平台买家前台 设计系统

A design system for the **buyer-facing storefront** of a virtual-goods / card-key auto-delivery platform (发卡平台买家前台). Buyers browse digital products, place an order, pay, and instantly receive card secrets (卡密). The whole system is built to feel **modern, clean, and trustworthy** — because the #1 buyer fear in virtual transactions is being scammed.

> **Brand:** 秒卡 MiaoKa — "instant card." Tagline: *虚拟商品 · 自动发货 · 即时到账.*
> The sample storefront in the UI kit is a fictional shop, **极客发卡 · GeekCards**, built on this system.

**Sources:** None provided — this is a from-scratch system. No codebase, Figma, or brand assets were attached; the visual language, naming, logo, and copy were all authored here. Fonts and icons are substitutions from open libraries (see flags below).

---

## Index / Manifest

**Root**
- `styles.css` — the single entry point consumers link. `@import`s only.
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `fonts.css`, `base.css`.
- `assets/` — `logo-mark.svg` (on color), `logo-mark-light.svg` (on dark/white).
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Brand).
- `SKILL.md` — Agent Skill wrapper for use in Claude Code.

**Components** (`components/`, namespace `window.MiaoKa_cadc89`)
- `core/` — `Button`, `Input`, `Badge`, `Card`, `PriceTag`, `QuantityStepper`.
- `commerce/` — `ProductCard`, `ProductListItem`, `CardKey`, `OrderStatusBadge`, `PaymentOption`, `CheckoutSteps`.

**UI Kits** (`ui_kits/`)
- `storefront/` — the full interactive buyer front: 店铺首页 → 商品详情/下单 → 支付 → 订单查询/取卡. Entry `index.html`.

---

## CONTENT FUNDAMENTALS

**Voice:** confident, plain, reassuring. We speak to the buyer as **你/您** (lean 您 at trust-critical moments like payment), and refer to the platform as **平台/我们** sparingly. The goal of every line is to **remove hesitation** and **prove reliability**.

- **Tone:** direct and concrete, never salesy-hype. Prefer verifiable promises over adjectives: "自动发货 · 秒到账" beats "超级快". 
- **Casing & punctuation:** Chinese primary; Latin/numbers in Manrope. Use a middle dot ` · ` to chain short trust phrases ("官方授权 · 自动发货 · 7×24 秒到账"). Avoid exclamation marks; trust comes from calm, not shouting.
- **Trust language is a vocabulary, reused verbatim:** 平台担保交易 · 自动发货 · 秒到账 · 非人为问题包补 · 假一赔十 · 7×24 在线客服 · 持牌第三方加密通道.
- **Status words are canonical** (don't paraphrase): 有货 / 缺货 / 待支付 / 已支付·发货中 / 已发货 / 已退款 / 已关闭.
- **Money:** always `¥` + two decimals, tabular figures. Show savings as "省 ¥20" and original price struck through.
- **Card secrets (卡密):** the hero noun. Before payment we promise "支付完成后自动显示"; after, we say "卡密已发放" and nudge "请尽快复制并妥善保管".
- **Emoji:** used **only** as lightweight product/payment thumbnails (🎬 🤖 🎮 💚 🅰️) where no real art exists — never in body copy or as decoration. Replace with real product art in production.
- **Examples:**
  - CTA: `立即购买` / `确认支付 ¥29.90` / `查询订单` / `去支付`
  - Reassurance: `平台担保 · 付款后卡密即时发放,假一赔十`
  - Empty/locked: `订单待支付,完成付款后卡密将在此自动显示`

---

## VISUAL FOUNDATIONS

**Overall vibe:** a clean fintech-grade storefront. White surfaces float on a cool off-white page (`--bg-page #F6F8FB`); soft low-spread shadows and generous radii make everything feel safe to tap. Nothing is loud — credibility comes from order, consistency, and breathing room.

- **Color:** trust-blue primary (`--brand #2F6BFF`) for all primary actions and active states. Cool **slate** neutrals for text/borders/backgrounds. Semantic colors carry meaning literally: **green** = 有货/已支付/已发货, **amber** = 待支付, **red** = 缺货/失败, **teal** = secure/担保/加密. Price uses a warm red accent (`#E5484D`) to draw the eye. No purple, no rainbow gradients.
- **Backgrounds:** flat fills. The only gradient is a barely-there white→page wash behind the home hero. No textures, no patterns, no hero photography in the system itself (product thumbnails are the imagery).
- **Type:** `Manrope` (Latin/UI) + `Noto Sans SC` (CJK) + `JetBrains Mono` (card keys, order numbers). Headings are bold/extrabold with tight tracking (`-0.02em`); body is 15px at 1.55. Card secrets and IDs are always monospace for unambiguous reading & copying.
- **Spacing:** 4px grid. Cards pad 18–20px; screen gutters 16px; sections separated by 16–22px. Mobile-first — content lives in a centered max-width column (page 1120, narrow forms 560).
- **Corner radii:** medium-to-large. Inputs/buttons `12px`, cards `16px`, pills/badges `999px`. Friendly, not sharp.
- **Cards:** white, `1px` slate border, `--shadow-sm`. Interactive cards lift `-2px` with `--shadow-md` on hover; press returns to rest. No colored left-border accents.
- **Shadows:** soft and low-opacity (`rgba(18,27,42,.04–.12)`). Primary buttons carry a colored brand shadow (`--shadow-brand`) so the main CTA visibly "pops". Focus is a 3px brand-tinted ring.
- **Borders:** `1px` for separators/cards, `1.5px` for interactive controls (inputs, buttons, selectable rows) so tap targets read as tappable.
- **Buttons:** primary = solid blue + brand shadow; secondary = white w/ blue outline; neutral = white w/ gray outline; ghost = text; plus success/danger. Heights 36/44/52px — min 44px on mobile. Press state = `translateY(1px) scale(.992)`.
- **Motion:** quick and calm. `--ease-out` (cubic-bezier(.22,1,.36,1)), 120–280ms. Fades and small lifts only — no bounces, no infinite loops. Copy buttons confirm with a 1.8s "已复制" check; payment shows a brief spinner before delivery.
- **Hover/press:** hover = subtle bg tint or `-2px` lift; press = slight shrink/translate. Disabled = 50% opacity, no transform.
- **Transparency & blur:** used only for the sticky top bar and sticky buy/pay bars (`backdrop-filter: blur(12px)` over 86–92% white) so content scrolls under them cleanly.
- **Trust scaffolding (signature motif):** a trust band of icon+label chips under the shop header (担保交易 · 自动发货 · 包补 · 客服) plus inline reassurance lines near every CTA, and a 4-step progress rail (选购→下单→付款→取卡). The **CardKey** block is the emotional payoff — locked & blurred before payment, revealed monospace with one-tap copy after.

---

## ICONOGRAPHY

- **System:** [Lucide](https://lucide.dev) — clean 2px-stroke, round-cap line icons. They match the calm, modern, trustworthy tone. Used for trust signals (ShieldCheck, Zap, RefreshCw, Headset, Lock), navigation (ChevronLeft/Right, Search), and actions (Copy, Check, Mail, Package, Clock).
- **Implementation:** `ui_kits/storefront/Icons.jsx` inlines the needed Lucide glyph paths as tiny React components (`<Icons.ShieldCheck size={18} />`) so the kit is offline-safe. In production you can swap to the `lucide-react` package or the CDN — keep stroke width 2 and round caps.
- **Stroke vs fill:** stroke only. Never mix filled icon sets.
- **Emoji:** used **only** as placeholder product & payment thumbnails (see Content). Not an icon system — replace with real brand/product art in production.
- **No hand-drawn SVG illustration.** The only bespoke SVG is the logo mark (`assets/logo-mark.svg`): a rounded card with a lightning bolt = "card + instant."

---

## ⚠️ Substitutions & open questions (please confirm)

1. **Fonts** — no brand fonts were supplied, so I substituted **Manrope / Noto Sans SC / JetBrains Mono** from Google Fonts (loaded via `@import` in `tokens/fonts.css`). For production, **self-host** these and replace the import with local `@font-face`. Want a different type pairing?
2. **Icons** — substituted **Lucide**. Confirm or name your preferred set.
3. **Brand name & logo** — I invented **秒卡 MiaoKa** and a card+bolt mark. Swap in your real shop name/logo any time.
4. **Colors** — trust-blue primary chosen for credibility. Happy to retune toward teal/green or a warmer palette if you prefer.
