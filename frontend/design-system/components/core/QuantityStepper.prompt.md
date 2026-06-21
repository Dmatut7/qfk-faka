Quantity selector for the order page, clamped to available stock.

```jsx
const [q, setQ] = React.useState(1);
<QuantityStepper value={q} min={1} max={stock} onChange={setQ} />
```

Controlled. Props: `value`, `min`, `max` (set to stock), `size` (`sm|md`), `onChange(next)`.
