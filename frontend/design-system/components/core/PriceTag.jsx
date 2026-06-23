import React from 'react';

const CSS = `
.mk-price{ display:inline-flex; align-items:baseline; gap:7px; font-family:var(--font-sans); }
.mk-price__main{ display:inline-flex; align-items:baseline; color:var(--price-accent); font-weight:var(--fw-extra); letter-spacing:var(--ls-snug); font-variant-numeric:tabular-nums; line-height:1; }
.mk-price__sym{ font-size:.6em; font-weight:var(--fw-bold); margin-right:1px; align-self:flex-start; margin-top:.16em; }
.mk-price__dec{ font-size:.66em; font-weight:var(--fw-extra); }
.mk-price--neutral .mk-price__main{ color:var(--price-color); }
.mk-price__orig{ color:var(--text-subtle); text-decoration:line-through; font-weight:var(--fw-medium); font-variant-numeric:tabular-nums; }
.mk-price__label{ font-size:var(--text-xs); color:var(--text-muted); font-weight:var(--fw-semibold); align-self:flex-end; margin-bottom:.12em; }
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

function parts(n) {
  // 后端金额多以字符串(DECIMAL '29.9' / '45')下发,也需补足两位小数,避免显示成 ¥29.9 / ¥45
  if (typeof n === 'string') {
    const num = parseFloat(n);
    if (Number.isFinite(num)) n = num;
    else return { int: n, dec: '' };
  }
  if (typeof n !== 'number') return { int: String(n), dec: '' };
  if (!Number.isFinite(n)) return { int: '0', dec: '.00' };
  const s = n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const i = s.lastIndexOf('.');
  return i === -1 ? { int: s, dec: '' } : { int: s.slice(0, i), dec: s.slice(i) };
}

export function PriceTag({
  amount, original, currency = '¥', size = 'md', tone = 'accent',
  label, splitDecimals = true, className = '', ...rest
}) {
  const { int, dec } = parts(amount);
  const o = original != null ? parts(original) : null;
  return (
    <span className={['mk-price', `mk-price--${size}`, tone === 'neutral' ? 'mk-price--neutral' : '', className].filter(Boolean).join(' ')} {...rest}>
      <span className="mk-price__main">
        <span className="mk-price__sym">{currency}</span>{int}{dec && (splitDecimals ? <span className="mk-price__dec">{dec}</span> : dec)}
      </span>
      {label && <span className="mk-price__label">{label}</span>}
      {o && <span className="mk-price__orig">{currency}{o.int}{o.dec}</span>}
    </span>
  );
}
