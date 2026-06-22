import React from 'react';
import { Icons } from '../Icons.jsx';
import { normId } from '../api.js';

/* 鲸发卡风格发卡商城首页 —
   店招(cover 横幅 + 圆形 logo 叠左下 + 店名 + 认证 + 三联统计 + 联系客服)
   + 公告条 + 分类 tab(按 category_id 精确筛选)+ 2 列带图商品网格 + 联系客服弹窗。
   数据全部来自 props(已 normalize),无 window.MK_*。 */

const money = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
};

/* —— 已认证徽章 —— */
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

/* —— 三联统计单元 —— */
function Stat({ value, label, icon }) {
  return (
    <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        fontSize: 17, fontWeight: 800, color: 'var(--text-strong)', fontVariantNumeric: 'tabular-nums',
      }}>
        {icon}{value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, whiteSpace: 'nowrap' }}>{label}</div>
    </div>
  );
}

/* —— 库存标签 ——
   showStockType=1 精确显示「库存 N」;否则模糊(充足/少量/缺货)。
   缺货(stock<=0)始终显示「缺货」,与显示方式无关。 */
function StockPill({ stock, showStockType, isCard = true }) {
  let bg = 'var(--success-bg)', fg = 'var(--success-fg)', bd = 'var(--success-border)', txt = '库存充足';
  // 非卡密类(知识/资源/权益)无卡库存概念,统一显示「现货」
  if (!isCard) { txt = '现货'; }
  else if (stock <= 0) { bg = 'var(--surface-sunken)'; fg = 'var(--text-muted)'; bd = 'var(--border)'; txt = '缺货'; }
  else if (Number(showStockType) === 1) { txt = `库存 ${stock}`; }
  else if (stock <= 20) { bg = 'var(--pending-bg)'; fg = 'var(--pending-fg)'; bd = 'var(--pending-border)'; txt = '库存少量'; }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 8px',
      background: bg, color: fg, border: `1px solid ${bd}`, borderRadius: 'var(--radius-pill)',
      fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', flex: 'none',
    }}>{txt}</span>
  );
}

/* —— 带图缩略(加载失败回退 emoji 占位,不破图) —— */
function GoodsThumb({ src, alt, thumb, fontSize = 38 }) {
  const [failed, setFailed] = React.useState(false);
  // src 变化时重置失败态,避免新图沿用旧的回退态
  React.useEffect(() => { setFailed(false); }, [src]);
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    );
  }
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize }}>{thumb}</div>
  );
}

