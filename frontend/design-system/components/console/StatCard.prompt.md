KPI tile for console dashboards. Lay several in a `flex-wrap` row.

```jsx
<StatCard filled label="今日成交额" icon={<Icons.Zap size={18} color="#fff" />}
  value="¥12,840.00" sub="昨日 ¥9,610.00 · 累计 ¥386,200.00" />
<StatCard label="今日订单" tone="success" icon={<Icons.Package size={16} />}
  value={128} sub={<>昨日 96 <Delta today={128} yesterday={96} /></>} />
```

Props: `label`, `value`, `icon` (node), `tone` (default white card tint), `sub`, `filled` (solid orange-gradient — use for the ONE hero KPI). Reserve `filled` for the most important number on a board; everything else is a white card.
