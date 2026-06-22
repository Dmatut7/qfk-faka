import React from 'react';
import { api, ApiError } from '../api.js';
import { Icons } from '../Icons.jsx';
import { Button } from '../../../design-system/components/core/Button.jsx';

/* 门户首页(平台 SaaS 落地页,对标鲸商城PRO 网站首页)。
   Hero + 平台数据 + 最新资讯 + 入口(进入商城/订单查询/常见问题/开通小店)。
   纯前端,数据来自已就绪的门户公开 API。 */
export default function Portal({ config, onEnterShop, onLookup, onNews, onFaq, onForbidden }) {
  const siteName = config?.site?.name || '秒卡发卡';
  const [stats, setStats] = React.useState(null);
  const [news, setNews] = React.useState([]);

  React.useEffect(() => {
    let alive = true;
    api.platformStats().then((s) => alive && setStats(s)).catch(() => {});
    api.articles({ type: 1, limit: 5 }).then((d) => alive && setNews(Array.isArray(d.items) ? d.items : [])).catch((e) => { if (!(e instanceof ApiError)) { /* 静默 */ } });
    return () => { alive = false; };
  }, []);

  const openConsole = () => { if (typeof window !== 'undefined') window.open('/console.html', '_blank', 'noopener'); };

  const STAT = [
    { k: 'merchants', label: '入驻商家', icon: 'Package' },
    { k: 'products', label: '在售商品', icon: 'Inbox' },
    { k: 'orders', label: '累计成交', icon: 'Check' },
  ];
  const ENTRIES = [
    { label: '进入商城', icon: 'Package', tone: 'brand', onClick: onEnterShop },
    { label: '订单查询', icon: 'Search', tone: 'success', onClick: onLookup },
    { label: '常见问题', icon: 'Headset', tone: 'secure', onClick: onFaq },
    { label: '最新资讯', icon: 'Megaphone', tone: 'pending', onClick: onNews },
    { label: '禁售目录', icon: 'Lock', tone: 'danger', onClick: onForbidden },
    { label: '开通小店', icon: 'ShieldCheck', tone: 'brand', onClick: openConsole },
    { label: '商家中心', icon: 'Lock', tone: 'neutral', onClick: openConsole },
  ];

  return (
    <div style={{ maxWidth: 'var(--container-page, 1100px)', margin: '0 auto', padding: '0 16px 80px' }}>
      {/* Hero */}
      <section style={{
        marginTop: 20, borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
        background: 'linear-gradient(120deg, var(--secure-solid, #2563eb) 0%, var(--brand, #4f46e5) 60%, var(--brand-active, #4338ca) 100%)',
        color: '#fff', padding: '40px 28px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.02em' }}>{siteName}</div>
        <div style={{ fontSize: 15, marginTop: 10, opacity: 0.92 }}>为数字虚拟商品打造的自动发货寄售平台 · 卡密 / 知识 / 资源 / 权益</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 22, flexWrap: 'wrap' }}>
          <Button variant="secondary" size="lg" iconLeft={<Icons.Package size={18} />} onClick={onEnterShop}>进入商城</Button>
          <Button variant="ghost" size="lg" onClick={openConsole} style={{ color: '#fff', borderColor: 'rgba(255,255,255,.5)' }}>开通小店</Button>
        </div>
      </section>

      {/* 平台数据 */}
      <section style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
        {STAT.map((s) => {
          const Icon = Icons[s.icon] || Icons.Package;
          return (
            <div key={s.k} style={{ flex: '1 1 180px', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: 'var(--shadow-xs)' }}>
              <span style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--brand-soft)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Icon size={22} color="var(--brand)" /></span>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-strong)', fontVariantNumeric: 'tabular-nums' }}>{stats ? (stats[s.k] ?? 0) : '—'}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </section>

      {/* 入口宫格 */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginTop: 16 }}>
        {ENTRIES.map((e) => {
          const Icon = Icons[e.icon] || Icons.Package;
          return (
            <button key={e.label} onClick={e.onClick} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 12px', cursor: 'pointer',
              background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', fontFamily: 'var(--font-sans)', boxShadow: 'var(--shadow-xs)',
            }}>
              <span style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--brand-soft)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={22} color="var(--brand)" /></span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>{e.label}</span>
            </button>
          );
        })}
      </section>

      {/* 最新资讯 */}
      <section style={{ marginTop: 22, background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xs)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-strong)' }}>最新资讯</span>
          <button onClick={onNews} style={{ border: 'none', background: 'transparent', color: 'var(--brand-active)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>查看全部 ›</button>
        </div>
        {news.length === 0 ? (
          <div style={{ padding: '28px 0', textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13.5 }}>暂无资讯</div>
        ) : (
          <div>
            {news.map((a) => (
              <button key={a.id} onClick={onNews} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%', textAlign: 'left', padding: '13px 18px', border: 'none', borderBottom: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                <span style={{ fontSize: 14, color: 'var(--text-strong)', fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</span>
                <span style={{ fontSize: 12, color: 'var(--text-subtle)', flex: 'none' }}>{String(a.create_time || '').slice(0, 10)}</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
