import React from 'react';
import { useAsync, Panel, Toolbar, DataTable, Money, Pill, Modal, Field, Spinner, ErrorBar } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { ApiError } from '../api.js';
import { Button } from '../../../../design-system/components/core/Button.jsx';
import { Input } from '../../../../design-system/components/core/Input.jsx';

/* 订单状态枚举(见 app\model\Order)。 */
const STATUS = {
  0: { text: '待支付', tone: 'pending', icon: 'Clock' },
  1: { text: '已支付', tone: 'brand', icon: 'Check' },
  2: { text: '已发货', tone: 'success', icon: 'ShieldCheck' },
  3: { text: '已关闭', tone: 'neutral', icon: 'Lock' },
  4: { text: '已退款', tone: 'danger', icon: 'RefreshCw' },
  5: { text: '异常待人工', tone: 'danger', icon: 'AlertTriangle' },
};

const STATUS_PENDING = 0;
const STATUS_PAID = 1;
const STATUS_EXCEPTION = 5;

function StatusPill({ status }) {
  const s = STATUS[Number(status)] || { text: `状态${status}`, tone: 'neutral', icon: 'Inbox' };
  const Icon = Icons[s.icon] || Icons.Inbox;
  return (
    <Pill tone={s.tone}>
      <Icon size={12} />
      {s.text}
    </Pill>
  );
}

const FILTER_OPTIONS = [
  { value: '', label: '全部' },
  { value: '0', label: '待支付' },
  { value: '1', label: '已支付' },
  { value: '2', label: '已发货' },
  { value: '3', label: '已关闭' },
  { value: '4', label: '已退款' },
  { value: '5', label: '异常' },
];

