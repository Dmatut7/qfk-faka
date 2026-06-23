import React from 'react';
import { useAsync, Panel, Toolbar, DataTable, Money, Pill, Modal, Field, EmptyState, StatCard, ErrorBar, Spinner } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { ApiError } from '../api.js';
import { Button } from '../../../../design-system/components/core/Button.jsx';
import { Input } from '../../../../design-system/components/core/Input.jsx';

/* 卡密状态映射(与后端 Card 模型一致:0未售 1锁定 2已售 3作废) */
const STATUS_META = {
  0: { tone: 'success', text: '未售', icon: 'Package' },
  1: { tone: 'pending', text: '锁定', icon: 'Lock' },
  2: { tone: 'brand', text: '已售', icon: 'Check' },
  3: { tone: 'danger', text: '作废', icon: 'AlertTriangle' },
};

/* 卡密脱敏:仅展示首尾少量字符,中段以圆点遮挡 */
function maskSecret(s) {
  const v = String(s || '');
  if (v.length <= 6) return v.replace(/./g, '•');
  return `${v.slice(0, 3)}••••${v.slice(-3)}`;
}

/* CSV 单元格转义:含逗号 / 引号 / 换行时用双引号包裹并转义内部引号 */
function csvCell(v) {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/* 文件名时间戳:yyyymmdd-hhmmss */
function exportStamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/* 将当前已加载卡密行导出为 CSV(仅前端,脱敏字段,与列表展示一致) */
function exportRowsCsv(rows, productTitle, codeNoun) {
  const header = [`${codeNoun}(脱敏)`, '批次', '状态', '导入时间'];
  const body = (rows || []).map((row) => {
    const m = STATUS_META[row.status];
    return [
      maskSecret(row.secret),
      row.batch_no || '',
      m ? m.text : String(row.status),
      row.create_time || '',
    ].map(csvCell).join(',');
  });
  // 加 BOM 以便 Excel 正确识别 UTF-8
  const content = '﻿' + [header.map(csvCell).join(','), ...body].join('\r\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = String(productTitle || codeNoun).replace(/[\\/:*?"<>|]/g, '_');
  a.download = `${safeTitle}-${codeNoun}-${exportStamp()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Cards({ api, session }) {
  const [selectedId, setSelectedId] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [importOpen, setImportOpen] = React.useState(false);

  // 切换商品或状态筛选时回到第 1 页
  React.useEffect(() => { setPage(1); }, [selectedId, statusFilter]);

  // 商品列表(用于选择)
  const products = useAsync(() => api.products(), []);
  const productList = products.data || [];

  // 默认选中第一个商品
  React.useEffect(() => {
    if (selectedId == null && productList.length > 0) {
      setSelectedId(productList[0].id);
    }
  }, [productList, selectedId]);

  const selectedProduct = productList.find((p) => p.id === selectedId) || null;
  // 码池称谓:权益类商品的「卡密」即权益码,标签自适应
  const isRights = !!selectedProduct && Number(selectedProduct.goods_type) === 4;
  const codeNoun = isRights ? '权益码' : '卡密';
  // 统计卡 label:权益类追加「权益码」后缀(未售权益码/已售权益码…),卡密类沿用「未售/已售」
  const statLabel = (base) => (isRights ? `${base}${codeNoun}` : base);

  // 库存统计 + 卡密列表(依赖所选商品 / 状态筛选)
  const stats = useAsync(
    () => (selectedId == null ? Promise.resolve(null) : api.cardStats(selectedId)),
    [selectedId]
  );
  const cards = useAsync(
    () => (selectedId == null
      ? Promise.resolve({ items: [], total: 0 })
      : api.cards(selectedId, { page, ...(statusFilter === '' ? {} : { status: statusFilter }) })),
    [selectedId, statusFilter, page]
  );

  const reloadAll = React.useCallback(() => {
    stats.reload();
    cards.reload();
  }, [stats, cards]);

  const columns = [
    {
      key: 'secret', title: `${codeNoun}(脱敏)`,
      render: (row) => (
        <span className="tnum" style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-strong)' }}>
          {maskSecret(row.secret)}
        </span>
      ),
    },
    {
      key: 'batch_no', title: '批次',
      render: (row) => row.batch_no
        ? <span style={{ color: 'var(--text-body)' }}>{row.batch_no}</span>
        : <span style={{ color: 'var(--text-subtle)' }}>—</span>,
    },
    {
      key: 'status', title: '状态', width: 96,
      render: (row) => {
        const m = STATUS_META[row.status] || { tone: 'neutral', text: String(row.status), icon: 'Inbox' };
        const Ico = Icons[m.icon];
        return <Pill tone={m.tone}>{Ico ? <Ico size={13} /> : null}{m.text}</Pill>;
      },
    },
    {
      key: 'create_time', title: '导入时间', width: 180,
      render: (row) => (
        <span style={{ color: 'var(--text-body)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Icons.Clock size={13} />{row.create_time || '—'}
        </span>
      ),
    },
    {
      key: '_ops', title: '操作', align: 'right', width: 140,
      render: (row) => <RowOps row={row} onAsk={(kind) => setConfirm({ kind, row })} />,
    },
  ];

  const rows = (cards.data && cards.data.items) || [];
  const total = Number((cards.data && cards.data.total) || 0);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const goPage = (p) => setPage(Math.min(Math.max(1, p), totalPages));

  // 二次确认:{ kind: 'disable'|'delete', row } | null
  const [confirm, setConfirm] = React.useState(null);
  const [confirmBusy, setConfirmBusy] = React.useState(false);
  const [confirmErr, setConfirmErr] = React.useState('');
  React.useEffect(() => { setConfirmErr(''); setConfirmBusy(false); }, [confirm]);

  async function doConfirm() {
    if (!confirm) return;
    setConfirmBusy(true); setConfirmErr('');
    try {
      if (confirm.kind === 'disable') await api.disableCard(confirm.row.id);
      else await api.deleteCard(confirm.row.id);
      setConfirm(null);
      // 删除/作废后若当前页越界(如最后一页最后一张被移除),回退到有效页;否则原地刷新
      const nextTotal = Math.max(0, total - 1);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / pageSize));
      if (page > nextTotalPages) {
        // page 变更会触发卡密列表重载;库存统计另行刷新
        stats.reload();
        setPage(nextTotalPages);
      } else {
        reloadAll();
      }
    } catch (e) {
      setConfirmErr(e instanceof ApiError ? e.message : '操作失败,请重试');
    } finally {
      setConfirmBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Panel
        title={`${codeNoun}管理`}
        subtitle={`选择商品后查看库存统计、导入与维护${codeNoun}(卡密/权益类一物一售)`}
        actions={
          <Button variant="primary" size="sm" iconLeft={<Icons.Package size={15} />}
            onClick={() => setImportOpen(true)} disabled={selectedId == null}>
            导入{codeNoun}
          </Button>
        }
      >
        <ProductPicker
          products={products}
          selectedId={selectedId}
          onSelect={(id) => { setSelectedId(id); setStatusFilter(''); }}
        />
      </Panel>

      {selectedId != null && (
        <Panel title={selectedProduct ? selectedProduct.title : '库存统计'} subtitle="按状态统计当前商品卡密数量">
          {stats.loading && <div style={{ padding: 16 }}><Spinner /></div>}
          {!stats.loading && stats.error && <ErrorBar message={stats.error} onRetry={stats.reload} />}
          {!stats.loading && !stats.error && stats.data && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              <StatCard label={statLabel('未售')} value={stats.data.unsold} icon="Package" tone="success" />
              <StatCard label={statLabel('锁定')} value={stats.data.locked} icon="Lock" tone="pending" />
              <StatCard label={statLabel('已售')} value={stats.data.sold} icon="Check" tone="brand" />
              <StatCard label={statLabel('作废')} value={stats.data.disabled} icon="AlertTriangle" tone="danger" />
              <StatCard label="库存(缓存)" value={stats.data.stock} icon="Zap" tone="brand" sub="商品缓存库存,应与未售一致" />
            </div>
          )}
        </Panel>
      )}

      {selectedId != null && (
        <Panel title={`${codeNoun}列表`} subtitle={`脱敏展示,仅未售${codeNoun}可作废 / 删除`} padded={false}>
          <Toolbar right={
            <div style={{ display: 'inline-flex', gap: 6 }}>
              <Button
                variant="neutral" size="sm"
                iconLeft={<Icons.Copy size={15} />}
                disabled={rows.length === 0}
                onClick={() => exportRowsCsv(rows, selectedProduct ? selectedProduct.title : codeNoun, codeNoun)}
              >
                导出
              </Button>
              <Button variant="neutral" size="sm" iconLeft={<Icons.RefreshCw size={15} />} onClick={reloadAll}>
                刷新
              </Button>
            </div>
          }>
            <StatusTabs value={statusFilter} onChange={setStatusFilter} />
          </Toolbar>
          <DataTable
            columns={columns}
            rows={rows}
            loading={cards.loading}
            error={cards.error}
            onReload={cards.reload}
            empty="该商品暂无卡密,点击右上角导入"
            emptyIcon="Inbox"
          />
          {total > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
              <span>共 {total} 条 · 第 {page}/{totalPages} 页</span>
              <Button size="sm" variant="ghost" disabled={page <= 1 || cards.loading} onClick={() => goPage(page - 1)}>上一页</Button>
              <Button size="sm" variant="ghost" disabled={page >= totalPages || cards.loading} onClick={() => goPage(page + 1)}>下一页</Button>
            </div>
          )}
        </Panel>
      )}

      {selectedId == null && !products.loading && (
        <Panel title="卡密管理">
          <EmptyState icon="Package" text="暂无商品" sub="请先在「商品管理」创建商品后再导入卡密" />
        </Panel>
      )}

      <ImportModal
        open={importOpen}
        product={selectedProduct}
        api={api}
        onClose={() => setImportOpen(false)}
        onImported={reloadAll}
      />

      <ConfirmActionModal
        confirm={confirm}
        busy={confirmBusy}
        err={confirmErr}
        onCancel={() => (confirmBusy ? null : setConfirm(null))}
        onConfirm={doConfirm}
      />
    </div>
  );
}

/* 作废 / 删除 二次确认弹窗 */
function ConfirmActionModal({ confirm, busy, err, onCancel, onConfirm }) {
  const open = confirm != null;
  const kind = confirm && confirm.kind;
  const row = (confirm && confirm.row) || {};
  const isDelete = kind === 'delete';
  const title = isDelete ? '确认删除卡密' : '确认作废卡密';
  const message = isDelete
    ? '将永久删除这张未售卡密,操作不可撤销。'
    : '将作废这张未售卡密,作废后不再参与发货,操作不可撤销。';

  return (
    <Modal
      open={open}
      title={title}
      width={420}
      onClose={onCancel}
      footer={
        <>
          <Button variant="neutral" onClick={onCancel} disabled={busy}>取消</Button>
          <Button
            variant={isDelete ? 'danger' : 'primary'}
            loading={busy}
            iconLeft={<Icons.AlertTriangle size={14} />}
            onClick={onConfirm}
          >
            {isDelete ? '确认删除' : '确认作废'}
          </Button>
        </>
      }
    >
      <div style={{ fontSize: 13.5, color: 'var(--text-body)', lineHeight: 1.7 }}>
        <div style={{ marginBottom: 8 }}>
          卡密:<span className="tnum" style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-strong)' }}>{maskSecret(row.secret)}</span>
        </div>
        <div>{message}</div>
        {err ? <div style={{ marginTop: 10 }}><ErrorBar message={err} /></div> : null}
      </div>
    </Modal>
  );
}

/* 商品选择器(下拉) */
function ProductPicker({ products, selectedId, onSelect }) {
  if (products.loading) return <div style={{ padding: 8 }}><Spinner size={18} /></div>;
  if (products.error) return <ErrorBar message={products.error} onRetry={products.reload} />;
  const list = products.data || [];
  if (list.length === 0) return <EmptyState icon="Package" text="暂无商品" sub="请先创建商品" />;
  return (
    <Field label="选择商品" hint="切换商品以查看其卡密库存">
      <select
        value={selectedId == null ? '' : String(selectedId)}
        onChange={(e) => onSelect(Number(e.target.value))}
        className="mk-input"
        style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 'var(--radius-md, 8px)' }}
      >
        {list.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}{p.sku ? ` · ${p.sku}` : ''}（库存 {p.stock ?? 0}）
          </option>
        ))}
      </select>
    </Field>
  );
}

/* 状态筛选 Tabs */
function StatusTabs({ value, onChange }) {
  const tabs = [
    { v: '', label: '全部' },
    { v: '0', label: '未售' },
    { v: '1', label: '锁定' },
    { v: '2', label: '已售' },
    { v: '3', label: '作废' },
  ];
  return (
    <div style={{ display: 'inline-flex', gap: 6 }}>
      {tabs.map((t) => (
        <button
          key={t.v}
          onClick={() => onChange(t.v)}
          style={{
            padding: '6px 14px', borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            border: `1px solid ${value === t.v ? 'var(--brand-soft-border)' : 'var(--border)'}`,
            background: value === t.v ? 'var(--brand-soft)' : 'var(--surface)',
            color: value === t.v ? 'var(--brand-active)' : 'var(--text-body)',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* 行操作:作废 / 删除(仅未售卡 status===0 可用;点击后弹二次确认) */
function RowOps({ row, onAsk }) {
  const unsold = row.status === 0;
  if (!unsold) return <span style={{ color: 'var(--text-subtle)', fontSize: 12 }}>—</span>;

  return (
    <div style={{ display: 'inline-flex', gap: 6 }}>
      <Button variant="neutral" size="sm" onClick={() => onAsk('disable')}>作废</Button>
      <Button variant="danger" size="sm"
        iconLeft={<Icons.AlertTriangle size={13} />} onClick={() => onAsk('delete')}>删除</Button>
    </div>
  );
}

/* 导入卡密弹窗:多行 textarea(一行一卡) + 可选批次号 */
function ImportModal({ open, product, api, onClose, onImported }) {
  const [text, setText] = React.useState('');
  const [batchNo, setBatchNo] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [result, setResult] = React.useState(null);

  React.useEffect(() => {
    if (open) { setText(''); setBatchNo(''); setErr(''); setResult(null); setBusy(false); }
  }, [open]);

  const submit = async () => {
    if (!product) return;
    if (text.trim() === '') { setErr('请输入至少一行卡密'); return; }
    setBusy(true); setErr('');
    try {
      const res = await api.importCards(product.id, text, batchNo.trim() || undefined);
      setResult(res);
      onImported();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : '导入失败,请重试');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title={product ? `导入卡密 · ${product.title}` : '导入卡密'}
      onClose={onClose}
      width={560}
      footer={
        result ? (
          <Button variant="primary" size="md" onClick={onClose}>完成</Button>
        ) : (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="neutral" size="md" onClick={onClose} disabled={busy}>取消</Button>
            <Button variant="primary" size="md" loading={busy} onClick={submit}
              iconLeft={<Icons.Package size={15} />}>导入</Button>
          </div>
        )
      }
    >
      {result ? (
        <ImportResult result={result} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="卡密内容" hint="每行一张卡密,空行自动跳过,行内 / 库内重复将自动去重">
            <textarea
              className="mk-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={'CARD-0001-XXXX\nCARD-0002-YYYY\n…'}
              rows={9}
              style={{
                width: '100%', resize: 'vertical', padding: '10px 12px', lineHeight: 1.5,
                fontFamily: 'var(--font-mono, monospace)', borderRadius: 'var(--radius-md, 8px)',
              }}
            />
          </Field>
          <Field label="批次号(可选)" hint="便于后续按批次追溯">
            <Input value={batchNo} onChange={(e) => setBatchNo(e.target.value)} placeholder="如 2026-06-A" />
          </Field>
          {err && <ErrorBar message={err} />}
        </div>
      )}
    </Modal>
  );
}

/* 导入结果展示 */
function ImportResult({ result }) {
  const items = [
    { label: '成功导入', value: result.imported, tone: 'success', icon: 'Check' },
    { label: '重复跳过', value: result.duplicated, tone: 'pending', icon: 'Copy' },
    { label: '空行跳过', value: result.empty, tone: 'neutral', icon: 'Inbox' },
    { label: '当前库存', value: result.stock, tone: 'brand', icon: 'Package' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success-fg)', fontWeight: 700 }}>
        <Icons.ShieldCheck size={18} />导入完成（共 {result.total} 行）
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {items.map((it) => (
          <StatCard key={it.label} label={it.label} value={it.value} icon={it.icon} tone={it.tone} />
        ))}
      </div>
    </div>
  );
}
