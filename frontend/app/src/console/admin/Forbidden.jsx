import React from 'react';
import { useAsync, Panel, Toolbar, DataTable, Pill, Modal, Field, ErrorBar } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { ApiError } from '../api.js';
import { Button } from '../../../../design-system/components/core/Button.jsx';
import { Input } from '../../../../design-system/components/core/Input.jsx';

/* 平台禁售目录管理(对标鲸商城PRO 总后台禁售目录)。 */
const emptyForm = { category: '', title: '', description: '', sort: '0', status: 1 };

export default function Forbidden({ api }) {
  const list = useAsync(() => api.forbidden(), []);
  const items = list.data?.items || [];
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [removing, setRemoving] = React.useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const openCreate = () => { setEditing(null); setForm(emptyForm); setErr(''); setOpen(true); };
  const openEdit = (r) => {
    setEditing(r);
    setForm({ category: r.category ?? '', title: r.title ?? '', description: r.description ?? '', sort: String(r.sort ?? 0), status: Number(r.status) });
    setErr(''); setOpen(true);
  };

  async function submit() {
    if (!form.title.trim()) { setErr('请填写禁售项名称'); return; }
    setSaving(true); setErr('');
    const payload = { category: form.category.trim() || '其他', title: form.title.trim(), description: form.description.trim(), sort: Number(form.sort) || 0, status: Number(form.status) };
    try {
      if (editing) await api.updateForbidden(editing.id, payload);
      else await api.createForbidden(payload);
      setOpen(false); list.reload();
    } catch (e) { setErr(e instanceof ApiError ? e.message : '保存失败,请重试'); }
    finally { setSaving(false); }
  }

  async function confirmDelete() {
    if (!removing) return;
    try { await api.deleteForbidden(removing.id); setRemoving(null); list.reload(); } catch { /* 静默 */ }
  }

  const columns = [
    { key: 'category', title: '类目', width: 120, render: (r) => <Pill tone="neutral">{r.category || '其他'}</Pill> },
    { key: 'title', title: '禁售项', render: (r) => r.title },
    { key: 'description', title: '说明', render: (r) => <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{r.description || '—'}</span> },
    { key: 'status', title: '状态', width: 80, render: (r) => Number(r.status) === 1 ? <Pill tone="success">展示</Pill> : <Pill tone="neutral">隐藏</Pill> },
    { key: 'actions', title: '操作', width: 150, align: 'right', render: (r) => (
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>编辑</Button>
        <Button size="sm" variant="danger" onClick={() => setRemoving(r)}>删除</Button>
      </div>
    ) },
  ];

  return (
    <Panel title="禁售目录" subtitle="平台违禁商品类目,展示在门户「禁售目录」页"
      actions={<Button onClick={openCreate} iconLeft={<Icons.Lock />}>新增禁售项</Button>}>
      <Toolbar right={<Button variant="ghost" iconLeft={<Icons.RefreshCw />} onClick={list.reload}>刷新</Button>}>
        共 {items.length} 项
      </Toolbar>
      <DataTable columns={columns} rows={items} loading={list.loading} error={list.error} onReload={list.reload} empty="暂无禁售项" />

      <Modal open={open} title={editing ? '编辑禁售项' : '新增禁售项'} onClose={() => (saving ? null : setOpen(false))}
        footer={<>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>取消</Button>
          <Button onClick={submit} loading={saving}>保存</Button>
        </>}>
        {err ? <div style={{ marginBottom: 12 }}><ErrorBar message={err} /></div> : null}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="类目"><Input value={form.category} placeholder="如 虚拟货币 / 博彩" onChange={set('category')} /></Field>
          <Field label="排序" hint="越大越前"><Input type="number" value={form.sort} onChange={set('sort')} /></Field>
        </div>
        <Field label="禁售项名称"><Input value={form.title} maxLength={200} placeholder="如 比特币等虚拟代币" onChange={set('title')} /></Field>
        <Field label="说明(可选)"><Input value={form.description} placeholder="禁售依据/补充说明" onChange={set('description')} /></Field>
        <Field label="状态">
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant={Number(form.status) === 1 ? 'primary' : 'ghost'} onClick={() => setForm((f) => ({ ...f, status: 1 }))}>展示</Button>
            <Button variant={Number(form.status) === 0 ? 'primary' : 'ghost'} onClick={() => setForm((f) => ({ ...f, status: 0 }))}>隐藏</Button>
          </div>
        </Field>
      </Modal>

      <Modal open={!!removing} title="删除禁售项" onClose={() => setRemoving(null)}
        footer={<>
          <Button variant="ghost" onClick={() => setRemoving(null)}>取消</Button>
          <Button variant="danger" onClick={confirmDelete}>确认删除</Button>
        </>}>
        确定删除「{removing?.title}」吗?
      </Modal>
    </Panel>
  );
}
