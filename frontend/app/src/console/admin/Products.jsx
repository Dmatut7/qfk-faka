import React from 'react';
import { useAsync, Panel, Toolbar, DataTable, Money, Pill } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { ApiError } from '../api.js';
import { Button } from '../../../../design-system/components/core/Button.jsx';
import { Input } from '../../../../design-system/components/core/Input.jsx';

const PAGE_SIZE = 20;

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

  const columns = [
    { key: 'id', title: 'ID', width: 72, render: (r) => <span style={{ color: 'var(--color-text-muted)' }}>#{r.id}</span> },
    {
      key: 'title',
      title: '商品',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.title}</div>
          {r.sku ? <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{r.sku}</div> : null}
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
      key: 'type',
      title: '类型',
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
        <span style={{ color: Number(r.stock) <= 0 ? 'var(--color-danger)' : 'inherit' }}>{r.stock}</span>
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
        <Button variant="ghost" onClick={x.reload} icon={<Icons.RefreshCw />}>
          刷新
        </Button>
      }
    >
      <Toolbar
        right={
          <>
            <Button variant="primary" onClick={apply} icon={<Icons.Search />}>
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
            height: 36,
            padding: '0 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
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
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>共 {total} 项 · 第 {curPage} / {pages} 页</span>
          <Button size="sm" variant="ghost" disabled={curPage <= 1 || x.loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}>上一页</Button>
          <Button size="sm" variant="ghost" disabled={curPage >= pages || x.loading}
            onClick={() => setPage((p) => p + 1)}>下一页</Button>
        </div>
      )}
    </Panel>
  );
}
