Marketplace-style horizontal product row (thumbnail + name + price + category + date). Use for the storefront listing on mobile; pair with ProductCard for grid views.

```jsx
<ProductListItem name="CRMChat 客服系统" desc="开源 · 一键部署"
  price={20} category="源码" date="06-21" stock={12} thumb="📦"
  onClick={() => goDetail(id)} />
```

Props: `name`, `desc`, `price`, `original`, `stock` (0 → 缺货 + dimmed), `thumb`, `category`, `date`, `onClick`. Render in a single-column stack on mobile, or `auto-fill minmax(340px,1fr)` grid on desktop.
