import React from 'react';
import { useAsync, Panel, Toolbar, DataTable, Money, Pill, StatCard } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { ApiError } from '../api.js';
import { Button } from '../../../../design-system/components/core/Button.jsx';
import { Input } from '../../../../design-system/components/core/Input.jsx';

const PAGE_SIZE = 20;

// 商品类型(goods_type):1卡密 / 2知识 / 3资源 / 4权益
const GOODS_TYPE = {
  1: { label: '卡密', tone: 'brand' },
  2: { label: '知识', tone: 'secure' },
  3: { label: '资源', tone: 'pending' },
  4: { label: '权益', tone: 'success' },
};

// 缺货红色角标:在售(status=1)但库存为 0
function isOutOfStock(r) {
  return Number(r.status) === 1 && Number(r.stock) <= 0;
}

export default function Products({ api, session }) {
  const [merchantId, setMerchantId] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [keyword, setKeyword] = React.useState('');
  const [query, setQuery] = React.useState({});
  const [page, setPage] = React.useState(1);

  const x = useAsync(() => api.products({ ...query, page }), [query, page]);

  const apply = () => {
    const params = {};
    if (merchantId.trim() !== '') params.merchant_id = merchantId.trim();
    if (status !== '') params.status = status;
    if (keyword.trim() !== '') params.keyword = keyword.trim();
    setPage(1);
    setQuery(params);
  };
  const reset = () => {
    setMerchantId('');
    setStatus('');
    setKeyword('');
    setPage(1);
    setQuery({});
  };

  const rows = x.data?.items || [];
  const total = x.data?.total || 0;
  const curPage = x.data?.page || page;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // 统计卡:全局口径,取后端 summary(避免本页 reduce 导致翻页失真),兜底 0
  const summary = x.data?.summary || {};
  const summaryTotal = summary.total || 0;
  const onSaleCount = summary.on_sale || 0;
  const offShelfCount = summary.off_sale || 0;
  const outOfStockCount = summary.out_stock || 0;

  const columns = [
    { key: 'id', title: 'ID', width: 72, render: (r) => <span style={{ color: 'var(--text-muted)' }}>#{r.id}</span> },
    {
      key: 'title',
      title: '商品',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{r.title}</span>
            {isOutOfStock(r) ? <Pill tone="danger">缺货</Pill> : null}
          </div>
          {r.sku ? <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.sku}</div> : null}
        </div>
      ),
    },
    {
      key: 'merchant_id',
      title: '商户',
      width: 110,
      render: (r) => <Pill tone="neutral">商户 #{r.merchant_id}</Pill>,
    },
    {
      key: 'goods_type',
      title: '类型',
      width: 96,
      render: (r) => {
        const t = GOODS_TYPE[Number(r.goods_type)];
        return t ? <Pill tone={t.tone}>{t.label}</Pill> : <Pill tone="neutral">未知</Pill>;
      },
    },
    {
      key: 'type',
      title: '发货方式',
      width: 110,
      render: (r) =>
        Number(r.type) === 1 ? (
          <Pill tone="brand">自动发卡</Pill>
        ) : (
          <Pill tone="neutral">手动发货</Pill>
        ),
    },
    { key: 'price', title: '价格', align: 'right', width: 120, render: (r) => <Money amount={r.price} strong /> },
    {
      key: 'stock',
      title: '库存',
      align: 'right',
      width: 90,
      render: (r) => (
        <span
          title={isOutOfStock(r) ? '在售但库存为 0,已缺货' : undefined}
          style={{ color: Number(r.stock) <= 0 ? 'var(--danger-fg)' : 'inherit', fontWeight: Number(r.stock) <= 0 ? 700 : 400 }}
        >
          {r.stock}{isOutOfStock(r) ? ' ⚠' : ''}
        </span>
      ),
    },
    { key: 'sales_count', title: '销量', align: 'right', width: 90, render: (r) => <span>{r.sales_count}</span> },
    {
      key: 'status',
      title: '状态',
      width: 100,
      render: (r) =>
        Number(r.status) === 1 ? (
          <Pill tone="success">在售</Pill>
        ) : (
          <Pill tone="danger">下架</Pill>
        ),
    },
  ];

  return (
    <Panel
      title="跨商户商品"
      subtitle="平台只读视图,展示全部商户商品"
      actions={
        <Button variant="ghost" onClick={x.reload} iconLeft={<Icons.RefreshCw />}>
          刷新
        </Button>
      }
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <StatCard label="商品总数" value={summaryTotal} icon="Package" tone="brand" />
        <StatCard label="在售" value={onSaleCount} icon="Check" tone="success" />
        <StatCard label="下架" value={offShelfCount} icon="Inbox" tone="neutral" />
        <StatCard label="缺货" value={outOfStockCount} icon="AlertTriangle" tone="danger" />
      </div>

      <Toolbar
        right={
          <>
            <Button variant="primary" onClick={apply} iconLeft={<Icons.Search />}>
              查询
            </Button>
            <Button variant="ghost" onClick={reset}>
              重置
            </Button>
          </>
        }
      >
        <Input
          placeholder="商户 ID"
          value={merchantId}
          onChange={(e) => setMerchantId(e.target.value)}
          style={{ width: 120 }}
        />
        <Input
          placeholder="商品名称关键词"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && apply()}
          style={{ width: 200 }}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{
            height: 44,
            padding: '0 12px',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--border-strong)',
            background: '#fff',
            color: 'var(--text-strong)',
          }}
        >
          <option value="">全部状态</option>
          <option value="1">在售</option>
          <option value="0">下架</option>
        </select>
      </Toolbar>

      <DataTable
        columns={columns}
        rows={rows}
        loading={x.loading}
        error={x.error instanceof ApiError ? x.error.message : x.error}
        onReload={x.reload}
        empty="暂无商品"
      />

      {total > 0 && pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>共 {total} 项 · 第 {curPage} / {pages} 页</span>
          <Button size="sm" variant="ghost" disabled={curPage <= 1 || x.loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}>上一页</Button>
          <Button size="sm" variant="ghost" disabled={curPage >= pages || x.loading}
            onClick={() => setPage((p) => p + 1)}>下一页</Button>
        </div>
      )}
    </Panel>
  );
}
