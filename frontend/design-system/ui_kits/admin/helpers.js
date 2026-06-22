/* Kit-local console helpers (not bundled DS components): money formatting,
   day-over-day delta, and a tiny quick-action grid. window globals. */
function Money({ amount, strong, color }) {
  const n = Number(amount);
  const text = Number.isFinite(n) ? `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';
  return <span className="tnum" style={{ fontWeight: strong ? 800 : 600, color: color || 'inherit', whiteSpace: 'nowrap' }}>{text}</span>;
}
function Delta({ today, yesterday, money }) {
  const a = Number(today), b = Number(yesterday);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  const diff = a - b, up = diff > 0, down = diff < 0;
  const color = up ? 'var(--success-fg)' : down ? 'var(--danger-fg)' : 'var(--text-subtle)';
  const arrow = up ? '↑' : down ? '↓' : '→';
  const mag = Math.abs(diff);
  return <span style={{ color, fontWeight: 700, whiteSpace: 'nowrap' }}>{arrow} {money ? `¥${mag.toFixed(2)}` : mag}</span>;
}
function QuickGrid({ items, onGo }) {
  const TONE = {
    brand: ['var(--brand-active)', 'var(--brand-soft)'], secure: ['var(--secure-fg)', 'var(--secure-bg)'],
    success: ['var(--success-fg)', 'var(--success-bg)'], pending: ['var(--pending-fg)', 'var(--pending-bg)'],
    danger: ['var(--danger-fg)', 'var(--danger-bg)'], neutral: ['var(--text-body)', 'var(--surface-sunken)'],
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(98px, 1fr))', gap: 10 }}>
      {items.map((q) => {
        const Icon = window.Icons[q.icon] || window.Icons.Package;
        const [fg, bg] = TONE[q.tone] || TONE.brand;
        return (
          <button key={q.key} onClick={() => onGo && onGo(q.key)} title={q.label} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '14px 8px',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: '#fff', cursor: 'pointer', fontFamily: 'var(--font-sans)',
          }}>
            <span style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={20} color={fg} /></span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-body)', textAlign: 'center' }}>{q.label}</span>
          </button>
        );
      })}
    </div>
  );
}
Object.assign(window, { Money, Delta, QuickGrid });
