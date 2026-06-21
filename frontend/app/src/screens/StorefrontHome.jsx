import React from 'react';
import { ProductCard } from '../../../design-system/components/commerce/ProductCard.jsx';
import { Icons } from '../Icons.jsx';

/* Storefront home — store header (cover + avatar + 认证/trust band),
   dynamic category tabs (from product.category_id), product grid via ProductCard.
   Data comes from props (already normalized); no window.MK_*. */

function TrustChip({ icon, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, color: 'var(--text-body)', whiteSpace: 'nowrap' }}>
      <span style={{ display: 'flex', color: 'var(--secure-solid)' }}>{icon}</span>{children}
    </div>
  );
}

function VerifiedBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, height: 22, padding: '0 9px 0 7px',
      background: 'var(--brand)', color: '#fff', borderRadius: 'var(--radius-pill)',
      fontSize: 12, fontWeight: 800, flex: 'none', whiteSpace: 'nowrap',
    }}>
      <Icons.ShieldCheck size={13} color="#fff" />已认证
    </span>
  );
}

const GRID = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 12 };
/* @media(max-width:480px): minmax(min(100%,320px),1fr) already collapses to single column on narrow screens. */

function StateWrap({ children }) {
  return (
    <div style={{ maxWidth: 'var(--container-page)', margin: '0 auto', padding: '0 16px' }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 14, textAlign: 'center', minHeight: 220, padding: '48px 16px',
        color: 'var(--text-muted)',
      }}>
        {children}
      </div>
    </div>
  );
}

export default function StorefrontHome({ shop, products, loading, error, onReload, onSelect }) {
  const [cat, setCat] = React.useState('all');
  const list = products || [];

  // Build category tabs from product.category_id (only when present).
  const cats = React.useMemo(() => {
    const seen = new Map();
    for (const p of list) {
      const id = p.category_id;
      if (id != null && !seen.has(id)) {
        seen.set(id, p.category_name || ('分类 ' + id));
      }
    }
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [list]);

  const tabs = [{ id: 'all', name: '全部' }, ...cats];
  const shown = cat === 'all' ? list : list.filter(p => p.category_id === cat);

  const store = shop || {};

  return (
    <div>
      {/* cover banner */}
      <div style={{
        height: 150, position: 'relative',
        background: 'radial-gradient(120% 140% at 80% 0%, #2F6BFF 0%, #1A45BD 45%, #11297A 100%)',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 80% at 18% 120%, rgba(15,169,160,.5), transparent 60%)' }} />
        <div style={{ position: 'absolute', right: 18, bottom: 12, color: 'rgba(255,255,255,.5)', fontSize: 12, fontWeight: 700, letterSpacing: '.04em' }}>MiaoKa · Verified Store</div>
      </div>

      {/* merchant card */}
      <div style={{ maxWidth: 'var(--container-page)', margin: '0 auto', padding: '0 16px' }}>
        <div style={{
          marginTop: -24, position: 'relative', background: '#fff', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)', padding: '0 18px 18px',
        }}>
          {/* avatar */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
            <div style={{
              width: 84, height: 84, borderRadius: 22, marginTop: -34, flex: 'none',
              background: 'var(--brand)', boxShadow: 'var(--shadow-brand)', border: '4px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 34, fontWeight: 800,
            }}>
              {(store.name || '店').slice(0, 1)}
            </div>
          </div>

          {/* name + contact */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.01em' }}>{store.name || '店铺'}</h1>
            <VerifiedBadge />
            <button style={{
              marginLeft: 'auto', flex: 'none', display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px',
              border: '1.5px solid var(--brand-soft-border)', background: 'var(--brand-soft)', color: 'var(--brand-active)',
              borderRadius: 'var(--radius-pill)', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
            }}><Icons.Headset size={16} />联系商家</button>
          </div>
          {store.intro && <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>{store.intro}</p>}

          {/* trust band */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <TrustChip icon={<Icons.ShieldCheck size={17} />}>平台担保交易</TrustChip>
            <TrustChip icon={<Icons.Zap size={17} />}>自动发货 · 秒到账</TrustChip>
            <TrustChip icon={<Icons.RefreshCw size={17} />}>非人为问题包补</TrustChip>
            <TrustChip icon={<Icons.Headset size={17} />}>7×24 在线客服</TrustChip>
          </div>
        </div>
      </div>

      {/* category tabs (underline style) — only when more than just 全部 */}
      {tabs.length > 1 && !loading && !error && (
        <div style={{ position: 'sticky', top: 60, zIndex: 10, background: 'var(--bg-page)', marginTop: 18 }}>
          <div style={{ maxWidth: 'var(--container-page)', margin: '0 auto', padding: '0 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 24, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {tabs.map(c => {
                const on = c.id === cat;
                return (
                  <button key={String(c.id)} onClick={() => setCat(c.id)} style={{
                    flex: 'none', position: 'relative', height: 46, padding: '0 2px', border: 'none', background: 'transparent', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', fontWeight: on ? 800 : 600, fontSize: 15,
                    color: on ? 'var(--brand-active)' : 'var(--text-muted)', whiteSpace: 'nowrap', transition: 'color .15s',
                  }}>
                    {c.name}
                    {on && <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 0, width: 22, height: 3, borderRadius: 3, background: 'var(--brand)' }} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* product area */}
      <div style={{ maxWidth: 'var(--container-page)', margin: '0 auto', padding: '16px 16px 96px' }}>
        {loading ? (
          <div style={GRID}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{
                height: 132, borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)',
                background: 'linear-gradient(90deg, var(--bg-subtle, #f2f4f7) 25%, #e9edf2 50%, var(--bg-subtle, #f2f4f7) 75%)',
                backgroundSize: '200% 100%', animation: 'mk-shimmer 1.2s ease-in-out infinite',
              }} />
            ))}
            <style>{'@keyframes mk-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}'}</style>
          </div>
        ) : error ? (
          <StateWrap>
            <Icons.AlertTriangle size={40} color="var(--danger-solid, #e5484d)" />
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-strong)' }}>
              {(error && error.message) || '加载失败,请重试'}
            </div>
            <button onClick={onReload} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, height: 40, padding: '0 20px',
              border: 'none', background: 'var(--brand)', color: '#fff', borderRadius: 'var(--radius-pill)',
              fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}><Icons.RefreshCw size={16} color="#fff" />重试</button>
          </StateWrap>
        ) : shown.length === 0 ? (
          <StateWrap>
            <Icons.Inbox size={44} color="var(--text-subtle)" />
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-strong)' }}>该店铺暂无在售商品</div>
          </StateWrap>
        ) : (
          <>
            <div style={GRID}>
              {shown.map(p => (
                <ProductCard
                  key={p.id}
                  name={p.name}
                  desc={p.desc}
                  price={p.price}
                  original={p.original}
                  stock={p.stock}
                  sold={p.sold}
                  thumb={p.thumb}
                  onClick={() => onSelect && onSelect(p)}
                />
              ))}
            </div>
            <div style={{ textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13, marginTop: 28 }}>— 没有更多了 —</div>
          </>
        )}
      </div>
    </div>
  );
}
