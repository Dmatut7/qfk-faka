Console table with built-in loading / error / empty states. Wrap it in a Panel.

```jsx
<DataTable
  rowKey="orderNo"
  columns={[
    { key: 'orderNo', title: '订单号', render: r => <span className="ds-mono">{r.orderNo}</span> },
    { key: 'product', title: '商品' },
    { key: 'amount', title: '实付', align: 'right', render: r => <Money amount={r.amount} strong /> },
    { key: 'status', title: '状态', render: r => <Pill tone={r.tone}>{r.status}</Pill> },
  ]}
  rows={orders} loading={loading} error={error} onReload={reload} empty="暂无订单" />
```

Columns: `{ key, title, render?(row), align?, width? }`. Right-align amounts/counts. States are automatic — pass `loading`, `error`+`onReload`, or an empty `rows`.
