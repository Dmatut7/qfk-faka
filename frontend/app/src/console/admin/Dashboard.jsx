import React from 'react';
import { useAsync, Panel, StatCard, Money, Spinner, ErrorBar } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { Button } from '../../../../design-system/components/core/Button.jsx';

/* 平台仪表盘:聚合关键指标(商户 / 订单 / 成交额 / 提现 / 商品 / 卡密)。 */
export default function Dashboard({ api }) {
  const d = useAsync(api.dashboard);
  const data = d.data || {};

  // 后端返回嵌套结构:{merchants:{total,pending,active,frozen}, orders:{total,today,paid,delivered},
  //   sales:{total,today}, withdrawals:{pending_count,pending_amount}, products:{total,on_sale}, cards:{unsold}}
  const merchants = data.merchants || {};
  const orders = data.orders || {};
  const sales = data.sales || {};
  const withdrawals = data.withdrawals || {};
  const products = data.products || {};
  const cards = data.cards || {};
  const n = (v) => (v == null ? 0 : v);

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
                <StatCard label="商户总数" value={n(merchants.total)} icon="Package" tone="brand" sub={`正常 ${n(merchants.active)} · 冻结 ${n(merchants.frozen)}`} />
                <StatCard label="待审核商户" value={n(merchants.pending)} icon="Clock" tone="pending" />
              </Block>

              {/* 订单与成交额 */}
              <Block title="订单 / 成交额">
                <StatCard label="订单总数" value={n(orders.total)} icon="Search" tone="brand" sub={`已发货 ${n(orders.delivered)}`} />
                <StatCard label="今日订单" value={n(orders.today)} icon="Zap" tone="secure" />
                <StatCard label="成交总额" value={<Money amount={n(sales.total)} strong />} icon="RefreshCw" tone="success" />
                <StatCard label="今日成交额" value={<Money amount={n(sales.today)} strong />} icon="RefreshCw" tone="success" />
              </Block>

              {/* 待办 */}
              <Block title="待办">
                <StatCard
                  label="待审核提现"
                  value={n(withdrawals.pending_count)}
                  icon="RefreshCw" tone="pending"
                  sub={<Money amount={n(withdrawals.pending_amount)} />}
                />
              </Block>

              {/* 商品 / 卡密 */}
              <Block title="商品 / 卡密">
                <StatCard label="在售商品" value={n(products.on_sale)} icon="Inbox" tone="brand" sub={`总计 ${n(products.total)}`} />
                <StatCard label="未售卡密" value={n(cards.unsold)} icon="Lock" tone="secure" />
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
