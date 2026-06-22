The signature back-office shell: icon rail + grouped text menu + breadcrumb top bar + main area, collapsing to a drawer under 860px. Selection is controlled.

```jsx
const NAV = [
  { group: '概览', icon: Icons.Zap, items: [{ key: 'stats', label: '数据概览', icon: Icons.Zap }] },
  { group: '商品', icon: Icons.Package, items: [
    { key: 'products', label: '商品管理', icon: Icons.Package },
    { key: 'cards', label: '卡密管理', icon: Icons.Lock },
  ] },
];
const [active, setActive] = React.useState('stats');
<ConsoleShell nav={NAV} active={active} onNavigate={setActive}
  brandTitle="秒卡 · 商户" brandSub="极客发卡" user="极客发卡" onLogout={logout}>
  {active === 'stats' && <Stats />}
  {active === 'products' && <Products />}
</ConsoleShell>
```

`nav` groups carry an `icon` (component, for the rail) and `items` each with `key`/`label`/`icon`. The main area auto-renders an H1 from the active item's label. Drives both the merchant and platform consoles — only the nav config differs.
