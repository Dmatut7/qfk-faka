Labeled input for the buyer's email (to receive card keys) and order-lookup fields.

```jsx
<Input label="接收邮箱" required placeholder="you@example.com"
  hint="卡密将发送到此邮箱,请填写常用邮箱" icon={mailIcon} />
<Input label="订单号" error="未找到该订单,请核对后重试" />
```

Props: `label`, `hint`, `error` (red state, overrides hint), `required`, `icon` (leading). Passes through all native input attrs (`type`, `value`, `onChange`, `placeholder`).
