Canonical order-status badge: pending 待支付 / paid 已支付·发货中 / delivered 已发货 / failed / refunded / closed.

```jsx
<OrderStatusBadge status="delivered" />
<OrderStatusBadge status="pending" />
```

Props: `status`, `solid`, `label` (override). Maps each state to the right color so status reads consistently across the app.
