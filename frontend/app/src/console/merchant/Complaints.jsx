import React from 'react';
import { useAsync, Panel, Toolbar, DataTable, Pill, Modal, Field } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { ApiError } from '../api.js';
import { Button } from '../../../../design-system/components/core/Button.jsx';
import { Input } from '../../../../design-system/components/core/Input.jsx';

const STATUS = {
  0: { tone: 'pending', label: '待处理' },
  1: { tone: 'brand', label: '已回复' },
  2: { tone: 'danger', label: '平台介入中' },
  3: { tone: 'success', label: '已解决' },
  4: { tone: 'neutral', label: '已驳回' },
};
const TYPE = { 1: '未收到货', 2: '卡密无效', 3: '描述不符', 4: '其他' };
const ACTIVE = [0, 1, 2];

export default function Complaints({ api }) {
  const list = useAsync(() => api.complaints(), []);
  const items = list.data?.items || [];

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
    { key: 'actions', title: '操作', width: 120, align: 'right', render: (r) => (
      ACTIVE.includes(Number(r.status))
        ? <Button size="sm" variant="primary" onClick={() => open(r)}>{r.merchant_reply ? '补充回复' : '回复'}</Button>
        : <span style={{ color: 'var(--text-subtle)', fontSize: 12 }}>—</span>
    ) },
  ];

  return (
    <Panel title="投诉处理" subtitle="买家发起的售后投诉:及时回复;未解决买家可申请平台介入仲裁">
      <Toolbar right={<Button variant="ghost" iconLeft={<Icons.RefreshCw />} onClick={list.reload}>刷新</Button>}>
        共 {items.length} 条投诉
      </Toolbar>
      <DataTable columns={columns} rows={items} loading={list.loading} error={list.error} onReload={list.reload} empty="暂无投诉,继续保持好评" emptyIcon="ShieldCheck" />

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
        <Field label="你的回复">
          <Input value={reply} placeholder="如:已为您补发,请刷新查单" onChange={(e) => setReply(e.target.value)} />
        </Field>
      </Modal>
    </Panel>
  );
}
