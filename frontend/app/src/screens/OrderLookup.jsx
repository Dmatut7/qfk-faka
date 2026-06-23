import React from 'react';
import { Button } from '../../../design-system/components/core/Button.jsx';
import { Input } from '../../../design-system/components/core/Input.jsx';
import { Badge } from '../../../design-system/components/core/Badge.jsx';
import { PriceTag } from '../../../design-system/components/core/PriceTag.jsx';
import { CardKey } from '../../../design-system/components/commerce/CardKey.jsx';
import { OrderStatusBadge } from '../../../design-system/components/commerce/OrderStatusBadge.jsx';
import { CheckoutSteps } from '../../../design-system/components/commerce/CheckoutSteps.jsx';
import { api, normalizeProduct, statusKey, STATUS, ApiError, BASE } from '../api.js';
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

/* 订单进度条:把后端状态映射到「下单 · 付款 · 取卡」三步(取卡=已发货) */
function statusToStep(statusNum) {
  if (statusNum === STATUS.DELIVERED) return 3;     // 已取卡 → 全部完成
  if (statusNum === STATUS.PAID) return 2;          // 已付款,发货中
  if (statusNum === STATUS.PENDING) return 1;       // 已下单,待支付
  return 1;                                          // 关闭/退款/异常 → 停在下单
}

