import React from 'react';
import { Icons } from '../Icons.jsx';
import { normId } from '../api.js';
import { ProductCard } from '../../../design-system/components/commerce/ProductCard.jsx';

/* 秒卡 MiaoKa 风格发卡商城首页(淘宝商业橙)——
   平台公告条(轮播 + 可关闭)→ 橙色封面 banner → 商户卡(圆形 avatar + 店名 + 已认证 +
   三联统计 + 信任 chips + 联系客服)→ 4 横排销售类型卡(按 goods_type 分组计数,点击筛选)
   → 搜索框 → 排序/分类筛选(综合/销量/上新/价格 + 分类计数,选中橙高亮)
   → 2 列 image-led 商品网格(ESM <ProductCard/>)→ 底部 tab bar。
   配色全走 CSS 变量(橙 token);业务逻辑/状态/handler 原样保留,只重写渲染与配色。 */

const money = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
};

/* 销售类型元数据(对标演示站,emoji 仅做占位缩略) */
const GOODS_TYPE_META = {
  1: { name: '数字卡密', emoji: '⚡️', short: '卡密' },
  2: { name: '知识文章', emoji: '☘️', short: '知识' },
  3: { name: '资源下载', emoji: '💎', short: '资源' },
  4: { name: '数字权益', emoji: '👑', short: '权益' },
};
const GOODS_TYPE_ORDER = [1, 2, 3, 4];

/* —— 已认证徽章(橙渐变) —— */
function VerifiedBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, height: 22, padding: '0 9px 0 7px',
      background: 'var(--brand-gradient)', color: '#fff', borderRadius: 'var(--radius-pill)',
      fontSize: 12, fontWeight: 800, flex: 'none', whiteSpace: 'nowrap',
    }}>
      <Icons.ShieldCheck size={13} color="#fff" />已认证
    </span>
  );
}

/* —— 三联统计单元 —— */
function Stat({ value, label, seal }) {
  return (
    <div style={{ flex: 1, minWidth: 0, textAlign: 'center', lineHeight: 1.2 }}>
      <div style={{
        fontWeight: 800, fontSize: 17, color: 'var(--text-strong)',
        fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
      }}>{value}</div>
      <div style={{
        fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, whiteSpace: 'nowrap',
      }}>
        {seal && (
          <span style={{
            display: 'inline-flex', width: 14, height: 14, borderRadius: '50%',
            background: 'var(--secure-solid)', color: '#fff', alignItems: 'center',
            justifyContent: 'center', fontSize: 9, fontWeight: 800,
          }}>保</span>
        )}
        {label}
      </div>
    </div>
  );
}

/* —— 信任 chip —— */
function TrustChip({ icon, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600,
      color: 'var(--text-body)', whiteSpace: 'nowrap',
    }}>
      <span style={{ display: 'flex', color: 'var(--secure-solid)' }}>{icon}</span>{children}
    </div>
  );
}

/* —— 可复制联系方式行 —— */
function ContactRow({ icon, label, value }) {
  const [copied, setCopied] = React.useState(false);
  if (!value) return null;
  const copy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(String(value));
      else {
        const ta = document.createElement('textarea');
        ta.value = String(value); document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta);
      }
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    } catch { /* 复制失败静默 */ }
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ display: 'flex', color: 'var(--brand-active)', flex: 'none' }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)', wordBreak: 'break-all' }}>{value}</div>
      </div>
      <button type="button" onClick={copy} style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, height: 32, padding: '0 12px', flex: 'none',
        border: '1px solid var(--brand-soft-border)', background: copied ? 'var(--success-bg)' : 'var(--brand-soft)',
        color: copied ? 'var(--success-fg)' : 'var(--brand-active)', borderRadius: 'var(--radius-pill)',
        fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', whiteSpace: 'nowrap',
      }}>
        {copied ? <><Icons.Check size={14} />已复制</> : <><Icons.Copy size={14} />复制</>}
      </button>
    </div>
  );
}

