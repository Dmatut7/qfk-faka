Selectable payment-method row for the payment page.

```jsx
const [m, setM] = React.useState('wechat');
<PaymentOption name="微信支付" desc="数亿用户的选择" tag="推荐" icon="💚"
  selected={m==='wechat'} onSelect={() => setM('wechat')} />
<PaymentOption name="支付宝" desc="安全便捷" icon="🅰️"
  selected={m==='alipay'} onSelect={() => setM('alipay')} />
```

Props: `name`, `desc`, `icon`, `tag`, `selected`, `onSelect`. Radio semantics — drive single-select from parent state.
