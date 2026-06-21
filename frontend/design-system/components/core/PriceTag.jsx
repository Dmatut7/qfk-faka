import React from 'react';

const CSS = `
.mk-price{ display:inline-flex; align-items:baseline; gap:8px; font-family:var(--font-sans); }
.mk-price__main{ display:inline-flex; align-items:baseline; color:var(--price-accent); font-weight:var(--fw-extra); letter-spacing:var(--ls-snug); font-variant-numeric:tabular-nums; }
.mk-price__sym{ font-size:.62em; font-weight:var(--fw-bold); margin-right:1px; align-self:flex-start; margin-top:.18em; }
.mk-price--neutral .mk-price__main{ color:var(--price-color); }
.mk-price__orig{ color:var(--text-subtle); text-decoration:line-through; font-weight:var(--fw-medium); font-variant-numeric:tabular-nums; }
.mk-price--sm .mk-price__main{ font-size:var(--text-lg); }
.mk-price--md .mk-price__main{ font-size:var(--text-2xl); }
.mk-price--lg .mk-price__main{ font-size:var(--text-4xl); }
.mk-price--sm .mk-price__orig{ font-size:var(--text-xs); }
.mk-price--md .mk-price__orig{ font-size:var(--text-sm); }
.mk-price--lg .mk-price__orig{ font-size:var(--text-md); }
`;
if (typeof document !== 'undefined' && !document.getElementById('mk-price-css')) {
  const s = document.createElement('style'); s.id = 'mk-price-css'; s.textContent = CSS; document.head.appendChild(s);
}

function fmt(n) {
  if (typeof n !== 'number') return n;
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PriceTag({
  amount, original, currency = '¥', size = 'md', tone = 'accent',
  className = '', ...rest
}) {
  return (
    <span className={['mk-price', `mk-price--${size}`, tone === 'neutral' ? 'mk-price--neutral' : '', className].filter(Boolean).join(' ')} {...rest}>
      <span className="mk-price__main">
        <span className="mk-price__sym">{currency}</span>{fmt(amount)}
      </span>
      {original != null && <span className="mk-price__orig">{currency}{fmt(original)}</span>}
    </span>
  );
}
