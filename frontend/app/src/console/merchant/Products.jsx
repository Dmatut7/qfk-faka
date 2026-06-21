import React from 'react';
import { useAsync, Panel, Toolbar, DataTable, Money, Pill, Modal, Field, StatCard, ErrorBar } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { ApiError } from '../api.js';
import { Button } from '../../../../design-system/components/core/Button.jsx';
import { Input } from '../../../../design-system/components/core/Input.jsx';

const TYPE_AUTO = 1;
const TYPE_MANUAL = 2;
const STATUS_ON = 1;
const STATUS_OFF = 0;

const EMPTY_FORM = {
  category_id: '',
  title: '',
  sku: '',
  description: '',
  price: '',
  type: TYPE_AUTO,
  min_buy: 1,
  max_buy: 0,
  delivery_message: '',
  sort: 0,
};

export default function Products({ api, session }) {
  const products = useAsync(() => api.products(), []);
  const categories = useAsync(() => api.categories(), []);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null); // null=新建,否则为编辑中的 row
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState('');
  const [busyId, setBusyId] = React.useState(0);
  const [rowError, setRowError] = React.useState('');

  const cats = categories.data || [];
  const catName = (id) => {
    const c = cats.find((x) => Number(x.id) === Number(id));
    return c ? c.name : '未分类';
  };

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      category_id: row.category_id == null ? '' : String(row.category_id),
      title: row.title || '',
      sku: row.sku || '',
      description: row.description || '',
      price: row.price == null ? '' : String(row.price),
      type: Number(row.type) || TYPE_AUTO,
      min_buy: row.min_buy ?? 1,
      max_buy: row.max_buy ?? 0,
      delivery_message: row.delivery_message || '',
      sort: row.sort ?? 0,
    });
    setFormError('');
    setModalOpen(true);
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit() {
    setFormError('');
    if (!form.title.trim()) { setFormError('请填写商品标题'); return; }
    if (!(Number(form.price) > 0)) { setFormError('价格必须大于 0'); return; }
    const payload = {
      category_id: form.category_id === '' ? '' : Number(form.category_id),
      title: form.title.trim(),
      sku: form.sku.trim(),
      description: form.description,
      price: form.price,
      type: Number(form.type),
      min_buy: Math.max(1, Number(form.min_buy) || 1),
      max_buy: Number(form.max_buy) || 0,
      delivery_message: form.delivery_message,
      sort: Number(form.sort) || 0,
    };
    setSaving(true);
    try {
      if (editing) {
        await api.updateProduct(editing.id, payload);
      } else {
        await api.createProduct(payload);
      }
      setModalOpen(false);
      products.reload();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : '保存失败,请重试');
    } finally {
      setSaving(false);
    }
  }

  async function rowAction(row, fn) {
    setRowError('');
    setBusyId(row.id);
    try {
      await fn();
      products.reload();
    } catch (e) {
      setRowError(e instanceof ApiError ? e.message : '操作失败,请重试');
    } finally {
      setBusyId(0);
    }
  }

  function toggleStatus(row) {
    const next = Number(row.status) === STATUS_ON ? STATUS_OFF : STATUS_ON;
    rowAction(row, () => api.setProductStatus(row.id, next));
  }

  function remove(row) {
    if (typeof window !== 'undefined' && !window.confirm(`确定删除商品「${row.title}」?`)) return;
    rowAction(row, () => api.deleteProduct(row.id));
  }

  const rows = products.data || [];
  const total = rows.length;
  const onSale = rows.filter((r) => Number(r.status) === STATUS_ON).length;
  const stockSum = rows.reduce((s, r) => s + (Number(r.stock) || 0), 0);
  const salesSum = rows.reduce((s, r) => s + (Number(r.sales_count) || 0), 0);

  const columns = [
    {
      key: 'title', title: '商品', render: (r) => (
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{r.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {r.sku ? `SKU ${r.sku} · ` : ''}{catName(r.category_id)}
          </div>
        </div>
      ),
    },
    {
      key: 'type', title: '类型', render: (r) => (
        <Pill tone={Number(r.type) === TYPE_AUTO ? 'brand' : 'neutral'}>
          {Number(r.type) === TYPE_AUTO ? '自动发卡' : '手动发货'}
        </Pill>
      ),
    },
    { key: 'price', title: '价格', align: 'right', render: (r) => <Money amount={r.price} strong /> },
    { key: 'stock', title: '库存', align: 'right', render: (r) => <span>{r.stock ?? 0}</span> },
    { key: 'sales_count', title: '已售', align: 'right', render: (r) => <span>{r.sales_count ?? 0}</span> },
    {
      key: 'buy', title: '限购', align: 'center', render: (r) => (
        <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
          {(r.min_buy ?? 1)} ~ {Number(r.max_buy) > 0 ? r.max_buy : '不限'}
        </span>
      ),
    },
    {
      key: 'status', title: '状态', render: (r) => (
        Number(r.status) === STATUS_ON
          ? <Pill tone="success">在售</Pill>
          : <Pill tone="neutral">已下架</Pill>
      ),
    },
    {
      key: 'ops', title: '操作', align: 'right', width: 240, render: (r) => {
        const busy = busyId === r.id;
        return (
          <div style={{ display: 'inline-flex', gap: 6, justifyContent: 'flex-end' }}>
            <Button size="sm" variant="neutral" disabled={busy} onClick={() => openEdit(r)}>编辑</Button>
            <Button
              size="sm"
              variant={Number(r.status) === STATUS_ON ? 'ghost' : 'secondary'}
              loading={busy}
              onClick={() => toggleStatus(r)}
            >
              {Number(r.status) === STATUS_ON ? '下架' : '上架'}
            </Button>
            <Button size="sm" variant="danger" loading={busy} onClick={() => remove(r)}>删除</Button>
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <StatCard label="商品总数" value={total} icon="Package" tone="brand" />
        <StatCard label="在售中" value={onSale} icon="Zap" tone="success" />
        <StatCard label="库存合计" value={stockSum} icon="Inbox" tone="neutral" sub="以卡密加锁查询为准" />
        <StatCard label="累计销量" value={salesSum} icon="Check" tone="brand" />
      </div>

      {rowError && <ErrorBar message={rowError} onRetry={() => setRowError('')} />}

      <Panel
        title="商品管理"
        subtitle="管理你的发卡商品、价格与上下架状态"
        actions={
          <Button size="sm" iconLeft={<Icons.Package size={16} />} onClick={openCreate}>新建商品</Button>
        }
        padded={false}
      >
        <div style={{ padding: 18 }}>
          <Toolbar right={
            <Button size="sm" variant="ghost" iconLeft={<Icons.RefreshCw size={15} />} onClick={() => { products.reload(); categories.reload(); }}>
              刷新
            </Button>
          }>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>共 {total} 件商品</span>
          </Toolbar>
          <DataTable
            columns={columns}
            rows={rows}
            loading={products.loading}
            error={products.error}
            onReload={products.reload}
            empty="还没有商品,点击「新建商品」开始"
            emptyIcon="Package"
          />
        </div>
      </Panel>

      <Modal
        open={modalOpen}
        title={editing ? '编辑商品' : '新建商品'}
        onClose={() => !saving && setModalOpen(false)}
        width={520}
        footer={
          <>
            <Button variant="neutral" size="sm" disabled={saving} onClick={() => setModalOpen(false)}>取消</Button>
            <Button size="sm" loading={saving} onClick={submit}>{editing ? '保存修改' : '创建'}</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {formError && <ErrorBar message={formError} />}

          <Input label="商品标题" required value={form.title} onChange={set('title')} placeholder="例如:Netflix 高级会员月卡" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="价格 (元)" required type="number" min="0" step="0.01" value={form.price} onChange={set('price')} placeholder="0.00" />
            <Input label="SKU(可选)" value={form.sku} onChange={set('sku')} placeholder="自定义货号" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="分类">
              <select
                value={form.category_id}
                onChange={set('category_id')}
                style={selectStyle}
              >
                <option value="">未分类</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="发货类型">
              <select value={form.type} onChange={set('type')} style={selectStyle}>
                <option value={TYPE_AUTO}>自动发卡</option>
                <option value={TYPE_MANUAL}>手动发货</option>
              </select>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Input label="最少购买" type="number" min="1" step="1" value={form.min_buy} onChange={set('min_buy')} />
            <Input label="最多购买" hint="0=不限" type="number" min="0" step="1" value={form.max_buy} onChange={set('max_buy')} />
            <Input label="排序" hint="越小越前" type="number" step="1" value={form.sort} onChange={set('sort')} />
          </div>

          <Field label="商品描述" hint="展示给买家的说明(可选)">
            <textarea value={form.description} onChange={set('description')} rows={3} style={textareaStyle} placeholder="商品介绍、使用须知等" />
          </Field>

          <Field label="发货留言" hint="下单成功后随卡密展示给买家(可选)">
            <textarea value={form.delivery_message} onChange={set('delivery_message')} rows={2} style={textareaStyle} placeholder="例如:请在 24 小时内激活" />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

const selectStyle = {
  width: '100%', height: 44, padding: '0 12px', fontSize: 'var(--text-base)',
  border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
  background: '#fff', color: 'var(--text-strong)', cursor: 'pointer',
};

const textareaStyle = {
  width: '100%', padding: '10px 12px', fontSize: 'var(--text-base)', fontFamily: 'inherit',
  border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
  background: '#fff', color: 'var(--text-strong)', resize: 'vertical',
};
