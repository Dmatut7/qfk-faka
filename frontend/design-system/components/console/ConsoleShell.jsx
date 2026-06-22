import React from 'react';
import { Button } from '../core/Button.jsx';

/* Console application shell — the signature back-office layout:
   a 60px icon rail (one button per nav group) + a 224px text menu (grouped
   items) + a 56px top bar (breadcrumb + user + logout) + the scrolling main
   area. Collapses to a hamburger drawer under 860px.

   nav = [{ group, icon: IconComp, items: [{ key, label, icon: IconComp }] }]
   IconComp is a component called as <IconComp size color />. */

function useIsNarrow(query = '(max-width:860px)') {
  const [narrow, setNarrow] = React.useState(() =>
    typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false);
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mql = window.matchMedia(query);
    const onChange = (e) => setNarrow(e.matches);
    setNarrow(mql.matches);
    mql.addEventListener ? mql.addEventListener('change', onChange) : mql.addListener(onChange);
    return () => { mql.removeEventListener ? mql.removeEventListener('change', onChange) : mql.removeListener(onChange); };
  }, [query]);
  return narrow;
}

function flatten(nav) { return nav.reduce((a, g) => a.concat(g.items), []); }

export function ConsoleShell({ nav, active, onNavigate, brandTitle = '秒卡 · 控制台', brandSub, user, onLogout, brandMark, children }) {
  const flat = flatten(nav);
  const activeItem = flat.find((n) => n.key === active);
  const isNarrow = useIsNarrow();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  React.useEffect(() => { if (!isNarrow) setDrawerOpen(false); }, [isNarrow]);
  const select = (key) => { onNavigate && onNavigate(key); if (isNarrow) setDrawerOpen(false); };

  const asideBase = { width: 224, flex: 'none', background: '#fff', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' };
  const asideStyle = isNarrow
    ? { ...asideBase, position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 40, transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform .22s ease', boxShadow: drawerOpen ? 'var(--shadow-lg)' : 'none' }
    : { ...asideBase, position: 'sticky', top: 0, height: '100vh' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-page)', fontFamily: 'var(--font-sans)' }}>
      {isNarrow && drawerOpen && <div onClick={() => setDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(17,20,24,.45)', zIndex: 35 }} />}

      {/* icon rail */}
      {!isNarrow && (
        <div style={{ width: 60, flex: 'none', background: '#fff', borderRight: '1px solid var(--border)', position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 14, gap: 4 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--brand-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            {brandMark || <span style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>秒</span>}
          </div>
          {nav.map((g) => {
            const Icon = g.icon;
            const on = g.items.some((it) => it.key === active);
            return (
              <button key={g.group} type="button" title={g.group} onClick={() => select(g.items[0].key)} style={{
                width: 46, height: 46, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                background: on ? 'var(--brand-soft)' : 'transparent', fontFamily: 'var(--font-sans)',
              }}>
                {Icon && <Icon size={18} color={on ? 'var(--brand)' : 'var(--text-muted)'} />}
                <span style={{ fontSize: 9, fontWeight: 700, color: on ? 'var(--brand-active)' : 'var(--text-subtle)' }}>{g.group.slice(0, 2)}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* text menu */}
      <aside style={asideStyle}>
        <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-strong)', letterSpacing: '-0.01em' }}>{brandTitle}</div>
          {brandSub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{brandSub}</div>}
        </div>
        <nav style={{ flex: 1, padding: 10, overflowY: 'auto' }}>
          {nav.map((g) => (
            <div key={g.group} style={{ marginBottom: 6 }}>
              <div style={{ padding: '8px 12px 4px', fontSize: 11, fontWeight: 700, letterSpacing: '.04em', color: 'var(--text-subtle)' }}>{g.group}</div>
              {g.items.map((item) => {
                const Icon = item.icon;
                const on = active === item.key;
                return (
                  <button key={item.key} onClick={() => select(item.key)} aria-current={on ? 'page' : undefined} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 2,
                    border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'var(--font-sans)', fontWeight: on ? 700 : 600, fontSize: 14,
                    background: on ? 'var(--brand-soft)' : 'transparent', color: on ? 'var(--brand-active)' : 'var(--text-body)',
                  }}>
                    {Icon && <Icon size={18} color={on ? 'var(--brand)' : 'var(--text-muted)'} />}{item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        {onLogout && (
          <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
            <Button variant="neutral" size="md" block onClick={onLogout}>退出登录</Button>
          </div>
        )}
      </aside>

      {/* content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, height: 56, flex: 'none', padding: isNarrow ? '0 14px' : '0 28px', background: '#fff', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, fontSize: 13.5 }}>
            {isNarrow && (
              <button type="button" aria-label="菜单" onClick={() => setDrawerOpen((v) => !v)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none', width: 36, height: 36, marginRight: 2, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: '#fff', cursor: 'pointer', color: 'var(--text-body)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
              </button>
            )}
            <span style={{ color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{brandTitle}</span>
            <span style={{ color: 'var(--text-subtle)' }}>›</span>
            <span style={{ color: 'var(--text-strong)', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeItem?.label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 'none' }}>
            {user && <span style={{ fontSize: 13.5, color: 'var(--text-body)', fontWeight: 600, whiteSpace: 'nowrap' }}>{user}</span>}
            {onLogout && <Button variant="ghost" size="sm" onClick={onLogout}>退出</Button>}
          </div>
        </header>
        <main style={{ flex: 1, minWidth: 0, padding: isNarrow ? '16px 14px' : '24px 28px', maxWidth: 1180 }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.02em', margin: '0 0 18px' }}>{activeItem?.label}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}
