import React from 'react';
import { Badge } from '../core/Badge.jsx';
import { PriceTag } from '../core/PriceTag.jsx';

const CSS = `
.mk-row{
  display:flex; gap:14px; width:100%; text-align:left; padding:14px; align-items:stretch;
  background:var(--surface-card); border:1px solid var(--border); border-radius:var(--radius-lg);
  box-shadow:var(--shadow-sm); cursor:pointer; font-family:var(--font-sans);
  transition:transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out);
  -webkit-tap-highlight-color:transparent;
}
.mk-row:hover{ transform:translateY(-2px); box-shadow:var(--shadow-md); border-color:var(--border-strong); }
.mk-row:active{ transform:translateY(0); }
.mk-row__thumb{ width:88px; height:88px; flex:none; border-radius:var(--radius-md); background:var(--brand-soft); display:flex; align-items:center; justify-content:center; font-size:40px; overflow:hidden; }
.mk-row__thumb img{ width:100%; height:100%; object-fit:cover; }
.mk-row__main{ flex:1; min-width:0; display:flex; flex-direction:column; }
.mk-row__name{ font-size:var(--text-md); font-weight:var(--fw-bold); color:var(--text-strong); line-height:var(--lh-snug); letter-spacing:var(--ls-snug); display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden; }
.mk-row__desc{ font-size:var(--text-sm); color:var(--text-muted); margin-top:4px; line-height:var(--lh-snug); display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden; }
.mk-row__price{ margin-top:auto; padding-top:8px; }
.mk-row__meta{ display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:8px; }
.mk-row__cat{ font-size:var(--text-xs); color:var(--text-muted); background:var(--surface-sunken); padding:3px 9px; border-radius:var(--radius-pill); font-weight:var(--fw-semibold); }
.mk-row__date{ font-size:var(--text-xs); color:var(--text-subtle); font-variant-numeric:tabular-nums; }
.mk-row--out{ opacity:.64; }
`;
if (typeof document !== 'undefined' && !document.getElementById('mk-row-css')) {
  const s = document.createElement('style'); s.id = 'mk-row-css'; s.textContent = CSS; document.head.appendChild(s);
}

export function ProductListItem({
  name, desc, price, original, stock = 0, thumb, category, date,
  onClick, className = '', ...rest
}) {
  const out = stock <= 0;
  return (
    <button type="button" onClick={out ? undefined : onClick}
      className={['mk-row', out ? 'mk-row--out' : '', className].filter(Boolean).join(' ')} {...rest}>
      <span className="mk-row__thumb">{thumb}</span>
      <span className="mk-row__main">
        <span className="mk-row__name">{name}</span>
        {desc && <span className="mk-row__desc">{desc}</span>}
        <span className="mk-row__price">
          <PriceTag amount={price} original={original} size="md" />
        </span>
        <span className="mk-row__meta">
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            {category && <span className="mk-row__cat">{category}</span>}
            {out
              ? <Badge variant="danger" dot>缺货</Badge>
              : <Badge variant="success" dot>有货</Badge>}
          </span>
          {date && <span className="mk-row__date">{date}</span>}
        </span>
      </span>
    </button>
  );
}
