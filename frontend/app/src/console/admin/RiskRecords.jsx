import React from 'react';
import { useAsync, Panel, Toolbar, DataTable, Pill } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { Button } from '../../../../design-system/components/core/Button.jsx';

/* 风控记录:聚合黑名单拦截 + 支付异常(发货受阻)。对标鲸商城PRO 总后台风控记录。 */
const PAGE_SIZE = 20;

function riskOf(r) {
  let c = r.context;
  if (typeof c === 'string') { try { c = JSON.parse(c); } catch { c = {}; } }
  c = c || {};
  if (r.type === 'risk_event') {
    if (c.risk === 'blacklist_block') return { label: '黑名单拦截', tone: 'danger' };
    return { label: '风险事件', tone: 'danger' };
  }
  if (r.type === 'settle_exception') return { label: '支付异常', tone: 'pending' };
  return { label: r.type, tone: 'neutral' };
}

export default function RiskRecords({ api }) {
  const [page, setPage] = React.useState(1);
  const list = useAsync(() => api.riskRecords({ page }), [page]);
  const items = list.data?.items || [];
  const total = list.data?.total || 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const columns = [
    { key: 'risk', title: '风险类型', width: 110, render: (r) => { const x = riskOf(r); return <Pill tone={x.tone}>{x.label}</Pill>; } },
    { key: 'message', title: '说明', render: (r) => <span style={{ fontSize: 13 }}>{r.message}</span> },
    { key: 'order_no', title: '订单', width: 160, render: (r) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.order_no || '—'}</span> },
    { key: 'level', title: '级别', width: 80, render: (r) => <Pill tone={r.level === 'error' ? 'danger' : 'pending'}>{r.level}</Pill> },
    { key: 'create_time', title: '时间', width: 170, render: (r) => <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{r.create_time || '—'}</span> },
  ];

  return (
    <Panel title="风控记录" subtitle="平台风险事件留痕:黑名单买家下单拦截、支付异常(已收款发货受阻)">
      <Toolbar right={<Button variant="ghost" iconLeft={<Icons.RefreshCw />} onClick={list.reload}>刷新</Button>}>
        共 {total} 条风控记录
      </Toolbar>
      <DataTable columns={columns} rows={items} loading={list.loading} error={list.error} onReload={list.reload} empty="暂无风控记录" emptyIcon="ShieldCheck" />
      {total > 0 && pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
          <Button size="sm" variant="neutral" disabled={page <= 1 || list.loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>上一页</Button>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>第 {page} / {pages} 页</span>
          <Button size="sm" variant="neutral" disabled={page >= pages || list.loading} onClick={() => setPage((p) => p + 1)}>下一页</Button>
        </div>
      )}
    </Panel>
  );
}
