---
name: miaoka-design
description: Use this skill to generate well-branded interfaces and assets for 秒卡 MiaoKa — a Taobao-style virtual-goods / card-key (发卡) platform spanning a buyer storefront, merchant console, and platform admin console. Either for production or throwaway prototypes/mocks. Contains design guidelines, colors, type, fonts, assets, and UI-kit components for prototyping.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files (`styles.css` + `tokens/` for foundations, `components/` for reusable primitives, `ui_kits/` for full-screen recreations, `guidelines/` for specimen cards).

Visual language is **淘宝商业风 (Taobao-commercial)**: warm orange brand (`--brand #FF5000`), vivid red prices (`--price-accent #FA2C19`), dense promo-badged image-led product cards on the buyer side; clean white, orange-accented, data-dense double-sidebar consoles on the back-office side.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view — link `styles.css` for tokens and load `_ds_bundle.js` to use components via `window.MiaoKa_b7a409`. If working on production code, copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without other guidance, ask what they want to build, ask a few questions, and act as an expert designer who outputs HTML artifacts _or_ production code depending on the need.
