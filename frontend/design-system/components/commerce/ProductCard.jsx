import React from 'react';
import { Card } from '../core/Card.jsx';
import { Badge } from '../core/Badge.jsx';
import { PriceTag } from '../core/PriceTag.jsx';

const CSS = `
.mk-prod{ display:flex; flex-direction:column; height:100%; }
.mk-prod__top{ display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
.mk-prod__thumb{ width:46px; height:46px; border-radius:var(--radius-md); flex:none; display:flex; align-items:center; justify-content:center; font-size:24px; background:var(--brand-soft); overflow:hidden; }
.mk-prod__thumb img{ width:100%; height:100%; object-fit:cover; }
.mk-prod__name{ font-size:var(--text-md); font-weight:var(--fw-bold); color:var(--text-strong); line-height:var(--lh-snug); letter-spacing:var(--ls-snug); }
.mk-prod__desc{ font-size:var(--text-sm); color:var(--text-muted); margin-top:5px; line-height:var(--lh-snug); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.mk-prod__foot{ display:flex; align-items:flex-end; justify-content:space-between; gap:8px; margin-top:14px; }
.mk-prod__sold{ font-size:var(--text-xs); color:var(--text-subtle); margin-top:6px; }
.mk-prod--out{ opacity:.66; }
`;
if (typeof document !== 'undefined' && !document.getElementById('mk-prod-css')) {
  const s = document.createElement('style'); s.id = 'mk-prod-css'; s.textContent = CSS; document.head.appendChild(s);
}

export function ProductCard({
  name, desc, price, original, stock = 0, thumb, sold,
  badge, onClick, className = '', ...rest
}) {
  const out = stock <= 0;
  return (
    <Card interactive={!out} onClick={out ? undefined : onClick}
      className={['mk-prod', out ? 'mk-prod--out' : '', className].filter(Boolean).join(' ')} {...rest}>
      <div className="mk-prod__top">
        <span className="mk-prod__thumb">{thumb}</span>
        {out
          ? <Badge variant="danger" dot>缺货</Badge>
          : (badge || <Badge variant="success" dot>有货{stock > 0 ? ` ${stock}` : ''}</Badge>)}
      </div>
      <div style={{ marginTop: 12, flex: 1 }}>
        <div className="mk-prod__name">{name}</div>
        {desc && <div className="mk-prod__desc">{desc}</div>}
      </div>
      <div className="mk-prod__foot">
        <PriceTag amount={price} original={original} size="md" />
        {sold != null && <span className="mk-prod__sold">已售 {sold}</span>}
      </div>
    </Card>
  );
}
