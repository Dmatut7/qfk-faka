import React from 'react';

/* Console panel — white card with an optional titled header (title +
   subtitle on the left, actions on the right) and a padded body. */
export function Panel({ title, subtitle, actions, children, padded = true, style, ...rest }) {
  return (
    <section style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', ...style }} {...rest}>
      {(title || actions) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ minWidth: 0 }}>
            {title && <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-strong)' }}>{title}</div>}
            {subtitle && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
          </div>
          {actions && <div style={{ display: 'flex', gap: 8, flex: 'none' }}>{actions}</div>}
        </div>
      )}
      <div style={padded ? { padding: 18 } : undefined}>{children}</div>
    </section>
  );
}
