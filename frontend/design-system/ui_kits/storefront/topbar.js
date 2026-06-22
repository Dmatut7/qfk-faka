/* Top app bar — logo, shop name, and a 取卡 (order lookup) entry. */
function TopBar({ onHome, onLookup, back, onBack, title }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 20, background: 'rgba(255,255,255,0.86)',
      backdropFilter: 'saturate(180%) blur(12px)', WebkitBackdropFilter: 'saturate(180%) blur(12px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        maxWidth: 'var(--container-page)', margin: '0 auto', height: 60, padding: '0 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {back ? (
            <button onClick={onBack} aria-label="返回" style={{
              width: 38, height: 38, marginLeft: -6, border: 'none', background: 'transparent',
              borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-strong)',
            }}><Icons.ChevronLeft size={24} /></button>
          ) : (
            <img src="../../assets/logo-mark.svg" width="32" height="32" alt="" style={{ cursor: 'pointer' }} onClick={onHome} />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, minWidth: 0 }}>
            <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-strong)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {title || window.MK_SHOP.name}
            </span>
            {!title && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{window.MK_SHOP.intro}</span>}
          </div>
        </div>
        <button onClick={onLookup} style={{
          display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 14px',
          border: '1.5px solid var(--border-strong)', background: '#fff', borderRadius: 'var(--radius-pill)',
          fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13, color: 'var(--text-strong)', cursor: 'pointer',
          whiteSpace: 'nowrap', flex: 'none',
        }}>
          <Icons.Package size={16} color="var(--brand)" />取卡 / 查单
        </button>
      </div>
    </header>
  );
}
window.TopBar = TopBar;