/* —— 联系客服弹窗 —— */
function ContactModal({ contact, onClose }) {
  const c = contact || {};
  const empty = !c.qq && !c.wechat && !c.mobile;
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(18,27,42,.5)',
        backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="联系客服"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460, background: '#fff', borderRadius: '18px 18px 0 0',
          padding: '18px 18px calc(18px + env(safe-area-inset-bottom, 0px))',
          boxShadow: 'var(--shadow-lg, 0 -10px 40px rgba(18,27,42,.18))',
          animation: 'mk-sheet-up .22s ease-out',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800, color: 'var(--text-strong)' }}>
            <Icons.Headset size={20} color="var(--brand-active)" />联系客服
          </div>
          <button type="button" onClick={onClose} aria-label="关闭" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32,
            border: 'none', background: 'var(--surface-sunken)', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-muted)',
          }}><Icons.X size={18} /></button>
        </div>
        {empty ? (
          <div style={{ padding: '28px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            商家暂未提供联系方式
          </div>
        ) : (
          <div>
            <ContactRow icon={<Icons.MessageCircle size={18} />} label="QQ" value={c.qq} />
            <ContactRow icon={<Icons.MessageCircle size={18} />} label="微信" value={c.wechat} />
            <ContactRow icon={<Icons.Phone size={18} />} label="手机" value={c.mobile} />
          </div>
        )}
        <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-subtle)', textAlign: 'center', lineHeight: 1.5 }}>
          请通过以上方式联系商家;平台担保交易,谨防站外私下转账。
        </div>
      </div>
      <style>{'@keyframes mk-sheet-up{from{transform:translateY(100%)}to{transform:translateY(0)}}'}</style>
    </div>
  );
}

