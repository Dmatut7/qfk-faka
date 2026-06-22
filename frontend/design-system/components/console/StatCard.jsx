import React from 'react';

/* Console stat card — KPI tile. Two variants:
   - default: white card, tinted icon chip, label, big number, sub line.
   - filled: orange gradient solid card for the hero KPI (e.g. 今日成交额). */
const TONE = {
  brand:   ['var(--brand-active)', 'var(--brand-soft)'],
  success: ['var(--success-fg)', 'var(--success-bg)'],
  pending: ['var(--pending-fg)', 'var(--pending-bg)'],
  secure:  ['var(--secure-fg)', 'var(--secure-bg)'],
  danger:  ['var(--danger-fg)', 'var(--danger-bg)'],
  neutral: ['var(--text-body)', 'var(--surface-sunken)'],
};

export function StatCard({ label, value, icon, tone = 'brand', sub, filled = false, style, ...rest }) {
  const [fg, bg] = TONE[tone] || TONE.brand;
  if (filled) {
    return (
      <div style={{ flex: '1 1 230px', minWidth: 210, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', padding: 18, color: '#fff', background: 'var(--brand-gradient)', ...style }} {...rest}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.94 }}>{label}</span>
          {icon && <span style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(255,255,255,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{icon}</span>}
        </div>
        <div style={{ marginTop: 12, fontSize: 25, fontWeight: 800, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
        {sub && <div style={{ fontSize: 12.5, marginTop: 5, opacity: 0.9 }}>{sub}</div>}
      </div>
    );
  }
  return (
    <div style={{ flex: '1 1 180px', minWidth: 160, background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: 18, ...style }} {...rest}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>
        {icon && <span style={{ width: 28, height: 28, borderRadius: 8, background: bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{icon}</span>}
        {label}
      </div>
      <div style={{ marginTop: 10, fontSize: 26, fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
      {sub && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