export default function Orders({ api, session }) {
  // 受控查询条件:已生效的 query 决定请求,form 仅是输入缓冲。
  const [query, setQuery] = React.useState({ status: '', order_no: '', buyer_email: '', page: 1 });
  const [form, setForm] = React.useState({ order_no: '', buyer_email: '' });

  // 商品 id→标题 映射(用于把订单里的 #id 渲染成商品标题)
  const products = useAsync(() => api.products(), []);
  const productMap = React.useMemo(() => {
    const m = {};
    (products.data || []).forEach((p) => { m[p.id] = p.title; });
    return m;
  }, [products.data]);
  const productTitle = (id) => productMap[id] || `#${id}`;

  const list = useAsync(
    () =>
      api.orders({
        status: query.status,
        order_no: query.order_no,
        buyer_email: query.buyer_email,
        page: query.page,
      }),
    [query.status, query.order_no, query.buyer_email, query.page],
  );

  const data = list.data || {};
  const rows = data.items || [];
  const total = Number(data.total || 0);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function applySearch() {
    setQuery((q) => ({ ...q, order_no: form.order_no.trim(), buyer_email: form.buyer_email.trim(), page: 1 }));
  }
  function resetSearch() {
    setForm({ order_no: '', buyer_email: '' });
    setQuery({ status: '', order_no: '', buyer_email: '', page: 1 });
  }
  function setStatus(status) {
    setQuery((q) => ({ ...q, status, page: 1 }));
  }
  function goPage(p) {
    setQuery((q) => ({ ...q, page: Math.min(Math.max(1, p), totalPages) }));
  }

  /* 详情弹窗 */
  const [detailId, setDetailId] = React.useState(null);
  const detail = useAsync(() => (detailId == null ? Promise.resolve(null) : api.order(detailId)), [detailId]);

  /* 行内操作(关单 / 补发) */
  const [actBusy, setActBusy] = React.useState(0); // 正在操作的订单 id
  const [actErr, setActErr] = React.useState('');

  async function runAction(id, fn) {
    if (actBusy) return; // 防补发/关单双发:已有进行中操作时忽略
    setActBusy(id);
    setActErr('');
    try {
      await fn(id);
      list.reload();
      if (detailId === id) detail.reload();
    } catch (e) {
      setActErr(e instanceof ApiError ? e.message : '操作失败,请重试');
    } finally {
      setActBusy(0);
    }
  }

  const closeOrder = (id) => runAction(id, api.closeOrder);
  const redeliverOrder = (id) => runAction(id, api.redeliverOrder);

  /* 二次确认:{ kind: 'close'|'redeliver', order } | null */
  const [confirm, setConfirm] = React.useState(null);
  const [confirming, setConfirming] = React.useState(false);
  function askClose(order) { setConfirm({ kind: 'close', order }); }
  function askRedeliver(order) { setConfirm({ kind: 'redeliver', order }); }
  async function doConfirm() {
    if (!confirm || confirming) return;
    const { kind, order } = confirm;
    setConfirming(true);
    try {
      if (kind === 'close') await closeOrder(order.id);
      else await redeliverOrder(order.id);
      setConfirm(null);
    } finally {
      setConfirming(false);
    }
  }

  const canClose = (s) => Number(s) === STATUS_PENDING;
  const canRedeliver = (s) => Number(s) === STATUS_PAID || Number(s) === STATUS_EXCEPTION;

  const columns = [
    {
      key: 'order_no',
      title: '订单号',
      render: (r) => (
        <span className="tnum" style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{r.order_no}</span>
      ),
    },
    {
      key: 'product_id',
      title: '商品',
      render: (r) => (
        <div style={{ minWidth: 0 }}>
          <div style={{ color: 'var(--text-strong)', fontWeight: 600 }}>
            {productMap[r.product_id] || `#${r.product_id}`}{' '}
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>×{r.quantity}</span>
          </div>
          {productMap[r.product_id] ? (
            <div className="tnum" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>#{r.product_id}</div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'buyer_email',
      title: '收件邮箱',
      render: (r) => <span style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>{r.buyer_email}</span>,
    },
    {
      key: 'total_amount',
      title: '金额',
      align: 'right',
      width: 110,
      render: (r) => <Money amount={r.total_amount} strong />,
    },
    {
      key: 'status',
      title: '状态',
      width: 120,
      render: (r) => <StatusPill status={r.status} />,
    },
    {
      key: 'create_time',
      title: '下单时间',
      width: 160,
      render: (r) => <span style={{ color: 'var(--text-muted)', fontSize: 12.5, whiteSpace: 'nowrap' }}>{r.create_time}</span>,
    },
    {
      key: 'actions',
      title: '操作',
      width: 220,
      align: 'right',
      render: (r) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Button size="sm" variant="ghost" iconLeft={<Icons.Search />} onClick={() => setDetailId(r.id)}>
            详情
          </Button>
          {canClose(r.status) && (
            <Button
              size="sm"
              variant="danger"
              iconLeft={<Icons.Lock />}
              loading={actBusy === r.id}
              disabled={actBusy !== 0 && actBusy !== r.id}
              onClick={() => askClose(r)}
            >
              关单
            </Button>
          )}
          {canRedeliver(r.status) && (
            <Button
              size="sm"
              variant="ghost"
              iconLeft={<Icons.RefreshCw />}
              loading={actBusy === r.id}
              disabled={actBusy !== 0 && actBusy !== r.id}
              onClick={() => askRedeliver(r)}
            >
              补发
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Panel title="订单管理" subtitle="查看本店订单、关闭未支付订单、对已支付/异常订单补发卡密">
      {actErr ? (
        <div style={{ marginBottom: 12 }}>
          <ErrorBar message={actErr} onRetry={() => setActErr('')} />
        </div>
      ) : null}

      <Toolbar
        right={
          <Button variant="ghost" iconLeft={<Icons.RefreshCw />} onClick={list.reload}>
            刷新
          </Button>
        }
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Field label="订单号">
            <Input
              value={form.order_no}
              placeholder="精确订单号"
              onChange={(e) => setForm((f) => ({ ...f, order_no: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
            />
          </Field>
          <Field label="收件邮箱">
            <Input
              value={form.buyer_email}
              placeholder="精确邮箱"
              onChange={(e) => setForm((f) => ({ ...f, buyer_email: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
            />
          </Field>
          <Button iconLeft={<Icons.Search />} onClick={applySearch}>查询</Button>
          <Button variant="ghost" onClick={resetSearch}>重置</Button>
        </div>
      </Toolbar>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {FILTER_OPTIONS.map((o) => (
          <Button
            key={o.value || 'all'}
            size="sm"
            variant={query.status === o.value ? 'primary' : 'ghost'}
            onClick={() => setStatus(o.value)}
          >
            {o.label}
          </Button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={list.loading}
        error={list.error}
        onReload={list.reload}
        empty="暂无订单"
        emptyIcon="Inbox"
      />

      {total > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 14, fontSize: 13, color: 'var(--text-muted)' }}>
          <span>共 {total} 条 · 第 {query.page}/{totalPages} 页</span>
          <Button size="sm" variant="ghost" disabled={query.page <= 1 || list.loading} onClick={() => goPage(query.page - 1)}>上一页</Button>
          <Button size="sm" variant="ghost" disabled={query.page >= totalPages || list.loading} onClick={() => goPage(query.page + 1)}>下一页</Button>
        </div>
      )}

      <OrderDetailModal
        open={detailId != null}
        detail={detail}
        onClose={() => setDetailId(null)}
        actBusy={actBusy}
        actErr={actErr}
        canClose={canClose}
        canRedeliver={canRedeliver}
        onCloseOrder={askClose}
        onRedeliver={askRedeliver}
        productTitle={productTitle}
      />

      <ConfirmActionModal
        confirm={confirm}
        confirming={confirming}
        onCancel={() => { if (!confirming) setConfirm(null); }}
        onConfirm={doConfirm}
      />
    </Panel>
  );
}

/* 关单 / 补发 二次确认弹窗 */
function ConfirmActionModal({ confirm, confirming, onCancel, onConfirm }) {
  const open = confirm != null;
  const kind = confirm && confirm.kind;
  const order = (confirm && confirm.order) || {};
  const qty = Number(order.quantity || 0);
  const isRedeliver = kind === 'redeliver';
  const title = isRedeliver ? '确认补发卡密' : '确认关闭订单';
  const message = isRedeliver
    ? `将从库存分配 ${qty} 张新卡密并发货,操作不可撤销。`
    : '将关闭该未支付订单,操作不可撤销。';

  return (
    <Modal
      open={open}
      title={title}
      width={420}
      onClose={onCancel}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={confirming}>取消</Button>
          <Button
            variant={isRedeliver ? 'primary' : 'danger'}
            iconLeft={isRedeliver ? <Icons.RefreshCw /> : <Icons.Lock />}
            loading={confirming}
            disabled={confirming}
            onClick={onConfirm}
          >
            {isRedeliver ? '确认补发' : '确认关单'}
          </Button>
        </>
      }
    >
      <div style={{ fontSize: 13.5, color: 'var(--text-body)', lineHeight: 1.7 }}>
        {order.order_no ? (
          <div style={{ marginBottom: 8 }}>
            订单号:<span className="tnum" style={{ color: 'var(--text-strong)', fontWeight: 700 }}>{order.order_no}</span>
          </div>
        ) : null}
        <div>{message}</div>
      </div>
    </Modal>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--slate-100)', fontSize: 13.5 }}>
      <div style={{ width: 96, flex: 'none', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
      <div style={{ flex: 1, minWidth: 0, color: 'var(--text-body)', wordBreak: 'break-all' }}>{children}</div>
    </div>
  );
}

function OrderDetailModal({ open, detail, onClose, actBusy, actErr, canClose, canRedeliver, onCloseOrder, onRedeliver, productTitle }) {
  const o = detail.data;
  const cards = (o && o.cards) || [];

  const [copied, setCopied] = React.useState(false);
  function flashCopied() {
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  async function copyCards() {
    const text = cards.join('\n');
    if (!text) return;
    // 1) navigator.clipboard,成功才提示
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        flashCopied();
        return;
      } catch {
        /* 落到 execCommand 兜底 */
      }
    }
    // 2) document.execCommand('copy') 兜底
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (ok) { flashCopied(); return; }
    } catch {
      /* 复制失败,用户可手动选择 */
    }
  }

  return (
    <Modal
      open={open}
      title="订单详情"
      width={560}
      onClose={onClose}
      footer={
        o ? (
          <>
            {canClose(o.status) && (
              <Button variant="danger" iconLeft={<Icons.Lock />} loading={actBusy === o.id} onClick={() => onCloseOrder(o)}>
                关单
              </Button>
            )}
            {canRedeliver(o.status) && (
              <Button variant="ghost" iconLeft={<Icons.RefreshCw />} loading={actBusy === o.id} onClick={() => onRedeliver(o)}>
                补发卡密
              </Button>
            )}
            <Button onClick={onClose}>关闭</Button>
          </>
        ) : (
          <Button onClick={onClose}>关闭</Button>
        )
      }
    >
      {detail.loading && <div style={{ padding: '32px 0', textAlign: 'center' }}><Spinner /></div>}
      {!detail.loading && detail.error && <ErrorBar message={detail.error} onRetry={detail.reload} />}
      {!detail.loading && !detail.error && o && (
        <div>
          {actErr ? <div style={{ marginBottom: 12 }}><Pill tone="danger">{actErr}</Pill></div> : null}

          <Row label="订单号"><span className="tnum">{o.order_no}</span></Row>
          <Row label="状态"><StatusPill status={o.status} /></Row>
          <Row label="商品">
            {productTitle ? productTitle(o.product_id) : `#${o.product_id}`} <span style={{ color: 'var(--text-muted)' }}>× {o.quantity}</span>
            {productTitle && productTitle(o.product_id) !== `#${o.product_id}` ? (
              <span className="tnum" style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: 12 }}>#{o.product_id}</span>
            ) : null}
          </Row>
          <Row label="单价"><Money amount={o.unit_price} /></Row>
          <Row label="实付金额"><Money amount={o.total_amount} strong /></Row>
          <Row label="收件邮箱">{o.buyer_email}</Row>
          {o.buyer_contact ? <Row label="联系方式">{o.buyer_contact}</Row> : null}
          {o.pay_channel ? <Row label="支付渠道">{o.pay_channel}</Row> : null}
          <Row label="下单时间"><span className="tnum">{o.create_time}</span></Row>
          {o.paid_at ? <Row label="支付时间"><span className="tnum">{o.paid_at}</span></Row> : null}
          {o.delivered_at ? <Row label="发货时间"><span className="tnum">{o.delivered_at}</span></Row> : null}
          {Number(o.status) === 0 && o.expire_at ? <Row label="过期时间"><span className="tnum">{o.expire_at}</span></Row> : null}
          {o.remark ? <Row label="备注">{o.remark}</Row> : null}

          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icons.Package size={14} /> 卡密 ({cards.length})
              </span>
              {cards.length > 0 && (
                <Button size="sm" variant="ghost" iconLeft={<Icons.Copy />} onClick={copyCards}>
                  {copied ? '已复制' : '复制全部'}
                </Button>
              )}
            </div>
            {cards.length > 0 ? (
              <div
                style={{
                  background: 'var(--surface-sunken)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 12,
                  maxHeight: 200,
                  overflowY: 'auto',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 12.5,
                  lineHeight: 1.7,
                  color: 'var(--text-body)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {cards.map((c, i) => (
                  <div key={i}>{c}</div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>暂无已发放卡密</div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
