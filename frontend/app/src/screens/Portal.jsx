import React from 'react';
import { api, ApiError } from '../api.js';
import { Icons } from '../Icons.jsx';
import { Button } from '../../../design-system/components/core/Button.jsx';
import { Badge } from '../../../design-system/components/core/Badge.jsx';

/* 门户首页(平台 SaaS 落地页 · 淘宝商业风橙色系统)。
   Hero(橙色渐变) + 平台数据卡 + 入口宫格 + 最新资讯。
   纯前端,数据来自已就绪的门户公开 API。逻辑/状态/回调与原屏一致,仅重写布局与配色。 */
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
    { label: '进入商城', icon: 'Package', onClick: onEnterShop },
    { label: '订单查询', icon: 'Search', onClick: onLookup },
    { label: '常见问题', icon: 'Headset', onClick: onFaq },
    { label: '最新资讯', icon: 'Megaphone', onClick: onNews },
    { label: '禁售目录', icon: 'Lock', onClick: onForbidden },
    { label: '开通小店', icon: 'ShieldCheck', onClick: openConsole },
    { label: '商家中心', icon: 'Lock', onClick: openConsole },
  ];

  return (
    <div style={{ maxWidth: 'var(--container-page, 1120px)', margin: '0 auto', padding: '0 16px 80px', fontFamily: 'var(--font-sans)' }}>
      {/* Hero — 橙色渐变,平台名 + 标语 + 双 CTA */}
      <section style={{
        marginTop: 20, borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-brand)',
        background: 'var(--brand-gradient)', color: 'var(--text-on-brand)',
        padding: '44px 28px', textAlign: 'center', position: 'relative',
      }}>
        <Badge variant="brand" solid style={{ background: 'rgba(255,255,255,.18)', color: 'var(--text-on-brand)', border: 'none' }}>
          虚拟商品 · 自动发货 · 秒到账
        </Badge>
        <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em', marginTop: 14 }}>{siteName}</div>
        <div style={{ fontSize: 15, marginTop: 10, opacity: 0.94, lineHeight: 1.55 }}>
          为数字虚拟商品打造的自动发货寄售平台 · 卡密 / 知识 / 资源 / 权益
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
          <Button variant="neutral" size="lg" iconLeft={<Icons.Package size={18} color="var(--brand)" />} onClick={onEnterShop}>进入商城</Button>
          <Button
            variant="ghost" size="lg" onClick={openConsole}
            iconLeft={<Icons.ShieldCheck size={18} color="var(--text-on-brand)" />}
            style={{ color: 'var(--text-on-brand)', borderColor: 'rgba(255,255,255,.55)', borderStyle: 'solid' }}
          >
            开通小店
          </Button>
        </div>
      </section>

      {/* 平台数据卡 — 三联统计 */}
      <section style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
        {STAT.map((s) => {
          const Icon = Icons[s.icon] || Icons.Package;
          return (
            <div key={s.k} style={{
              flex: '1 1 180px', background: 'var(--surface-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '18px 20px', display: 'flex', alignItems: 'center',
              gap: 14, boxShadow: 'var(--shadow-xs)',
            }}>
              <span style={{ width: 46, height: 46, borderRadius: 'var(--radius-md)', background: 'var(--brand-soft)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <Icon size={22} color="var(--brand)" />
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 25, fontWeight: 800, color: 'var(--text-strong)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
                  {stats ? (stats[s.k] ?? 0) : '—'}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </section>

      {/* 入口宫格 — 进入商城 / 订单查询 / 常见问题 / 最新资讯 / 禁售目录 / 开通小店 / 商家中心 */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginTop: 16 }}>
        {ENTRIES.map((e) => {
          const Icon = Icons[e.icon] || Icons.Package;
          return (
            <button
              key={e.label} type="button" onClick={e.onClick}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 12px', cursor: 'pointer',
                background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
                fontFamily: 'var(--font-sans)', boxShadow: 'var(--shadow-xs)', transition: 'transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)',
              }}
              onMouseEnter={(ev) => { ev.currentTarget.style.transform = 'translateY(-2px)'; ev.currentTarget.style.boxShadow = 'var(--shadow-md)'; ev.currentTarget.style.borderColor = 'var(--border-brand, var(--orange-300))'; }}
              onMouseLeave={(ev) => { ev.currentTarget.style.transform = 'translateY(0)'; ev.currentTarget.style.boxShadow = 'var(--shadow-xs)'; ev.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <span style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'var(--brand-soft)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={22} color="var(--brand)" />
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>{e.label}</span>
            </button>
          );
        })}
      </section>

      {/* 最新资讯 */}
      <section style={{ marginTop: 22, background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xs)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800, color: 'var(--text-strong)' }}>
            <Icons.Megaphone size={18} color="var(--brand)" /> 最新资讯
          </span>
          <button type="button" onClick={onNews} style={{ border: 'none', background: 'transparent', color: 'var(--text-link)', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            查看全部 ›
          </button>
        </div>
        {news.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13.5 }}>暂无资讯</div>
        ) : (
          <div>
            {news.map((a) => (
              <button
                key={a.id} type="button" onClick={onNews}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%', textAlign: 'left', padding: '13px 18px', border: 'none', borderBottom: '1px solid var(--border)', background: 'var(--surface-card)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
                onMouseEnter={(ev) => { ev.currentTarget.style.background = 'var(--brand-soft)'; }}
                onMouseLeave={(ev) => { ev.currentTarget.style.background = 'var(--surface-card)'; }}
              >
                <span style={{ fontSize: 14, color: 'var(--text-strong)', fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</span>
                <span style={{ fontSize: 12, color: 'var(--text-subtle)', flex: 'none', fontVariantNumeric: 'tabular-nums' }}>{String(a.create_time || '').slice(0, 10)}</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
