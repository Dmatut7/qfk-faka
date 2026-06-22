import React from 'react';
import { useAsync, Panel, Toolbar, DataTable, Pill, Modal, Field } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { ApiError } from '../api.js';
import { Button } from '../../../../design-system/components/core/Button.jsx';
import { Input } from '../../../../design-system/components/core/Input.jsx';

/* 买家黑名单(平台级):按邮箱拦截下单。对标鲸商城PRO 总后台「买家黑名单」。 */
export default function Blacklist({ api }) {
  const [keyword, setKeyword] = React.useState('');
  const [q, setQ] = React.useState('');
  const list = useAsync(() => api.blacklist(q ? { keyword: q } : {}), [q]);
  const items = list.data?.items || [];

  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');

  const add = async () => {
    setErr('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setErr('请输入有效邮箱'); return; }
    setBusy(true);
    try {
      await api.addBlacklist(email.trim(), reason.trim());
      setOpen(false); setEmail(''); setReason('');
      list.reload();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : '添加失败,请重试');
    } finally { setBusy(false); }
  };

  const lift = async (row) => {
    if (typeof window !== 'undefined' && !window.confirm(`解除对「${row.email}」的拉黑?`)) return;
    try { await api.removeBlacklist(row.id); list.reload(); } catch { /* 静默 */ }
  };

  const columns = [
    { key: 'email', title: '买家邮箱', render: (r) => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{r.email}</span> },
    { key: 'reason', title: '原因', render: (r) => r.reason || '—' },
    { key: 'status', title: '状态', width: 90, render: (r) => Number(r.status) === 1 ? <Pill tone="danger">生效中</Pill> : <Pill tone="neutral">已解除</Pill> },
    { key: 'create_time', title: '加入时间', width: 170, render: (r) => <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{r.create_time || '—'}</span> },
    { key: 'actions', title: '操作', width: 110, align: 'right', render: (r) => (
      Number(r.status) === 1
        ? <Button size="sm" variant="ghost" onClick={() => lift(r)}>解除</Button>
        : <span style={{ color: 'var(--text-subtle)', fontSize: 12 }}>—</span>
    ) },
  ];

  return (
    <Panel
      title="买家黑名单"
      subtitle="平台级:被拉黑邮箱将无法在任何店铺下单(下单前即拦截)"
      actions={<Button onClick={() => { setErr(''); setOpen(true); }} iconLeft={<Icons.AlertTriangle />}>拉黑买家</Button>}
    >
      <Toolbar right={<Button variant="ghost" iconLeft={<Icons.RefreshCw />} onClick={list.reload}>刷新</Button>}>
        <div style={{ width: 260 }}>
          <Input value={keyword} icon={<Icons.Search />} placeholder="按邮箱搜索"
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') setQ(keyword.trim()); }} />
        </div>
        <Button variant="primary" size="sm" onClick={() => setQ(keyword.trim())}>搜索</Button>
      </Toolbar>

      <DataTable columns={columns} rows={items} loading={list.loading} error={list.error} onReload={list.reload} empty="暂无黑名单" emptyIcon="ShieldCheck" />

      <Modal
        open={open}
        title="拉黑买家"
        onClose={() => (busy ? null : setOpen(false))}
        footer={<>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>取消</Button>
          <Button variant="danger" onClick={add} loading={busy}>确认拉黑</Button>
        </>}
      >
        {err ? <div style={{ marginBottom: 12 }}><Pill tone="danger">{err}</Pill></div> : null}
        <Field label="买家邮箱">
          <Input value={email} type="email" placeholder="buyer@example.com" onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="原因(可选)">
          <Input value={reason} placeholder="如:恶意刷单 / 欺诈" onChange={(e) => setReason(e.target.value)} />
        </Field>
      </Modal>
    </Panel>
  );
}