/* 客服提示条(淘宝橙温和底) */
function SupportHint({ text }) {
  return (
    <div style={{ marginTop: 14, display: 'flex', gap: 9, padding: '12px 14px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
      <Icons.Headset size={16} color="var(--text-muted)" style={{ flex: 'none', marginTop: 1 }} />
      <span style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

/* 平台查单兜底安全提示:queryTips 为空时也展示这句默认文案,保证总有安全提示。 */
const DEFAULT_QUERY_TIPS = '官方查单仅需订单号+邮箱/查单密码,切勿向他人透露验证码或额外付款。';

/* 平台查单风险提示(纯文本渲染,保留换行;为空回退到默认兜底文案)。橙色商业风的安全提示。 */
function OrderQueryTips({ text }) {
  const t = (text || '').trim() || DEFAULT_QUERY_TIPS;
  return (
    <div style={{
      marginTop: 16, display: 'flex', gap: 10, padding: '12px 14px',
      background: 'var(--pending-bg)', border: '1px solid var(--pending-border)',
      borderRadius: 'var(--radius-md)',
    }}>
      <Icons.ShieldCheck size={17} color="var(--pending-fg)" style={{ flex: 'none', marginTop: 1 }} />
      <span style={{ fontSize: 12.5, color: 'var(--pending-fg)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{t}</span>
    </div>
  );
}

export default function OrderLookup({ initialResult, onBack, queryTips }) {
  const [orderNo, setOrderNo] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [mode, setMode] = React.useState('email'); // 'email' | 'password' 查单凭证
  const [fieldErr, setFieldErr] = React.useState({ orderNo: '', email: '', password: '' });
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
    const pw = password.trim();
    const byPwd = mode === 'password';
    const fe = {
      orderNo: on ? '' : '请输入订单号',
      email: byPwd ? '' : (em ? '' : '请输入邮箱'),
      password: byPwd ? (pw ? '' : '请输入查单密码') : '',
    };
    setFieldErr(fe);
    if (fe.orderNo || fe.email || fe.password) return;

    setError('');
    setResult(null);
    setLoading(true);
    try {
      const order = await api.queryOrder(byPwd ? { orderNo: on, password: pw } : { orderNo: on, email: em });
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
      // 2003 凭证与订单不匹配:订单号本身存在,问题在凭证,给出针对性文案。
      let msg;
      if (e instanceof ApiError && e.code === 2003) {
        msg = mode === 'password' ? '订单号或查单密码有误' : '订单号或邮箱有误,请核对邮箱';
      } else {
        msg = e instanceof ApiError ? e.message : '查询失败,请稍后重试';
      }
      // 查无 / 业务错误 → 空错态(不造假样例订单)
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e) => { e.preventDefault(); if (!loading) search(); };

  return (
    <div className="ol-shell" style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px 64px' }}>
      {onBack && (
        <button onClick={onBack} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'transparent',
          color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
          cursor: 'pointer', padding: 0, marginBottom: 14,
        }}><Icons.ChevronLeft size={18} />返回</button>
      )}

      {/* 标题区:淘宝橙渐变标识 + 大标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 'var(--radius-md)', flex: 'none',
          background: 'var(--brand-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-brand)',
        }}>
          <Icons.Package size={22} color="#fff" />
        </div>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.02em', margin: 0 }}>订单查询 / 取卡</h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 4 }}>
            {directMode
              ? '以下是您本次订单的详情与卡密,请妥善保管。'
              : '输入下单时的订单号和邮箱,即可查看订单状态并领取卡密。'}
          </p>
        </div>
      </div>

      {/* 平台查单风险提示(表单上方;directMode 付款后直达结果不展示) */}
      {!directMode && <OrderQueryTips text={queryTips} />}

      {/* 查询表单(directMode 下不展示) */}
      {!directMode && (
        <form onSubmit={onSubmit} style={{ marginTop: 18, background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 18, boxShadow: 'var(--shadow-sm)' }}>
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
            {/* 凭证方式切换:邮箱 / 查单密码(淘宝橙分段) */}
            <div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-strong)', marginBottom: 6 }}>查单凭证</div>
              <div style={{ display: 'flex', gap: 8, background: 'var(--surface-sunken)', padding: 4, borderRadius: 'var(--radius-md)' }}>
                {[['email', '邮箱查单'], ['password', '密码查单']].map(([m, label]) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setMode(m); setError(''); setFieldErr((s) => ({ ...s, email: '', password: '' })); }}
                    disabled={loading}
                    style={{
                      flex: 1, height: 38, border: 'none', borderRadius: 'var(--radius-sm)', cursor: loading ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 700,
                      background: mode === m ? 'var(--surface-card)' : 'transparent',
                      color: mode === m ? 'var(--brand-active)' : 'var(--text-muted)',
                      boxShadow: mode === m ? 'var(--shadow-xs)' : 'none',
                    }}
                  >{label}</button>
                ))}
              </div>
            </div>
            {mode === 'email' ? (
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
            ) : (
              <Input
                label="查单密码"
                placeholder="下单时设置的查单密码"
                type="password"
                icon={<Icons.Lock size={18} />}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErr((s) => ({ ...s, password: '' })); setError(''); }}
                error={fieldErr.password}
                autoComplete="off"
                disabled={loading}
              />
            )}
          </div>
          <div style={{ marginTop: 16 }}>
            <Button type="submit" variant="primary" size="lg" block loading={loading} iconLeft={loading ? undefined : <Icons.Search size={18} />}>
              {loading ? '查询中…' : '查询订单'}
            </Button>
          </div>
        </form>
      )}

      {/* 查单帮助 / 防诈骗提示(仅空查单态展示,填补桌面端留白) */}
      {!directMode && !result && !loading && !error && (
        <div style={{ marginTop: 16, background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 18, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Icons.ShieldCheck size={17} color="var(--brand)" />
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-strong)' }}>查单帮助与安全提示</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 7 }}>
            <li style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.6 }}>订单号在下单成功页或付款回执中,形如 <span className="ds-mono" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-strong)' }}>MK20260621A8F3</span>。</li>
            <li style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.6 }}>可用下单邮箱或下单时设置的查单密码核验身份,二选一即可。</li>
            <li style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.6 }}>付款成功后系统自动发货,卡密/内容会在本页订单详情中展示,请勿向他人透露。</li>
            <li style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.6 }}>官方不会以「订单异常」为由要求额外转账或索取验证码,谨防诈骗。</li>
          </ul>
          <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--text-subtle)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icons.Headset size={15} color="var(--text-subtle)" />查不到或有疑问?可凭订单号联系客服协助。
          </div>
        </div>
      )}

      {/* 加载态(查询进行中,无错无果) */}
      {!directMode && loading && !result && (
        <div style={{ marginTop: 18, background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '28px 20px', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
          <div className="ol-spin" style={{
            width: 30, height: 30, margin: '0 auto 12px', borderRadius: '50%',
            border: '3px solid var(--brand-soft-border)', borderTopColor: 'var(--brand)',
          }} />
          <div style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>正在查询订单…</div>
        </div>
      )}

      {/* 错误 / 空错态 */}
      {!directMode && error && !loading && (
        <div style={{ marginTop: 18, background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '28px 20px', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, margin: '0 auto 12px', borderRadius: '50%', background: 'var(--surface-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.Inbox size={26} color="var(--text-muted)" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>未找到该订单</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
            {error || (mode === 'password' ? '请核对订单号与查单密码后重试。' : '请核对订单号与邮箱后重试。')}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-subtle)', marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icons.Headset size={15} color="var(--text-subtle)" />如有疑问请联系客服协助查询
          </div>
        </div>
      )}

      {/* 结果区 */}
      {result && <OrderResult result={result} flashToast={flashToast} contactEmail={email.trim()} contactPassword={password.trim()} directMode={directMode} refreshing={loading} onRefresh={search} />}

      {/* toast「已复制」统一样式 */}
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

      {/* 加载圈动画 + 桌面放宽 + 投诉多行描述框(内联,全走橙色 token,避免依赖外部 keyframes) */}
      <style>{`
        @keyframes ol-spin{to{transform:rotate(360deg)}}
        .ol-spin{animation:ol-spin .7s linear infinite}
        @media (min-width:960px){.ol-shell{max-width:900px!important}}
        .ol-textarea{
          width:100%; min-height:96px; padding:11px 14px; font-family:var(--font-sans); font-size:var(--text-md);
          color:var(--text-strong); background:#fff; border:1.5px solid var(--border-strong);
          border-radius:var(--radius-md); line-height:1.55; resize:vertical; -webkit-appearance:none; appearance:none;
          transition:border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
        }
        .ol-textarea::placeholder{ color:var(--text-subtle); }
        .ol-textarea:hover{ border-color:var(--slate-400); }
        .ol-textarea:focus{ outline:none; border-color:var(--brand); box-shadow:var(--shadow-focus); }
      `}</style>
    </div>
  );
}

/* 发货物按商品类型的称谓(卡密店保持「卡密」原文案不变) */
const DELIVER_NOUN = { 1: '卡密', 2: '内容', 3: '资源', 4: '权益' };
const deliverNoun = (gt) => DELIVER_NOUN[Number(gt) || 1] || '卡密';

function OrderResult({ result, flashToast, contactEmail = '', contactPassword = '', directMode = false, refreshing = false, onRefresh }) {
  const r = result;
  const statusNum = Number(r.status);
  const key = statusKey(statusNum);
  const cards = Array.isArray(r.cards) ? r.cards : [];
  const noun = deliverNoun(r.goods_type);
  // 已收款订单(已发货/异常/已退款)可申请售后
  // 与后端 ComplaintService.COMPLAINABLE 对齐:已支付(发货中)同样可申诉(最需售后的场景)
  const canComplain = [STATUS.PAID, STATUS.DELIVERED, STATUS.EXCEPTION, STATUS.REFUNDED].includes(statusNum);
  // 知识类(goods_type=2)且已发货 → 可站内阅读章节
  const canRead = Number(r.goods_type) === 2 && statusNum === STATUS.DELIVERED;

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
    <div style={{ marginTop: 18, background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
      {/* 头部:订单号 + 状态徽标 */}
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span className="ds-mono" style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>{r.order_no}</span>
        <OrderStatusBadge status={key} label={STATUS_LABEL[key]} />
      </div>

      {/* 进度条:下单 · 付款 · 取卡 */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'var(--surface-sunken)' }}>
        <CheckoutSteps steps={['下单', '付款', '取卡']} current={statusToStep(statusNum)} />
      </div>

      <div style={{ padding: 18 }}>
        {/* 订单商品摘要(缩略图 + 名称 + 数量 + 红色实付 + 邮箱) */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-md)', background: 'var(--brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flex: 'none', overflow: 'hidden' }}>
            {prod && prod.image
              ? <img src={prod.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : prodThumb}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-strong)', lineHeight: 1.35, wordBreak: 'break-word' }}>{prodName}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
              <Badge variant="neutral">数量 ×{qty}</Badge>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>实付</span>
                <PriceTag amount={total} size="sm" />
              </span>
            </div>
            {contactEmail && (
              <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 5, display: 'inline-flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                <Icons.Mail size={13} color="var(--text-subtle)" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contactEmail}</span>
              </div>
            )}
          </div>
        </div>

        {/* 已发货:展示卡密(CardKey 列表 + 逐条复制 + 复制全部) */}
        {statusNum === STATUS.DELIVERED && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 800, color: 'var(--success-fg)' }}>
                <Icons.ShieldCheck size={16} color="var(--success-solid)" />{noun}已发放({cards.length})
              </div>
              {cards.length > 1 && (
                <button onClick={copyAll} style={{
                  display: 'flex', alignItems: 'center', gap: 6, border: '1.5px solid var(--brand)', background: 'var(--brand-soft)',
                  borderRadius: 'var(--radius-pill)', padding: '5px 12px', fontSize: 12.5, fontWeight: 700, color: 'var(--brand-active)', cursor: 'pointer',
                }}><Icons.Copy size={14} color="var(--brand)" />复制全部</button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cards.map((code, i) => (
                <CardKey
                  key={code}
                  index={cards.length > 1 ? i + 1 : undefined}
                  label={noun}
                  code={code}
                  onCopy={() => flashToast('已复制')}
                />
              ))}
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 9, padding: '12px 14px', background: 'var(--pending-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--pending-border)' }}>
              <Icons.Clock size={16} color="var(--pending-solid)" style={{ flex: 'none', marginTop: 1 }} />
              <span style={{ fontSize: 12.5, color: 'var(--pending-fg)', lineHeight: 1.5 }}>请尽快复制并妥善保管{noun}。{noun}仅展示给本订单,如遇问题请在 24 小时内联系客服。</span>
            </div>
          </div>
        )}

        {/* 待支付:locked 占位,不展示卡密 */}
        {statusNum === STATUS.PENDING && (
          <div>
            <CardKey locked label={noun} lockedHint={`订单待支付,完成付款后${noun}将在此自动显示`} />
            <SupportHint text="该订单尚未支付。如已付款但未到账,请稍候片刻或联系客服核对。" />
          </div>
        )}

        {/* 已支付 · 发货中(status=1):介于待支付与发货之间 */}
        {statusNum === STATUS.PAID && (
          <div>
            <CardKey locked label={noun} lockedHint={`已收到付款,正在为您发货,${noun}稍后将在此显示`} />
            <SupportHint text="款项已收到,系统正在自动发货,请稍候刷新查询。" />
          </div>
        )}

        {/* 已关闭 */}
        {statusNum === STATUS.CLOSED && (
          <div style={{ display: 'flex', gap: 9, padding: '14px 16px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <Icons.Clock size={18} color="var(--text-muted)" style={{ flex: 'none', marginTop: 1 }} />
            <span style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.5 }}>该订单已关闭或已过期,未完成支付,因此没有卡密。如需购买请返回重新下单。</span>
          </div>
        )}

        {/* 已退款 */}
        {statusNum === STATUS.REFUNDED && (
          <div style={{ display: 'flex', gap: 9, padding: '14px 16px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <Icons.RefreshCw size={18} color="var(--text-muted)" style={{ flex: 'none', marginTop: 1 }} />
            <span style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.5 }}>该订单已退款,款项将原路退回。本订单不再展示卡密,如有疑问请联系客服。</span>
          </div>
        )}

        {/* 异常待人工:醒目红,绝不显示去支付 */}
        {statusNum === STATUS.EXCEPTION && (
          <div>
            <div style={{ display: 'flex', gap: 10, padding: '14px 16px', background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger-solid)' }}>
              <Icons.AlertTriangle size={20} color="var(--danger-solid)" style={{ flex: 'none', marginTop: 1 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--danger-fg)' }}>订单异常</div>
                <div style={{ fontSize: 12.5, color: 'var(--danger-fg)', lineHeight: 1.5, marginTop: 3 }}>款项已收到,但发货受阻。客服将尽快为您处理或安排退款,无需重复支付。</div>
              </div>
            </div>
            <SupportHint text="请联系客服并提供本订单号,我们会优先为您处理。" />
          </div>
        )}

        {/* 知识类:站内阅读章节(左目录 + 右正文) */}
        {canRead && <ChapterReader orderNo={r.order_no} email={contactEmail} password={contactPassword} />}

        {/* 资源类:限时签名下载链(30 分钟有效期) */}
        {statusNum === STATUS.DELIVERED && r.download_url && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Button as="a" href={/^https?:\/\//i.test(r.download_url) ? r.download_url : BASE + r.download_url} target="_blank" rel="noopener noreferrer" variant="primary" size="md" iconLeft={<Icons.Package size={17} color="#fff" />}>
                下载资源
              </Button>
              {!directMode && onRefresh && (
                <Button variant="secondary" size="md" loading={refreshing} onClick={onRefresh} iconLeft={<Icons.RefreshCw size={16} />}>
                  刷新下载链
                </Button>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Icons.Clock size={13} color="var(--text-subtle)" />
              {directMode ? '链接有效期 30 分钟,过期请到「取卡 / 查单」页重新查单获取。' : '链接有效期 30 分钟,过期点「刷新下载链」即可重新获取。'}
            </div>
          </div>
        )}

        {/* 申请售后 / 投诉(已收款订单) */}
        {canComplain && <ComplaintBox orderNo={r.order_no} defaultEmail={contactEmail} flashToast={flashToast} />}
      </div>
    </div>
  );
}

/* 知识类章节阅读:购后凭订单凭证拉取章节全文,左目录右正文站内展开 */
function ChapterReader({ orderNo, email, password }) {
  const [open, setOpen] = React.useState(false);
  const [chapters, setChapters] = React.useState(null);
  const [active, setActive] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState('');

  const load = async () => {
    setOpen(true);
    if (chapters) return;
    setLoading(true); setErr('');
    try {
      const d = await api.orderChapters({ orderNo, email: email || undefined, password: password || undefined });
      setChapters(Array.isArray(d.chapters) ? d.chapters : []);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : '内容加载失败');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed var(--border)' }}>
      {!open ? (
        <Button variant="secondary" size="md" onClick={load} iconLeft={<Icons.Inbox size={16} />}>
          阅读内容
        </Button>
      ) : loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-subtle)', padding: '20px 0' }}>加载中…</div>
      ) : err ? (
        <div style={{ fontSize: 13, color: 'var(--danger-fg)' }}>{err}</div>
      ) : !chapters || chapters.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>暂无可阅读章节。</div>
      ) : (
        <div className="ol-reader" style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, alignItems: 'start' }}>
          {/* 左:章节目录 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto' }}>
            {chapters.map((c, i) => (
              <button key={c.id} onClick={() => setActive(i)} style={{
                textAlign: 'left', padding: '8px 11px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                fontSize: 12.5, fontWeight: 700, fontFamily: 'var(--font-sans)', lineHeight: 1.4,
                border: i === active ? '1.5px solid var(--brand)' : '1px solid var(--border)',
                background: i === active ? 'var(--brand-soft)' : 'var(--surface-card)',
                color: i === active ? 'var(--brand-active)' : 'var(--text-muted)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{c.title}</button>
            ))}
          </div>
          {/* 右:当前章节正文 */}
          <article style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: '16px 18px', minWidth: 0 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 800, color: 'var(--text-strong)' }}>{chapters[active].title}</h3>
            <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-body)', wordBreak: 'break-word' }}
              dangerouslySetInnerHTML={{ __html: chapters[active].content || '' }} />
          </article>
          {/* 移动端单列:目录在上、正文在下 */}
          <style>{`@media (max-width:520px){.ol-reader{grid-template-columns:1fr!important}.ol-reader>div{flex-direction:row!important;flex-wrap:wrap!important;max-height:none!important}}`}</style>
        </div>
      )}
    </div>
  );
}

