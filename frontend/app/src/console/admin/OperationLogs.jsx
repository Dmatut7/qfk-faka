import React from 'react';
import { useAsync, Panel, Toolbar, DataTable, Pill } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { Button } from '../../../../design-system/components/core/Button.jsx';

/* 平台操作审计:展示敏感后台操作留痕(type=admin_op)。对标鲸商城PRO 总后台「操作日志」。 */
const ACTION = {
  order_refund:      { label: '订单退款', tone: 'danger' },
  complaint_resolve: { label: '投诉解决', tone: 'success' },
  complaint_reject:  { label: '投诉驳回', tone: 'neutral' },
  blacklist_add:     { label: '拉黑买家', tone: 'danger' },
  blacklist_remove:  { label: '解除黑名单', tone: 'neutral' },
  merchant_approve:  { label: '商户审核', tone: 'success' },
  merchant_freeze:   { label: '冻结商户', tone: 'danger' },
  merchant_unfreeze: { label: '解冻商户', tone: 'brand' },
  withdraw_approve:  { label: '提现打款', tone: 'success' },
  withdraw_reject:   { label: '驳回提现', tone: 'neutral' },
};

const PAGE_SIZE = 20;

export default function OperationLogs({ api }) {
  const [page, setPage] = React.useState(1);
  const list = useAsync(() => api.logs({ type: 'admin_op', page }), [page]);
  const items = list.data?.items || [];
  const total = list.data?.total || 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const ctxOf = (r) => {
    let c = r.context;
    if (typeof c === 'string') { try { c = JSON.parse(c); } catch { c = {}; } }
    return c || {};
  };

  const columns = [
    { key: 'action', title: '操作', width: 120, render: (r) => {
      const a = ACTION[ctxOf(r).action] || { label: ctxOf(r).action || '操作', tone: 'neutral' };
      return <Pill tone={a.tone}>{a.label}</Pill>;
    } },
    { key: 'message', title: '说明', render: (r) => <span style={{ fontSize: 13 }}>{r.message}</span> },
    { key: 'actor', title: '操作员', width: 90, render: (r) => <span style={{ fontSize: 12.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>管理员#{ctxOf(r).actor_id ?? '—'}</span> },
    { key: 'create_time', title: '时间', width: 170, render: (r) => <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{r.create_time || '—'}</span> },
  ];

  return (
    <Panel title="操作日志" subtitle="平台敏感操作审计留痕(退款 / 投诉裁决 / 黑名单 / 商户审核 / 提现打款)">
      <Toolbar right={<Button variant="ghost" iconLeft={<Icons.RefreshCw />} onClick={list.reload}>刷新</Button>}>
        共 {total} 条操作记录
      </Toolbar>
      <DataTable columns={columns} rows={items} loading={list.loading} error={list.error} onReload={list.reload} empty="暂无操作记录" emptyIcon="ShieldCheck" />
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
