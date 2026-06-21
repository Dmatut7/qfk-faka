The delivered card secret with one-tap copy — the most important component on the platform. Never reveals the code when `locked`.

```jsx
{/* paid / delivered */}
<CardKey index={1} label="Netflix 卡密" code="NFLX-7K2M-9QZP-44XB" onCopy={t => toast('已复制')} />
{/* unpaid — code stays hidden */}
<CardKey locked label="卡密" lockedHint="支付完成后自动显示" />
```

Props: `code`, `label`, `index` (pill for multi-qty), `locked` (security state — code is not rendered at all), `lockedHint`, `onCopy(text)`. Copy button shows a "已复制" confirmation for 1.8s.
