Money display with tabular figures and small currency symbol.

```jsx
<PriceTag amount={29.9} original={49} size="lg" />
<PriceTag amount={119.7} tone="neutral" size="md" />
```

Props: `amount` (number), `original` (struck-through), `currency` (default ¥), `size` (`sm|md|lg`), `tone` (`accent` red for buy price, `neutral` ink for totals).
