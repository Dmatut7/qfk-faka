Image-led Taobao-style product tile composing PriceTag. Use in a 2-col mobile / 3–5-col desktop grid.

```jsx
<ProductCard
  name="Netflix 高级会员 · 1个月" subtitle="本店流媒体热销第1名"
  price={29.9} original={49} priceLabel="补贴后"
  stock={128} sold={2304} thumb="🎬" category="流媒体会员"
  typeLabel="卡密" promo="超级立减"
  tags={[{ text: '平台担保', tone: 'subsidy' }, { text: '立减20%', tone: 'promo' }]}
  onCart={() => addToCart(id)} onClick={() => goDetail(id)} />
```

Key props: `name`, `subtitle`, `price`, `original`, `priceLabel`, `stock` (0 → 已售罄 + dimmed; ≤5 → 仅剩 N corner), `image`/`thumb`, `category`, `typeLabel`, `promo` (red mini-badge + 限时 corner), `tags` (tone `subsidy` green-fill / `promo` orange-outline), `sold`, `onCart`, `onClick`.
