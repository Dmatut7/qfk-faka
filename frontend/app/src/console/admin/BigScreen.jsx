import React from 'react';
import { useAsync, Money, Spinner, ErrorBar } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { Button } from '../../../../design-system/components/core/Button.jsx';

/* 大屏数据:对标鲸发卡「大屏数据」。
   深色投屏风格的只读可视化概览,数据全部来自 adminApi.dashboard()。
   纯展示,不改后端、不写业务逻辑。 */
export default function BigScreen({ api }) {
  const d = useAsync(api.dashboard);
  const data = d.data || {};

  const merchants = data.merchants || {};
  const orders = data.orders || {};
  const sales = data.sales || {};
  const commission = data.commission || {};
  const withdrawals = data.withdrawals || {};
  const products = data.products || {};
  const cards = data.cards || {};
  const n = (v) => (v == null ? 0 : v);

  const now = new Date();
  const ts = now.toLocaleString('zh-CN', { hour12: false });

  // 大屏统一深色容器(铺满主内容区,可投屏)
  const shell = {
    background: 'radial-gradient(1200px 600px at 20% -10%, #1e293b 0%, #0f172a 55%, #020617 100%)',
    borderRadius: 18, padding: '26px 28px 30px', color: '#e2e8f0',
    boxShadow: '0 12px 48px rgba(2,6,23,0.45)', minHeight: 480,
    fontFamily: 'var(--font-sans)',
  };

  if (d.loading) {
    return (
      <div style={{ ...shell, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner />
      </div>
    );
  }
  if (d.error) {
    return (
      <div style={{ ...shell, paddingTop: 28 }}>
        <ErrorBar message={d.error} onRetry={d.reload} />
      </div>
    );
  }

  const cards8 = [
    { label: '今日成交额', icon: 'Zap', accent: '#34d399', money: true, value: n(sales.today), sub: <>昨日 <Money amount={n(sales.yesterday)} /></> },
    { label: '今日订单', icon: 'Search', accent: '#60a5fa', value: n(orders.today), sub: `昨日 ${n(orders.yesterday)} 单` },
    { label: '总成交额', icon: 'Star', accent: '#a78bfa', money: true, value: n(sales.total), sub: '平台累计成交' },
    { label: '平台抽佣', icon: 'Lock', accent: '#f472b6', money: true, value: n(commission.total), sub: <>今日 <Money amount={n(commission.today)} /></> },
    { label: '入驻商户', icon: 'ShieldCheck', accent: '#22d3ee', value: n(merchants.total), sub: `正常 ${n(merchants.active)} · 待审 ${n(merchants.pending)}` },
    { label: '在售商品', icon: 'Package', accent: '#fbbf24', value: n(products.on_sale), sub: `商品总数 ${n(products.total)}` },
    { label: '未售卡密', icon: 'Inbox', accent: '#4ade80', value: n(cards.unsold), sub: '可发放库存' },
    { label: '待审提现', icon: 'RefreshCw', accent: '#fb923c', value: n(withdrawals.pending_count), sub: <>金额 <Money amount={n(withdrawals.pending_amount)} /></> },
  ];

  return (
    <div style={shell}>
      {/* 顶部标题条 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <span style={{
            width: 44, height: 44, borderRadius: 12, flex: 'none',
            background: 'linear-gradient(135deg,#6366f1,#22d3ee)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 22px rgba(99,102,241,0.7)',
          }}>
            <Icons.Zap size={24} color="#fff" />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '0.01em', color: '#f8fafc', textShadow: '0 0 18px rgba(99,102,241,0.45)' }}>
              秒卡 · 运营大屏
            </div>
            <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 3 }}>实时经营概览 · 数据更新于 {ts}</div>
          </div>
        </div>
        <Button variant="secondary" size="sm" iconLeft={<Icons.RefreshCw size={15} />} onClick={d.reload} disabled={d.loading}>
          刷新
        </Button>
      </div>

      {/* 大号数字卡网格 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {cards8.map((c) => (
          <BigStat key={c.label} {...c} />
        ))}
      </div>
    </div>
  );
}

/* 大屏数字卡:深色玻璃面板 + 霓虹高亮 + 大字体 */
function BigStat({ label, icon, accent, value, sub, money }) {
  const Icon = Icons[icon] || Icons.Package;
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: 'rgba(15,23,42,0.55)', border: '1px solid rgba(148,163,184,0.18)',
      borderRadius: 16, padding: '20px 20px 22px',
      backdropFilter: 'blur(6px)',
    }}>
      {/* 角落霓虹光晕 */}
      <span aria-hidden="true" style={{
        position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%',
        background: accent, opacity: 0.22, filter: 'blur(28px)', pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{
          width: 30, height: 30, borderRadius: 9, flex: 'none',
          background: `${accent}22`, border: `1px solid ${accent}55`,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} color={accent} />
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#cbd5e1', letterSpacing: '0.02em' }}>{label}</span>
      </div>
      <div style={{
        fontSize: 38, fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.02em',
        color: '#f8fafc', textShadow: `0 0 24px ${accent}66`,
      }}>
        {money
          ? <Money amount={value} strong color="#f8fafc" />
          : Number(value).toLocaleString('zh-CN')}
      </div>
      {sub != null && (
        <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 10 }}>{sub}</div>
      )}
    </div>
  );
}
