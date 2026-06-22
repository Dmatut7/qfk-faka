import React from 'react';
import { useAsync, Panel, Toolbar, DataTable, Money, Pill, StatCard, Modal } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { ApiError } from '../api.js';
import { Button } from '../../../../design-system/components/core/Button.jsx';
import { Input } from '../../../../design-system/components/core/Input.jsx';

const REFUNDABLE = [1, 2, 5]; // 已支付/已发货/异常待人工 可退款

/* 订单状态(对齐 orders 迁移 status 注释):
   0 待支付 / 1 已支付 / 2 已发货 / 3 已关闭 / 4 已退款 / 5 异常待人工 */
const STATUS = {
  0: { tone: 'pending', label: '待支付' },
  1: { tone: 'brand', label: '已支付' },
  2: { tone: 'success', label: '已发货' },
  3: { tone: 'neutral', label: '已关闭' },
  4: { tone: 'danger', label: '已退款' },
  5: { tone: 'danger', label: '异常待人工' },
};

const PAGE_SIZE = 20;

export default function Orders({ api }) {
  const [merchantId, setMerchantId] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [orderNo, setOrderNo] = React.useState('');
  const [query, setQuery] = React.useState({ merchant_id: '', status: '', order_no: '' });
  const [page, setPage] = React.useState(1);

  const list = useAsync(
    () => api.orders({ merchant_id: query.merchant_id, status: query.status, order_no: query.order_no, page }),
    [query.merchant_id, query.status, query.order_no, page]
  );

  // 跨商户商品 id→标题 映射(把订单里的 #id 渲染成商品标题)
  const products = useAsync(() => api.products(), []);
  const productMap = React.useMemo(() => {
    const m = {};
    const arr = Array.isArray(products.data) ? products.data : (products.data && products.data.items) || [];
    arr.forEach((p) => { m[p.id] = p.title; });
    return m;
  }, [products.data]);

  const items = list.data?.items || [];
  const total = list.data?.total || 0;
  const curPage = list.data?.page || page;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const submitSearch = () => {
    setPage(1);
    setQuery({ merchant_id: merchantId.trim(), status, order_no: orderNo.trim() });
  };

  // 退款
  const [refundTarget, setRefundTarget] = React.useState(null);
  const [refundReason, setRefundReason] = React.useState('');
  const [refundBusy, setRefundBusy] = React.useState(false);
  const [refundErr, setRefundErr] = React.useState('');
  const openRefund = (row) => { setRefundTarget(row); setRefundReason(''); setRefundErr(''); };
  const confirmRefund = async () => {
    if (!refundTarget) return;
    setRefundBusy(true); setRefundErr('');
    try {
      await api.refundOrder(refundTarget.id, refundReason.trim());
      setRefundTarget(null);
      list.reload();
    } catch (e) {
      setRefundErr(e instanceof ApiError ? e.message : '退款失败,请重试');
    } finally { setRefundBusy(false); }
  };

  const columns = [
    {
      key: 'order_no', title: '订单号 / 收货', render: (r) => (
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: 'var(--text-strong)' }} className="tnum">{r.order_no}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{r.buyer_email || '—'}</div>
        </div>
      ),
    },
    {
      key: 'merchant_id', title: '商户', render: (r) => (
        <span className="tnum" style={{ fontWeight: 600, color: 'var(--text-strong)' }}>#{r.merchant_id}</span>
      ),
    },
    {
      key: 'product', title: '商品', render: (r) => (
        <div style={{ minWidth: 0 }}>
          <div>
            <span style={{ color: 'var(--text-strong)', fontWeight: 600 }}>{r.product_title || productMap[r.product_id] || `商品 #${r.product_id}`}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}> ×{r.quantity}</span>
          </div>
          {(r.product_title || productMap[r.product_id]) ? (
            <div className="tnum" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>#{r.product_id}</div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'unit_price', title: '单价', align: 'right',
      render: (r) => <Money amount={r.unit_price} />,
    },
    {
      key: 'total_amount', title: '金额', align: 'right',
      render: (r) => <Money amount={r.total_amount} strong />,
    },
    {
      key: 'status', title: '状态', render: (r) => {
        const s = STATUS[r.status] || { tone: 'neutral', label: r.status };
        return <Pill tone={s.tone}>{s.label}</Pill>;
      },
    },
    {
      key: 'pay_channel', title: '渠道', render: (r) => (
        <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{r.pay_channel || '—'}</span>
      ),
    },
    {
      key: 'time', title: '下单 / 支付时间', render: (r) => (
        <div style={{ whiteSpace: 'nowrap' }}>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{r.create_time || '—'}</div>
          {r.paid_at ? (
            <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 2 }}>付:{r.paid_at}</div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'actions', title: '操作', align: 'right', render: (r) => (
        REFUNDABLE.includes(Number(r.status))
          ? <Button size="sm" variant="danger" onClick={() => openRefund(r)}>退款</Button>
          : <span style={{ color: 'var(--text-subtle)', fontSize: 12 }}>—</span>
      ),
    },
  ];

  // 本页内按状态计数(只读视图,统计当前页可见数据)
  const counts = items.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <StatCard label="本页订单" value={items.length} icon="Package" tone="brand" sub={`共 ${total} 单`} />
        <StatCard label="待支付" value={counts[0] || 0} icon="Clock" tone="pending" />
        <StatCard label="已发货" value={counts[2] || 0} icon="Check" tone="success" />
        <StatCard label="异常待人工" value={counts[5] || 0} icon="AlertTriangle" tone="danger" />
      </div>

      <Panel title="跨商户订单" subtitle="按商户 / 状态 / 订单号筛选;已收款订单可发起退款(卡密回库 + 资金原路冲回)" padded={false}>
        <div style={{ padding: 18 }}>
          <Toolbar right={
            <Button variant="secondary" size="sm" iconLeft={<Icons.RefreshCw size={15} />}
              onClick={list.reload}>刷新</Button>
          }>
            <div style={{ width: 220 }}>
              <Input value={orderNo} icon={<Icons.Search />} placeholder="订单号"
                onChange={(e) => setOrderNo(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitSearch(); }} />
            </div>
            <div style={{ width: 150 }}>
              <Input value={merchantId} placeholder="商户 ID" inputMode="numeric"
                onChange={(e) => setMerchantId(e.target.value.replace(/[^\d]/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter') submitSearch(); }} />
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              style={{
                height: 48, padding: '0 14px', borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--border-strong)', background: '#fff',
                color: 'var(--text-strong)', fontSize: 'var(--text-md)', fontFamily: 'inherit',
              }}>
              <option value="">全部状态</option>
              <option value="0">待支付</option>
              <option value="1">已支付</option>
              <option value="2">已发货</option>
              <option value="3">已关闭</option>
              <option value="4">已退款</option>
              <option value="5">异常待人工</option>
            </select>
            <Button variant="primary" size="sm" iconLeft={<Icons.Search size={15} />}
              onClick={submitSearch}>搜索</Button>
          </Toolbar>

          <DataTable
            columns={columns}
            rows={items}
            loading={list.loading}
            error={list.error}
            onReload={list.reload}
            empty="暂无符合条件的订单"
            emptyIcon="Inbox"
          />

          {total > 0 && pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
              <Button size="sm" variant="neutral" disabled={curPage <= 1 || list.loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}>上一页</Button>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>第 {curPage} / {pages} 页</span>
              <Button size="sm" variant="neutral" disabled={curPage >= pages || list.loading}
                onClick={() => setPage((p) => p + 1)}>下一页</Button>
            </div>
          )}
        </div>
      </Panel>

      <Modal
        open={!!refundTarget}
        title="订单退款"
        onClose={() => (refundBusy ? null : setRefundTarget(null))}
        footer={<>
          <Button variant="ghost" onClick={() => setRefundTarget(null)} disabled={refundBusy}>取消</Button>
          <Button variant="danger" onClick={confirmRefund} loading={refundBusy}>确认退款</Button>
        </>}
      >
        {refundErr ? <div style={{ marginBottom: 12 }}><Pill tone="danger">{refundErr}</Pill></div> : null}
        <div style={{ fontSize: 13.5, color: 'var(--text-body)', lineHeight: 1.6, marginBottom: 12 }}>
          确认对订单 <b>{refundTarget?.order_no}</b>(应付 <Money amount={refundTarget?.total_amount} />)发起退款?
          <br />将:卡密回库重新可售、商户结算金额原路冲回、用券则反核销。此操作不可撤销。
        </div>
        <Input label="退款原因(可选)" value={refundReason} placeholder="如:买家协商退款 / 商品质量问题"
          onChange={(e) => setRefundReason(e.target.value)} />
      </Modal>
    </div>
  );
}