/* —— 带图商品卡(2 列网格用) —— */
function GoodsCard({ p, onClick }) {
  const isCard = Number(p.goods_type ?? 1) === 1;
  const out = isCard ? p.stock <= 0 : false;
  const hasOriginal = p.original != null && p.original > p.price;
  return (
    <button
      type="button"
      onClick={out ? undefined : onClick}
      disabled={out}
      style={{
        display: 'flex', flexDirection: 'column', textAlign: 'left', padding: 0, width: '100%',
        background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
        overflow: 'hidden', cursor: out ? 'default' : 'pointer', opacity: out ? 0.66 : 1,
        boxShadow: 'var(--shadow-xs)', fontFamily: 'var(--font-sans)',
        transition: 'transform .15s, box-shadow .15s, border-color .15s',
      }}
      onMouseEnter={(e) => { if (!out) { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* 图片 16:9 */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: 'var(--brand-soft)', overflow: 'hidden' }}>
        <GoodsThumb src={p.image} alt={p.name} thumb={p.thumb} fontSize={38} />
        <div style={{ position: 'absolute', top: 8, right: 8 }}><StockPill stock={p.stock} showStockType={p.show_stock_type} isCard={isCard} /></div>
        {p.on_sale && (
          <div style={{ position: 'absolute', top: 8, left: 8, display: 'inline-flex', alignItems: 'center', gap: 3, height: 20, padding: '0 8px', background: 'var(--danger-solid, #e5484d)', color: '#fff', borderRadius: 'var(--radius-pill)', fontSize: 11, fontWeight: 800 }}>限时</div>
        )}
      </div>
      {/* 内容 */}
      <div style={{ padding: '10px 11px 12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{
          fontSize: 14, fontWeight: 700, color: 'var(--text-strong)', lineHeight: 1.35,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.7em',
        }}>{p.name}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--price-accent)', fontWeight: 800, fontSize: 18, fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ fontSize: 12, marginRight: 1 }}>¥</span>{money(p.price)}
          </span>
          {hasOriginal && (
            <span style={{ color: 'var(--text-subtle)', textDecoration: 'line-through', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
              ¥{money(p.original)}
            </span>
          )}
        </div>
        {p.sales_count != null && (
          <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', marginTop: 6 }}>已售 {p.sales_count}</div>
        )}
      </div>
    </button>
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
          padding: '18px 18px calc(18px + env(safe-area-inset-bottom, 0px))', boxShadow: 'var(--shadow-lg, 0 -10px 40px rgba(18,27,42,.18))',
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

/* —— 平台公告条(店招之上,可关闭;多条轮播显示最新一条 + 点击看全部) —— */
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
      <div style={{
        display: 'flex', alignItems: 'center', gap: 9, padding: '9px 14px',
        background: 'var(--brand-soft, #eef3ff)', borderBottom: '1px solid var(--brand-soft-border, #d6e2ff)',
        color: 'var(--brand-active)',
      }}>
        <Icons.Megaphone size={17} color="var(--brand-active)" style={{ flex: 'none' }} />
        <button
          type="button"
          onClick={() => setShowAll(true)}
          title="查看全部平台公告"
          style={{
            flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6, padding: 0, border: 'none',
            background: 'transparent', cursor: 'pointer', textAlign: 'left', color: 'inherit',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <span style={{
            flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
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
            border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--brand-active)', opacity: .7,
          }}
        ><Icons.X size={15} /></button>
      </div>
      {showAll && <PlatformNoticeModal notices={notices} onClose={() => setShowAll(false)} />}
    </>
  );
}

const GRID = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 };

/* 商品类型分组陈列(对标鲸商城PRO 店铺首页按销售类型分组)。emoji 与演示站一致。 */
const GOODS_TYPE_META = {
  1: { name: '数字卡密', emoji: '⚡️' },
  2: { name: '知识文章', emoji: '☘️' },
  3: { name: '资源下载', emoji: '💎' },
  4: { name: '数字权益', emoji: '👑' },
};
const GOODS_TYPE_ORDER = [1, 2, 3, 4];

/* 把商品按 goods_type 分组,返回有序非空分组 [{type, meta, items}] */
function groupByGoodsType(products) {
  const buckets = new Map();
  for (const p of products) {
    const t = Number(p.goods_type ?? 1);
    if (!buckets.has(t)) buckets.set(t, []);
    buckets.get(t).push(p);
  }
  // 已知类型按固定顺序在前,未知类型(理论上无)兜底排后
  const types = [...buckets.keys()].sort((a, b) => {
    const ia = GOODS_TYPE_ORDER.indexOf(a), ib = GOODS_TYPE_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  return types.map((t) => ({
    type: t,
    meta: GOODS_TYPE_META[t] || { name: '其他商品', emoji: '📦' },
    items: buckets.get(t),
  }));
}

/* 顶部 4 横排销售类型卡(对标鲸商城PRO 店铺招牌):点击按类型筛选 */
function TypeSummaryCards({ counts, active, onPick }) {
  const types = GOODS_TYPE_ORDER.filter((t) => (counts[t] || 0) > 0);
  if (types.length < 2) return null; // 单一类型店无需类型卡
  return (
    <div style={{ maxWidth: 'var(--container-page)', margin: '0 auto', padding: '18px 16px 0' }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {types.map((t) => {
          const meta = GOODS_TYPE_META[t];
          const on = active === t;
          return (
            <button key={t} type="button" onClick={() => onPick(on ? null : t)} style={{
              flex: '1 1 200px', minWidth: 170, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 10, padding: '16px 18px', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)',
              borderRadius: 'var(--radius-lg)', background: on ? 'var(--brand-soft)' : '#fff',
              border: on ? '1.5px solid var(--brand)' : '1px solid var(--border)', boxShadow: 'var(--shadow-xs)',
            }}>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 16, fontWeight: 800, color: on ? 'var(--brand-active)' : 'var(--text-strong)', letterSpacing: '-0.01em' }}>{meta.name}</span>
                <span style={{ display: 'block', fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>包含 {counts[t] || 0} 件商品</span>
              </span>
              <span style={{ fontSize: 26, flex: 'none' }} aria-hidden="true">{meta.emoji}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* 类型分组小节:标题(emoji + 名称 + 计数)+ 2 列网格 */
function GoodsTypeSection({ group, onSelect }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 2px 12px' }}>
        <span style={{ fontSize: 18 }} aria-hidden="true">{group.meta.emoji}</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.01em' }}>{group.meta.name}</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-subtle)' }}>{group.items.length} 件</span>
        <span style={{ flex: 1, height: 1, background: 'var(--border)', marginLeft: 6 }} />
      </div>
      <div style={GRID}>
        {group.items.map((p) => (
          <GoodsCard key={p.id} p={p} onClick={() => onSelect && onSelect(p)} />
        ))}
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

export default function StorefrontHome({ shop, categories, products, loading, error, onReload, onSelect }) {
  const [cat, setCat] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState(null); // null=全部类型;否则 goods_type
  const [query, setQuery] = React.useState('');
  const [showContact, setShowContact] = React.useState(false);
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

  const allCount = list.length;
  const tabs = [{ id: 'all', name: '全部', goods_count: allCount }, ...cats];
  // 按销售类型计数(对标鲸商城PRO 顶部 4 类型卡)
  const typeCounts = React.useMemo(() => {
    const c = {};
    for (const p of list) { const t = Number(p.goods_type ?? 1); c[t] = (c[t] || 0) + 1; }
    return c;
  }, [list]);
  // 真正按 category_id 精确筛选 + 销售类型筛选(类型卡)。
  const byCat = cat === 'all' ? list : list.filter((p) => normId(p.category_id) === normId(cat));
  const byType = typeFilter ? byCat.filter((p) => Number(p.goods_type ?? 1) === typeFilter) : byCat;
  // 客户端实时搜索:在筛选结果上,按 name 包含关键词(不区分大小写)叠加过滤。
  const q = query.trim().toLowerCase();
  const shown = q ? byType.filter((p) => String(p.name || '').toLowerCase().includes(q)) : byType;

  const verified = Number(store.verified) === 1;
  // 平台公告(store.notices,由 App 注入)— 区别于下面的商户店铺公告 announcement 字段。
  const notices = Array.isArray(store.notices) ? store.notices.filter((n) => n && (n.title || n.content)) : [];
  const announcement = (store.announcement || '').trim();
  const intro = (store.intro || '').trim();
  const salesCount = store.sales_count != null ? store.sales_count : 0;
  const deposit = money(store.deposit);

  return (
    <div>
      {/* 平台公告条(店招之上) */}
      {notices.length > 0 && <PlatformNoticeBar notices={notices} />}

      {/* 店招封面横幅 */}
      <div style={{
        height: 150, position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(120% 140% at 80% 0%, #2F6BFF 0%, #1A45BD 45%, #11297A 100%)',
      }}>
        {store.cover && (
          <img src={store.cover} alt="" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,.28) 100%)' }} />
      </div>

      {/* 商家卡片 */}
      <div style={{ maxWidth: 'var(--container-page)', margin: '0 auto', padding: '0 16px' }}>
        <div style={{
          marginTop: -34, position: 'relative', background: '#fff', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)', padding: '0 16px 16px',
        }}>
          {/* 头像(圆形)叠在左下 + 联系客服按钮(右上) */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            <div style={{
              width: 76, height: 76, borderRadius: '50%', marginTop: -30, flex: 'none', overflow: 'hidden',
              background: 'var(--brand)', boxShadow: 'var(--shadow-brand, 0 6px 18px rgba(47,107,255,.35))', border: '4px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 30, fontWeight: 800,
            }}>
              {store.logo
                ? <img src={store.logo} alt={store.name || '店铺'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (store.name || '店').slice(0, 1)}
            </div>
            <button
              type="button"
              onClick={() => setShowContact(true)}
              style={{
                marginLeft: 'auto', marginBottom: 6, flex: 'none', display: 'flex', alignItems: 'center', gap: 6,
                height: 34, padding: '0 14px', border: '1.5px solid var(--brand-soft-border)', background: 'var(--brand-soft)',
                color: 'var(--brand-active)', borderRadius: 'var(--radius-pill)', fontFamily: 'var(--font-sans)',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            ><Icons.Headset size={16} />联系客服</button>
          </div>

          {/* 店名 + 认证 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.01em' }}>
              {store.name || '店铺'}
            </h1>
            {verified && <VerifiedBadge />}
          </div>

          {/* intro 行 */}
          {intro && <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>{intro}</p>}

          {/* 三联统计:商品数 / 成交 / 保证金 */}
          <div style={{ display: 'flex', alignItems: 'stretch', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <Stat value={allCount} label="在售商品" />
            <div style={{ width: 1, background: 'var(--border)', margin: '2px 0' }} />
            <Stat value={salesCount} label="累计成交" />
            <div style={{ width: 1, background: 'var(--border)', margin: '2px 0' }} />
            <Stat value={deposit} label="保证金(元)" icon={<Icons.ShieldCheck size={15} color="var(--secure-solid)" />} />
          </div>
        </div>

        {/* 公告条 */}
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

      {/* 顶部销售类型卡(对标鲸商城PRO 招牌) */}
      {!loading && !error && <TypeSummaryCards counts={typeCounts} active={typeFilter} onPick={setTypeFilter} />}

      {/* 商品搜索框 */}
      {!loading && !error && (
        <div style={{ maxWidth: 'var(--container-page)', margin: '0 auto', padding: '0 16px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9, marginTop: 14, height: 42, padding: '0 14px',
            background: 'var(--surface-sunken, #f2f4f7)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-pill)',
          }}>
            <Icons.Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索商品名称"
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
      )}

      {/* 分类筛选(带计数方框,对标鲸商城PRO) */}
      {tabs.length > 1 && !loading && !error && (
        <div style={{ maxWidth: 'var(--container-page)', margin: '0 auto', padding: '18px 16px 0' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {tabs.map((c) => {
              const on = c.id === cat;
              return (
                <button key={String(c.id)} onClick={() => setCat(c.id)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', cursor: 'pointer',
                  borderRadius: 'var(--radius-md)', background: on ? 'var(--brand-soft)' : '#fff',
                  border: on ? '1.5px solid var(--brand)' : '1px solid var(--border)',
                  fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: on ? 800 : 600,
                  color: on ? 'var(--brand-active)' : 'var(--text-body)', whiteSpace: 'nowrap', transition: 'all .12s',
                }}>
                  {c.image ? <img src={c.image} alt="" style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover' }} /> : null}
                  <span>{c.name}</span>
                  {!q && c.goods_count != null ? <span style={{ fontSize: 12, color: on ? 'var(--brand-active)' : 'var(--text-subtle)' }}>{c.goods_count}</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 商品区 */}
      <div style={{ maxWidth: 'var(--container-page)', margin: '0 auto', padding: '16px 16px 96px' }}>
        {loading ? (
          <div style={GRID}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{
                height: 196, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
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
              {(error && error.message) || (typeof error === 'string' ? error : '') || '加载失败,请重试'}
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
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-strong)' }}>
              {q ? '没有找到相关商品' : (cat === 'all' ? '该店铺暂无在售商品' : '该分类下暂无商品')}
            </div>
          </StateWrap>
        ) : (
          <>
            {(() => {
              const groups = groupByGoodsType(shown);
              // 仅单一类型(如纯卡密店)→ 维持扁平网格,不加分组标题;多类型 → 按类型分组陈列
              if (groups.length <= 1) {
                return (
                  <div style={GRID}>
                    {shown.map((p) => (
                      <GoodsCard key={p.id} p={p} onClick={() => onSelect && onSelect(p)} />
                    ))}
                  </div>
                );
              }
              return groups.map((g) => (
                <GoodsTypeSection key={g.type} group={g} onSelect={onSelect} />
              ));
            })()}
            <div style={{ textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13, marginTop: 28 }}>— 没有更多了 —</div>
          </>
        )}
      </div>

      {showContact && <ContactModal contact={store.contact} onClose={() => setShowContact(false)} />}
    </div>
  );
}
