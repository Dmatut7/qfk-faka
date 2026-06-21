/* Payment screen — order summary, method selection, pay action. */
function PaymentScreen({ order, onPaid }) {
  const { CheckoutSteps, PaymentOption, PriceTag, Button } = window.MiaoKa_cadc89;
  const [method, setMethod] = React.useState('wechat');
  const [paying, setPaying] = React.useState(false);
  const p = order.product;

  const pay = () => {
    setPaying(true);
    setTimeout(() => onPaid(order), 1400);
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '18px 16px 120px' }}>
      <CheckoutSteps current={2} />

      {/* order summary */}
      <div style={{ marginTop: 22, background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
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
            <PriceTag amount={order.total} size="md" />
          </div>
        </div>
      </div>

      {/* methods */}
      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-subtle)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 12 }}>选择支付方式</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PaymentOption name="微信支付" desc="数亿用户的选择,即时到账" tag="推荐" icon="💚" selected={method === 'wechat'} onSelect={() => setMethod('wechat')} />
          <PaymentOption name="支付宝" desc="安全便捷,支持花呗分期" icon="🅰️" selected={method === 'alipay'} onSelect={() => setMethod('alipay')} />
          <PaymentOption name="USDT 数字货币" desc="TRC20 · 大额订单可用" icon="₮" selected={method === 'usdt'} onSelect={() => setMethod('usdt')} />
        </div>
      </div>

      {/* safety note */}
      <div style={{ marginTop: 18, display: 'flex', gap: 10, padding: '14px 16px', background: 'var(--secure-bg)', border: '1px solid var(--teal-50)', borderRadius: 'var(--radius-md)' }}>
        <Icons.Lock size={18} color="var(--secure-solid)" />
        <span style={{ fontSize: 13, color: 'var(--secure-fg)', lineHeight: 1.5 }}>
          支付通过持牌第三方加密通道完成,平台不存储您的支付信息。付款成功后卡密<b>即时自动发放</b>。
        </span>
      </div>

      {/* sticky pay bar */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 30, background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderTop: '1px solid var(--border)',
        boxShadow: '0 -6px 24px rgba(18,27,42,.06)',
      }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>应付</span>
            <PriceTag amount={order.total} size="md" />
          </div>
          <Button variant="primary" size="lg" block loading={paying} onClick={pay} style={{ flex: 1 }}
            iconLeft={!paying && <Icons.Lock size={18} />}>
            {paying ? '正在跳转支付…' : `确认支付 ¥${order.total.toFixed(2)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
window.PaymentScreen = PaymentScreen;
