import React from 'react';
import { Button } from '../../../design-system/components/core/Button.jsx';
import { Input } from '../../../design-system/components/core/Input.jsx';
import { Badge } from '../../../design-system/components/core/Badge.jsx';
import { PriceTag } from '../../../design-system/components/core/PriceTag.jsx';
import { QuantityStepper } from '../../../design-system/components/core/QuantityStepper.jsx';
import { CheckoutSteps } from '../../../design-system/components/commerce/CheckoutSteps.jsx';
import { api, normalizeProduct, ApiError } from '../api.js';
import { Icons } from '../Icons.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function InfoRow({ label, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>{children}</span>
    </div>
  );
}

function CenterState({ children }) {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '64px 16px', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center' }}>
      {children}
    </div>
  );
}

export default function ProductDetail({ productId, initialProduct, shop, onBack, onOrderCreated }) {
  // 优先用列表传入的商品对象做首屏(秒开),再后台拉详情补全 detail/limits。
  const [product, setProduct] = React.useState(initialProduct || null);
  const [loading, setLoading] = React.useState(!initialProduct);
  const [loadErr, setLoadErr] = React.useState('');
  // 首屏已有数据但详情请求失败:非阻断轻提示,可重试
  const [partialErr, setPartialErr] = React.useState(false);
  // 顶部大图加载失败 → 回退 emoji 占位
  const [imgFailed, setImgFailed] = React.useState(false);

  const [qty, setQty] = React.useState(1);
  const [email, setEmail] = React.useState('');
  const [touched, setTouched] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitErr, setSubmitErr] = React.useState('');

  const load = React.useCallback(() => {
    let alive = true;
    // 有首屏数据时不显示整屏 loading,后台静默刷新;无则正常 loading。
    setLoading((prev) => (product ? false : true));
    setLoadErr('');
    setPartialErr(false);
    api.product(productId)
      .then((raw) => {
        if (!alive) return;
        // 合并:列表对象保留 image/原价等,详情补 detail/min_buy/max_buy/stock。
        setProduct((prev) => ({ ...(prev || {}), ...normalizeProduct(raw) }));
        setPartialErr(false);
        setLoading(false);
      })
      .catch((e) => {
        if (!alive) return;
        // 已有首屏数据时拉详情失败不致命,继续展示首屏,但给出非阻断提示。
        if (!product) { setLoadErr(e instanceof ApiError ? e.message : '加载失败,请重试'); }
        else { setPartialErr(true); }
        setLoading(false);
      });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  React.useEffect(() => load(), [load]);

  // 图片地址变化时重置失败态,避免新图沿用旧回退
  React.useEffect(() => { setImgFailed(false); }, [product && product.image]);

  // ---- loading ----
  if (loading) {
    return (
      <CenterState>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--brand)', animation: 'mk-spin .7s linear infinite' }} />
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>正在加载商品详情…</span>
      </CenterState>
    );
  }

  // ---- load error ----
  if (loadErr || !product) {
    return (
      <CenterState>
        <Icons.AlertTriangle size={40} color="var(--danger-solid)" />
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)' }}>{loadErr || '商品不存在'}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {onBack && (
            <Button variant="neutral" size="md" onClick={onBack} iconLeft={<Icons.ChevronLeft size={18} />}>返回</Button>
          )}
          <Button variant="primary" size="md" onClick={load} iconLeft={<Icons.RefreshCw size={18} />}>重试</Button>
        </div>
      </CenterState>
    );
  }

  // ---- loaded ----
  const p = product;
  const out = p.stock <= 0;
  const hasSold = p.sold != null;
  const hasOriginal = p.original != null && p.original > p.price;

  // 库存展示:show_stock_type=1 精确「库存 N」;=0 模糊(充足>20/少量1-20/缺货0)。
  // 缺货始终「缺货」。返回 {variant, text} 供 Badge 渲染。
  const stockBadge = (() => {
    if (out) return { variant: 'danger', text: '缺货' };
    if (Number(p.show_stock_type) === 1) return { variant: 'success', text: `库存 ${p.stock}` };
    if (p.stock <= 20) return { variant: 'pending', text: '库存少量' };
    return { variant: 'success', text: '库存充足' };
  })();

  const minBuy = Math.max(1, p.min_buy || 1);
  // max_buy>0 ? min(max_buy, stock) : stock
  const maxBuy = out ? minBuy : (p.max_buy > 0 ? Math.min(p.max_buy, p.stock) : p.stock);
  // 受 stock/限购约束的有效上限(至少 minBuy 以保证 stepper 合法)
  const effMax = Math.max(minBuy, maxBuy);

  // 把当前 qty 钳进合法区间(渲染期纠偏,QuantityStepper 内部亦 clamp)
  const safeQty = Math.min(Math.max(qty, minBuy), effMax);
  const emailOk = EMAIL_RE.test(email.trim());
  // 金额纪律:一律走整数分,禁止浮点乘减。展示时再 /100。
  const priceCents = Math.round(Number(p.price) * 100);
  const totalCents = priceCents * safeQty;
  const total = totalCents / 100;

  const submit = async () => {
    setTouched(true);
    setSubmitErr('');
    if (out) return;
    if (!emailOk) return;
    setSubmitting(true);
    try {
      const apiOrder = await api.createOrder({ productId, quantity: safeQty, email: email.trim() });
      onOrderCreated && onOrderCreated(apiOrder, email.trim(), p);
    } catch (e) {
      setSubmitErr(e instanceof ApiError ? e.message : '下单失败,请稍后重试');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '18px 16px 120px' }}>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'none', color: 'var(--text-muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '0 0 14px', marginLeft: -4 }}
        >
          <Icons.ChevronLeft size={18} /> 返回
        </button>
      )}

      <CheckoutSteps current={1} />

      {/* 首屏有数据但详情请求失败:非阻断轻提示,可重试 */}
      {partialErr && (
        <div role="status" style={{
          marginTop: 12, display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px',
          background: 'var(--pending-bg, #fff8eb)', border: '1px solid var(--pending-border, #fde7b8)',
          borderRadius: 'var(--radius-md)', color: 'var(--pending-fg, #92600a)',
        }}>
          <Icons.AlertTriangle size={16} color="var(--pending-fg, #92600a)" style={{ flex: 'none' }} />
          <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, lineHeight: 1.5 }}>商品详情加载不完整,可重试</span>
          <button
            type="button"
            onClick={load}
            style={{
              flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, height: 28, padding: '0 12px',
              border: '1px solid var(--pending-border, #fde7b8)', background: '#fff', color: 'var(--pending-fg, #92600a)',
              borderRadius: 'var(--radius-pill)', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          ><Icons.RefreshCw size={13} />重试</button>
        </div>
      )}

      {/* 顶部大图 */}
      <div style={{
        marginTop: 18, width: '100%', aspectRatio: '16 / 9', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        background: 'var(--brand-soft)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {p.image && !imgFailed
          ? <img src={p.image} alt={p.name} onError={() => setImgFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ fontSize: 64 }}>{p.thumb}</div>}
      </div>

      {/* head */}
      <div style={{ marginTop: 16 }}>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.01em', lineHeight: 1.3 }}>{p.name}</h1>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <Badge variant={stockBadge.variant} dot>{stockBadge.text}</Badge>
          <Badge variant="secure" icon={<Icons.Zap size={13} />}>自动发货</Badge>
          {hasSold && <Badge variant="neutral">已售 {p.sold}</Badge>}
        </div>
      </div>

      {/* price */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
        <PriceTag amount={p.price} original={hasOriginal ? p.original : undefined} size="lg" />
        {hasOriginal && (
          <span style={{ fontSize: 13, color: 'var(--success-fg)', fontWeight: 700, background: 'var(--success-bg)', padding: '3px 9px', borderRadius: 99 }}>
            省 ¥{((Math.round(Number(p.original) * 100) - priceCents) / 100).toFixed(0)}
          </span>
        )}
      </div>

      {/* 店铺公告 */}
      {shop && (shop.announcement || '').trim() && (
        <div style={{
          marginTop: 16, display: 'flex', gap: 9, alignItems: 'flex-start', padding: '10px 13px',
          background: 'var(--pending-bg, #fff8eb)', border: '1px solid var(--pending-border, #fde7b8)',
          borderRadius: 'var(--radius-md)', color: 'var(--pending-fg, #92600a)',
        }}>
          <Icons.Megaphone size={17} color="var(--pending-fg, #92600a)" style={{ flex: 'none', marginTop: 1 }} />
          <span style={{ fontSize: 13, lineHeight: 1.55, fontWeight: 600 }}>{shop.announcement.trim()}</span>
        </div>
      )}

      {/* detail */}
      {p.detail && (
        <div style={{ marginTop: 22, background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 18, boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-subtle)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>商品说明</div>
          <p style={{ fontSize: 15, color: 'var(--text-body)', lineHeight: 1.7, whiteSpace: 'pre-wrap', textWrap: 'pretty' }}>{p.detail}</p>
        </div>
      )}

      {/* trust promise */}
      {p.delivery_message && (
        <div style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--secure-bg)', border: '1px solid var(--teal-50)', borderRadius: 'var(--radius-lg)', padding: '12px 14px' }}>
          <Icons.Package size={18} color="var(--secure-solid)" style={{ flex: 'none', marginTop: 1 }} />
          <span style={{ fontSize: 13.5, color: 'var(--secure-fg)', lineHeight: 1.6 }}>{p.delivery_message}</span>
        </div>
      )}

      {/* 购买须知(下单前提示)— 非空才展示;纯文本保留换行,不用 innerHTML */}
      {(p.purchase_notice || '').trim() && (
        <div style={{
          marginTop: 16, display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px',
          background: 'var(--pending-bg, #fff8eb)', border: '1px solid var(--pending-border, #fde7b8)',
          borderRadius: 'var(--radius-lg)', color: 'var(--pending-fg, #92600a)',
        }}>
          <Icons.AlertTriangle size={18} color="var(--pending-fg, #92600a)" style={{ flex: 'none', marginTop: 1 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>购买须知</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.6, fontWeight: 600, whiteSpace: 'pre-wrap', textWrap: 'pretty' }}>
              {p.purchase_notice.trim()}
            </div>
          </div>
        </div>
      )}

      {/* order form */}
      <div style={{ marginTop: 16, background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 18, boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>购买数量</span>
          <QuantityStepper value={safeQty} min={minBuy} max={effMax} onChange={setQty} {...(out ? { 'aria-disabled': true } : {})} />
        </div>
        <Input
          label="接收邮箱"
          required
          type="email"
          placeholder="you@example.com"
          inputMode="email"
          autoComplete="email"
          icon={<Icons.Mail size={18} />}
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (submitErr) setSubmitErr(''); }}
          onBlur={() => setTouched(true)}
          error={touched && !emailOk ? '请输入有效的邮箱地址,卡密将发送至此' : ''}
          hint="卡密将自动发送到此邮箱,并可在「取卡 / 查单」页查看"
        />

        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed var(--border)' }}>
          <InfoRow label="单价">¥{p.price.toFixed(2)}</InfoRow>
          <InfoRow label="数量">×{safeQty}</InfoRow>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>预计应付</span>
            <PriceTag amount={total} size="md" />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, textAlign: 'right' }}>最终金额以提交后订单为准</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center', marginTop: 16, color: 'var(--text-muted)', fontSize: 12.5, textAlign: 'center', lineHeight: 1.5 }}>
        <Icons.ShieldCheck size={15} color="var(--secure-solid)" style={{ flex: 'none' }} />
        平台担保 · 付款后通常数十秒内自动发货,可在取卡页查看
      </div>

      {/* sticky buy bar */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 30, background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderTop: '1px solid var(--border)',
        boxShadow: '0 -6px 24px rgba(18,27,42,.06)',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '12px 16px' }}>
          {submitErr && (
            <div role="alert" style={{ display: 'flex', alignItems: 'flex-start', gap: 6, color: 'var(--danger-fg)', fontSize: 13, fontWeight: 600, marginBottom: 10, lineHeight: 1.5 }}>
              <Icons.AlertTriangle size={15} color="var(--danger-solid)" style={{ flex: 'none', marginTop: 1 }} />
              <span>{submitErr}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>预计应付</span>
              <PriceTag amount={total} size="md" />
            </div>
            <Button
              variant="primary"
              size="lg"
              block
              loading={submitting}
              disabled={out}
              onClick={submit}
              style={{ flex: 1 }}
              iconRight={!submitting && !out ? <Icons.ChevronRight size={20} /> : undefined}
            >
              {out ? '暂时缺货' : (submitting ? '提交中…' : '立即购买')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
