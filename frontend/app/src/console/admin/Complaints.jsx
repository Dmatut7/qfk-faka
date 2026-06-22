import React from 'react';
import { useAsync, Panel, Toolbar, DataTable, Pill, Modal, Field, StatCard } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { ApiError } from '../api.js';
import { Button } from '../../../../design-system/components/core/Button.jsx';
import { Input } from '../../../../design-system/components/core/Input.jsx';

const STATUS = {
  0: { tone: 'pending', label: '待商户处理' },
  1: { tone: 'brand', label: '商户已回复' },
  2: { tone: 'danger', label: '平台介入中' },
  3: { tone: 'success', label: '已解决' },
  4: { tone: 'neutral', label: '已驳回' },
};
const TYPE = { 1: '未收到货', 2: '卡密无效', 3: '描述不符', 4: '其他' };
const ACTIVE = [0, 1, 2];

export default function Complaints({ api }) {
  const [status, setStatus] = React.useState('');
  const list = useAsync(() => api.complaints(status === '' ? {} : { status }), [status]);
  const items = list.data?.items || [];

  const [target, setTarget] = React.useState(null); // 当前裁决的投诉
  const [mode, setMode] = React.useState('resolve'); // resolve | reject
  const [remark, setRemark] = React.useState('');
  const [refund, setRefund] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');

  const open = (row, m) => { setTarget(row); setMode(m); setRemark(''); setRefund(false); setErr(''); };
  const submit = async () => {
    if (mode === 'reject' && !remark.trim()) { setErr('驳回必须填写备注'); return; }
    setBusy(true); setErr('');
    try {
      if (mode === 'resolve') await api.resolveComplaint(target.id, remark.trim(), refund);
      else await api.rejectComplaint(target.id, remark.trim());
      setTarget(null);
      list.reload();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : '操作失败,请重试');
    } finally { setBusy(false); }
  };

  const counts = items.reduce((a, c) => { a[c.status] = (a[c.status] || 0) + 1; return a; }, {});

  const columns = [
    { key: 'order_no', title: '订单 / 发起人', render: (r) => (
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{r.order_no}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.buyer_email}</div>
      </div>
    ) },
    { key: 'type', title: '类型', width: 90, render: (r) => <Pill tone="neutral">{TYPE[r.type] || '其他'}</Pill> },
    { key: 'description', title: '问题 / 商户回复', render: (r) => (
      <div style={{ maxWidth: 320 }}>
        <div style={{ fontSize: 13 }}>{r.description}</div>
        {r.merchant_reply ? <div style={{ fontSize: 12, color: 'var(--brand-active)', marginTop: 4 }}>商:{r.merchant_reply}</div> : null}
        {r.admin_remark ? <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 2 }}>裁:{r.admin_remark}</div> : null}
      </div>
    ) },
    { key: 'status', title: '状态', width: 110, render: (r) => {
      const s = STATUS[r.status] || { tone: 'neutral', label: r.status };
      return <div><Pill tone={s.tone}>{s.label}</Pill>{Number(r.refunded) === 1 ? <div style={{ fontSize: 11, color: 'var(--success-fg)', marginTop: 3 }}>已退款</div> : null}</div>;
    } },
    { key: 'actions', title: '裁决', width: 150, align: 'right', render: (r) => (
      ACTIVE.includes(Number(r.status)) ? (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <Button size="sm" variant="primary" onClick={() => open(r, 'resolve')}>解决</Button>
          <Button size="sm" variant="ghost" onClick={() => open(r, 'reject')}>驳回</Button>
        </div>
      ) : <span style={{ color: 'var(--text-subtle)', fontSize: 12 }}>—</span>
    ) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <StatCard label="本页投诉" value={items.length} icon="AlertTriangle" tone="brand" />
        <StatCard label="平台介入中" value={counts[2] || 0} icon="AlertTriangle" tone="danger" />
        <StatCard label="待商户处理" value={counts[0] || 0} icon="Clock" tone="pending" />
        <StatCard label="已解决" value={counts[3] || 0} icon="Check" tone="success" />
      </div>

      <Panel title="投诉仲裁" subtitle="平台介入处理:可裁决解决(可联动退款)或驳回">
        <Toolbar right={<Button variant="ghost" iconLeft={<Icons.RefreshCw />} onClick={list.reload}>刷新</Button>}>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            style={{ height: 44, padding: '0 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-strong)', background: '#fff', fontFamily: 'inherit' }}>
            <option value="">全部状态</option>
            <option value="0">待商户处理</option>
            <option value="1">商户已回复</option>
            <option value="2">平台介入中</option>
            <option value="3">已解决</option>
            <option value="4">已驳回</option>
          </select>
        </Toolbar>
        <DataTable columns={columns} rows={items} loading={list.loading} error={list.error} onReload={list.reload} empty="暂无投诉" emptyIcon="ShieldCheck" />
      </Panel>

      <Modal
        open={!!target}
        title={mode === 'resolve' ? '裁决:解决投诉' : '裁决:驳回投诉'}
        onClose={() => (busy ? null : setTarget(null))}
        footer={<>
          <Button variant="ghost" onClick={() => setTarget(null)} disabled={busy}>取消</Button>
          <Button variant={mode === 'resolve' ? 'primary' : 'danger'} onClick={submit} loading={busy}>确认{mode === 'resolve' ? '解决' : '驳回'}</Button>
        </>}
      >
        {err ? <div style={{ marginBottom: 12 }}><Pill tone="danger">{err}</Pill></div> : null}
        {target ? (
          <div style={{ marginBottom: 16, padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', border: '1px solid var(--border-strong)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-active)', marginBottom: 8 }}>证据上下文(请据此裁决)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 10 }}>
              <span>订单 <span style={{ fontFamily: 'var(--font-mono)' }}>{target.order_no}</span></span>
              <span>类型 {TYPE[target.type] || '其他'}</span>
              {target.buyer_email ? <span>买家 {target.buyer_email}</span> : null}
              {Number(target.refunded) === 1 ? <span style={{ color: 'var(--success-fg)' }}>已退款</span> : null}
            </div>
            <div style={{ fontSize: 13, marginBottom: target.merchant_reply ? 8 : 0 }}>
              <span style={{ color: 'var(--text-subtle)' }}>买家描述:</span> {target.description || '—'}
            </div>
            {target.merchant_reply ? (
              <div style={{ fontSize: 13, color: 'var(--brand-active)' }}>
                <span style={{ color: 'var(--text-subtle)' }}>商户回复:</span> {target.merchant_reply}
              </div>
            ) : <div style={{ fontSize: 12.5, color: 'var(--text-subtle)' }}>商户尚未回复</div>}
            {target.admin_remark ? (
              <div style={{ fontSize: 12.5, color: 'var(--text-subtle)', marginTop: 6 }}>历史裁决备注:{target.admin_remark}</div>
            ) : null}
          </div>
        ) : null}
        {mode === 'resolve' && (
          <Field label="是否联动退款">
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox" checked={refund} onChange={(e) => setRefund(e.target.checked)} />
              退款给买家(卡密回库 + 商户结算冲回 + 优惠券反核销)
            </label>
          </Field>
        )}
        <Field label={mode === 'reject' ? '裁决备注(驳回必填)' : '裁决备注'}>
          <Input value={remark} placeholder={mode === 'resolve' ? '如:卡密确有问题,予以退款' : '如:证据不足,驳回(必填)'} onChange={(e) => setRemark(e.target.value)} />
        </Field>
      </Modal>
    </div>
  );
}
