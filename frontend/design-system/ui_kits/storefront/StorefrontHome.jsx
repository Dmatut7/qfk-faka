/* Storefront home — merchant store header (cover + avatar + 认证/保证金/联系),
   trust band, category tabs, product grid. */
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

function Stat({ value, label, seal }) {
  return (
    <div style={{ flex: 1, textAlign: 'center', lineHeight: 1.2 }}>
      <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text-strong)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{value}</div>
      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        {seal && <span style={{ display: 'inline-flex', width: 14, height: 14, borderRadius: '50%', background: 'var(--secure-solid)', color: '#fff', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800 }}>保</span>}
        {label}
      </div>
    </div>
  );
}

function StorefrontHome({ onSelect }) {
  const { ProductCard, ProductListItem } = window.MiaoKa_cadc89;
  const [cat, setCat] = React.useState('all');
  const catName = Object.fromEntries(window.MK_CATEGORIES.map(c => [c.id, c.name]));
  const list = window.MK_PRODUCTS.filter(p => cat === 'all' || p.cat === cat);
  const S = window.MK_SHOP;

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
          {/* avatar + stats */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
            <div style={{
              width: 84, height: 84, borderRadius: 22, marginTop: -34, flex: 'none',
              background: 'var(--brand)', boxShadow: 'var(--shadow-brand)', border: '4px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img src="../../assets/logo-mark-light.svg" width="48" height="48" alt="" />
            </div>
            <div style={{ flex: 1, display: 'flex', paddingTop: 14, paddingBottom: 2 }}>
              <Stat value={S.stats.products} label="商品" />
              <Stat value={S.stats.deals} label="成交" />
              <Stat value={'¥' + S.stats.deposit} label="保证金" seal />
            </div>
          </div>

          {/* name + contact */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.01em' }}>{S.name}</h1>
            {S.verified && <VerifiedBadge />}
            <button style={{
              marginLeft: 'auto', flex: 'none', display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px',
              border: '1.5px solid var(--brand-soft-border)', background: 'var(--brand-soft)', color: 'var(--brand-active)',
              borderRadius: 'var(--radius-pill)', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
            }}><Icons.Headset size={16} />联系商家</button>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>{S.intro}</p>

          {/* trust band */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <TrustChip icon={<Icons.ShieldCheck size={17} />}>平台担保交易</TrustChip>
            <TrustChip icon={<Icons.Zap size={17} />}>自动发货 · 秒到账</TrustChip>
            <TrustChip icon={<Icons.RefreshCw size={17} />}>非人为问题包补</TrustChip>
            <TrustChip icon={<Icons.Headset size={17} />}>7×24 在线客服</TrustChip>
          </div>
        </div>
      </div>

      {/* category tabs (underline style) */}
      <div style={{ position: 'sticky', top: 60, zIndex: 10, background: 'var(--bg-page)', marginTop: 18 }}>
        <div style={{ maxWidth: 'var(--container-page)', margin: '0 auto', padding: '0 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 24, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {window.MK_CATEGORIES.map(c => {
              const on = c.id === cat;
              return (
                <button key={c.id} onClick={() => setCat(c.id)} style={{
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

      {/* product list */}
      <div style={{ maxWidth: 'var(--container-page)', margin: '0 auto', padding: '16px 16px 96px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
          {list.map(p => (
            <ProductListItem key={p.id} name={p.name} desc={p.desc} price={p.price} original={p.original}
              stock={p.stock} thumb={p.thumb} category={catName[p.cat]} date={p.date} onClick={() => onSelect(p)} />
          ))}
        </div>
        <div style={{ textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13, marginTop: 28 }}>— 没有更多了 —</div>
      </div>
    </div>
  );
}
window.StorefrontHome = StorefrontHome;
