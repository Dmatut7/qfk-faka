import React from 'react';
import { Button } from '../../../design-system/components/core/Button.jsx';
import { Input } from '../../../design-system/components/core/Input.jsx';
import { CardKey } from '../../../design-system/components/commerce/CardKey.jsx';
import { OrderStatusBadge } from '../../../design-system/components/commerce/OrderStatusBadge.jsx';
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

/* 客服提示条 */
function SupportHint({ text }) {
  return (
    <div style={{ marginTop: 14, display: 'flex', gap: 9, padding: '12px 14px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
      <Icons.Headset size={16} color="var(--text-muted)" />
      <span style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

/* 平台查单风险提示(纯文本渲染,保留换行;为空不显示)。对标鲸发卡查单页安全提示。 */
function OrderQueryTips({ text }) {
  const t = (text || '').trim();
  if (!t) return null;
  return (
    <div style={{
      marginTop: 16, display: 'flex', gap: 10, padding: '12px 14px',
      background: 'var(--pending-bg, #fff8eb)', border: '1px solid var(--pending-border, #fde7b8)',
      borderRadius: 'var(--radius-md)',
    }}>
      <Icons.ShieldCheck size={17} color="var(--pending-fg, #92600a)" style={{ flex: 'none', marginTop: 1 }} />
      <span style={{ fontSize: 12.5, color: 'var(--pending-fg, #92600a)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{t}</span>
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

      {/* 平台查单风险提示(表单上方;directMode 付款后直达结果不展示) */}
      {!directMode && <OrderQueryTips text={queryTips} />}

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
            {/* 凭证方式切换:邮箱 / 查单密码 */}
            <div style={{ display: 'flex', gap: 0, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              {[['email', '邮箱查单'], ['password', '密码查单']].map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setError(''); setFieldErr((s) => ({ ...s, email: '', password: '' })); }}
                  disabled={loading}
                  style={{
                    flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', border: 'none',
                    background: mode === m ? 'var(--brand-soft)' : '#fff',
                    color: mode === m ? 'var(--brand-active)' : 'var(--text-muted)',
                  }}
                >{label}</button>
              ))}
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
      {result && <OrderResult result={result} flashToast={flashToast} contactEmail={email.trim()} contactPassword={password.trim()} />}

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

/* 发货物按商品类型的称谓(卡密店保持「卡密」原文案不变) */
const DELIVER_NOUN = { 1: '卡密', 2: '内容', 3: '资源', 4: '权益' };
const deliverNoun = (gt) => DELIVER_NOUN[Number(gt) || 1] || '卡密';

function OrderResult({ result, flashToast, contactEmail = '', contactPassword = '' }) {
  const r = result;
  const statusNum = Number(r.status);
  const key = statusKey(statusNum);
  const cards = Array.isArray(r.cards) ? r.cards : [];
  const noun = deliverNoun(r.goods_type);
  // 已收款订单(已发货/异常/已退款)可申请售后
  const canComplain = [STATUS.DELIVERED, STATUS.EXCEPTION, 4].includes(statusNum);
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
                <Icons.ShieldCheck size={16} color="var(--success-solid)" />{noun}已发放({cards.length})
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
                  label={noun}
                  code={code}
                  onCopy={() => flashToast('已复制' + noun)}
                />
              ))}
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 9, padding: '12px 14px', background: 'var(--pending-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--pending-border)' }}>
              <Icons.Clock size={16} color="var(--pending-solid)" />
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

        {/* 知识类:站内阅读章节 */}
        {canRead && <ChapterReader orderNo={r.order_no} email={contactEmail} password={contactPassword} />}

        {/* 资源类:限时签名下载链 */}
        {statusNum === STATUS.DELIVERED && r.download_url && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed var(--border)' }}>
            <a href={BASE + r.download_url} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, border: 'none', textDecoration: 'none',
              background: 'var(--brand)', color: '#fff', borderRadius: 'var(--radius-pill)', padding: '11px 20px',
              fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 800,
            }}><Icons.Package size={17} color="#fff" />下载资源</a>
            <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 8 }}>链接有效期 30 分钟,过期请重新查单获取。</div>
          </div>
        )}

        {/* 申请售后 / 投诉(已收款订单) */}
        {canComplain && <ComplaintBox orderNo={r.order_no} defaultEmail={contactEmail} flashToast={flashToast} />}
      </div>
    </div>
  );
}

/* 知识类章节阅读:购后凭订单凭证拉取章节全文,站内展开阅读 */
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
        <button onClick={load} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, border: '1.5px solid var(--brand)', background: 'var(--brand-soft)',
          borderRadius: 'var(--radius-pill)', padding: '9px 16px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 700, color: 'var(--brand-active)',
        }}><Icons.Inbox size={16} color="var(--brand)" />阅读内容</button>
      ) : loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-subtle)', padding: '20px 0' }}>加载中…</div>
      ) : err ? (
        <div style={{ fontSize: 13, color: 'var(--danger-fg)' }}>{err}</div>
      ) : !chapters || chapters.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>暂无可阅读章节。</div>
      ) : (
        <div>
          {/* 章节目录 */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {chapters.map((c, i) => (
              <button key={c.id} onClick={() => setActive(i)} style={{
                padding: '5px 12px', borderRadius: 'var(--radius-pill)', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, fontFamily: 'var(--font-sans)',
                border: i === active ? '1.5px solid var(--brand)' : '1px solid var(--border)',
                background: i === active ? 'var(--brand-soft)' : '#fff', color: i === active ? 'var(--brand-active)' : 'var(--text-muted)',
              }}>{c.title}</button>
            ))}
          </div>
          {/* 当前章节正文 */}
          <article style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: '16px 18px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 800, color: 'var(--text-strong)' }}>{chapters[active].title}</h3>
            <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-body)', wordBreak: 'break-word' }}
              dangerouslySetInnerHTML={{ __html: chapters[active].content || '' }} />
          </article>
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

/* 售后投诉:填写邮箱(预填查单邮箱)+ 类型 + 描述,提交后展示进度 */
function ComplaintBox({ orderNo, defaultEmail, flashToast }) {
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState(defaultEmail || '');
  const [type, setType] = React.useState(2);
  const [desc, setDesc] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [done, setDone] = React.useState(false);

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
      <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-md)', fontSize: 12.5, color: 'var(--success-fg)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <Icons.Check size={16} color="var(--success-solid)" />售后申请已提交,商户会尽快处理;若未解决可在此页再次申请平台介入。
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed var(--border)' }}>
      {!open ? (
        <button onClick={() => setOpen(true)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid var(--border-strong)',
          background: '#fff', borderRadius: 'var(--radius-pill)', padding: '8px 14px', cursor: 'pointer',
          fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, color: 'var(--text-strong)',
        }}><Icons.AlertTriangle size={15} color="var(--pending-solid)" />遇到问题?申请售后</button>
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
                  background: type === t.v ? 'var(--brand-soft)' : '#fff',
                  color: type === t.v ? 'var(--brand-active)' : 'var(--text-muted)',
                }}>{t.label}</button>
              ))}
            </div>
          </div>
          <Input label="问题描述" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="请描述遇到的问题,便于商户和平台处理" />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="primary" size="md" onClick={submit} loading={busy}>提交申请</Button>
            <Button variant="ghost" size="md" onClick={() => setOpen(false)} disabled={busy}>取消</Button>
          </div>
        </div>
      )}
    </div>
  );
}