const COMPLAINT_TYPES = [
  { v: 1, label: '未收到货' },
  { v: 2, label: '卡密/内容无效' },
  { v: 3, label: '与描述不符' },
  { v: 4, label: '其他问题' },
];

/* 售后投诉:填写邮箱(预填查单邮箱)+ 类型 + 描述,提交后展示进度,可申请平台介入 */
function ComplaintBox({ orderNo, defaultEmail, flashToast }) {
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState(defaultEmail || '');
  const [type, setType] = React.useState(2);
  const [desc, setDesc] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [done, setDone] = React.useState(false);
  // 售后列表 + 平台介入
  const [complaints, setComplaints] = React.useState(null);
  const [listBusy, setListBusy] = React.useState(false);
  const [listErr, setListErr] = React.useState('');
  const [escId, setEscId] = React.useState(null); // 正在申请介入的投诉 id

  const loadComplaints = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setListErr('请填写下单时的邮箱以核验身份'); return; }
    setListErr(''); setListBusy(true);
    try {
      const d = await api.queryComplaints({ orderNo, email: email.trim() });
      setComplaints(Array.isArray(d.items) ? d.items : (Array.isArray(d.complaints) ? d.complaints : (Array.isArray(d) ? d : [])));
    } catch (e) {
      setListErr(e instanceof ApiError ? e.message : '加载售后记录失败');
    } finally { setListBusy(false); }
  };

  const escalate = async (id) => {
    setListErr(''); setEscId(id);
    try {
      await api.escalateComplaint({ id, orderNo, email: email.trim() });
      flashToast && flashToast('已申请平台介入');
      await loadComplaints();
    } catch (e) {
      setListErr(e instanceof ApiError ? e.message : '申请平台介入失败');
    } finally { setEscId(null); }
  };

  const submit = async () => {
    setErr('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setErr('请填写下单时的邮箱以核验身份'); return; }
    if (!desc.trim()) { setErr('请描述遇到的问题'); return; }
    setBusy(true);
    try {
      await api.fileComplaint({ orderNo, email: email.trim(), type, description: desc.trim() });
      setDone(true);
      flashToast && flashToast('已提交售后申请');
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : '提交失败,请稍后重试');
    } finally { setBusy(false); }
  };

  if (done) {
    return (
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed var(--border)' }}>
        <div style={{ padding: '12px 14px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-md)', fontSize: 12.5, color: 'var(--success-fg)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Icons.Check size={16} color="var(--success-solid)" />售后申请已提交,商户会尽快处理;若未解决可在此查看进度并申请平台介入。
        </div>
        {/* 售后记录 + 申请平台介入 */}
        <div style={{ marginTop: 12 }}>
          {!complaints ? (
            <Button variant="neutral" size="sm" onClick={loadComplaints} loading={listBusy} iconLeft={listBusy ? undefined : <Icons.RefreshCw size={14} />}>
              查看售后进度
            </Button>
          ) : (
            <ComplaintList items={complaints} escId={escId} onEscalate={escalate} onRefresh={loadComplaints} listBusy={listBusy} />
          )}
          {listErr ? <div style={{ fontSize: 12.5, color: 'var(--danger-fg)', marginTop: 8 }}>{listErr}</div> : null}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed var(--border)' }}>
      {!open ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="neutral" size="sm" onClick={() => setOpen(true)} iconLeft={<Icons.AlertTriangle size={15} color="var(--pending-solid)" />}>
            遇到问题?申请售后
          </Button>
          <Button variant="ghost" size="sm" onClick={loadComplaints} loading={listBusy} iconLeft={listBusy ? undefined : <Icons.RefreshCw size={14} />}>
            查看售后进度
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {err ? <div style={{ fontSize: 12.5, color: 'var(--danger-fg)' }}>{err}</div> : null}
          <Input label="下单邮箱(核验身份)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 6 }}>问题类型</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COMPLAINT_TYPES.map((t) => (
                <button key={t.v} onClick={() => setType(t.v)} style={{
                  padding: '6px 12px', borderRadius: 'var(--radius-pill)', cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
                  fontFamily: 'var(--font-sans)',
                  border: type === t.v ? '1.5px solid var(--brand)' : '1px solid var(--border)',
                  background: type === t.v ? 'var(--brand-soft)' : 'var(--surface-card)',
                  color: type === t.v ? 'var(--brand-active)' : 'var(--text-muted)',
                }}>{t.label}</button>
              ))}
            </div>
          </div>
          <div className="mk-field">
            <label className="mk-field__label" htmlFor="ol-complaint-desc">问题描述</label>
            <textarea
              id="ol-complaint-desc"
              className="ol-textarea"
              rows={4}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="请描述遇到的问题,便于商户和平台处理(可多行详细说明)"
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="primary" size="md" onClick={submit} loading={busy}>提交申请</Button>
            <Button variant="ghost" size="md" onClick={() => setOpen(false)} disabled={busy}>取消</Button>
          </div>
        </div>
      )}
      {/* 未提交分支下,若已加载到售后记录也展示(支持「查看售后进度」入口) */}
      {!open && complaints && (
        <div style={{ marginTop: 12 }}>
          <ComplaintList items={complaints} escId={escId} onEscalate={escalate} onRefresh={loadComplaints} listBusy={listBusy} />
        </div>
      )}
      {!open && listErr ? <div style={{ fontSize: 12.5, color: 'var(--danger-fg)', marginTop: 8 }}>{listErr}</div> : null}
    </div>
  );
}

