import React from 'react';
import { PriceTag } from '../core/PriceTag.jsx';

/* Image-led Taobao-style product card.
   Full-bleed 1:1 image (emoji+gradient placeholder when no art), type badge
   over the image, one corner badge, promo-prefixed 2-line title, red price
   with optional label, subsidy/promo chips, sold count + cart button. */
const CSS = `
.mk-pc{ display:flex; flex-direction:column; height:100%; background:var(--surface-card); border:1px solid var(--border); border-radius:var(--radius-md); overflow:hidden; cursor:pointer; transition:transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out); box-shadow:var(--shadow-xs); }
.mk-pc:hover{ transform:translateY(-2px); box-shadow:var(--shadow-md); }
.mk-pc:active{ transform:translateY(0); }
.mk-pc--out{ opacity:.7; cursor:default; }
.mk-pc--out:hover{ transform:none; box-shadow:var(--shadow-xs); }

.mk-pc__media{ position:relative; aspect-ratio:1/1; background:linear-gradient(150deg,#FFF3EC,#FFE3D1); display:flex; align-items:center; justify-content:center; overflow:hidden; }
.mk-pc__media img{ width:100%; height:100%; object-fit:cover; display:block; }
.mk-pc__emoji{ font-size:64px; filter:drop-shadow(0 6px 14px rgba(122,36,0,.18)); }
.mk-pc__cat{ position:absolute; bottom:8px; left:50%; transform:translateX(-50%); font-size:11px; font-weight:700; color:var(--orange-700); background:rgba(255,255,255,.7); padding:2px 8px; border-radius:var(--radius-pill); white-space:nowrap; }
.mk-pc__type{ position:absolute; top:8px; left:8px; display:inline-flex; align-items:center; gap:3px; height:20px; padding:0 7px; border-radius:var(--radius-sm); font-size:11px; font-weight:800; color:#fff; background:rgba(17,20,24,.55); backdrop-filter:blur(4px); white-space:nowrap; }
.mk-pc__corner{ position:absolute; top:8px; right:8px; display:inline-flex; align-items:center; gap:3px; height:20px; padding:0 7px; border-radius:var(--radius-sm); font-size:11px; font-weight:800; white-space:nowrap; }
.mk-pc__corner--promo{ color:#fff; background:var(--promo-solid); }
.mk-pc__corner--low{ color:#fff; background:var(--pending-solid); }
.mk-pc__corner--out{ color:#fff; background:var(--slate-500); }

.mk-pc__body{ display:flex; flex-direction:column; flex:1; padding:10px 11px 11px; gap:7px; }
.mk-pc__title{ font-size:var(--text-base); font-weight:700; color:var(--text-strong); line-height:1.34; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.mk-pc__promo{ display:inline-flex; align-items:center; height:16px; padding:0 5px; margin-right:5px; border-radius:3px; background:var(--promo-solid); color:#fff; font-size:10.5px; font-weight:800; vertical-align:1px; }
.mk-pc__sub{ font-size:var(--text-xs); color:var(--text-subtle); line-height:1.3; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden; }
.mk-pc__priceRow{ display:flex; align-items:baseline; gap:8px; margin-top:auto; }
.mk-pc__tags{ display:flex; flex-wrap:wrap; gap:5px; }
.mk-pc__tag{ display:inline-flex; align-items:center; height:17px; padding:0 6px; border-radius:3px; font-size:10.5px; font-weight:700; white-space:nowrap; }
.mk-pc__tag--subsidy{ color:var(--subsidy-fg); background:var(--subsidy-bg); }
.mk-pc__tag--promo{ color:var(--promo-soft-fg); background:transparent; border:1px solid var(--promo-soft-border); }
.mk-pc__foot{ display:flex; align-items:center; justify-content:space-between; gap:8px; }
.mk-pc__sold{ font-size:var(--text-xs); color:var(--text-subtle); white-space:nowrap; }
.mk-pc__cart{ flex:none; width:30px; height:30px; border-radius:50%; border:none; display:flex; align-items:center; justify-content:center; background:var(--brand-gradient); color:#fff; cursor:pointer; box-shadow:0 3px 8px rgba(255,80,0,.3); }
.mk-pc__cart:active{ transform:scale(.92); }
.mk-pc__cart svg{ width:16px; height:16px; }

/* 紧凑卡(无图):用小标签行替代大图,适配发卡纯文字商品(如卡密码) */
.mk-pc--compact .mk-pc__body{ padding:12px; gap:9px; min-height:104px; }
.mk-pc--compact .mk-pc__title{ font-size:15.5px; }
.mk-pc__tagrow{ display:flex; align-items:center; gap:6px; padding:12px 12px 0; }
.mk-pc__type--inline{ position:static; height:20px; background:var(--brand-soft); color:var(--brand-active); backdrop-filter:none; }
.mk-pc__corner--inline{ position:static; }
`;
if (typeof document !== 'undefined' && !document.getElementById('mk-pc-css')) {
  const s = document.createElement('style'); s.id = 'mk-pc-css'; s.textContent = CSS; document.head.appendChild(s);
}

export function ProductCard({
  name, subtitle, price, original, priceLabel, stock = 0, image, thumb, category,
  typeLabel, promo, tags, sold, onCart, onClick, className = '', ...rest
}) {
  const out = stock <= 0;
  const low = !out && stock > 0 && stock <= 5;
  const compact = !image; // 无图 → 紧凑文字卡(发卡:卡密/权益类多为纯文字商品)
  const corner = out
    ? <span className={'mk-pc__corner mk-pc__corner--out' + (compact ? ' mk-pc__corner--inline' : '')}>已售罄</span>
    : promo
      ? <span className={'mk-pc__corner mk-pc__corner--promo' + (compact ? ' mk-pc__corner--inline' : '')}>限时</span>
      : low ? <span className={'mk-pc__corner mk-pc__corner--low' + (compact ? ' mk-pc__corner--inline' : '')}>仅剩 {stock}</span> : null;
  return (
    <div
      className={['mk-pc', out ? 'mk-pc--out' : '', compact ? 'mk-pc--compact' : '', className].filter(Boolean).join(' ')}
      onClick={out ? undefined : onClick} {...rest}
    >
      {compact ? (
        <div className="mk-pc__tagrow">
          {typeLabel && <span className="mk-pc__type mk-pc__type--inline">{typeLabel}</span>}
          {corner}
          {category && <span className="mk-pc__sold" style={{ marginLeft: 'auto' }}>{category}</span>}
        </div>
      ) : (
        <div className="mk-pc__media">
          <img src={image} alt="" />
          {typeLabel && <span className="mk-pc__type">{typeLabel}</span>}
          {corner}
        </div>
      )}
      <div className="mk-pc__body">
        <div className="mk-pc__title">
          {promo && <span className="mk-pc__promo">{promo}</span>}{name}
        </div>
        {subtitle && <div className="mk-pc__sub">{subtitle}</div>}
        {tags && tags.length > 0 && (
          <div className="mk-pc__tags">
            {tags.map((t, i) => (
              <span key={i} className={`mk-pc__tag mk-pc__tag--${t.tone || 'subsidy'}`}>{t.text}</span>
            ))}
          </div>
        )}
        <div className="mk-pc__priceRow">
          <PriceTag amount={price} original={original} size="sm" label={priceLabel} />
        </div>
        <div className="mk-pc__foot">
          <span className="mk-pc__sold">{sold != null ? `已售 ${sold}` : '\u00A0'}</span>
          {!out && (
            <button className="mk-pc__cart" aria-label="加入购物车"
              onClick={(e) => { e.stopPropagation(); onCart && onCart(); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
