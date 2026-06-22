/* Product detail + order form. */
function InfoRow({ label, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>{children}</span>
    </div>
  );
}

function ProductDetail({ product, onBuy }) {
  const { CheckoutSteps, QuantityStepper, Input, Badge, PriceTag, Button } = window.MiaoKa_b7a409;
  const [qty, setQty] = React.useState(1);
  const [email, setEmail] = React.useState('');
  const [touched, setTouched] = React.useState(false);
  const p = product;
  const out = p.stock <= 0;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const total = (p.price * qty);

  const submit = () => {
    setTouched(true);
    if (!emailOk || out) return;
    onBuy({ product: p, qty, email, total });
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '18px 16px 120px' }}>
      <CheckoutSteps current={1} />

      {/* head */}
      <div style={{ display: 'flex', gap: 16, marginTop: 22, alignItems: 'flex-start' }}>
        <div style={{ width: 72, height: 72, borderRadius: 16, background: 'var(--brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, flex: 'none' }}>{p.thumb}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.01em', lineHeight: 1.3 }}>{p.name}</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {out ? <Badge variant="danger" dot>缺货</Badge> : <Badge variant="success" dot>有货 {p.stock}</Badge>}
            <Badge variant="secure" icon={<Icons.Zap size={13} />}>自动发货</Badge>
            <Badge variant="neutral">已售 {p.sold}</Badge>
          </div>
        </div>
      </div>

      {/* price */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 18 }}>
        <PriceTag amount={p.price} original={p.original} size="lg" />
        <span style={{ fontSize: 13, color: 'var(--success-fg)', fontWeight: 700, background: 'var(--success-bg)', padding: '3px 9px', borderRadius: 99 }}>
          省 ¥{(p.original - p.price).toFixed(0)}
        </span>
      </div>

      {/* detail */}
      <div style={{ marginTop: 22, background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 18, boxShadow: 'var(--shadow-xs)' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-subtle)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>商品说明</div>
        <p style={{ fontSize: 15, color: 'var(--text-body)', lineHeight: 1.7, textWrap: 'pretty' }}>{p.detail}</p>
      </div>

      {/* order form */}
      <div style={{ marginTop: 16, background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 18, boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>购买数量</span>
          <QuantityStepper value={qty} min={1} max={Math.max(1, p.stock)} onChange={setQty} />
        </div>
        <Input label="接收邮箱" required type="email" placeholder="you@example.com"
          icon={<Icons.Mail size={18} />}
          value={email} onChange={e => setEmail(e.target.value)}
          error={touched && !emailOk ? '请输入有效的邮箱地址,卡密将发送至此' : ''}
          hint="卡密将自动发送到此邮箱,并可在「取卡 / 查单」页查看" />

        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed var(--border)' }}>
          <InfoRow label="单价">¥{p.price.toFixed(2)}</InfoRow>
          <InfoRow label="数量">×{qty}</InfoRow>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>应付金额</span>
            <PriceTag amount={total} size="md" />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center', marginTop: 16, color: 'var(--text-muted)', fontSize: 12.5 }}>
        <Icons.ShieldCheck size={15} color="var(--secure-solid)" />平台担保 · 付款后卡密即时发放,假一赔十
      </div>

      {/* sticky buy bar */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 30, background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderTop: '1px solid var(--border)',
        boxShadow: '0 -6px 24px rgba(18,27,42,.06)',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>应付</span>
            <PriceTag amount={total} size="md" />
          </div>
          <Button variant="primary" size="lg" block disabled={out} onClick={submit} style={{ flex: 1 }}
            iconRight={<Icons.ChevronRight size={20} />}>
            {out ? '暂时缺货' : '立即购买'}
          </Button>
        </div>
      </div>
    </div>
  );
}
window.ProductDetail = ProductDetail;
