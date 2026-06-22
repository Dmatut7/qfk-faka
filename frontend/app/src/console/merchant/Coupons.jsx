import React from 'react';
import { useAsync, Panel, Toolbar, DataTable, Pill, Modal, Field } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { ApiError } from '../api.js';
import { Button } from '../../../../design-system/components/core/Button.jsx';
import { Input } from '../../../../design-system/components/core/Input.jsx';

const TYPE_AMOUNT = 1;
const TYPE_PERCENT = 2;
const STATUS_ON = 1;
const STATUS_OFF = 0;

const emptyForm = {
  code: '', name: '', type: TYPE_AMOUNT,
  value: '', min_amount: '0', max_discount: '0', total: '0',
  valid_from: '', valid_to: '', status: STATUS_ON,
};

/* 券面值描述:满减「满X减Y」/ 折扣「N折(封顶Z)」 */
function describe(c) {
  if (Number(c.type) === TYPE_PERCENT) {
    const zhe = (Number(c.value) / 10).toFixed(1).replace(/\.0$/, '');
    const cap = Number(c.max_discount) > 0 ? ` · 封顶¥${Number(c.max_discount).toFixed(2)}` : '';
    return `${zhe}折${cap}`;
  }
  const min = Number(c.min_amount) > 0 ? `满¥${Number(c.min_amount).toFixed(2)}` : '无门槛';
  return `${min}减¥${Number(c.value).toFixed(2)}`;
}

