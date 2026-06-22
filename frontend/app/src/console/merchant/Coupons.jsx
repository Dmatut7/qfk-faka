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

/* 有效期文案:展示 valid_from~valid_to,缺省端记为「不限」 */
function periodText(c) {
  const fmt = (s) => (s ? String(s).slice(0, 16).replace('T', ' ') : '不限');
  if (!c.valid_from && !c.valid_to) return '长期有效';
  return `${fmt(c.valid_from)} ~ ${fmt(c.valid_to)}`;
}

/* 解析时间字符串为时间戳(失败返回 NaN,不参与过期判断) */
function ts(s) {
  if (!s) return NaN;
  const t = Date.parse(String(s).replace(' ', 'T'));
  return Number.isNaN(t) ? NaN : t;
}

/* 派生状态:expired(已过期)/ pending(未开始)/ on(启用)/ off(停用) */
function deriveStatus(c) {
  const now = Date.now();
  const from = ts(c.valid_from);
  const to = ts(c.valid_to);
  if (Number(c.status) === STATUS_OFF) return 'off';
  if (!Number.isNaN(to) && now > to) return 'expired';
  if (!Number.isNaN(from) && now < from) return 'pending';
  return 'on';
}

const STATUS_META = {
  on: { tone: 'success', label: '启用' },
  off: { tone: 'neutral', label: '停用' },
  expired: { tone: 'neutral', label: '已过期' },
  pending: { tone: 'pending', label: '未开始' },
};

/* 工具条内紧凑筛选控件(搜索框 / 下拉) */
const filterControlStyle = {
  height: 34, padding: '0 10px', fontSize: 13, fontFamily: 'var(--font-sans)',
  border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
  background: '#fff', color: 'var(--text-strong)', cursor: 'pointer',
};

export default function Coupons({ api }) {
  const list = useAsync(() => api.coupons(), []);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [formErr, setFormErr] = React.useState('');
  const [removing, setRemoving] = React.useState(null);
  const [delBusy, setDelBusy] = React.useState(false);

  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState(''); // '' = 全部状态
  const [typeFilter, setTypeFilter] = React.useState('');     // '' = 全部类型

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // 前端过滤现有 rows(后端 coupons 接口不带筛选参数,故纯前端 filter)
  const rows = list.data || [];
  const filteredRows = React.useMemo(() => {
    const kw = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (typeFilter !== '' && Number(r.type) !== Number(typeFilter)) return false;
      if (statusFilter !== '' && deriveStatus(r) !== statusFilter) return false;
      if (kw && !String(r.code || '').toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [rows, search, statusFilter, typeFilter]);

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
    const v = Number(form.value);
    if (Number(form.type) === TYPE_PERCENT) {
      if (!(v >= 1 && v <= 99)) { setFormErr('折扣值需在 1~99 之间(如 90 表示 9 折)'); return; }
    } else {
      const min = Number(form.min_amount) || 0;
      if (min > 0 && v > min) { setFormErr('满减券的减免金额不能超过使用门槛'); return; }
    }
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
    { key: 'period', title: '有效期', nowrap: true, render: (r) => <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{periodText(r)}</span> },
    { key: 'total', title: '库存', align: 'right', render: (r) => Number(r.total) > 0 ? `${Number(r.used) || 0}/${r.total}` : `${Number(r.used) || 0}/不限` },
    { key: 'status', title: '状态', width: 90, render: (r) => { const m = STATUS_META[deriveStatus(r)]; return <Pill tone={m.tone}>{m.label}</Pill>; } },
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
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>共 {filteredRows.length} / {rows.length} 张券</span>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: 10, display: 'flex', color: 'var(--text-subtle)', pointerEvents: 'none' }}>
            <Icons.Search size={15} />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索券码"
            aria-label="搜索券码"
            style={{ ...filterControlStyle, width: 180, paddingLeft: 32 }}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="按状态筛选" style={filterControlStyle}>
          <option value="">全部状态</option>
          <option value="on">启用</option>
          <option value="off">停用</option>
          <option value="expired">已过期</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="按类型筛选" style={filterControlStyle}>
          <option value="">全部类型</option>
          <option value={TYPE_AMOUNT}>满减</option>
          <option value={TYPE_PERCENT}>折扣</option>
        </select>
      </Toolbar>

      <DataTable columns={columns} rows={filteredRows} loading={list.loading} error={list.error} onReload={list.reload} empty="暂无优惠券,点击右上角新建" />

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
