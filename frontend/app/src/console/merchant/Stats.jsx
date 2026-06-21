import React from 'react';
import { useAsync, Panel, DataTable, Money, StatCard } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';

export default function Stats({ api, session }) {
  const summary = useAsync(() => api.statsSummary(), []);
  const top = useAsync(() => api.topProducts({ limit: 10 }), []);

  const s = summary.data || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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

      <Panel title="热销商品" subtitle="按销量排序 Top 10">
        <DataTable
          columns={[
            { key: 'product_id', title: '商品 ID', render: (r) => '#' + r.product_id },
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
