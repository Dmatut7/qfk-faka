import React from 'react';
import { useAsync, Panel, StatCard, Money, Spinner, ErrorBar, Delta } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { Button } from '../../../../design-system/components/core/Button.jsx';

/* 平台仪表盘:对标鲸发卡后台
   问候卡 + 今日数据卡 + 待处理 + 常用功能。
   数据源:adminApi.dashboard() → {merchants,orders,sales,withdrawals,products,cards}。
   props.onNavigate(key):由 ConsoleApp 注入,用于「待处理 / 常用功能」快捷跳转。 */
export default function Dashboard({ api, onNavigate }) {
  const d = useAsync(api.dashboard);
  const data = d.data || {};

  const merchants = data.merchants || {};
  const orders = data.orders || {};
  const sales = data.sales || {};
  const withdrawals = data.withdrawals || {};
  const products = data.products || {};
  const cards = data.cards || {};
  const commission = data.commission || {};
  const profit = data.profit || {};
  const complaints = data.complaints || {};
  const n = (v) => (v == null ? 0 : v);
  const go = (key) => { if (typeof onNavigate === 'function') onNavigate(key); };

  const hour = new Date().getHours();
  const greet = hour < 6 ? '夜深了' : hour < 12 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好';

  if (d.loading) {
    return <div style={{ padding: '60px 0', textAlign: 'center' }}><Spinner /></div>;
  }
  if (d.error) {
    return <ErrorBar message={d.error} onRetry={d.reload} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 问候卡 */}
      <GreetingCard greet={greet} onReload={d.reload} loading={d.loading} />

      {/* 今日 / 概览 数据卡 */}
      <Section title="今日 · 概览">
        <StatCard
          filled
          label="今日成交额" icon="Zap"
          value={`¥${Number(n(sales.today)).toFixed(2)}`}
          sub={`昨日 ¥${Number(n(sales.yesterday)).toFixed(2)} · 累计 ¥${Number(n(sales.total)).toFixed(2)}`}
        />
        <StatCard
          label="今日订单" icon="Search" tone="brand"
          value={n(orders.today)}
          sub={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span>昨日 {n(orders.yesterday)}</span>
              <Delta today={n(orders.today)} yesterday={n(orders.yesterday)} />
            </span>
          }
        />
        <StatCard
          label="平台利润" icon="Lock" tone="brand"
          value={<Money amount={n(profit.today ?? commission.today)} strong />}
          sub={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span>昨日 <Money amount={n(profit.yesterday)} /></span>
              <Delta today={n(profit.today)} yesterday={n(profit.yesterday)} money />
            </span>
          }
        />
        <StatCard
          label="本月利润" icon="Search" tone="success"
          value={<Money amount={n(profit.month)} strong />}
          sub={<span>累计利润 <Money amount={n(profit.total ?? commission.total)} /></span>}
        />
        <StatCard
          label="入驻商户" icon="Package" tone="secure"
          value={n(merchants.total)}
          sub={`今日新增 ${n(merchants.today)} · 正常 ${n(merchants.active)} · 待审核 ${n(merchants.pending)} · 冻结 ${n(merchants.frozen)}`}
        />
        <StatCard
          label="在售商品" icon="Inbox" tone="pending"
          value={n(products.on_sale)}
          sub={`商品总数 ${n(products.total)} · 未售卡密 ${n(cards.unsold)}`}
        />
      </Section>

      {/* 待处理 + 常用功能 并排 */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Panel title="待处理" subtitle="需要您及时跟进的事项" style={{ flex: '1 1 360px', minWidth: 300 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <TodoRow
              icon="RefreshCw" tone="pending"
              label="待审核提现"
              count={n(withdrawals.pending_count)}
              extra={<Money amount={n(withdrawals.pending_amount)} />}
              onClick={() => go('a-withdrawals')}
            />
            <TodoRow
              icon="Clock" tone="brand"
              label="待审核商户"
              count={n(merchants.pending)}
              onClick={() => go('a-merchants')}
            />
            <TodoRow
              icon="AlertTriangle" tone="danger"
              label="异常待人工订单"
              count={n(orders.exception)}
              onClick={() => go('a-orders')}
            />
            <TodoRow
              icon="AlertTriangle" tone="danger"
              label="投诉待仲裁"
              count={n(complaints.intervene)}
              onClick={() => go('a-complaints')}
            />
          </div>
        </Panel>

        <Panel title="常用功能" subtitle="快速进入各管理模块" style={{ flex: '2 1 460px', minWidth: 320 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(98px, 1fr))', gap: 10 }}>
            <QuickAction icon="Package" tone="brand" label="商户审核" onClick={() => go('a-merchants')} />
            <QuickAction icon="RefreshCw" tone="success" label="提现审核" onClick={() => go('a-withdrawals')} />
            <QuickAction icon="AlertTriangle" tone="danger" label="投诉仲裁" onClick={() => go('a-complaints')} />
            <QuickAction icon="Search" tone="secure" label="对账报表" onClick={() => go('a-settlement')} />
            <QuickAction icon="QrCode" tone="pending" label="支付渠道" onClick={() => go('a-channels')} />
            <QuickAction icon="Megaphone" tone="brand" label="内容管理" onClick={() => go('a-content')} />
            <QuickAction icon="Mail" tone="secure" label="邀请码" onClick={() => go('a-invite')} />
            <QuickAction icon="Lock" tone="neutral" label="平台配置" onClick={() => go('a-settings')} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* 问候卡:secure/brand 渐变背景 */
function GreetingCard({ greet, onReload, loading }) {
  return (
    <section style={{
      position: 'relative', overflow: 'hidden',
      borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)',
      background: 'linear-gradient(120deg, var(--orange-400) 0%, var(--orange-500) 55%, var(--orange-700) 100%)',
      color: '#fff', padding: '22px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.01em' }}>
          {greet},平台管理员 <span aria-hidden="true">👋</span>
        </div>
        <div style={{ fontSize: 13.5, marginTop: 6, opacity: 0.9 }}>
          又是元气满满的一天,愿今天订单不断、对账无忧。
        </div>
      </div>
      <Button variant="secondary" size="sm" iconLeft={<Icons.RefreshCw size={15} />} onClick={onReload} disabled={loading}>
        刷新数据
      </Button>
    </section>
  );
}

/* 分区:小标题 + 卡片行 */
function Section({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>{children}</div>
    </div>
  );
}

const TONE_BG = {
  success: ['var(--success-fg)', 'var(--success-bg)'],
  pending: ['var(--pending-fg)', 'var(--pending-bg)'],
  secure: ['var(--secure-fg)', 'var(--secure-bg)'],
  brand: ['var(--brand-active)', 'var(--brand-soft)'],
  danger: ['var(--danger-fg)', 'var(--danger-bg)'],
  neutral: ['var(--text-body)', 'var(--surface-sunken)'],
};

/* 待处理行:可点击跳转 */
function TodoRow({ icon, tone = 'brand', label, count, extra, onClick }) {
  const [fg, bg] = TONE_BG[tone] || TONE_BG.brand;
  const Icon = Icons[icon] || Icons.Clock;
  const has = Number(count) > 0;
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
      padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
      background: '#fff', cursor: 'pointer', fontFamily: 'var(--font-sans)',
    }}>
      <span style={{ width: 36, height: 36, flex: 'none', borderRadius: 10, background: bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={fg} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--text-strong)' }}>{label}</span>
        {extra && <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>待处理金额 {extra}</span>}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 'none' }}>
        <span style={{
          fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em',
          color: has ? 'var(--pending-fg, var(--brand-active))' : 'var(--text-subtle)',
        }}>{count}</span>
        <Icons.ChevronRight size={16} color="var(--text-subtle)" />
      </span>
    </button>
  );
}

/* 常用功能:图标格 */
function QuickAction({ icon, tone = 'brand', label, onClick }) {
  const [fg, bg] = TONE_BG[tone] || TONE_BG.brand;
  const Icon = Icons[icon] || Icons.Package;
  return (
    <button onClick={onClick} title={label} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      padding: '14px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
      background: '#fff', cursor: 'pointer', fontFamily: 'var(--font-sans)',
    }}>
      <span style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color={fg} />
      </span>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-body)', textAlign: 'center' }}>{label}</span>
    </button>
  );
}
