/* Storefront home — Taobao-style shop: announcement bar, store header
   (cover + avatar + 认证/保证金/三联统计 + trust band), 4 sales-type cards,
   search + sort filter, 2-col image-led product grid, bottom tab bar. */
function TrustChip({ icon, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--text-body)', whiteSpace: 'nowrap' }}>
      <span style={{ display: 'flex', color: 'var(--secure-solid)' }}>{icon}</span>{children}
    </div>
  );
}

function VerifiedBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3, height: 22, padding: '0 9px 0 7px',
      background: 'var(--brand-gradient)', color: '#fff', borderRadius: 'var(--radius-pill)',
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

function AnnounceBar() {
  const [i, setI] = React.useState(0);
  const [show, setShow] = React.useState(true);
  React.useEffect(() => {
    const t = setInterval(() => setI(v => (v + 1) % window.MK_ANNOUNCE.length), 4000);
    return () => clearInterval(t);
  }, []);
  if (!show) return null;
  return (
    <div style={{ background: 'var(--brand-soft)', borderBottom: '1px solid var(--brand-soft-border)' }}>
      <div style={{ maxWidth: 'var(--container-page)', margin: '0 auto', padding: '0 16px', height: 36, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13 }}>📣</span>
        <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: 'var(--orange-700)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{window.MK_ANNOUNCE[i]}</span>
        <button onClick={() => setShow(false)} aria-label="关闭" style={{ flex: 'none', width: 22, height: 22, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--orange-600)', fontSize: 15, lineHeight: 1 }}>×</button>
      </div>
    </div>
  );
}

function StorefrontHome({ onSelect, flashToast }) {
  const { ProductCard } = window.MiaoKa_b7a409;
  const [cat, setCat] = React.useState('all');
  const [sort, setSort] = React.useState('综合');
  const [priceDir, setPriceDir] = React.useState('desc');
  const catName = Object.fromEntries(window.MK_CATEGORIES.map(c => [c.id, c.name]));
  let list = window.MK_PRODUCTS.filter(p => cat === 'all' || p.cat === cat);
  if (sort === '销量') list = [...list].sort((a, b) => b.sold - a.sold);
  else if (sort === '上新') list = [...list].sort((a, b) => b.date.localeCompare(a.date));
  else if (sort === '价格') list = [...list].sort((a, b) => priceDir === 'asc' ? a.price - b.price : b.price - a.price);
  const S = window.MK_SHOP;

  return (
    <div style={{ paddingBottom: 64 }}>
      <AnnounceBar />

      {/* cover banner */}
      <div style={{
        height: 150, position: 'relative',
        background: 'radial-gradient(120% 140% at 80% 0%, #FF7B33 0%, #FF5000 45%, #C23A00 100%)',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 80% at 18% 120%, rgba(255,193,77,.55), transparent 60%)' }} />
        <div style={{ position: 'absolute', right: 18, bottom: 12, color: 'rgba(255,255,255,.6)', fontSize: 12, fontWeight: 700, letterSpacing: '.04em' }}>MiaoKa · Verified Store</div>
      </div>

      <div style={{ maxWidth: 'var(--container-page)', margin: '0 auto', padding: '0 16px' }}>
        {/* merchant card */}
        <div style={{
          marginTop: -24, position: 'relative', background: '#fff', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)', padding: '0 18px 18px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
            <div style={{
              width: 84, height: 84, borderRadius: 22, marginTop: -34, flex: 'none',
              background: 'var(--brand-gradient)', boxShadow: 'var(--shadow-brand)', border: '4px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img src="../../assets/logo-mark-light.svg" width="48" height="48" alt="" />
            </div>
            <div style={{ flex: 1, display: 'flex', paddingTop: 14, paddingBottom: 2 }}>
              <Stat value={S.stats.products} label="在售商品" />
              <Stat value={S.stats.deals} label="累计成交" />
              <Stat value={'¥' + S.stats.deposit} label="保证金" seal />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.01em' }}>{S.name}</h1>
            {S.verified && <VerifiedBadge />}
            <button style={{
              marginLeft: 'auto', flex: 'none', display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px',
              border: '1.5px solid var(--brand-soft-border)', background: 'var(--brand-soft)', color: 'var(--brand-active)',
              borderRadius: 'var(--radius-pill)', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
            }} onClick={() => flashToast && flashToast('已联系客服,稍后回复您')}><Icons.Headset size={16} />联系商家</button>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>{S.intro}</p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <TrustChip icon={<Icons.ShieldCheck size={16} />}>平台担保交易</TrustChip>
            <TrustChip icon={<Icons.Zap size={16} />}>自动发货 · 秒到账</TrustChip>
            <TrustChip icon={<Icons.RefreshCw size={16} />}>非人为问题包补</TrustChip>
            <TrustChip icon={<Icons.Headset size={16} />}>7×24 在线客服</TrustChip>
          </div>
        </div>

        {/* search box */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, height: 42, padding: '0 14px', background: '#fff', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-pill)' }}>
            <Icons.Search size={18} color="var(--text-subtle)" />
            <input placeholder="搜索店内商品" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-strong)' }} />
          </div>
          <button style={{ flex: 'none', height: 42, padding: '0 22px', border: 'none', borderRadius: 'var(--radius-pill)', background: 'var(--cta-gradient-buy)', color: '#fff', fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: 'var(--shadow-brand)' }}>搜索</button>
        </div>
      </div>

      {/* sticky sort + category */}
      <div style={{ position: 'sticky', top: 60, zIndex: 10, background: 'rgba(245,245,246,.9)', backdropFilter: 'blur(8px)', marginTop: 12 }}>
        <div style={{ maxWidth: 'var(--container-page)', margin: '0 auto', padding: '0 16px' }}>
          {/* category chips */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
            {window.MK_CATEGORIES.map(c => {
              const on = c.id === cat;
              return (
                <button key={c.id} onClick={() => setCat(c.id)} style={{
                  flex: 'none', height: 32, padding: '0 14px', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontWeight: on ? 800 : 600, fontSize: 13, whiteSpace: 'nowrap',
                  border: on ? '1.5px solid var(--brand)' : '1px solid var(--border)',
                  background: on ? 'var(--brand-soft)' : '#fff', color: on ? 'var(--brand-active)' : 'var(--text-body)',
                  transition: 'all .15s',
                }}>{c.name} <span style={{ fontWeight: 600, opacity: .65 }}>{c.count}</span></button>
              );
            })}
          </div>
          {/* sort row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 42, borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
            {window.MK_SORTS.map(s => {
              const on = s === sort;
              const isPrice = s === '价格';
              return (
                <button key={s} onClick={() => { if (isPrice && on) setPriceDir(d => d === 'asc' ? 'desc' : 'asc'); setSort(s); }} style={{
                  flex: 'none', display: 'flex', alignItems: 'center', gap: 2, height: 30, padding: '0 14px', border: 'none', background: 'transparent', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontWeight: on ? 800 : 600, fontSize: 13.5, color: on ? 'var(--brand)' : 'var(--text-body)',
                }}>
                  {s}
                  {isPrice && <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: .5, marginLeft: 1 }}>
                    <span style={{ fontSize: 8, color: on && priceDir === 'asc' ? 'var(--brand)' : 'var(--text-subtle)' }}>▲</span>
                    <span style={{ fontSize: 8, color: on && priceDir === 'desc' ? 'var(--brand)' : 'var(--text-subtle)' }}>▼</span>
                  </span>}
                </button>
              );
            })}
            <span style={{ marginLeft: 'auto', display: 'flex', color: 'var(--text-muted)', padding: '0 6px' }}><Icons.Grid size={18} /></span>
          </div>
        </div>
      </div>

      {/* product grid (2-col) */}
      <div style={{ maxWidth: 'var(--container-page)', margin: '0 auto', padding: '12px 16px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))', gap: 10 }}>
          {list.map(p => (
            <ProductCard key={p.id} name={p.name} subtitle={p.subtitle} price={p.price} original={p.original}
              priceLabel={p.priceLabel} stock={p.stock} thumb={p.thumb} category={catName[p.cat]}
              typeLabel={p.type} promo={p.promo} tags={p.tags} sold={p.sold}
              onCart={() => flashToast && flashToast('已加入购物车')} onClick={() => onSelect(p)} />
          ))}
        </div>
        <div style={{ textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13, marginTop: 24 }}>— 没有更多了 —</div>
      </div>

      {/* bottom tab bar */}
      <nav style={{
        position: 'sticky', bottom: 0, zIndex: 15, background: 'rgba(255,255,255,.94)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border)', display: 'flex', maxWidth: 'var(--container-page)', margin: '0 auto',
      }}>
        {[
          { k: 'home', label: '首页', icon: Icons.Home },
          { k: 'goods', label: '宝贝', icon: Icons.Grid, active: true },
          { k: 'store', label: '门店', icon: Icons.Store },
          { k: 'new', label: '新品', icon: Icons.Sparkles },
          { k: 'service', label: '客服', icon: Icons.Headset },
        ].map(it => (
          <button key={it.k} onClick={() => flashToast && flashToast(it.label)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 0 10px',
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: it.active ? 'var(--brand)' : 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontWeight: it.active ? 800 : 600, fontSize: 11,
          }}>
            <it.icon size={22} />{it.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
window.StorefrontHome = StorefrontHome;
