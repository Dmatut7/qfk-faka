import React from 'react';

/* Status pill — small rounded label carrying a semantic tone. Used for order
   states, audit states, risk levels across the consoles. */
const TONE = {
  neutral: ['var(--text-body)', 'var(--surface-sunken)', 'var(--border)'],
  brand:   ['var(--brand-active)', 'var(--brand-soft)', 'var(--brand-soft-border)'],
  success: ['var(--success-fg)', 'var(--success-bg)', 'var(--success-border)'],
  pending: ['var(--pending-fg)', 'var(--pending-bg)', 'var(--pending-border)'],
  danger:  ['var(--danger-fg)', 'var(--danger-bg)', 'var(--danger-border)'],
  secure:  ['var(--secure-fg)', 'var(--secure-bg)', 'var(--teal-50)'],
};

export function Pill({ tone = 'neutral', dot = false, children, style, ...rest }) {
  const [fg, bg, bd] = TONE[tone] || TONE.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 'var(--radius-pill)',
      background: bg, color: fg, border: `1px solid ${bd}`, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', ...style,
    }} {...rest}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flex: 'none' }} />}
      {children}
    </span>
  );
}
