import React from 'react';
import { Button } from '../../../design-system/components/core/Button.jsx';
import { Input } from '../../../design-system/components/core/Input.jsx';
import { OrderStatusBadge } from '../../../design-system/components/commerce/OrderStatusBadge.jsx';
import { PriceTag } from '../../../design-system/components/core/PriceTag.jsx';
import { api, setBuyerToken, getBuyerToken, statusKey } from '../api.js';

/** 买家账号(可选):未登录显示登录/注册;已登录显示「我的订单」。 */
export default function BuyerAccount() {
  const [loggedIn, setLoggedIn] = React.useState(!!getBuyerToken());
  const [mode, setMode] = React.useState('login'); // login | register
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [err, setErr] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [me, setMe] = React.useState(null);
  const [orders, setOrders] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!loggedIn) return undefined;
    let alive = true;
    setLoading(true);
    Promise.all([api.buyerMe().catch(() => null), api.buyerOrders().catch(() => null)])
      .then(([m, o]) => {
        if (!alive) return;
        setMe(m && m.buyer);
        setOrders((o && o.items) || []);
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [loggedIn]);

  const submit = async () => {
    if (busy) return;
    if (!email.trim() || !password) { setErr('请填写邮箱和密码'); return; }
    setErr(''); setBusy(true);
    try {
      const fn = mode === 'register' ? api.buyerRegister : api.buyerLogin;
      const { token } = await fn({ email: email.trim(), password });
      setBuyerToken(token);
      setLoggedIn(true);
    } catch (e) {
      setErr((e && e.message) || '操作失败,请重试');
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    setBuyerToken('');
    setLoggedIn(false);
    setMe(null); setOrders(null); setEmail(''); setPassword(''); setErr('');
  };

  const wrap = { maxWidth: 560, margin: '0 auto', padding: '18px 16px 80px' };

  if (!loggedIn) {
    return (
      <div style={wrap}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button type="button" onClick={() => { setMode('login'); setErr(''); }} style={tabStyle(mode === 'login')}>登录</button>
          <button type="button" onClick={() => { setMode('register'); setErr(''); }} style={tabStyle(mode === 'register')}>注册</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="邮箱" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <Input
            label="密码" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'register' ? '至少 6 位' : '密码'}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          />
          {err ? <div style={{ color: 'var(--danger-fg)', fontSize: 13, fontWeight: 600 }}>{err}</div> : null}
          <Button size="lg" block loading={busy} onClick={submit}>{mode === 'register' ? '注册并登录' : '登录'}</Button>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
            登录后可查看「我的订单」。无需账号也可在「订单查询」凭订单号 + 邮箱取卡。
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-strong)' }}>我的订单</div>
          {me ? <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{me.email}</div> : null}
        </div>
        <Button variant="ghost" size="sm" onClick={logout}>退出登录</Button>
      </div>

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-subtle)' }}>加载中…</div>
      ) : !orders || orders.length === 0 ? (
        <div style={{ padding: '50px 0', textAlign: 'center', color: 'var(--text-subtle)' }}>暂无订单</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.map((o) => (
            <div key={o.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 14, background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'ui-monospace,Menlo,monospace', wordBreak: 'break-all' }}>{o.order_no}</span>
                <OrderStatusBadge status={statusKey(o.status)} label={statusKey(o.status) === 'exception' ? '异常待处理' : undefined} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{o.create_time}</span>
                <PriceTag amount={o.total_amount} size="sm" />
              </div>
              {Number(o.status) === 2 && o.delivered_content ? (
                <pre style={{ marginTop: 10, background: 'var(--brand-soft)', borderRadius: 8, padding: 10, fontSize: 12.5, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'ui-monospace,Menlo,monospace' }}>{o.delivered_content}</pre>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function tabStyle(active) {
  return {
    flex: 1, height: 40, borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 700, fontSize: 14,
    fontFamily: 'inherit',
    border: active ? '1.5px solid var(--brand)' : '1px solid var(--border)',
    background: active ? 'var(--brand-soft)' : '#fff',
    color: active ? 'var(--brand-active)' : 'var(--text-muted)',
  };
}
