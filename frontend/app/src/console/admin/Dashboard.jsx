import React from 'react';
import { useAsync, Panel, StatCard, Money, Spinner, ErrorBar } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { Button } from '../../../../design-system/components/core/Button.jsx';

/* 平台仪表盘:聚合关键指标(商户 / 订单 / 成交额 / 提现 / 商品 / 卡密)。 */
export default function Dashboard({ api }) {
  const d = useAsync(api.dashboard);
  const data = d.data || {};

  // 容错:后端字段名差异时回退到常见命名
  const num = (...keys) => {
    for (const k of keys) {
      if (data[k] != null) return data[k];
    }
    return 0;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Panel
        title="平台概览"
        subtitle="商户、订单、成交额与待办的实时汇总"
        padded={false}
        actions={
          <Button variant="secondary" size="sm" iconLeft={<Icons.RefreshCw size={15} />}
            onClick={d.reload} disabled={d.loading}>刷新</Button>
        }
      >
        <div style={{ padding: 18 }}>
          {d.loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}><Spinner /></div>
          ) : d.error ? (
            <ErrorBar message={d.error} onRetry={d.reload} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* 商户 */}
              <Block title="商户">
                <StatCard label="商户总数" value={num('merchant_total', 'merchants_total', 'merchant_count')} icon="Package" tone="brand" />
                <StatCard label="待审核商户" value={num('merchant_pending', 'pending_merchants', 'merchant_pending_count')} icon="Clock" tone="pending" />
              </Block>

              {/* 订单与成交额 */}
              <Block title="订单 / 成交额">
                <StatCard label="订单总数" value={num('order_total', 'orders_total', 'order_count')} icon="Search" tone="brand" />
                <StatCard label="今日订单" value={num('order_today', 'today_orders', 'order_today_count')} icon="Zap" tone="secure" />
                <StatCard label="成交总额" value={<Money amount={num('amount_total', 'gmv_total', 'paid_amount_total')} strong />} icon="RefreshCw" tone="success" />
                <StatCard label="今日成交额" value={<Money amount={num('amount_today', 'gmv_today', 'paid_amount_today')} strong />} icon="RefreshCw" tone="success" />
              </Block>

              {/* 待办 */}
              <Block title="待办">
                <StatCard
                  label="待审核提现"
                  value={num('withdrawal_pending', 'pending_withdrawals', 'withdrawal_pending_count')}
                  icon="RefreshCw" tone="pending"
                  sub={<Money amount={num('withdrawal_pending_amount', 'pending_withdrawal_amount')} />}
                />
              </Block>

              {/* 商品 / 卡密 */}
              <Block title="商品 / 卡密">
                <StatCard label="在售商品" value={num('product_on_sale', 'on_sale_products', 'product_on_sale_count')} icon="Inbox" tone="brand" />
                <StatCard label="未售卡密" value={num('card_unsold', 'unsold_cards', 'card_unsold_count')} icon="Lock" tone="secure" />
              </Block>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}

/* 概览分块:小标题 + 卡片行 */
function Block({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>{children}</div>
    </div>
  );
}
