import React from 'react';

const CSS = `
.mk-badge{
  display:inline-flex; align-items:center; gap:5px; font-family:var(--font-sans);
  font-size:var(--text-xs); font-weight:var(--fw-bold); line-height:1;
  padding:5px 9px; border-radius:var(--radius-pill); border:1px solid transparent;
  white-space:nowrap; letter-spacing:var(--ls-snug);
}
.mk-badge--soft{ }
.mk-badge__dot{ width:6px; height:6px; border-radius:50%; background:currentColor; flex:none; }
.mk-badge svg{ width:13px; height:13px; }

.mk-badge--neutral{ color:var(--text-muted); background:var(--surface-sunken); border-color:var(--border); }
.mk-badge--brand{ color:var(--brand-active); background:var(--brand-soft); border-color:var(--brand-soft-border); }
.mk-badge--success{ color:var(--success-fg); background:var(--success-bg); border-color:var(--success-border); }
.mk-badge--pending{ color:var(--pending-fg); background:var(--pending-bg); border-color:var(--pending-border); }
.mk-badge--danger{ color:var(--danger-fg); background:var(--danger-bg); border-color:var(--danger-border); }
.mk-badge--secure{ color:var(--secure-fg); background:var(--secure-bg); border-color:var(--teal-50); }

/* solid */
.mk-badge--solid.mk-badge--brand{ color:#fff; background:var(--brand); border-color:transparent; }
.mk-badge--solid.mk-badge--success{ color:#fff; background:var(--success-solid); border-color:transparent; }
.mk-badge--solid.mk-badge--pending{ color:#fff; background:var(--pending-solid); border-color:transparent; }
.mk-badge--solid.mk-badge--danger{ color:#fff; background:var(--danger-solid); border-color:transparent; }
`;
if (typeof document !== 'undefined' && !document.getElementById('mk-badge-css')) {
  const s = document.createElement('style'); s.id = 'mk-badge-css'; s.textContent = CSS; document.head.appendChild(s);
}

export function Badge({
  children, variant = 'neutral', solid = false, dot = false, icon,
  className = '', ...rest
}) {
  return (
    <span
      className={[
        'mk-badge', `mk-badge--${variant}`, solid ? 'mk-badge--solid' : 'mk-badge--soft', className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {dot && <span className="mk-badge__dot" aria-hidden="true" />}
      {icon}
      {children}
    </span>
  );
}