/* —— 平台公告全文弹窗(查看全部) —— */
function PlatformNoticeModal({ notices, onClose }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(18,27,42,.5)',
        backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        role="dialog" aria-modal="true" aria-label="平台公告"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460, maxHeight: '78vh', overflowY: 'auto', background: '#fff',
          borderRadius: '18px 18px 0 0', padding: '18px 18px calc(18px + env(safe-area-inset-bottom, 0px))',
          boxShadow: 'var(--shadow-lg, 0 -10px 40px rgba(18,27,42,.18))', animation: 'mk-sheet-up .22s ease-out',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800, color: 'var(--text-strong)' }}>
            <Icons.Megaphone size={20} color="var(--brand-active)" />平台公告
          </div>
          <button type="button" onClick={onClose} aria-label="关闭" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32,
            border: 'none', background: 'var(--surface-sunken)', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-muted)',
          }}><Icons.X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {notices.map((n) => (
            <div key={n.id} style={{ paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>{n.title}</div>
              {n.create_time && (
                <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 3 }}>{n.create_time}</div>
              )}
              <div style={{ fontSize: 13.5, color: 'var(--text-body)', marginTop: 7, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{n.content}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{'@keyframes mk-sheet-up{from{transform:translateY(100%)}to{transform:translateY(0)}}'}</style>
    </div>
  );
}

/* —— 平台公告条(banner 之上,橙底,可关闭;多条轮播 + 点击看全部) —— */
function PlatformNoticeBar({ notices }) {
  const [closed, setClosed] = React.useState(false);
  const [idx, setIdx] = React.useState(0);
  const [showAll, setShowAll] = React.useState(false);
  const many = notices.length > 1;
  // notices 内容的稳定标识:变化时需重置轮播下标与计时器
  const noticesKey = notices.map((n) => n.id).join(',');

  // notices 变化时重置到第一条,避免 idx 越界或停留在旧内容
  React.useEffect(() => { setIdx(0); }, [noticesKey]);

  React.useEffect(() => {
    if (!many || closed) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % notices.length), 4500);
    return () => clearInterval(t);
  }, [many, closed, notices.length, noticesKey]);

  if (closed || notices.length === 0) return null;
  const cur = notices[idx % notices.length];

  return (
    <>
      <div style={{ background: 'var(--brand-soft)', borderBottom: '1px solid var(--brand-soft-border)' }}>
        <div style={{
          maxWidth: 'var(--container-page)', margin: '0 auto', padding: '0 16px', minHeight: 36,
          display: 'flex', alignItems: 'center', gap: 9,
        }}>
          <Icons.Megaphone size={16} color="var(--orange-700)" style={{ flex: 'none' }} />
          <button
            type="button"
            onClick={() => setShowAll(true)}
            title="查看全部平台公告"
            style={{
              flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 0', border: 'none',
              background: 'transparent', cursor: 'pointer', textAlign: 'left', color: 'var(--orange-700)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <span style={{
              flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              <span style={{ fontWeight: 800 }}>{cur.title}</span>
              {cur.content ? <span style={{ fontWeight: 600, opacity: .85 }}>{'  ·  ' + cur.content}</span> : null}
            </span>
            <span style={{ flex: 'none', fontSize: 12, fontWeight: 700, opacity: .8, whiteSpace: 'nowrap' }}>
              {many ? `全部 ${notices.length} 条 ›` : '详情 ›'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setClosed(true)}
            aria-label="关闭公告"
            style={{
              flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22,
              border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--orange-600)', opacity: .8,
            }}
          ><Icons.X size={15} /></button>
        </div>
      </div>
      {showAll && <PlatformNoticeModal notices={notices} onClose={() => setShowAll(false)} />}
    </>
  );
}

/* —— 顶部 4 横排销售类型卡(按 goods_type 计数,点击筛选) —— */
function TypeSummaryCards({ counts, active, onPick }) {
  const types = GOODS_TYPE_ORDER.filter((t) => (counts[t] || 0) > 0);
  if (types.length < 2) return null; // 单一类型店无需类型卡
  return (
    <div style={{ maxWidth: 'var(--container-page)', margin: '0 auto', padding: '16px 16px 0' }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {types.map((t) => {
          const meta = GOODS_TYPE_META[t];
          const on = active === t;
          return (
            <button key={t} type="button" onClick={() => onPick(on ? null : t)} style={{
              flex: '1 1 160px', minWidth: 150, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 10, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)',
              borderRadius: 'var(--radius-lg)', background: on ? 'var(--brand-soft)' : '#fff',
              border: on ? '1.5px solid var(--brand)' : '1px solid var(--border)', boxShadow: 'var(--shadow-xs)',
              transition: 'all .15s',
            }}>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: on ? 'var(--brand-active)' : 'var(--text-strong)', letterSpacing: '-0.01em' }}>{meta.name}</span>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>包含 {counts[t] || 0} 件商品</span>
              </span>
              <span style={{ fontSize: 24, flex: 'none' }} aria-hidden="true">{meta.emoji}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StateWrap({ children }) {
  return (
    <div style={{ maxWidth: 'var(--container-page)', margin: '0 auto', padding: '0 16px' }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 14, textAlign: 'center', minHeight: 220, padding: '48px 16px', color: 'var(--text-muted)',
      }}>{children}</div>
    </div>
  );
}

/* 商品网格(2 列移动 / auto-fill ≥176 桌面) */
const GRID = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 };

/* 排序项:综合 / 销量 / 上新 / 价格 */
const SORTS = ['综合', '销量', '上新', '价格'];

/* 知识/资源/权益:单列列表行(左缩略图 + 右标题/价/分类·已售) */
function ProductListRow({ p, catName, onSelect }) {
  const price = Number(p.price);
  return (
    <button type="button" onClick={() => onSelect && onSelect(p)}
      style={{ display: 'flex', gap: 14, width: '100%', textAlign: 'left', padding: '14px 0', border: 'none', borderBottom: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
      <div style={{
        width: 112, height: 112, flex: 'none', borderRadius: 'var(--radius-md)', overflow: 'hidden',
        backgroundColor: 'var(--surface-sunken)', backgroundImage: p.image ? `url("${p.image}")` : 'none',
        backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
      }}>{!p.image && (p.thumb || '📦')}</div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: '2px 0' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</div>
        <div style={{ marginTop: 8, color: 'var(--price-accent)', fontWeight: 800, fontSize: 19 }}>
          {price <= 0 ? '免费' : <><span style={{ fontSize: 13 }}>¥</span>{price}</>}
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 12.5, color: 'var(--text-subtle)' }}>
          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{catName || ''}</span>
          {p.sold != null && <span style={{ flex: 'none' }}>已售 {p.sold}</span>}
        </div>
      </div>
    </button>
  );
}

export default function StorefrontHome({ shop, categories, products, loading, error, onReload, onSelect }) {
  const [cat, setCat] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState(1); // 默认卡密;按 goods_type 切换(下划线 Tab)
  const [query, setQuery] = React.useState('');
  const [sort, setSort] = React.useState('综合'); // 综合 / 销量 / 上新 / 价格
  const [priceDir, setPriceDir] = React.useState('desc'); // 价格排序方向
  const [showContact, setShowContact] = React.useState(false);
  const gridRef = React.useRef(null); // 商品网格容器,供底部「宝贝」tab 滚动定位
  const list = products || [];
  const store = shop || {};

  // 分类 tab:优先用后端 categories;缺省时从商品 category_id 兜底推导。
  const cats = React.useMemo(() => {
    const cs = Array.isArray(categories) ? categories : [];
    if (cs.length) {
      return cs.map((c) => ({
        id: normId(c.id),
        name: c.name || ('分类 ' + c.id),
        image: c.image || null,
        goods_count: c.goods_count,
      }));
    }
    const seen = new Map();
    for (const p of list) {
      const id = normId(p.category_id);
      if (id != null && !seen.has(id)) seen.set(id, '分类 ' + id);
    }
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [categories, list]);

  const catNameById = React.useMemo(() => Object.fromEntries(cats.map((c) => [String(c.id), c.name])), [cats]);

  const allCount = list.length;
  const tabs = [{ id: 'all', name: '全部', goods_count: allCount }, ...cats];
  // 按销售类型计数(顶部 4 类型卡)
  const typeCounts = React.useMemo(() => {
    const c = {};
    for (const p of list) { const t = Number(p.goods_type ?? 1); c[t] = (c[t] || 0) + 1; }
    return c;
  }, [list]);
  // 商品加载后,若默认类型(卡密)无货,自动切到第一个有货的类型(只在数据到位时跑一次,不干扰用户后续手选)
  React.useEffect(() => {
    if (!list.length) return;
    setTypeFilter((cur) => ((typeCounts[cur] || 0) > 0 ? cur : ([1, 2, 3, 4].find((t) => (typeCounts[t] || 0) > 0) || cur)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length]);
  // 真正按 category_id 精确筛选 + 销售类型筛选(类型卡)。
  const byCat = cat === 'all' ? list : list.filter((p) => normId(p.category_id) === normId(cat));
  const byType = typeFilter ? byCat.filter((p) => Number(p.goods_type ?? 1) === typeFilter) : byCat;
  // 客户端实时搜索:在筛选结果上,按 name 包含关键词(不区分大小写)叠加过滤。
  const q = query.trim().toLowerCase();
  const filtered = q ? byType.filter((p) => String(p.name || '').toLowerCase().includes(q)) : byType;
  // 排序:综合(原序)/ 销量 / 上新 / 价格。不改变 filtered 引用,复制后排序。
  const shown = React.useMemo(() => {
    const arr = filtered.slice();
    const soldOf = (p) => Number(p.sold ?? p.sales_count ?? 0);
    if (sort === '销量') arr.sort((a, b) => soldOf(b) - soldOf(a));
    else if (sort === '上新') arr.sort((a, b) => normId(b.id) - normId(a.id)); // 无 date 字段,用 id 近似上新
    else if (sort === '价格') arr.sort((a, b) => priceDir === 'asc' ? Number(a.price) - Number(b.price) : Number(b.price) - Number(a.price));
    return arr;
  }, [filtered, sort, priceDir]);

  const verified = Number(store.verified) === 1;
  // 平台公告(store.notices,由 App 注入)— 区别于下面的商户店铺公告 announcement 字段。
  const notices = Array.isArray(store.notices) ? store.notices.filter((n) => n && (n.title || n.content)) : [];
  const announcement = (store.announcement || '').trim();
  const intro = (store.intro || '').trim();
  const salesCount = store.sales_count != null ? store.sales_count : 0;
  const deposit = money(store.deposit);

  return (
    <div style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}>
      <style>{`
        .mk-pgrid{ display:grid; gap:10px; grid-template-columns:repeat(2,1fr); }
        @media(min-width:560px){ .mk-pgrid{ grid-template-columns:repeat(3,1fr); } }
        @media(min-width:768px){ .mk-pgrid{ grid-template-columns:repeat(4,1fr); } }
        @media(min-width:1024px){ .mk-pgrid{ grid-template-columns:repeat(5,1fr); } }
        .mk-prows{ max-width:780px; }
        @media(min-width:768px){ .mk-bottomnav{ display:none !important; } }
      `}</style>
      {/* 平台公告条(banner 之上) */}
      {notices.length > 0 && <PlatformNoticeBar notices={notices} />}

      {/* 店招封面:有封面图则全屏照片主导;无则橙色渐变兜底 */}
      <div style={{
        height: 168, position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(120% 140% at 80% 0%, #FF7B33 0%, #FF5000 45%, #C23A00 100%)',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 80% at 18% 120%, rgba(255,193,77,.55), transparent 60%)' }} />
        {store.cover && (
          <img src={store.cover} alt="" aria-hidden="true"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.16) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 70%, rgba(0,0,0,.14) 100%)' }} />
      </div>

      {/* 商家卡片 */}
      <div style={{ maxWidth: 'var(--container-page)', margin: '0 auto', padding: '0 16px' }}>
        <div style={{
          marginTop: -28, position: 'relative', background: '#fff', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)', padding: '0 18px 16px',
        }}>
          {/* 头像(圆形)叠在左下 + 三联统计 */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
            <div style={{
              width: 76, height: 76, borderRadius: '50%', marginTop: -30, flex: 'none', overflow: 'hidden',
              background: 'var(--brand-gradient)', boxShadow: 'var(--shadow-brand)', border: '4px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 30, fontWeight: 800,
            }}>
              {store.logo
                ? <img src={store.logo} alt={store.name || '店铺'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (store.name || '店').slice(0, 1)}
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', paddingTop: 14, paddingBottom: 2 }}>
              <Stat value={allCount} label="在售商品" />
              <Stat value={salesCount} label="累计成交" />
              <Stat value={'¥' + deposit} label="保证金" seal />
            </div>
          </div>

          {/* 店名 + 认证 + 联系客服 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.01em' }}>
              {store.name || '店铺'}
            </h1>
            {verified && <VerifiedBadge />}
            <button
              type="button"
              onClick={() => setShowContact(true)}
              style={{
                marginLeft: 'auto', flex: 'none', display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px',
                border: '1.5px solid var(--brand-soft-border)', background: 'var(--brand-soft)', color: 'var(--brand-active)',
                borderRadius: 'var(--radius-pill)', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            ><Icons.Headset size={16} />联系客服</button>
          </div>

          {/* intro 行 */}
          {intro && <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>{intro}</p>}

          {/* 信任 chips */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <TrustChip icon={<Icons.ShieldCheck size={16} />}>平台担保交易</TrustChip>
            <TrustChip icon={<Icons.Zap size={16} />}>自动发货 · 秒到账</TrustChip>
            <TrustChip icon={<Icons.RefreshCw size={16} />}>非人为问题包补</TrustChip>
            <TrustChip icon={<Icons.Headset size={16} />}>7×24 在线客服</TrustChip>
          </div>
        </div>

        {/* 店铺公告条(商户 announcement,区别于平台公告) */}
        {announcement && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 9, marginTop: 12, padding: '10px 13px',
            background: 'var(--pending-bg, #fff8eb)', border: '1px solid var(--pending-border, #fde7b8)',
            borderRadius: 'var(--radius-md)', color: 'var(--pending-fg, #92600a)',
          }}>
            <Icons.Megaphone size={17} color="var(--pending-fg, #92600a)" style={{ flex: 'none', marginTop: 1 }} />
            <span style={{ fontSize: 13, lineHeight: 1.55, fontWeight: 600 }}>{announcement}</span>
          </div>
        )}
      </div>

      {/* 销售类型下划线 Tab(卡密/知识/资源/权益)— 切换类型即切布局 */}
      {!loading && !error && (
        <div style={{ maxWidth: 'var(--container-page)', margin: '0 auto', padding: '0 16px', marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 28, borderBottom: '1px solid var(--border)' }}>
            {[1, 2, 3, 4].map((t) => {
              const m = GOODS_TYPE_META[t] || { short: '商品' };
              const on = typeFilter === t;
              return (
                <button key={t} type="button" onClick={() => { setTypeFilter(t); setCat('all'); }} style={{
                  position: 'relative', border: 'none', background: 'transparent', cursor: 'pointer',
                  padding: '8px 2px 12px', fontFamily: 'var(--font-sans)',
                  fontWeight: on ? 800 : 600, fontSize: 16,
                  color: on ? 'var(--brand)' : 'var(--text-body)', transition: 'color .15s',
                }}>
                  {m.short}
                  {on && <span style={{ position: 'absolute', left: '50%', bottom: 4, transform: 'translateX(-50%)', width: 24, height: 3, borderRadius: 2, background: 'var(--brand)' }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 商品搜索框 */}
      {!loading && !error && (
        <div style={{ maxWidth: 'var(--container-page)', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 9, height: 42, padding: '0 14px',
              background: '#fff', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-pill)',
            }}>
              <Icons.Search size={18} color="var(--text-subtle)" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索店内商品"
                aria-label="搜索商品"
                style={{
                  flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
                  fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-strong)',
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="清除搜索"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, flex: 'none',
                    border: 'none', background: 'var(--border)', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-muted)',
                  }}
                ><Icons.X size={13} /></button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 排序 + 分类筛选(吸顶,避免滚动时与商品串字) */}
      {!loading && !error && (tabs.length > 1 || true) && (
        <div style={{
          maxWidth: 'var(--container-page)', margin: '0 auto', padding: '0 16px', marginTop: 12,
          position: 'sticky', top: 'var(--topbar-h, 60px)', zIndex: 14,
          background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(8px)',
        }}>
          {/* 分类计数方框 */}
          {tabs.length > 1 && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10 }}>
              {tabs.map((c) => {
                const on = c.id === cat;
                return (
                  <button key={String(c.id)} type="button" onClick={() => setCat(c.id)} style={{
                    flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px',
                    cursor: 'pointer', borderRadius: 'var(--radius-pill)',
                    background: on ? 'var(--brand-soft)' : '#fff',
                    border: on ? '1.5px solid var(--brand)' : '1px solid var(--border)',
                    fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: on ? 800 : 600,
                    color: on ? 'var(--brand-active)' : 'var(--text-body)', whiteSpace: 'nowrap', transition: 'all .15s',
                  }}>
                    {c.image ? <img src={c.image} alt="" style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover' }} /> : null}
                    <span>{c.name}</span>
                    {!q && c.goods_count != null ? <span style={{ fontSize: 12, fontWeight: 600, color: on ? 'var(--brand-active)' : 'var(--text-subtle)', opacity: .8 }}>{c.goods_count}</span> : null}
                  </button>
                );
              })}
            </div>
          )}
          {/* 排序行(综合/销量/上新/价格) */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4, height: 42,
            borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
          }}>
            {SORTS.map((s) => {
              const on = s === sort;
              const isPrice = s === '价格';
              return (
                <button key={s} type="button" onClick={() => { if (isPrice && on) setPriceDir((d) => d === 'asc' ? 'desc' : 'asc'); setSort(s); }} style={{
                  flex: 'none', display: 'flex', alignItems: 'center', gap: 2, height: 30, padding: '0 14px',
                  border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  fontWeight: on ? 800 : 600, fontSize: 13.5, color: on ? 'var(--brand)' : 'var(--text-body)',
                }}>
                  {s}
                  {isPrice && (
                    <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: .5, marginLeft: 1 }}>
                      <span style={{ fontSize: 8, color: on && priceDir === 'asc' ? 'var(--brand)' : 'var(--text-subtle)' }}>▲</span>
                      <span style={{ fontSize: 8, color: on && priceDir === 'desc' ? 'var(--brand)' : 'var(--text-subtle)' }}>▼</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 商品区 */}
      <div style={{ maxWidth: 'var(--container-page)', margin: '0 auto', padding: '12px 16px 24px' }}>
        {loading ? (
          <div className="mk-pgrid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                height: 230, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                background: 'linear-gradient(90deg, var(--bg-subtle, #f2f4f7) 25%, #e9edf2 50%, var(--bg-subtle, #f2f4f7) 75%)',
                backgroundSize: '200% 100%', animation: 'mk-shimmer 1.2s ease-in-out infinite',
              }} />
            ))}
            <style>{'@keyframes mk-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}'}</style>
          </div>
        ) : error ? (
          <StateWrap>
            <Icons.AlertTriangle size={40} color="var(--price-accent)" />
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-strong)' }}>
              {(error && error.message) || (typeof error === 'string' ? error : '') || '加载失败,请重试'}
            </div>
            <button type="button" onClick={onReload} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, height: 40, padding: '0 20px',
              border: 'none', background: 'var(--brand)', color: '#fff', borderRadius: 'var(--radius-pill)',
              fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              boxShadow: 'var(--shadow-brand)',
            }}><Icons.RefreshCw size={16} color="#fff" />重试</button>
          </StateWrap>
        ) : shown.length === 0 ? (
          <StateWrap>
            <Icons.Inbox size={44} color="var(--text-subtle)" />
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-strong)' }}>
              {q ? '没有找到相关商品' : (allCount === 0 ? '该店铺暂无在售商品' : '当前类型下暂无商品')}
            </div>
          </StateWrap>
        ) : typeFilter === 1 ? (
          /* 卡密:2 列 image-led 网格 */
          <>
            <div ref={gridRef} className="mk-pgrid">
              {shown.map((p) => {
                const meta = GOODS_TYPE_META[1] || { short: '卡密' };
                const stock = Number(p.stock ?? 0);
                const soldVal = p.sold != null ? p.sold : (p.sales_count != null ? p.sales_count : undefined);
                return (
                  <ProductCard
                    key={p.id}
                    name={p.name}
                    price={Number(p.price)}
                    original={(p.original != null && Number(p.original) > Number(p.price)) ? Number(p.original) : undefined}
                    stock={stock}
                    image={p.image || undefined}
                    thumb={p.thumb || meta.emoji || '📦'}
                    typeLabel={meta.short}
                    promo={p.on_sale ? '限时' : undefined}
                    sold={soldVal}
                    onClick={() => onSelect && onSelect(p)}
                    onCart={() => onSelect && onSelect(p)}
                  />
                );
              })}
            </div>
            <div style={{ textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13, marginTop: 24 }}>— 没有更多了 —</div>
          </>
        ) : (
          /* 知识 / 资源 / 权益:单列列表(左缩略图 + 右标题/价/分类) */
          <>
            <div ref={gridRef} className="mk-prows" style={{ margin: '0 auto' }}>
              {shown.map((p) => (
                <ProductListRow key={p.id} p={p}
                  catName={p.category_id != null ? (catNameById[String(normId(p.category_id))] || '') : ''}
                  onSelect={onSelect} />
              ))}
            </div>
            <div style={{ textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13, marginTop: 18 }}>— 没有更多了 —</div>
          </>
        )}
      </div>

      {/* 底部 tab bar(客服项打开联系弹窗,其余 tab 均有真实行为) */}
      <nav className="mk-bottomnav" style={{
        position: 'sticky', bottom: 0, zIndex: 15, background: 'rgba(255,255,255,.94)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border)', display: 'flex', maxWidth: 'var(--container-page)', margin: '0 auto',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        {[
          { k: 'home', label: '首页', icon: Icons.Star, active: true, onTap: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
          { k: 'goods', label: '宝贝', icon: Icons.Package, onTap: () => { if (gridRef.current) gridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); } },
          { k: 'store', label: '门店', icon: Icons.Shield, onTap: () => setShowContact(true) },
          { k: 'new', label: '新品', icon: Icons.Zap, onTap: () => setSort('上新') },
          { k: 'service', label: '客服', icon: Icons.Headset, onTap: () => setShowContact(true) },
        ].map((it) => (
          <button key={it.k} type="button" onClick={it.onTap || undefined} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 0 10px',
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: it.active ? 'var(--brand)' : 'var(--text-muted)', fontFamily: 'var(--font-sans)',
            fontWeight: it.active ? 800 : 600, fontSize: 11,
          }}>
            <it.icon size={22} />{it.label}
          </button>
        ))}
      </nav>

      {showContact && <ContactModal contact={store.contact} onClose={() => setShowContact(false)} />}
    </div>
  );
}
