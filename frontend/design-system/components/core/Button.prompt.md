Primary CTA button — the main "do it" control for a screen (浏览→下单→付款→取卡).

```jsx
<Button variant="primary" size="lg" block iconRight={<span>→</span>}>立即购买</Button>
<Button variant="secondary">加入收藏</Button>
<Button variant="ghost" size="sm">取消</Button>
```

Variants: `primary` (single hero action, carries brand shadow), `secondary` (outlined blue), `neutral` (outlined gray), `ghost` (text only), `danger`, `success`. Sizes `sm | md | lg`. Props: `block`, `loading`, `iconLeft`, `iconRight`, `as="a"`. On mobile checkout, use `size="lg" block`.
