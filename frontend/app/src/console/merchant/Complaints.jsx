import React from 'react';
import { useAsync, Panel, Toolbar, DataTable, Pill, Modal, Field } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { ApiError } from '../api.js';
import { Button } from '../../../../design-system/components/core/Button.jsx';

const STATUS = {
  0: { tone: 'pending', label: '待处理' },
  1: { tone: 'brand', label: '已回复' },
  2: { tone: 'danger', label: '平台介入中' },
  3: { tone: 'success', label: '已解决' },
  4: { tone: 'neutral', label: '已驳回' },
};
const TYPE = { 1: '未收到货', 2: '卡密无效', 3: '描述不符', 4: '其他' };
const ACTIVE = [0, 1, 2];

const FILTER_OPTIONS = [
  { value: '0', label: '待处理' },
  { value: '1', label: '已回复' },
  { value: '2', label: '平台介入中' },
  { value: '3', label: '已解决' },
  { value: '4', label: '已驳回' },
];

const PAGE_SIZE = 20;

export default function Complaints({ api }) {
  // 默认高亮「待处理」(status 0)
  const [status, setStatus] = React.useState('0');
  const [page, setPage] = React.useState(1);
  const list = useAsync(() => api.complaints({ status, page }), [status, page]);
  const items = list.data?.items || [];
  const total = list.data?.total || 0;
  const curPage = list.data?.page || page;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const [target, setTarget] = React.useState(null);
  const [reply, setReply] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');

  const open = (row) => { setTarget(row); setReply(row.merchant_reply || ''); setErr(''); };
  const submit = async () => {
    if (!reply.trim()) { setErr('请填写回复内容'); return; }
    setBusy(true); setErr('');
    try {
      await api.replyComplaint(target.id, reply.trim());
      setTarget(null);
      list.reload();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : '回复失败,请重试');
    } finally { setBusy(false); }
  };

  const columns = [
    { key: 'order_no', title: '订单 / 买家', render: (r) => (
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{r.order_no}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.buyer_email}</div>
      </div>
    ) },
    { key: 'type', title: '类型', width: 90, render: (r) => <Pill tone="neutral">{TYPE[r.type] || '其他'}</Pill> },
    { key: 'description', title: '问题描述', render: (r) => <div style={{ maxWidth: 340, fontSize: 13 }}>{r.description}</div> },
    { key: 'status', title: '状态', width: 110, render: (r) => {
      const s = STATUS[r.status] || { tone: 'neutral', label: r.status };
      return <Pill tone={s.tone}>{s.label}</Pill>;
    } },
    { key: 'create_time', title: '投诉时间', width: 160, render: (r) => (
      <span style={{ color: 'var(--text-muted)', fontSize: 12.5, whiteSpace: 'nowrap' }}>{r.create_time}</span>
    ) },
    { key: 'actions', title: '操作', width: 120, align: 'right', render: (r) => (
      ACTIVE.includes(Number(r.status))
        ? <Button size="sm" variant="primary" onClick={() => open(r)}>{r.merchant_reply ? '补充回复' : '回复'}</Button>
        : <span style={{ color: 'var(--text-subtle)', fontSize: 12 }}>—</span>
    ) },
  ];

  return (
    <Panel title="投诉处理" subtitle="买家发起的售后投诉:及时回复;未解决买家可申请平台介入仲裁">
      <Toolbar right={<Button variant="ghost" iconLeft={<Icons.RefreshCw />} onClick={list.reload}>刷新</Button>}>
        共 {total} 条投诉
      </Toolbar>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {FILTER_OPTIONS.map((o) => (
          <Button
            key={o.value}
            size="sm"
            variant={status === o.value ? 'primary' : 'ghost'}
            onClick={() => { setStatus(o.value); setPage(1); }}
          >
            {o.label}
          </Button>
        ))}
      </div>

      <DataTable columns={columns} rows={items} loading={list.loading} error={list.error} onReload={list.reload} empty="暂无投诉,继续保持好评" emptyIcon="ShieldCheck" />
      {total > 0 && pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
          <Button size="sm" variant="neutral" disabled={curPage <= 1 || list.loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>上一页</Button>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>第 {curPage} / {pages} 页</span>
          <Button size="sm" variant="neutral" disabled={curPage >= pages || list.loading} onClick={() => setPage((p) => p + 1)}>下一页</Button>
        </div>
      )}

      <Modal
        open={!!target}
        title="回复投诉"
        onClose={() => (busy ? null : setTarget(null))}
        footer={<>
          <Button variant="ghost" onClick={() => setTarget(null)} disabled={busy}>取消</Button>
          <Button variant="primary" onClick={submit} loading={busy}>提交回复</Button>
        </>}
      >
        {err ? <div style={{ marginBottom: 12 }}><Pill tone="danger">{err}</Pill></div> : null}
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>订单 {target?.order_no} · {TYPE[target?.type] || '其他'}</div>
        <div style={{ fontSize: 13.5, color: 'var(--text-body)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: '10px 12px', marginBottom: 12 }}>{target?.description}</div>
        {target?.merchant_reply ? (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>我的上次回复</div>
            <div style={{ fontSize: 13.5, color: 'var(--text-body)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: '10px 12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{target.merchant_reply}</div>
          </div>
        ) : null}
        {target?.admin_remark ? (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>平台裁决备注</div>
            <div style={{ fontSize: 13.5, color: 'var(--text-body)', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: '10px 12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{target.admin_remark}</div>
          </div>
        ) : null}
        <Field label="你的回复">
          <textarea
            value={reply}
            placeholder="如:已为您补发,请刷新查单"
            rows={5}
            onChange={(e) => setReply(e.target.value)}
            style={{
              width: '100%',
              minHeight: 96,
              maxHeight: 200,
              resize: 'vertical',
              boxSizing: 'border-box',
              padding: '8px 12px',
              fontSize: 13.5,
              lineHeight: 1.6,
              fontFamily: 'inherit',
              color: 'var(--text-body)',
              background: 'var(--surface-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              outline: 'none',
            }}
          />
        </Field>
      </Modal>
    </Panel>
  );
}