/* 售后进度状态 → 文案 + 徽标色(后端 status 数字或字符串都兼容) */
const COMPLAINT_STATUS = {
  0: { label: '待处理', variant: 'pending' },
  1: { label: '处理中', variant: 'brand' },
  2: { label: '已解决', variant: 'success' },
  3: { label: '已驳回', variant: 'danger' },
  4: { label: '平台介入中', variant: 'brand' },
  pending: { label: '待处理', variant: 'pending' },
  processing: { label: '处理中', variant: 'brand' },
  resolved: { label: '已解决', variant: 'success' },
  rejected: { label: '已驳回', variant: 'danger' },
  escalated: { label: '平台介入中', variant: 'brand' },
};
const complaintStatus = (s) => COMPLAINT_STATUS[s] || COMPLAINT_STATUS[Number(s)] || { label: '处理中', variant: 'brand' };
const TYPE_LABEL = { 1: '未收到货', 2: '卡密/内容无效', 3: '与描述不符', 4: '其他问题' };

/* 售后记录列表:逐条显示状态,可对未终结的投诉申请平台介入 */
function ComplaintList({ items, escId, onEscalate, onRefresh, listBusy }) {
  if (!items || items.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '12px 14px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
        <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>暂无售后记录。</span>
        <Button variant="ghost" size="sm" onClick={onRefresh} loading={listBusy}>刷新</Button>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-strong)' }}>售后进度({items.length})</span>
        <Button variant="ghost" size="sm" onClick={onRefresh} loading={listBusy} iconLeft={listBusy ? undefined : <Icons.RefreshCw size={13} />}>刷新</Button>
      </div>
      {items.map((c) => {
        const st = complaintStatus(c.status);
        const cid = c.id ?? c.complaint_id;
        // 终结态(已解决/已驳回)或已在介入中 → 不再展示「申请平台介入」
        const canEscalate = !(st.variant === 'success' || st.variant === 'danger' || st.label === '平台介入中' || c.escalated);
        const typeLabel = TYPE_LABEL[Number(c.type)] || c.type_label || '售后';
        return (
          <div key={cid ?? Math.random()} style={{ padding: '12px 14px', background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)' }}>{typeLabel}</span>
              <Badge variant={st.variant} dot>{st.label}</Badge>
            </div>
            {(c.description || c.desc) && (
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5, wordBreak: 'break-word' }}>{c.description || c.desc}</div>
            )}
            {(c.reply || c.merchant_reply) && (
              <div style={{ fontSize: 12.5, color: 'var(--text-body)', marginTop: 6, padding: '8px 10px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', lineHeight: 1.5 }}>
                <span style={{ fontWeight: 700 }}>商户回复:</span>{c.reply || c.merchant_reply}
              </div>
            )}
            {canEscalate && cid != null && (
              <div style={{ marginTop: 10 }}>
                <Button variant="secondary" size="sm" loading={escId === cid} onClick={() => onEscalate(cid)} iconLeft={escId === cid ? undefined : <Icons.Shield size={14} />}>
                  申请平台介入
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
