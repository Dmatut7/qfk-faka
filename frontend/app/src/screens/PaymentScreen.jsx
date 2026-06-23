import React from 'react';
import { Button } from '../../../design-system/components/core/Button.jsx';
import { PriceTag } from '../../../design-system/components/core/PriceTag.jsx';
import { CheckoutSteps } from '../../../design-system/components/commerce/CheckoutSteps.jsx';
import { PaymentOption } from '../../../design-system/components/commerce/PaymentOption.jsx';
import { api, pollDelivery, statusKey, STATUS, ApiError } from '../api.js';
import { Icons } from '../Icons.jsx';

/* 解析后端时间字符串 "YYYY-MM-DD HH:MM:SS" → 时间戳(ms)。
   后端是本地时间,直接用 new Date(y,mo-1,...) 构造,避免 ISO 时区误差。 */
function parseBackendTime(s) {
  if (!s) return null;
  const m = String(s).match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (!m) {
    const t = Date.parse(s);
    return Number.isNaN(t) ? null : t;
  }
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime();
}

const fmtMMSS = (sec) => {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

const money = (n) => Number(n || 0).toFixed(2);

// 付款流程阶段:idle 选择中 / waiting 等待确认 + 发货中 / exception 异常 / timeout 仍确认中 / closed 已关闭
const PHASE = { IDLE: 'idle', WAITING: 'waiting', EXCEPTION: 'exception', TIMEOUT: 'timeout', CLOSED: 'closed' };

export default function PaymentScreen({ order, onBack, onPaid }) {
  const p = order.product || {};
  const [paying, setPaying] = React.useState(false);   // 已点击确认支付,进入异步流程
  const [phase, setPhase] = React.useState(PHASE.IDLE);
  const [err, setErr] = React.useState('');            // ApiError.message
  const [waitMsg, setWaitMsg] = React.useState('');    // 等待态副提示(轮询 onTick)
  // 二维码刷新:递增 key 让占位二维码重绘(本地演示无真实二维码图,仅作可视刷新反馈)
  const [qrKey, setQrKey] = React.useState(0);

  // 倒计时:用 order.expireAt 算剩余秒
  const expireTs = React.useMemo(() => parseBackendTime(order.expireAt), [order.expireAt]);
  const [remain, setRemain] = React.useState(() =>
    expireTs == null ? null : Math.max(0, Math.round((expireTs - Date.now()) / 1000))
  );

  React.useEffect(() => {
    if (expireTs == null) return undefined;
    const tick = () => setRemain(Math.max(0, Math.round((expireTs - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expireTs]);

  const expired = remain != null && remain <= 0;

  // 防止卸载后 setState。注意:挂载时必须重置为 true,否则 React 18 StrictMode
  // 的 mount→unmount→remount 双调用会在首次 cleanup 把它永久置 false,导致轮询被跳过。
  const aliveRef = React.useRef(true);
  React.useEffect(() => {
    aliveRef.current = true;
    return () => { aliveRef.current = false; };
  }, []);

  const total = Number(order.total || 0);

  const handlePay = async () => {
    // 倒计时仅作展示提示,不再因本地 expired 阻止支付:设备时钟/时区偏差会让
    // remain 误判为 0 把未过期订单卡死。真正的过期由后端 4003(CLOSED 分支)兜底。
    if (paying) return;
    setErr('');
    setPaying(true);
    setPhase(PHASE.WAITING);
    setWaitMsg('正在创建支付…');
    try {
      // 渠道恒为 epay(api.pay 内部默认 PAY_CHANNEL),聚合支付,不区分钱包
      const { pay } = await api.pay(order.orderNo);
      // best-effort 打开模拟网关;本地演示无法真正回跳,故转入轮询发货
      try {
        if (pay && pay.url) window.open(pay.url, '_blank', 'noopener');
      } catch { /* 弹窗被拦截也无妨,继续轮询 */ }
      if (!aliveRef.current) return;
      setWaitMsg('等待支付确认,发货中…');

      const finalOrder = await pollDelivery({
        orderNo: order.orderNo,
        email: order.email,
        onTick: (o) => {
          if (!aliveRef.current) return;
          const k = statusKey(o.status);
          if (k === 'paid') setWaitMsg('支付已确认,正在发货…');
          else if (k === 'pending') setWaitMsg('等待支付确认,发货中…');
        },
      });

      if (!aliveRef.current) return;
      const st = finalOrder ? Number(finalOrder.status) : null;

      if (st === STATUS.DELIVERED) {
        onPaid(finalOrder);                       // 已发货 → 交给上层进取卡页
        return;
      }
      if (st === STATUS.EXCEPTION) {
        setPhase(PHASE.EXCEPTION);
        setErr('款项处理异常,客服将尽快为您处理,请勿重复支付。');
        return;
      }
      if (st === STATUS.CLOSED || st === STATUS.REFUNDED) {
        setPhase(PHASE.CLOSED);
        setErr('订单已关闭或已过期,请返回重新下单。');
        return;
      }
      // 超时:仍 pending/paid(或查询一直失败 finalOrder=null)
      setPhase(PHASE.TIMEOUT);
      setErr('仍在确认中,可稍后到「取卡 / 查单」页用订单号查询。');
    } catch (e) {
      if (!aliveRef.current) return;
      const ae = e instanceof ApiError ? e : null;
      // 4002 已支付:不算失败,取卡后进发货页
      if (ae && ae.code === 4002) {
        // 已支付:仍处于异步流程,保持 paying=true + 等待态轮询;终态时再收尾,避免按钮卡死。
        setPhase(PHASE.WAITING);
        setWaitMsg('订单已支付,正在确认发货…');
        try {
          const o = await api.queryOrder({ orderNo: order.orderNo, email: order.email });
          if (!aliveRef.current) return;
          if (o && Number(o.status) === STATUS.DELIVERED) { onPaid(o); return; }
          // 已支付但尚未发货 → 继续轮询(此时 phase 已是 WAITING,等待态正确显示)
          const fin = await pollDelivery({ orderNo: order.orderNo, email: order.email });
          if (!aliveRef.current) return;
          if (fin && Number(fin.status) === STATUS.DELIVERED) { onPaid(fin); return; }
          if (fin && Number(fin.status) === STATUS.EXCEPTION) {
            setPhase(PHASE.EXCEPTION);
            setErr('款项处理异常,客服将尽快为您处理,请勿重复支付。');
            setPaying(false);
            return;
          }
          setPhase(PHASE.TIMEOUT);
          setErr('订单已支付,卡密仍在发放中,可稍后到「取卡 / 查单」页查询。');
          setPaying(false);
          return;
        } catch (e2) {
          if (!aliveRef.current) return;
          setPhase(PHASE.TIMEOUT);
          setErr(e2 instanceof ApiError ? e2.message : '订单已支付,请稍后到「取卡 / 查单」页查询。');
          setPaying(false);
          return;
        }
      }
      // 4003 已关闭 / 过期
      if (ae && ae.code === 4003) {
        setPhase(PHASE.CLOSED);
        setErr(ae.message);
        setPaying(false);
        return;
      }
      setPhase(PHASE.IDLE);
      setErr(ae ? ae.message : '支付发起失败,请重试。');
      setPaying(false);
    }
  };

  // 二维码刷新:仅清空 idle 阶段的发起失败错误并重绘占位二维码,不动状态机。
  // 已进入异步流程(paying / 终态)时不允许刷新,避免与轮询/已支付状态冲突。
  const handleRefreshQr = () => {
    if (paying || phase !== PHASE.IDLE) return;
    setErr('');
    setQrKey((k) => k + 1);
  };

  const inWaiting = phase === PHASE.WAITING;
  const isException = phase === PHASE.EXCEPTION;
  const isClosed = phase === PHASE.CLOSED;
  const isTimeout = phase === PHASE.TIMEOUT;
  const showOverlay = inWaiting || isException || isClosed || isTimeout;
  const terminalBack = isException || isClosed || isTimeout;

  const card = {
    background: '#fff', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
  };
  const sectionLabel = {
    fontSize: 13, fontWeight: 800, color: 'var(--text-subtle)',
    letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 12,
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '18px 16px calc(120px + env(safe-area-inset-bottom, 0px))' }}>
      <CheckoutSteps current={2} />

      {/* 倒计时条 */}
      {remain != null && (
        <div style={{
          marginTop: 16, display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 'var(--radius-md)',
          background: expired ? 'var(--danger-bg, #fef2f2)' : 'var(--brand-soft)',
          border: `1px solid ${expired ? 'var(--danger-50, #fecaca)' : 'var(--border)'}`,
          color: expired ? 'var(--danger-fg, #b91c1c)' : 'var(--text-strong)',
          fontSize: 13.5, fontWeight: 600,
        }}>
          <Icons.Clock size={16} color={expired ? 'var(--danger-solid, #dc2626)' : 'var(--brand, #FF5000)'} />
          {expired
            ? <span>订单已过期,请返回重新下单</span>
            : <span>剩余 <b className="ds-mono" style={{ fontSize: 14 }}>{fmtMMSS(remain)}</b>,未支付将自动取消</span>}
        </div>
      )}

      {/* 订单信息 */}
      <div style={{ marginTop: 18, ...card }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-strong)' }}>订单信息</span>
          <span className="ds-mono" style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{order.orderNo}</span>
        </div>
        <div style={{ padding: 18 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: 'var(--brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flex: 'none' }}>{p.thumb}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)', lineHeight: 1.35 }}>{p.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>数量 ×{order.qty} · 发往 {order.email}</div>
            </div>
          </div>
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>应付金额</span>
            <PriceTag amount={total} size="md" />
          </div>
        </div>
      </div>

      {/* 等待 / 异常 / 关闭 / 超时 状态卡 */}
      {showOverlay && (
        <div style={{ marginTop: 18, padding: 18, ...card }}>
          {inWaiting && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', padding: '8px 0' }}>
              <div className="ds-spin" style={{
                width: 38, height: 38, borderRadius: '50%',
                border: '3px solid var(--brand-soft)', borderTopColor: 'var(--brand, #FF5000)',
                animation: 'ds-spin 0.8s linear infinite',
              }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>等待支付确认 · 发货中</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {waitMsg || '若已在新窗口完成支付,卡密将自动发放,请稍候。'}
              </div>
            </div>
          )}

          {isException && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', padding: '8px 0' }}>
              <Icons.AlertTriangle size={34} color="var(--danger-solid, #dc2626)" />
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--danger-fg, #b91c1c)' }}>款项处理异常</div>
              <div style={{ fontSize: 13.5, color: 'var(--text-strong)', lineHeight: 1.6 }}>
                客服将尽快为您处理,<b>请勿重复支付</b>。
              </div>
              <Button variant="neutral" size="md" iconLeft={<Icons.Headset size={18} />}
                onClick={() => onBack && onBack()}>联系客服 / 返回</Button>
            </div>
          )}

          {(isClosed || isTimeout) && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', padding: '8px 0' }}>
              <Icons.Clock size={32} color="var(--text-muted)" />
              <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-strong)' }}>
                {isClosed ? '订单已关闭' : '仍在确认中'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{err}</div>
              <Button variant="neutral" size="md" iconLeft={<Icons.ChevronLeft size={18} />}
                onClick={() => onBack && onBack()}>返回</Button>
            </div>
          )}
        </div>
      )}

      {/* 错误提示(idle 阶段的发起失败) */}
      {err && phase === PHASE.IDLE && (
        <div style={{
          marginTop: 16, display: 'flex', gap: 10, padding: '12px 14px',
          background: 'var(--danger-bg, #fef2f2)', border: '1px solid var(--danger-50, #fecaca)',
          borderRadius: 'var(--radius-md)', color: 'var(--danger-fg, #b91c1c)', fontSize: 13, lineHeight: 1.5,
        }}>
          <Icons.AlertTriangle size={18} color="var(--danger-solid, #dc2626)" />
          <span>{err}</span>
        </div>
      )}

      {/* 前往支付说明区:实际为跳转聚合收银台(window.open),非本地可扫码,故诚实表述(过期后由后端 4003 兜底) */}
      {phase === PHASE.IDLE && (
        <div style={{ marginTop: 18 }}>
          <div style={sectionLabel}>前往支付</div>
          <div style={{ ...card, padding: 18, display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 'none' }}>
              <div key={qrKey} style={{
                width: 128, height: 128, borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--border)', background: 'var(--brand-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                filter: expired ? 'grayscale(1)' : 'none', opacity: expired ? 0.45 : 1,
              }}>
                <Icons.Lock size={64} color="var(--brand, #FF5000)" />
              </div>
              {expired && (
                <button
                  type="button"
                  onClick={handleRefreshQr}
                  style={{
                    position: 'absolute', inset: 0, borderRadius: 'var(--radius-md)',
                    background: 'rgba(255,255,255,0.86)', border: 'none', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 6, color: 'var(--brand-active)', fontSize: 12.5, fontWeight: 700,
                  }}
                >
                  <Icons.RefreshCw size={22} color="var(--brand, #FF5000)" />
                  支付链接已过期 · 点击刷新
                </button>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text-strong)' }}>前往收银台支付</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                聚合收银台 · 支持微信 / 支付宝 · 付款后自动发货。点击下方按钮前往收银台完成支付,新窗口可能被浏览器拦截,请允许弹窗。
              </div>
              {expired ? (
                <Button variant="secondary" size="sm" iconLeft={<Icons.RefreshCw size={16} />}
                  onClick={handleRefreshQr} style={{ marginTop: 12 }}>刷新支付链接</Button>
              ) : (
                <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--secure-fg)' }}>
                  <Icons.Check size={15} color="var(--secure-solid)" />点击下方按钮前往收银台完成支付
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 支付方式:聚合支付单入口(后端仅 epay,不让用户选具体钱包,固定选中) */}
      {phase === PHASE.IDLE && (
        <div style={{ marginTop: 18 }} role="radiogroup" aria-label="支付方式">
          <div style={sectionLabel}>支付方式</div>
          <PaymentOption
            name="聚合收银台"
            desc="支持微信 / 支付宝 · 即时到账 · 付款后自动发货"
            tag="推荐"
            icon={<Icons.Lock size={22} color="var(--brand-active)" />}
            selected
            onSelect={() => {}}
          />
        </div>
      )}

      {/* 担保提示 */}
      <div style={{ marginTop: 18, display: 'flex', gap: 10, padding: '14px 16px', background: 'var(--secure-bg)', border: '1px solid var(--teal-50)', borderRadius: 'var(--radius-md)' }}>
        <Icons.Lock size={18} color="var(--secure-solid)" />
        <span style={{ fontSize: 13, color: 'var(--secure-fg)', lineHeight: 1.5 }}>
          平台担保交易 · 付款后卡密<b>自动发放</b>,平台不存储您的支付信息。
        </span>
      </div>

      {/* 底部 sticky 付条 */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 30, background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderTop: '1px solid var(--border)',
        boxShadow: '0 -6px 24px rgba(18,27,42,.06)',
      }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '12px 16px calc(12px + env(safe-area-inset-bottom, 0px))', display: 'flex', alignItems: 'center', gap: 14 }}>
          {terminalBack ? (
            <Button variant="neutral" size="lg" block onClick={() => onBack && onBack()}
              iconLeft={<Icons.ChevronLeft size={18} />} style={{ flex: 1 }}>返回</Button>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>应付</span>
                <PriceTag amount={total} size="md" />
              </div>
              <Button variant="primary" size="lg" block loading={paying} disabled={paying}
                onClick={handlePay} style={{ flex: 1 }}
                iconLeft={!paying && <Icons.Lock size={18} />}>
                {paying ? (inWaiting ? '等待支付确认…' : '正在跳转支付…') : `确认支付 ¥${money(total)}`}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 旋转动画 keyframes(内联,避免依赖全局样式) */}
      <style>{`@keyframes ds-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
