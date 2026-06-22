import React from 'react';
import { useAsync, Panel, Toolbar, DataTable, Pill, Modal, Field } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { ApiError } from '../api.js';
import { Button } from '../../../../design-system/components/core/Button.jsx';
import { Input } from '../../../../design-system/components/core/Input.jsx';

const TYPE_REDUCE = 1;
const TYPE_DISCOUNT = 2;
const emptyForm = { name: '', type: TYPE_REDUCE, threshold: '', value: '', status: 1 };

function describe(p) {
  const thr = Number(p.threshold).toFixed(2);
  if (Number(p.type) === TYPE_DISCOUNT) {
    const zhe = (Number(p.value) / 10).toFixed(1).replace(/\.0$/, '');
    return `满¥${thr} 打${zhe}折`;
  }
  return `满¥${thr} 减¥${Number(p.value).toFixed(2)}`;
}

export default function Promotions({ api }) {
  const list = useAsync(() => api.promotions(), []);
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
    setForm({ name: r.name ?? '', type: Number(r.type) || TYPE_REDUCE, threshold: String(r.threshold ?? ''), value: String(r.value ?? ''), status: Number(r.status) });
    setErr(''); setOpen(true);
  };

  async function submit() {
    if (!(Number(form.threshold) >= 0)) { setErr('请填写门槛金额'); return; }
    if (!(Number(form.value) > 0)) { setErr('请填写优惠值'); return; }
    setSaving(true); setErr('');
    const payload = { name: form.name.trim(), type: Number(form.type), threshold: form.threshold, value: form.value, status: Number(form.status) };
    try {
      if (editing) await api.updatePromotion(editing.id, payload);
      else await api.createPromotion(payload);
      setOpen(false); list.reload();
    } catch (e) { setErr(e instanceof ApiError ? e.message : '保存失败,请重试'); }
    finally { setSaving(false); }
  }

  async function confirmDelete() {
    if (!removing) return;
    try { await api.deletePromotion(removing.id); setRemoving(null); list.reload(); } catch { /* 静默 */ }
  }

  const columns = [
    { key: 'name', title: '活动', render: (r) => r.name || '—' },
    { key: 'type', title: '类型', width: 80, render: (r) => <Pill tone={Number(r.type) === TYPE_DISCOUNT ? 'secure' : 'brand'}>{Number(r.type) === TYPE_DISCOUNT ? '满折' : '满减'}</Pill> },
    { key: 'rule', title: '规则', render: (r) => describe(r) },
    { key: 'status', title: '状态', width: 80, render: (r) => Number(r.status) === 1 ? <Pill tone="success">启用</Pill> : <Pill tone="neutral">停用</Pill> },
    { key: 'actions', title: '操作', width: 150, align: 'right', render: (r) => (
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>编辑</Button>
        <Button size="sm" variant="danger" onClick={() => setRemoving(r)}>删除</Button>
      </div>
    ) },
  ];

  return (
    <Panel
      title="满减满折"
      subtitle="订单级促销,达门槛自动生效;与优惠券「互斥取最优」(系统取对买家更优的一种)"
      actions={<Button onClick={openCreate} iconLeft={<Icons.Star />}>新建活动</Button>}
    >
      <Toolbar right={<Button variant="ghost" iconLeft={<Icons.RefreshCw />} onClick={list.reload}>刷新</Button>}>
        共 {items.length} 个活动
      </Toolbar>
      <DataTable columns={columns} rows={items} loading={list.loading} error={list.error} onReload={list.reload} empty="暂无活动,点击右上角新建" />

      <Modal
        open={open}
        title={editing ? '编辑活动' : '新建满减/满折'}
        onClose={() => (saving ? null : setOpen(false))}
        footer={<>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>取消</Button>
          <Button onClick={submit} loading={saving}>保存</Button>
        </>}
      >
        {err ? <div style={{ marginBottom: 12 }}><Pill tone="danger">{err}</Pill></div> : null}
        <Field label="活动名(可选)"><Input value={form.name} maxLength={64} placeholder="如 满减促销" onChange={set('name')} /></Field>
        <Field label="类型">
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant={Number(form.type) === TYPE_REDUCE ? 'primary' : 'ghost'} onClick={() => setForm((f) => ({ ...f, type: TYPE_REDUCE }))}>满减</Button>
            <Button variant={Number(form.type) === TYPE_DISCOUNT ? 'primary' : 'ghost'} onClick={() => setForm((f) => ({ ...f, type: TYPE_DISCOUNT }))}>满折</Button>
          </div>
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="门槛金额(元)" hint="订单满此额触发"><Input type="number" min="0" step="0.01" value={form.threshold} onChange={set('threshold')} placeholder="100.00" /></Field>
          {Number(form.type) === TYPE_DISCOUNT ? (
            <Field label="折扣(百分比)" hint="90 = 九折"><Input type="number" min="1" max="99" value={form.value} onChange={set('value')} placeholder="90" /></Field>
          ) : (
            <Field label="减免金额(元)"><Input type="number" min="0" step="0.01" value={form.value} onChange={set('value')} placeholder="10.00" /></Field>
          )}
        </div>
        <Field label="状态">
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant={Number(form.status) === 1 ? 'primary' : 'ghost'} onClick={() => setForm((f) => ({ ...f, status: 1 }))}>启用</Button>
            <Button variant={Number(form.status) === 0 ? 'primary' : 'ghost'} onClick={() => setForm((f) => ({ ...f, status: 0 }))}>停用</Button>
          </div>
        </Field>
      </Modal>

      <Modal open={!!removing} title="删除活动" onClose={() => setRemoving(null)}
        footer={<>
          <Button variant="ghost" onClick={() => setRemoving(null)}>取消</Button>
          <Button variant="danger" onClick={confirmDelete}>确认删除</Button>
        </>}>
        确定删除该促销活动吗?
      </Modal>
    </Panel>
  );
}
