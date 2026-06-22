Small tinted status label for table cells and detail headers.

```jsx
<Pill tone="success" dot>已发货</Pill>
<Pill tone="pending">待支付</Pill>
<Pill tone="danger">已退款</Pill>
```

Tones: `neutral` `brand` `success` `pending` `danger` `secure`. `dot` adds a leading status dot. Canonical order-status mapping: 待支付→pending · 已支付·发货中→brand · 已发货→success · 已退款/已关闭→danger/neutral · 异常待人工→danger.