export default function Coupons({ api }) {
  const list = useAsync(() => api.coupons(), []);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [formErr, setFormErr] = React.useState('');
  const [removing, setRemoving] = React.useState(null);
  const [delBusy, setDelBusy] = React.useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function openCreate() { setEditing(null); setForm(emptyForm); setFormErr(''); setOpen(true); }
  function openEdit(row) {
    setEditing(row);
    setForm({
      code: row.code ?? '', name: row.name ?? '', type: Number(row.type) || TYPE_AMOUNT,
      value: String(row.value ?? ''), min_amount: String(row.min_amount ?? '0'),
      max_discount: String(row.max_discount ?? '0'), total: String(row.total ?? '0'),
      valid_from: (row.valid_from || '').slice(0, 16), valid_to: (row.valid_to || '').slice(0, 16),
      status: Number(row.status),
    });
    setFormErr(''); setOpen(true);
  }

  async function submit() {
    if (!editing && !form.code.trim()) { setFormErr('券码必填'); return; }
    if (!(Number(form.value) >= 0) || form.value === '') { setFormErr('请填写有效的面值'); return; }
    setSaving(true); setFormErr('');
    const payload = {
      name: form.name.trim(), type: Number(form.type),
      value: form.value, min_amount: form.min_amount || '0',
      max_discount: form.max_discount || '0', total: Number(form.total) || 0,
      valid_from: form.valid_from ? form.valid_from.replace('T', ' ') + ':00' : '',
      valid_to: form.valid_to ? form.valid_to.replace('T', ' ') + ':00' : '',
      status: Number(form.status),
    };
    try {
      if (editing) await api.updateCoupon(editing.id, payload);
      else await api.createCoupon({ ...payload, code: form.code.trim() });
      setOpen(false); list.reload();
    } catch (e) {
      setFormErr(e instanceof ApiError ? e.message : '保存失败,请重试');
    } finally { setSaving(false); }
  }

  async function confirmDelete() {
    if (!removing) return;
    setDelBusy(true);
    try { await api.deleteCoupon(removing.id); setRemoving(null); list.reload(); }
    catch (e) { setFormErr(e instanceof ApiError ? e.message : '删除失败'); }
    finally { setDelBusy(false); }
  }

  const columns = [
    { key: 'code', title: '券码', render: (r) => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{r.code}</span> },
    { key: 'name', title: '名称', render: (r) => r.name || '—' },
    { key: 'type', title: '类型', width: 80, render: (r) => <Pill tone={Number(r.type) === TYPE_PERCENT ? 'secure' : 'brand'}>{Number(r.type) === TYPE_PERCENT ? '折扣' : '满减'}</Pill> },
    { key: 'rule', title: '规则', render: (r) => describe(r) },
    { key: 'total', title: '库存', align: 'right', render: (r) => Number(r.total) > 0 ? `${r.used}/${r.total}` : `${r.used}/不限` },
    { key: 'status', title: '状态', width: 80, render: (r) => Number(r.status) === STATUS_ON ? <Pill tone="success">启用</Pill> : <Pill tone="neutral">停用</Pill> },
    {
      key: 'actions', title: '操作', width: 150, align: 'right',
      render: (r) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>编辑</Button>
          <Button size="sm" variant="danger" onClick={() => setRemoving(r)}>删除</Button>
        </div>
      ),
    },
  ];

  return (
    <Panel
      title="优惠券"
      subtitle="创建满减 / 折扣券,买家结算时凭券码抵扣(单笔限用一张,互斥取最优)"
      actions={<Button onClick={openCreate} iconLeft={<Icons.Star />}>新建优惠券</Button>}
    >
      <Toolbar right={<Button variant="ghost" iconLeft={<Icons.RefreshCw />} onClick={list.reload}>刷新</Button>}>
        共 {(list.data || []).length} 张券
      </Toolbar>

      <DataTable columns={columns} rows={list.data || []} loading={list.loading} error={list.error} onReload={list.reload} empty="暂无优惠券,点击右上角新建" />

      <Modal
        open={open}
        title={editing ? '编辑优惠券' : '新建优惠券'}
        onClose={() => (saving ? null : setOpen(false))}
        footer={<>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>取消</Button>
          <Button onClick={submit} loading={saving}>保存</Button>
        </>}
      >
        {formErr ? <div style={{ marginBottom: 12 }}><Pill tone="danger">{formErr}</Pill></div> : null}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="券码" hint={editing ? '券码不可改' : '商户内唯一,买家凭此核销'}>
            <Input value={form.code} disabled={!!editing} maxLength={32} placeholder="如 SAVE20" onChange={set('code')} />
          </Field>
          <Field label="名称(可选)">
            <Input value={form.name} maxLength={64} placeholder="如 新人满减券" onChange={set('name')} />
          </Field>
        </div>

        <Field label="类型">
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant={Number(form.type) === TYPE_AMOUNT ? 'primary' : 'ghost'} onClick={() => setForm((f) => ({ ...f, type: TYPE_AMOUNT }))}>满减</Button>
            <Button variant={Number(form.type) === TYPE_PERCENT ? 'primary' : 'ghost'} onClick={() => setForm((f) => ({ ...f, type: TYPE_PERCENT }))}>折扣</Button>
          </div>
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {Number(form.type) === TYPE_PERCENT ? (
            <>
              <Field label="折扣(百分比)" hint="90 = 九折(应付为原价 90%)">
                <Input type="number" min="1" max="99" value={form.value} onChange={set('value')} placeholder="90" />
              </Field>
              <Field label="封顶优惠(元)" hint="0 = 不封顶">
                <Input type="number" min="0" step="0.01" value={form.max_discount} onChange={set('max_discount')} placeholder="0.00" />
              </Field>
            </>
          ) : (
            <>
              <Field label="减免金额(元)">
                <Input type="number" min="0" step="0.01" value={form.value} onChange={set('value')} placeholder="20.00" />
              </Field>
              <Field label="使用门槛(元)" hint="订单满此额可用,0=无门槛">
                <Input type="number" min="0" step="0.01" value={form.min_amount} onChange={set('min_amount')} placeholder="100.00" />
              </Field>
            </>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="发放总量" hint="0 = 不限量">
            <Input type="number" min="0" value={form.total} onChange={set('total')} placeholder="0" />
          </Field>
          <Field label="状态">
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant={Number(form.status) === STATUS_ON ? 'primary' : 'ghost'} onClick={() => setForm((f) => ({ ...f, status: STATUS_ON }))}>启用</Button>
              <Button variant={Number(form.status) === STATUS_OFF ? 'primary' : 'ghost'} onClick={() => setForm((f) => ({ ...f, status: STATUS_OFF }))}>停用</Button>
            </div>
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="生效时间(可选)">
            <Input type="datetime-local" value={form.valid_from} onChange={set('valid_from')} />
          </Field>
          <Field label="失效时间(可选)">
            <Input type="datetime-local" value={form.valid_to} onChange={set('valid_to')} />
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!removing}
        title="删除优惠券"
        onClose={() => (delBusy ? null : setRemoving(null))}
        footer={<>
          <Button variant="ghost" onClick={() => setRemoving(null)} disabled={delBusy}>取消</Button>
          <Button variant="danger" onClick={confirmDelete} loading={delBusy}>确认删除</Button>
        </>}
      >
        确定删除优惠券「{removing?.code}」吗?此操作不可撤销。
      </Modal>
    </Panel>
  );
}
