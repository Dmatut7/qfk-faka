import React from 'react';
import { useAsync, Panel, Toolbar, DataTable, Pill, Modal, Field } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { ApiError } from '../api.js';
import { Button } from '../../../../design-system/components/core/Button.jsx';
import { Input } from '../../../../design-system/components/core/Input.jsx';

const TYPE_REDUCE = 1;
const TYPE_DISCOUNT = 2;
const STATUS_ON = 1;
const STATUS_OFF = 0;
const emptyForm = { name: '', type: TYPE_REDUCE, threshold: '', value: '', start_at: '', end_at: '', status: 1 };

function describe(p) {
  const thr = Number(p.threshold).toFixed(2);
  if (Number(p.type) === TYPE_DISCOUNT) {
    const zhe = (Number(p.value) / 10).toFixed(1).replace(/\.0$/, '');
    return `满¥${thr} 打${zhe}折`;
  }
  return `满¥${thr} 减¥${Number(p.value).toFixed(2)}`;
}

/* 有效期文案:展示 start_at~end_at,缺省端记为「不限」 */
function periodText(p) {
  const fmt = (s) => (s ? String(s).slice(0, 16).replace('T', ' ') : '不限');
  if (!p.start_at && !p.end_at) return '长期有效';
  return `${fmt(p.start_at)} ~ ${fmt(p.end_at)}`;
}

/* 解析时间字符串为时间戳(失败返回 NaN,不参与过期判断) */
function ts(s) {
  if (!s) return NaN;
  const t = Date.parse(String(s).replace(' ', 'T'));
  return Number.isNaN(t) ? NaN : t;
}

/* 派生状态:expired(已过期 now>end_at)/ on(启用)/ off(停用) */
function deriveStatus(p) {
  const now = Date.now();
  const to = ts(p.end_at);
  if (Number(p.status) === STATUS_OFF) return 'off';
  if (!Number.isNaN(to) && now > to) return 'expired';
  return 'on';
}

const STATUS_META = {
  on: { tone: 'success', label: '启用' },
  off: { tone: 'neutral', label: '停用' },
  expired: { tone: 'neutral', label: '已过期' },
};

/* 工具条内紧凑筛选控件(下拉) */
const filterControlStyle = {
  height: 34, padding: '0 10px', fontSize: 13, fontFamily: 'var(--font-sans)',
  border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
  background: '#fff', color: 'var(--text-strong)', cursor: 'pointer',
};

export default function Promotions({ api }) {
  const list = useAsync(() => api.promotions(), []);
  const items = list.data?.items || [];
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [removing, setRemoving] = React.useState(null);

  const [statusFilter, setStatusFilter] = React.useState(''); // '' = 全部状态
  const [typeFilter, setTypeFilter] = React.useState('');     // '' = 全部类型

  // 前端过滤现有 items(后端 promotions 接口不带筛选参数,故纯前端 filter)
  const filteredItems = React.useMemo(() => items.filter((r) => {
    if (typeFilter !== '' && Number(r.type) !== Number(typeFilter)) return false;
    if (statusFilter !== '' && deriveStatus(r) !== statusFilter) return false;
    return true;
  }), [items, statusFilter, typeFilter]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const openCreate = () => { setEditing(null); setForm(emptyForm); setErr(''); setOpen(true); };
  const openEdit = (r) => {
    setEditing(r);
    setForm({ name: r.name ?? '', type: Number(r.type) || TYPE_REDUCE, threshold: String(r.threshold ?? ''), value: String(r.value ?? ''), start_at: (r.start_at || '').slice(0, 16), end_at: (r.end_at || '').slice(0, 16), status: Number(r.status) });
    setErr(''); setOpen(true);
  };

  async function submit() {
    if (!(Number(form.threshold) >= 0)) { setErr('请填写门槛金额'); return; }
    if (!(Number(form.value) > 0)) { setErr('请填写优惠值'); return; }
    setSaving(true); setErr('');
    const payload = {
      name: form.name.trim(), type: Number(form.type), threshold: form.threshold, value: form.value,
      start_at: form.start_at ? form.start_at.replace('T', ' ') + ':00' : '',
      end_at: form.end_at ? form.end_at.replace('T', ' ') + ':00' : '',
      status: Number(form.status),
    };
    try {
      if (editing) await api.updatePromotion(editing.id, payload);
      else await api.createPromotion(payload);
      setOpen(false); list.reload();
    } catch (e) { setErr(e instanceof ApiError ? e.message : '保存失败,请重试'); }
    finally { setSaving(false); }
  }

  async function confirmDelete() {
    if (!removing) return;
    setErr('');
    try { await api.deletePromotion(removing.id); setRemoving(null); list.reload(); }
    catch (e) { setErr(e instanceof ApiError ? e.message : '删除失败,请重试'); } // L6:不再静默吞错
  }

  const columns = [
    { key: 'name', title: '活动', render: (r) => r.name || '—' },
    { key: 'type', title: '类型', width: 80, render: (r) => <Pill tone={Number(r.type) === TYPE_DISCOUNT ? 'secure' : 'brand'}>{Number(r.type) === TYPE_DISCOUNT ? '满折' : '满减'}</Pill> },
    { key: 'rule', title: '规则', render: (r) => describe(r) },
    { key: 'period', title: '有效期', nowrap: true, render: (r) => <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{periodText(r)}</span> },
    { key: 'status', title: '状态', width: 90, render: (r) => { const m = STATUS_META[deriveStatus(r)]; return <Pill tone={m.tone}>{m.label}</Pill>; } },
    { key: 'actions', title: '操作', width: 150, align: 'right', render: (r) => (
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>编辑</Button>
        <Button size="sm" variant="danger" onClick={() => { setErr(''); setRemoving(r); }}>删除</Button>
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
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>共 {filteredItems.length} / {items.length} 个活动</span>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="按状态筛选" style={filterControlStyle}>
          <option value="">全部状态</option>
          <option value="on">启用</option>
          <option value="off">停用</option>
          <option value="expired">已过期</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="按类型筛选" style={filterControlStyle}>
          <option value="">全部类型</option>
          <option value={TYPE_REDUCE}>满减</option>
          <option value={TYPE_DISCOUNT}>满折</option>
        </select>
      </Toolbar>
      <DataTable columns={columns} rows={filteredItems} loading={list.loading} error={list.error} onReload={list.reload} empty="暂无活动,点击右上角新建" />

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          <Field label="生效时间(可选)">
            <Input type="datetime-local" value={form.start_at} onChange={set('start_at')} />
          </Field>
          <Field label="失效时间(可选)">
            <Input type="datetime-local" value={form.end_at} onChange={set('end_at')} />
          </Field>
        </div>
      </Modal>

      <Modal open={!!removing} title="删除活动" onClose={() => setRemoving(null)}
        footer={<>
          <Button variant="ghost" onClick={() => setRemoving(null)}>取消</Button>
          <Button variant="danger" onClick={confirmDelete}>确认删除</Button>
        </>}>
        确定删除该促销活动吗?
        {err ? <div style={{ marginTop: 12 }}><Pill tone="danger">{err}</Pill></div> : null}
      </Modal>
    </Panel>
  );
}
