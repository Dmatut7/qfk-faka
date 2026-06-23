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

// 商品类型 → 中文标签(1卡密/2知识/3资源/4权益)
const TYPE_LABEL = { 1: '卡密', 2: '知识', 3: '资源', 4: '权益' };

function InfoRow({ label, children, strong }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: strong ? 'var(--price-accent)' : 'var(--text-strong)' }}>{children}</span>
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

// 区块小标题(橙色装饰条 + uppercase 标签),贯穿淘宝风信息分组
function SectionTitle({ children, icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <span style={{ width: 4, height: 15, borderRadius: 2, background: 'var(--brand-gradient)', flex: 'none' }} />
      {icon}
      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.01em' }}>{children}</span>
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
  const [queryPassword, setQueryPassword] = React.useState('');
  const [couponCode, setCouponCode] = React.useState('');
  const [appliedCoupon, setAppliedCoupon] = React.useState(''); // 已验证生效的券码
  const [preview, setPreview] = React.useState(null); // { original_amount, discount, final_amount, discount_label, coupon_applied }
  const [couponErr, setCouponErr] = React.useState('');
  const [couponChecking, setCouponChecking] = React.useState(false);
  const [touched, setTouched] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitErr, setSubmitErr] = React.useState('');

  // 知识类章节目录(购前预览,仅标题):{ items:[{id,title}] }
  const [chapters, setChapters] = React.useState(null);
  // 章节目录加载失败态:用于区分「加载中(null)」与「失败可重试」
  const [chaptersErr, setChaptersErr] = React.useState(false);

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
        // 详情接口可能缺 image/original/market_price(normalizeProduct 会归一成空串/
        // undefined),直接覆盖会把列表带来的真实图/原价抹掉,造成图片闪回。
        // 故对这几个键:详情值为空时不覆盖,保留列表已有值。
        const det = normalizeProduct(raw);
        setProduct((prev) => {
          const base = prev || {};
          const merged = { ...base, ...det };
          if (det.image == null || det.image === '') merged.image = base.image;
          if (det.original == null) merged.original = base.original;
          if (det.market_price == null) merged.market_price = base.market_price;
          return merged;
        });
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

  // 知识类(goods_type=2)拉章节目录预览;非知识类不请求,清空。
  const isKnowledge = Number((product && product.goods_type) ?? 1) === 2;
  const loadChapters = React.useCallback(() => {
    let alive = true;
    setChaptersErr(false);
    setChapters(null);
    api.productChapters(productId)
      .then((r) => { if (alive) setChapters(Array.isArray(r && r.items) ? r.items : []); })
      .catch(() => { if (alive) setChaptersErr(true); });
    return () => { alive = false; };
  }, [productId]);
  React.useEffect(() => {
    if (!productId || !isKnowledge) { setChapters(null); setChaptersErr(false); return undefined; }
    return loadChapters();
  }, [productId, isKnowledge, loadChapters]);

  // 数量/已用券变化时重新试算(含自动促销)。必须在任何早退之前调用,保证每次渲染 hook 顺序恒定。
  React.useEffect(() => {
    if (!product || !productId) return undefined;
    const isCardP = Number(product.goods_type ?? 1) === 1;
    const outP = isCardP ? product.stock <= 0 : false;
    if (outP) return undefined;
    const minB = Math.max(1, product.min_buy || 1);
    const maxB = isCardP
      ? (product.max_buy > 0 ? Math.min(product.max_buy, product.stock) : product.stock)
      : (product.max_buy > 0 ? product.max_buy : 99);
    const sQty = Math.min(Math.max(qty, minB), Math.max(minB, maxB));
    let alive = true;
    api.checkoutPreview({ productId, quantity: sQty, couponCode: appliedCoupon || undefined })
      .then((r) => { if (alive) setPreview(r); })
      .catch(() => { if (alive) setPreview(null); });
    return () => { alive = false; };
  }, [productId, qty, appliedCoupon, product]);

  // ---- loading ----
  if (loading) {
    return (
      <CenterState>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--brand)', animation: 'mk-spin .7s linear infinite' }} />
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>正在加载商品详情…</span>
      </CenterState>
    );
  }

  // ---- load error / empty ----
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
  // 非卡密类(知识/资源/权益)无卡库存概念,视为现货可购;仅卡密类受 stock 约束。
  const isCard = Number(p.goods_type ?? 1) === 1;
  const out = isCard ? p.stock <= 0 : false;
  const hasSold = p.sold != null;
  const hasOriginal = p.original != null && p.original > p.price;
  const goodsType = Number(p.goods_type) || 1;

  // 库存展示:非卡密类显示「现货」;卡密类 show_stock_type=1 精确「库存 N」,=0 模糊(充足>20/少量1-20/缺货0)。
  const stockBadge = (() => {
    if (!isCard) return { variant: 'success', text: '现货' };
    if (out) return { variant: 'danger', text: '缺货' };
    if (Number(p.show_stock_type) === 1) return { variant: 'success', text: `库存 ${p.stock}` };
    if (p.stock <= 20) return { variant: 'pending', text: '库存少量' };
    return { variant: 'success', text: '库存充足' };
  })();

  const minBuy = Math.max(1, p.min_buy || 1);
  // 卡密:max_buy>0 ? min(max_buy, stock) : stock;非卡密:仅受 max_buy 约束(无 stock 上限,缺省 99)
  const maxBuy = out
    ? minBuy
    : (isCard
      ? (p.max_buy > 0 ? Math.min(p.max_buy, p.stock) : p.stock)
      : (p.max_buy > 0 ? p.max_buy : 99));
  // 受 stock/限购约束的有效上限(至少 minBuy 以保证 stepper 合法)
  const effMax = Math.max(minBuy, maxBuy);

  // 把当前 qty 钳进合法区间(渲染期纠偏,QuantityStepper 内部亦 clamp)
  const safeQty = Math.min(Math.max(qty, minBuy), effMax);
  const emailOk = EMAIL_RE.test(email.trim());
  // 金额纪律:一律走整数分,禁止浮点乘减。展示时再 /100。
  const priceCents = Math.round(Number(p.price) * 100);
  const totalCents = priceCents * safeQty;
  const total = totalCents / 100;
  // 试算:含限时折扣价 + 自动满减满折 + 已生效券,口径与下单一致
  const discountNum = preview ? Number(preview.discount) : 0;
  const hasDiscount = discountNum > 0;
  const payable = preview ? Number(preview.final_amount) : total;
  const couponApplied = !!(preview && preview.coupon_applied);

  // (试算 useEffect 已上移至早退之前,保证 hook 顺序恒定;此处不再重复声明)

  const applyCoupon = async () => {
    const code = couponCode.trim();
    setCouponErr('');
    if (!code) { setCouponErr('请输入优惠券码'); return; }
    setCouponChecking(true);
    try {
      // 先试算校验券是否可用(无效会抛错);成功则置为已用券,触发上面的试算
      await api.checkoutPreview({ productId, quantity: safeQty, couponCode: code });
      setAppliedCoupon(code);
    } catch (e) {
      setAppliedCoupon('');
      setCouponErr(e instanceof ApiError ? e.message : '优惠券验证失败');
    } finally {
      setCouponChecking(false);
    }
  };

  const submit = async () => {
    setTouched(true);
    setSubmitErr('');
    if (out) return;
    if (!emailOk) return;
    setSubmitting(true);
    try {
      const apiOrder = await api.createOrder({
        productId, quantity: safeQty, email: email.trim(),
        queryPassword: queryPassword.trim() || undefined,
        couponCode: appliedCoupon || undefined,
      });
      onOrderCreated && onOrderCreated(apiOrder, email.trim(), p);
    } catch (e) {
      setSubmitErr(e instanceof ApiError ? e.message : '下单失败,请稍后重试');
      setSubmitting(false);
    }
  };

  const savedAmount = hasOriginal ? ((Math.round(Number(p.original) * 100) - priceCents) / 100).toFixed(0) : '0';

  // 卡片容器统一样式(淘宝风:白底、细描边、软阴影、圆角)
  const cardStyle = { background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 18, boxShadow: 'var(--shadow-xs)' };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '18px 16px calc(176px + env(safe-area-inset-bottom, 0px))' }}>
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
          background: 'var(--pending-bg)', border: '1px solid var(--pending-border)',
          borderRadius: 'var(--radius-md)', color: 'var(--pending-fg)',
        }}>
          <Icons.AlertTriangle size={16} color="var(--pending-fg)" style={{ flex: 'none' }} />
          <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, lineHeight: 1.5 }}>商品详情加载不完整,可重试</span>
          <button
            type="button"
            onClick={load}
            style={{
              flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, height: 28, padding: '0 12px',
              border: '1px solid var(--pending-border)', background: '#fff', color: 'var(--pending-fg)',
              borderRadius: 'var(--radius-pill)', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          ><Icons.RefreshCw size={13} />重试</button>
        </div>
      )}

      {/* 顶部大图(无图回退 emoji 占位,暖橙渐变底) */}
      <div style={{
        marginTop: 18, width: '100%', aspectRatio: '16 / 9', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        background: 'var(--brand-gradient)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {p.image && !imgFailed
          ? <img src={p.image} alt={p.name} onError={() => setImgFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ fontSize: 72, filter: 'drop-shadow(0 4px 12px rgba(122,36,0,.28))' }}>{p.thumb}</div>}
      </div>

      {/* head:标题 + 徽标行(类型/库存/发货/已售) */}
      <div style={{ marginTop: 16 }}>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.01em', lineHeight: 1.3, margin: 0 }}>{p.name}</h1>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <Badge variant="brand">{TYPE_LABEL[goodsType]}</Badge>
          {p.on_sale && <Badge variant="danger" icon={<Icons.Zap size={13} />}>限时折扣</Badge>}
          <Badge variant={stockBadge.variant} dot>{stockBadge.text}</Badge>
          <Badge variant="secure" icon={<Icons.Zap size={13} />}>{isCard ? '自动发货' : '即时发货'}</Badge>
          {hasSold && <Badge variant="neutral">已售 {p.sold}</Badge>}
        </div>
      </div>

      {/* price:现价大红 + 划线原价 + 「省¥X」 */}
      <div style={{
        marginTop: 16, padding: '16px 18px', borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(180deg, var(--brand-soft) 0%, #fff 100%)', border: '1px solid var(--brand-soft-border)',
        display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap',
      }}>
        <PriceTag amount={p.price} original={hasOriginal ? p.original : undefined} size="lg" />
        {hasOriginal && (
          <span style={{ fontSize: 13, color: 'var(--danger-fg)', fontWeight: 800, background: 'var(--promo-soft-bg)', border: '1px solid var(--promo-soft-border)', padding: '3px 9px', borderRadius: 99 }}>
            省 ¥{savedAmount}
          </span>
        )}
      </div>

      {/* 店铺公告 */}
      {shop && (shop.announcement || '').trim() && (
        <div style={{
          marginTop: 16, display: 'flex', gap: 9, alignItems: 'flex-start', padding: '10px 13px',
          background: 'var(--pending-bg)', border: '1px solid var(--pending-border)',
          borderRadius: 'var(--radius-md)', color: 'var(--pending-fg)',
        }}>
          <Icons.Megaphone size={17} color="var(--pending-fg)" style={{ flex: 'none', marginTop: 1 }} />
          <span style={{ fontSize: 13, lineHeight: 1.55, fontWeight: 600 }}>{shop.announcement.trim()}</span>
        </div>
      )}

      {/* detail:商品说明 */}
      {p.detail && (
        <div style={{ marginTop: 16, ...cardStyle }}>
          <SectionTitle icon={<Icons.Package size={16} color="var(--brand)" />}>商品说明</SectionTitle>
          <p style={{ fontSize: 15, color: 'var(--text-body)', lineHeight: 1.7, whiteSpace: 'pre-wrap', textWrap: 'pretty', margin: 0 }}>{p.detail}</p>
        </div>
      )}

      {/* 知识类章节目录预览(仅标题,购前预览) */}
      {isKnowledge && (
        <div style={{ marginTop: 16, ...cardStyle }}>
          <SectionTitle icon={<Icons.Inbox size={16} color="var(--brand)" />}>章节目录</SectionTitle>
          {chaptersErr ? (
            <button
              type="button"
              onClick={loadChapters}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'none',
                padding: '6px 0', color: 'var(--brand-active)', fontSize: 13.5, fontWeight: 700,
                fontFamily: 'var(--font-sans)', cursor: 'pointer',
              }}
            >
              <Icons.RefreshCw size={14} color="var(--brand-active)" />章节目录加载失败,点此重试
            </button>
          ) : chapters == null ? (
            <div style={{ fontSize: 13.5, color: 'var(--text-muted)', padding: '6px 0' }}>正在加载章节目录…</div>
          ) : chapters.length === 0 ? (
            <div style={{ fontSize: 13.5, color: 'var(--text-muted)', padding: '6px 0' }}>暂无可预览章节,购买后即可解锁全部内容</div>
          ) : (
            <>
              <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column' }}>
                {chapters.map((c, i) => (
                  <li key={c.id ?? i} style={{
                    display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0',
                    borderBottom: i < chapters.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <span style={{
                      flex: 'none', width: 24, height: 24, borderRadius: 'var(--radius-sm)', background: 'var(--brand-soft)',
                      color: 'var(--brand-active)', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontVariantNumeric: 'tabular-nums',
                    }}>{i + 1}</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: 'var(--text-body)', fontWeight: 600, lineHeight: 1.5 }}>{c.title}</span>
                    <Icons.Lock size={15} color="var(--text-subtle)" style={{ flex: 'none' }} />
                  </li>
                ))}
              </ol>
              <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icons.Lock size={13} color="var(--text-subtle)" />仅展示标题,购买后可阅读全部章节内容
              </div>
            </>
          )}
        </div>
      )}

      {/* trust promise(发货说明) */}
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
          background: 'var(--pending-bg)', border: '1px solid var(--pending-border)',
          borderRadius: 'var(--radius-lg)', color: 'var(--pending-fg)',
        }}>
          <Icons.AlertTriangle size={18} color="var(--pending-fg)" style={{ flex: 'none', marginTop: 1 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>购买须知</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.6, fontWeight: 600, whiteSpace: 'pre-wrap', textWrap: 'pretty' }}>
              {p.purchase_notice.trim()}
            </div>
          </div>
        </div>
      )}

      {/* order form:数量 / 邮箱 / 查单密码 / 优惠券 / 金额分解 */}
      <div style={{ marginTop: 16, background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 18, boxShadow: 'var(--shadow-sm)' }}>
        <SectionTitle icon={<Icons.Zap size={16} color="var(--brand)" />}>购买信息</SectionTitle>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0 0' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>购买数量</span>
          {out
            ? <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--danger-fg)' }}>暂时缺货</span>
            : <QuantityStepper value={safeQty} min={minBuy} max={effMax} onChange={setQty} />}
        </div>
        {/* 起购/限购/库存提示:命中上下限时标橙强调,否则灰色小字 */}
        {!out && (() => {
          const hints = [];
          if (minBuy > 1) hints.push({ text: `${minBuy} 件起购`, hit: safeQty <= minBuy });
          // 仅当商户选择「精确显示库存」(show_stock_type=1)时才暴露具体「仅剩 N 件」;
          // 模糊模式(=0)只靠上方徽标显示 充足/少量/缺货,不泄露精确库存。
          const showExactStock = Number(p.show_stock_type) === 1;
          if (isCard && showExactStock && p.max_buy > 0 && p.stock < p.max_buy) {
            hints.push({ text: `仅剩 ${p.stock} 件`, hit: safeQty >= effMax });
          } else if (isCard && showExactStock && !(p.max_buy > 0) && p.stock < 99) {
            hints.push({ text: `仅剩 ${p.stock} 件`, hit: safeQty >= effMax });
          } else if (p.max_buy > 0) {
            hints.push({ text: `每单最多 ${p.max_buy} 件`, hit: safeQty >= effMax });
          }
          if (hints.length === 0) return null;
          return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 12px', marginTop: 8 }}>
              {hints.map((h, i) => (
                <span key={i} style={{ fontSize: 12.5, fontWeight: h.hit ? 700 : 600, color: h.hit ? 'var(--brand-active)' : 'var(--text-muted)' }}>{h.text}</span>
              ))}
            </div>
          );
        })()}
        <div style={{ height: 16 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
          <Input
            label="查单密码(选填)"
            type="password"
            placeholder="设置后可凭订单号 + 密码查单"
            autoComplete="new-password"
            icon={<Icons.Lock size={18} />}
            value={queryPassword}
            onChange={(e) => setQueryPassword(e.target.value)}
            hint="选填:设置后无需邮箱,凭订单号 + 此密码即可查单取卡"
          />

          {/* 优惠券(选填):输入券码后验证,生效则抵扣应付金额 */}
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Input
                  label="优惠券(选填)"
                  placeholder="输入券码"
                  icon={<Icons.Star size={18} />}
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value); setAppliedCoupon(''); setCouponErr(''); }}
                  error={couponErr}
                />
              </div>
              <Button variant="secondary" size="md" onClick={applyCoupon} loading={couponChecking} disabled={out}>验证</Button>
            </div>
            {couponApplied && (
              <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--success-fg)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icons.Check size={14} color="var(--success-solid)" />优惠券已生效
                {appliedCoupon && (
                  <button
                    type="button"
                    onClick={() => { setCouponCode(''); setAppliedCoupon(''); setCouponErr(''); }}
                    style={{
                      border: 'none', background: 'none', padding: 0, marginLeft: 2,
                      color: 'var(--brand-active)', fontSize: 12.5, fontWeight: 700,
                      fontFamily: 'var(--font-sans)', cursor: 'pointer', textDecoration: 'underline',
                    }}
                  >移除</button>
                )}
              </div>
            )}
            {!couponApplied && hasDiscount && (
              <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--brand-active)', fontWeight: 700 }}>
                已享{preview.discount_label || '优惠'} −¥{discountNum.toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {/* 金额分解:单价×数量 − 优惠 = 预计应付 */}
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px dashed var(--border)' }}>
          <InfoRow label="单价">¥{p.price.toFixed(2)}</InfoRow>
          <InfoRow label="数量">{out ? '—' : `×${safeQty}`}</InfoRow>
          {hasDiscount && <InfoRow label={preview.discount_label || '优惠'} strong>−¥{discountNum.toFixed(2)}</InfoRow>}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>预计应付</span>
            {out
              ? <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-muted)' }}>—</span>
              : <PriceTag amount={payable} size="md" />}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, textAlign: 'right' }}>最终金额以提交后订单为准</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center', marginTop: 16, color: 'var(--text-muted)', fontSize: 12.5, textAlign: 'center', lineHeight: 1.5 }}>
        <Icons.ShieldCheck size={15} color="var(--secure-solid)" style={{ flex: 'none' }} />
        平台担保 · 付款后通常数十秒内自动发货,可在取卡页查看
      </div>

      {/* 底部 sticky 购买条 */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 30, background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderTop: '1px solid var(--border)',
        boxShadow: '0 -6px 24px rgba(122,36,0,.08)',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '12px 16px' }}>
          {submitErr && (
            <div role="alert" style={{ display: 'flex', alignItems: 'flex-start', gap: 6, color: 'var(--danger-fg)', fontSize: 13, fontWeight: 600, marginBottom: 10, lineHeight: 1.5 }}>
              <Icons.AlertTriangle size={15} color="var(--danger-solid)" style={{ flex: 'none', marginTop: 1 }} />
              <span>{submitErr}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, flex: 'none' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>预计应付</span>
              {out
                ? <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-muted)' }}>—</span>
                : <PriceTag amount={payable} size="md" />}
            </div>
            <Button
              variant={out ? 'primary' : 'buy'}
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
