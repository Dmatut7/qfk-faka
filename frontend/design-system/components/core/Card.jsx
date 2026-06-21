import React from 'react';

const CSS = `
.mk-card{
  background:var(--surface-card); border:1px solid var(--border);
  border-radius:var(--radius-lg); box-shadow:var(--shadow-sm);
  transition:transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out);
}
.mk-card--pad{ padding:var(--space-5); }
.mk-card--interactive{ cursor:pointer; }
.mk-card--interactive:hover{ transform:translateY(-2px); box-shadow:var(--shadow-md); border-color:var(--border-strong); }
.mk-card--interactive:active{ transform:translateY(0); }
.mk-card--flat{ box-shadow:none; }
.mk-card--raised{ box-shadow:var(--shadow-md); border-color:transparent; }
`;
if (typeof document !== 'undefined' && !document.getElementById('mk-card-css')) {
  const s = document.createElement('style'); s.id = 'mk-card-css'; s.textContent = CSS; document.head.appendChild(s);
}

export function Card({
  children, pad = true, interactive = false, elevation = 'sm',
  as = 'div', className = '', ...rest
}) {
  const Tag = as;
  return (
    <Tag
      className={[
        'mk-card', pad ? 'mk-card--pad' : '',
        interactive ? 'mk-card--interactive' : '',
        elevation === 'flat' ? 'mk-card--flat' : '',
        elevation === 'raised' ? 'mk-card--raised' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </Tag>
  );
}
