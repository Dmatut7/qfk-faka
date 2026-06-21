import React from 'react';
import { Button } from '../../../design-system/components/core/Button.jsx';
import { Input } from '../../../design-system/components/core/Input.jsx';
import { CardKey } from '../../../design-system/components/commerce/CardKey.jsx';
import { OrderStatusBadge } from '../../../design-system/components/commerce/OrderStatusBadge.jsx';
import { api, normalizeProduct, statusKey, STATUS, ApiError } from '../api.js';
import { Icons } from '../Icons.jsx';

/* status → 中文 label(OrderStatusBadge 的 MAP 没有 exception,统一在这里自传 label) */
const STATUS_LABEL = {
  pending: '待支付',
  paid: '已支付 · 发货中',
  delivered: '已发货',
  closed: '已关闭',
  refunded: '已退款',
  exception: '异常待人工',
};

/* 客服提示条 */
function SupportHint({ text }) {
  return (
    <div style={{ marginTop: 14, display: 'flex', gap: 9, padding: '12px 14px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
      <Icons.Headset size={16} color="var(--text-muted)" />
      <span style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

export default function OrderLookup({ initialResult, onBack }) {
  const [orderNo, setOrderNo] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [fieldErr, setFieldErr] = React.useState({ orderNo: '', email: '' });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState(initialResult || null);
  const [toast, setToast] = React.useState('');
  const toastTimer = React.useRef(null);

  // initialResult 存在时直接渲染结果(付款后直达),不查询
  const directMode = !!initialResult;

  React.useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const flashToast = (m) => {
    setToast(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 1900);
  };

  const search = async () => {
    const on = orderNo.trim();
    const em = email.trim();
    const fe = { orderNo: on ? '' : '请输入订单号', email: em ? '' : '请输入邮箱' };
    setFieldErr(fe);
    if (fe.orderNo || fe.email) return;

    setError('');
    setResult(null);
    setLoading(true);
    try {
      const order = await api.queryOrder({ orderNo: on, email: em });
      // 后端查单只返回 product_id;尽力补一次商品详情,让结果显示真实商品名(失败不影响)。
      let enriched = order;
      if (order && !order.product && order.product_id != null) {
        try {
          const prod = await api.product(order.product_id);
          enriched = { ...order, product: prod };
        } catch { /* 商品已下架/查询失败 → 用 product_id 兜底显示 */ }
      }
      setResult(enriched);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : '查询失败,请稍后重试';
      // 查无 / 业务错误 → 空错态(不造假样例订单)
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e) => { e.preventDefault(); if (!loading) search(); };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 16px 60px' }}>
      {onBack && (
        <button onClick={onBack} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'transparent',
          color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
          cursor: 'pointer', padding: 0, marginBottom: 12,
        }}><Icons.ChevronLeft size={18} />返回</button>
      )}

      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.02em', margin: 0 }}>订单查询 / 取卡</h1>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>
        {directMode
          ? '以下是您本次订单的详情与卡密,请妥善保管。'
          : '输入下单时的订单号和邮箱,即可查看订单状态并领取卡密。'}
      </p>

      {/* 查询表单(directMode 下不展示) */}
      {!directMode && (
        <form onSubmit={onSubmit} style={{ marginTop: 18, background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 18, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input
              label="订单号"
              placeholder="如 MK20260621A8F3"
              icon={<Icons.Search size={18} />}
              value={orderNo}
              onChange={(e) => { setOrderNo(e.target.value); setFieldErr((s) => ({ ...s, orderNo: '' })); setError(''); }}
              error={fieldErr.orderNo}
              autoComplete="off"
              disabled={loading}
            />
            <Input
              label="邮箱"
              placeholder="下单时填写的邮箱"
              type="email"
              icon={<Icons.Mail size={18} />}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErr((s) => ({ ...s, email: '' })); setError(''); }}
              error={fieldErr.email}
              autoComplete="email"
              disabled={loading}
            />
          </div>
          <div style={{ marginTop: 14 }}>
            <Button type="submit" variant="primary" size="lg" block loading={loading} iconLeft={loading ? undefined : <Icons.Search size={18} />}>
              {loading ? '查询中…' : '查询订单'}
            </Button>
          </div>
        </form>
      )}

      {/* 错误 / 空错态 */}
      {!directMode && error && !loading && (
        <div style={{ marginTop: 18, background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '28px 20px', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, margin: '0 auto 12px', borderRadius: '50%', background: 'var(--surface-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.Inbox size={26} color="var(--text-muted)" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>未找到该订单</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
            请核对订单号与邮箱后重试。{error ? `(${error})` : ''}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-subtle)', marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icons.Headset size={15} color="var(--text-subtle)" />如有疑问请联系客服协助查询
          </div>
        </div>
      )}

      {/* 结果区 */}
      {result && <OrderResult result={result} flashToast={flashToast} />}

      {/* toast */}
      <div role="status" aria-live="polite" aria-atomic="true">
        {toast && (
          <div style={{
            position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 60,
            background: 'var(--slate-900)', color: '#fff', padding: '11px 20px', borderRadius: 'var(--radius-pill)',
            fontSize: 14, fontWeight: 600, boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Icons.Check size={16} color="var(--green-100)" />{toast}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderResult({ result, flashToast }) {
  const r = result;
  const statusNum = Number(r.status);
  const key = statusKey(statusNum);
  const cards = Array.isArray(r.cards) ? r.cards : [];

  // 商品信息:订单里可能没有完整商品对象,做优雅缺省
  const prod = r.product ? normalizeProduct(r.product) : null;
  const prodName = prod ? prod.name : (r.product_name || `商品 #${r.product_id ?? ''}`);
  const prodThumb = prod ? prod.thumb : '📦';
  const total = Number(r.total_amount ?? 0);
  const qty = Number(r.quantity ?? cards.length ?? 1);

  const copyAll = async () => {
    const text = cards.join('\n');
    if (!text) return;
    // 1) navigator.clipboard,成功才提示
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        flashToast('已复制全部卡密');
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
      if (ok) { flashToast('已复制全部卡密'); return; }
    } catch {
      /* 落到最终失败提示 */
    }
    // 3) 最终失败
    flashToast('复制失败,请手动长按选择');
  };

  return (
    <div style={{ marginTop: 18, background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span className="ds-mono" style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>{r.order_no}</span>
        <OrderStatusBadge status={key} label={STATUS_LABEL[key]} />
      </div>

      <div style={{ padding: 18 }}>
        {/* 订单信息 */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 11, background: 'var(--brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flex: 'none' }}>{prodThumb}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-strong)' }}>{prodName}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>数量 ×{qty} · 实付 ¥{total.toFixed(2)}</div>
          </div>
        </div>

        {/* 已发货:展示卡密 */}
        {statusNum === STATUS.DELIVERED && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 800, color: 'var(--success-fg)' }}>
                <Icons.ShieldCheck size={16} color="var(--success-solid)" />卡密已发放({cards.length})
              </div>
              {cards.length > 1 && (
                <button onClick={copyAll} style={{
                  display: 'flex', alignItems: 'center', gap: 6, border: '1.5px solid var(--border-strong)', background: '#fff',
                  borderRadius: 'var(--radius-pill)', padding: '5px 12px', fontSize: 12.5, fontWeight: 700, color: 'var(--text-strong)', cursor: 'pointer',
                }}><Icons.Copy size={14} />复制全部</button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cards.map((code, i) => (
                <CardKey
                  key={code}
                  index={cards.length > 1 ? i + 1 : undefined}
                  label="卡密"
                  code={code}
                  onCopy={() => flashToast('已复制卡密')}
                />
              ))}
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 9, padding: '12px 14px', background: 'var(--pending-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--pending-border)' }}>
              <Icons.Clock size={16} color="var(--pending-solid)" />
              <span style={{ fontSize: 12.5, color: 'var(--pending-fg)', lineHeight: 1.5 }}>请尽快复制并妥善保管卡密。卡密仅展示给本订单,如遇问题请在 24 小时内联系客服。</span>
            </div>
          </div>
        )}

        {/* 待支付:locked 占位,不展示卡密 */}
        {statusNum === STATUS.PENDING && (
          <div>
            <CardKey locked label="卡密" lockedHint="订单待支付,完成付款后卡密将在此自动显示" />
            <SupportHint text="该订单尚未支付。如已付款但未到账,请稍候片刻或联系客服核对。" />
          </div>
        )}

        {/* 已支付 · 发货中(status=1):介于待支付与发货之间 */}
        {statusNum === STATUS.PAID && (
          <div>
            <CardKey locked label="卡密" lockedHint="已收到付款,正在为您发货,卡密稍后将在此显示" />
            <SupportHint text="款项已收到,系统正在自动发货,请稍候刷新查询。" />
          </div>
        )}

        {/* 已关闭 */}
        {statusNum === STATUS.CLOSED && (
          <div style={{ display: 'flex', gap: 9, padding: '14px 16px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <Icons.Clock size={18} color="var(--text-muted)" />
            <span style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.5 }}>该订单已关闭或已过期,未完成支付,因此没有卡密。如需购买请返回重新下单。</span>
          </div>
        )}

        {/* 已退款 */}
        {statusNum === STATUS.REFUNDED && (
          <div style={{ display: 'flex', gap: 9, padding: '14px 16px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <Icons.RefreshCw size={18} color="var(--text-muted)" />
            <span style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.5 }}>该订单已退款,款项将原路退回。本订单不再展示卡密,如有疑问请联系客服。</span>
          </div>
        )}

        {/* 异常待人工:醒目,绝不显示去支付 */}
        {statusNum === STATUS.EXCEPTION && (
          <div>
            <div style={{ display: 'flex', gap: 10, padding: '14px 16px', background: 'var(--danger-bg, #fdeced)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger-solid)' }}>
              <Icons.AlertTriangle size={20} color="var(--danger-solid)" />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--danger-fg)' }}>订单异常</div>
                <div style={{ fontSize: 12.5, color: 'var(--danger-fg)', lineHeight: 1.5, marginTop: 3 }}>款项已收到,但发货受阻。客服将尽快为您处理或安排退款,无需重复支付。</div>
              </div>
            </div>
            <SupportHint text="请联系客服并提供本订单号,我们会优先为您处理。" />
          </div>
        )}
      </div>
    </div>
  );
}
