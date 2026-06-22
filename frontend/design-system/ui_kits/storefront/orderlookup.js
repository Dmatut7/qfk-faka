/* Order lookup + card retrieval — the page where buyers receive their goods. */
function genKeys(product, qty) {
  const seg = () => Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').padEnd(4, 'X').slice(0, 4);
  const prefix = (product.name.match(/[A-Za-z]+/) || ['CARD'])[0].toUpperCase().slice(0, 5);
  return Array.from({ length: qty }, () => `${prefix}-${seg()}-${seg()}-${seg()}-${seg()}`);
}

function OrderLookup({ order, onShop }) {
  const { Input, Button, OrderStatusBadge, CardKey } = window.MiaoKa_b7a409;
  const [mode, setMode] = React.useState('order');
  const [q, setQ] = React.useState('');
  const [error, setError] = React.useState('');
  const [toast, setToast] = React.useState('');
  const [result, setResult] = React.useState(order || null);

  React.useEffect(() => { if (order) setResult(order); }, [order]);

  const flashToast = (m) => { setToast(m); setTimeout(() => setToast(''), 1800); };

  const search = () => {
    const v = q.trim();
    if (!v) { setError('请输入订单号或邮箱'); return; }
    setError('');
    // demo: any non-empty query returns the active order, else a sample delivered one
    if (order && (v === order.orderNo || v === order.email)) { setResult(order); return; }
    setResult(window.MK_SAMPLE_ORDER(v));
  };

  const copyAll = (keys) => {
    const text = keys.join('\n');
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    flashToast('已复制全部卡密');
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 16px 60px' }}>
      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.02em' }}>订单查询 / 取卡</h1>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>输入下单时的订单号或邮箱,即可查看订单状态并领取卡密。</p>

      {/* search card */}
      <div style={{ marginTop: 18, background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 18, boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, background: 'var(--surface-sunken)', padding: 4, borderRadius: 'var(--radius-md)' }}>
          {[['order', '按订单号'], ['email', '按邮箱']].map(([k, label]) => (
            <button key={k} onClick={() => setMode(k)} style={{
              flex: 1, height: 36, border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              background: mode === k ? '#fff' : 'transparent', color: mode === k ? 'var(--text-strong)' : 'var(--text-muted)',
              fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, boxShadow: mode === k ? 'var(--shadow-xs)' : 'none',
            }}>{label}</button>
          ))}
        </div>
        <Input
          placeholder={mode === 'order' ? '如 MK20260621A8F3' : '下单时填写的邮箱'}
          icon={mode === 'order' ? <Icons.Search size={18} /> : <Icons.Mail size={18} />}
          value={q} onChange={e => { setQ(e.target.value); setError(''); }}
          error={error}
          onKeyDown={e => e.key === 'Enter' && search()} />
        <div style={{ marginTop: 14 }}>
          <Button variant="primary" size="lg" block onClick={search} iconLeft={<Icons.Search size={18} />}>查询订单</Button>
        </div>
      </div>

      {result && <OrderResult result={result} onCopyAll={copyAll} onShop={onShop} flashToast={flashToast} />}

      {/* toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 60,
          background: 'var(--slate-900)', color: '#fff', padding: '11px 20px', borderRadius: 'var(--radius-pill)',
          fontSize: 14, fontWeight: 600, boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: 8,
        }}><Icons.Check size={16} color="var(--green-100)" />{toast}</div>
      )}
    </div>
  );
}

function OrderResult({ result, onCopyAll, onShop, flashToast }) {
  const { OrderStatusBadge, CardKey, Button } = window.MiaoKa_b7a409;
  const delivered = result.status === 'delivered';
  const r = result;

  return (
    <div style={{ marginTop: 18, background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span className="ds-mono" style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.orderNo}</span>
        <OrderStatusBadge status={r.status} />
      </div>

      <div style={{ padding: 18 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 11, background: 'var(--brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flex: 'none' }}>{r.product.thumb}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-strong)' }}>{r.product.name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>数量 ×{r.qty} · 实付 ¥{r.total.toFixed(2)} · {r.email}</div>
          </div>
        </div>

        {delivered ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 800, color: 'var(--success-fg)' }}>
                <Icons.ShieldCheck size={16} color="var(--success-solid)" />卡密已发放({r.keys.length})
              </div>
              {r.keys.length > 1 && (
                <button onClick={() => onCopyAll(r.keys)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, border: '1.5px solid var(--border-strong)', background: '#fff',
                  borderRadius: 'var(--radius-pill)', padding: '5px 12px', fontSize: 12.5, fontWeight: 700, color: 'var(--text-strong)', cursor: 'pointer',
                }}><Icons.Copy size={14} />复制全部</button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {r.keys.map((code, i) => (
                <CardKey key={i} index={r.keys.length > 1 ? i + 1 : undefined} label={r.product.name.split(' ')[0] + ' 卡密'} code={code} onCopy={() => flashToast('已复制卡密')} />
              ))}
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 9, padding: '12px 14px', background: 'var(--pending-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--pending-border)' }}>
              <Icons.Clock size={16} color="var(--pending-solid)" />
              <span style={{ fontSize: 12.5, color: 'var(--pending-fg)', lineHeight: 1.5 }}>请尽快复制并妥善保管卡密。卡密仅展示给本订单,如遇问题请在 24 小时内联系客服。</span>
            </div>
          </div>
        ) : (
          <div>
            <CardKey locked label="卡密" lockedHint="订单待支付,完成付款后卡密将在此自动显示" />
            <div style={{ marginTop: 14 }}>
              <Button variant="primary" size="lg" block onClick={onShop}>去支付</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
window.OrderLookup = OrderLookup;
