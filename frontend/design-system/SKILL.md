---
name: miaoka-design
description: Use this skill to generate well-branded interfaces and assets for 秒卡 MiaoKa, a virtual-goods / card-key auto-delivery buyer storefront (发卡平台买家前台), either for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping a clean, trustworthy digital-goods shop.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

Key files:
- `styles.css` — link this once; it pulls in all tokens (colors, type, spacing, fonts).
- `tokens/` — CSS custom properties. Use `--brand`, `--text-strong`, `--surface-card`, semantic state vars (`--success-*`, `--pending-*`, `--danger-*`, `--secure-*`).
- `components/core/` + `components/commerce/` — React primitives (`Button`, `Input`, `Badge`, `Card`, `PriceTag`, `QuantityStepper`, `ProductCard`, `CardKey`, `OrderStatusBadge`, `PaymentOption`, `CheckoutSteps`). Each has a `.prompt.md` with usage.
- `ui_kits/storefront/` — full interactive buyer flow (浏览 → 下单 → 付款 → 取卡) to copy from.

Design principles: clean, mobile-first, trustworthy. Trust-blue primary, soft shadows, generous radii, monospace card secrets with one-tap copy. Canonical status vocabulary (有货/缺货/待支付/已支付/已发货). Never reveal 卡密 before payment. See `readme.md` → VISUAL FOUNDATIONS, CONTENT FUNDAMENTALS, ICONOGRAPHY.
