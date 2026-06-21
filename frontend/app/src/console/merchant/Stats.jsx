import React from 'react';
import { useAsync, Panel, DataTable, Money, StatCard } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';

/* 按时段问候(对标鲸发卡「早上好,又是元气满满的一天」) */
function greetingPhrase() {
  const h = new Date().getHours();
  if (h < 6) return ['夜深了', '注意休息,生意会一直在'];
  if (h < 12) return ['早上好', '又是元气满满的一天,祝你开单顺利'];
  if (h < 14) return ['中午好', '忙碌之余记得休息一下'];
  if (h < 18) return ['下午好', '保持节奏,继续冲业绩'];
  return ['晚上好', '辛苦了,今天也在认真经营'];
}

/* 常用功能快捷入口(对标卖家后台首页「常用功能」图标格) */
const QUICK_LINKS = [
  { key: 'm-products', label: '商品管理', icon: 'Package', tone: 'brand' },
  { key: 'm-cards', label: '卡密管理', icon: 'Lock', tone: 'secure' },
  { key: 'm-orders', label: '订单管理', icon: 'Search', tone: 'success' },
  { key: 'm-wallet', label: '钱包提现', icon: 'RefreshCw', tone: 'pending' },
  { key: 'm-shop', label: '店铺装修', icon: 'ShieldCheck', tone: 'neutral' },
];

const QUICK_TONE = {
  brand: ['var(--brand-active)', 'var(--brand-soft)'],
  secure: ['var(--secure-fg)', 'var(--secure-bg)'],
  success: ['var(--success-fg)', 'var(--success-bg)'],
  pending: ['var(--pending-fg)', 'var(--pending-bg)'],
  neutral: ['var(--text-body)', 'var(--surface-sunken)'],
};

function QuickLink({ label, icon, tone, onClick }) {
  const Icon = Icons[icon] || Icons.Package;
  const [fg, bg] = QUICK_TONE[tone] || QUICK_TONE.brand;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: '1 1 96px', minWidth: 92, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        padding: '16px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
        background: '#fff', cursor: 'pointer', fontFamily: 'var(--font-sans)',
      }}
    >
      <span style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color={fg} />
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-body)' }}>{label}</span>
    </button>
  );
}

export default function Stats({ api, session, onNavigate }) {
  const summary = useAsync(() => api.statsSummary(), []);
  const top = useAsync(() => api.topProducts({ limit: 10 }), []);

  const s = summary.data || {};
  const storeName = session?.user?.store_name || '商户';
  const [hello, cheer] = greetingPhrase();
  const go = (key) => { if (onNavigate) onNavigate(key); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* 问候卡 */}
      <section
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
          padding: '20px 22px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)',
          background: 'linear-gradient(120deg, var(--brand-soft), #fff)', border: '1px solid var(--brand-soft-border)',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.01em' }}>
            您好,{storeName} 👋
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 4 }}>
            {hello},{cheer}
          </div>
        </div>
        <span style={{ width: 52, height: 52, flex: 'none', borderRadius: 16, background: '#fff', boxShadow: 'var(--shadow-xs)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icons.Zap size={26} color="var(--brand)" />
        </span>
      </section>

      {/* 数据卡区 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        <StatCard
          label="销售额"
          value={<Money amount={Number(s.sales || 0)} strong />}
          icon="Zap"
          tone="brand"
          sub="已支付 + 已发货订单"
        />
        <StatCard
          label="订单数"
          value={s.order_count != null ? s.order_count : (summary.loading ? '—' : 0)}
          icon="Package"
          tone="success"
          sub="计入有效订单"
        />
      </div>

      {/* 常用功能 */}
      <Panel title="常用功能" subtitle="快速进入各业务模块">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {QUICK_LINKS.map((q) => (
            <QuickLink key={q.key} label={q.label} icon={q.icon} tone={q.tone} onClick={() => go(q.key)} />
          ))}
        </div>
      </Panel>

      {/* 热销商品 */}
      <Panel title="热销商品" subtitle="按销量排序 Top 10">
        <DataTable
          columns={[
            { key: 'product_id', title: '商品', render: (r) => r.product_title || '#' + r.product_id },
            { key: 'qty', title: '销量', align: 'right', render: (r) => Number(r.qty || 0) },
            { key: 'order_count', title: '订单数', align: 'right', render: (r) => Number(r.order_count || 0) },
            { key: 'sales', title: '销售额', align: 'right', render: (r) => <Money amount={Number(r.sales || 0)} strong /> },
          ]}
          rows={top.data || []}
          loading={top.loading}
          error={top.error}
          onReload={top.reload}
          empty="暂无销售数据"
        />
      </Panel>
    </div>
  );
}
