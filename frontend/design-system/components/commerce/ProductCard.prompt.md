Storefront product tile composing Card + PriceTag + Badge.

```jsx
<ProductCard name="Netflix 高级会员 1个月" desc="独享车位 · 自动发货 · 秒到账"
  price={29.9} original={49} stock={128} sold={2304} thumb="🎬"
  onClick={() => goDetail(id)} />
```

Props: `name`, `desc`, `price`, `original`, `stock` (0 → 缺货 + dimmed, non-clickable), `thumb`, `sold`, `badge` (override), `onClick`. Use in a responsive grid (1 col mobile, 2–3 desktop).
