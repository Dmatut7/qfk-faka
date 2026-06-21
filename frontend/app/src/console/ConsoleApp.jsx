import React from 'react';
import { Button } from '../../../design-system/components/core/Button.jsx';
import { Input } from '../../../design-system/components/core/Input.jsx';
import { Icons } from '../Icons.jsx';
import { merchantApi, adminApi, ApiError, getSession, setSession, clearSession } from './api.js';
import { SCREENS } from './screens.js';

/* 导航定义(key 同时是 SCREENS 的键) */
const MERCHANT_NAV = [
  { key: 'm-stats', label: '数据概览', icon: 'Zap' },
  { key: 'm-products', label: '商品管理', icon: 'Package' },
  { key: 'm-shop', label: '店铺装修', icon: 'ShieldCheck' },
  { key: 'm-categories', label: '分类管理', icon: 'Inbox' },
  { key: 'm-cards', label: '卡密管理', icon: 'Lock' },
  { key: 'm-orders', label: '订单管理', icon: 'Search' },
  { key: 'm-wallet', label: '钱包 / 提现', icon: 'RefreshCw' },
];
const ADMIN_NAV = [
  { key: 'a-dashboard', label: '仪表盘', icon: 'Zap' },
  { key: 'a-merchants', label: '商户审核', icon: 'ShieldCheck' },
  { key: 'a-channels', label: '支付渠道', icon: 'Zap' },
  { key: 'a-withdrawals', label: '提现审核', icon: 'RefreshCw' },
  { key: 'a-settlement', label: '对账报表', icon: 'Package' },
  { key: 'a-orders', label: '订单(跨商户)', icon: 'Search' },
  { key: 'a-products', label: '商品(跨商户)', icon: 'Inbox' },
  { key: 'a-settings', label: '平台配置', icon: 'Lock' },
];

export default function ConsoleApp() {
  const [session, setSess] = React.useState(() => getSession());
  const loggedIn = !!session.token;

  const onLogin = (token, role, user) => { setSession(token, role, user); setSess(getSession()); };
  const onLogout = () => {
    const apiFor = session.role === 'admin' ? adminApi : merchantApi;
    apiFor.logout().catch(() => {});
    clearSession();
    setSess(getSession());
  };

  if (!loggedIn) return <LoginScreen onLogin={onLogin} />;
  return <Dashboard session={session} onLogout={onLogout} />;
}

/* ============ 登录 ============ */
function LoginScreen({ onLogin }) {
  const [role, setRole] = React.useState('merchant');
  const [mode, setMode] = React.useState('login'); // 'login' | 'register'
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [err, setErr] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const switchRole = (k) => {
    setRole(k);
    setErr('');
    setNotice('');
    if (k === 'admin') setMode('login'); // 平台登录态不显示注册入口
  };

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!username.trim() || !password) { setErr('请输入账号和密码'); return; }
    setErr('');
    setLoading(true);
    try {
      const apiFor = role === 'admin' ? adminApi : merchantApi;
      const data = await apiFor.login(username.trim(), password);
      onLogin(data.token, role, data.merchant || data.admin || data.user || { username: username.trim() });
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : '登录失败,请重试');
    } finally {
      setLoading(false);
    }
  };

  const onRegistered = () => {
    setMode('login');
    setNotice('开店申请已提交,待平台审核通过后即可登录');
    setErr('');
  };

  if (role === 'merchant' && mode === 'register') {
    return (
      <RegisterScreen
        onCancel={() => { setMode('login'); setErr(''); setNotice(''); }}
        onRegistered={onRegistered}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg-page)' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.02em' }}>秒卡 · 运营控制台</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>商户后台 / 平台后台</div>
        </div>

        <form onSubmit={submit} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 22, boxShadow: 'var(--shadow-sm)' }}>
          {/* 角色切换 */}
          <div role="radiogroup" aria-label="登录身份" style={{ display: 'flex', gap: 8, padding: 4, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', marginBottom: 18 }}>
            {[['merchant', '商户登录'], ['admin', '平台登录']].map(([k, label]) => (
              <button key={k} type="button" role="radio" aria-checked={role === k}
                onClick={() => switchRole(k)}
                style={{
                  flex: 1, height: 38, border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14,
                  background: role === k ? '#fff' : 'transparent',
                  color: role === k ? 'var(--brand)' : 'var(--text-muted)',
                  boxShadow: role === k ? 'var(--shadow-xs)' : 'none',
                }}>{label}</button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="账号" placeholder={role === 'admin' ? '平台管理员账号' : '商户账号'} value={username}
              icon={<Icons.ShieldCheck size={18} />} autoComplete="username"
              onChange={(e) => { setUsername(e.target.value); setErr(''); }} />
            <Input label="密码" type="password" placeholder="密码" value={password}
              icon={<Icons.Lock size={18} />} autoComplete="current-password"
              onChange={(e) => { setPassword(e.target.value); setErr(''); }} />
          </div>

          {notice && (
            <div style={{ marginTop: 14, display: 'flex', gap: 8, padding: '10px 12px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-md)', color: 'var(--success-fg)', fontSize: 13 }}>
              <Icons.Check size={16} color="var(--success-fg)" /><span>{notice}</span>
            </div>
          )}

          {err && (
            <div style={{ marginTop: 14, display: 'flex', gap: 8, padding: '10px 12px', background: 'var(--danger-bg, #fdeced)', border: '1px solid var(--danger-solid)', borderRadius: 'var(--radius-md)', color: 'var(--danger-fg)', fontSize: 13 }}>
              <Icons.AlertTriangle size={16} color="var(--danger-solid)" /><span>{err}</span>
            </div>
          )}

          <div style={{ marginTop: 18 }}>
            <Button type="submit" variant="primary" size="lg" block loading={loading}>
              {loading ? '登录中…' : '登录'}
            </Button>
          </div>

          {role === 'merchant' && (
            <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text-muted)' }}>
              没有账号?
              <button type="button"
                onClick={() => { setMode('register'); setErr(''); setNotice(''); }}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--brand)', fontWeight: 700, fontFamily: 'inherit', fontSize: 13, padding: 0 }}>
                我要开店
              </button>
            </div>
          )}
        </form>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-subtle)' }}>
          演示:商户 demo_merchant / demo123456 · 平台 admin / admin123
        </div>
      </div>
    </div>
  );
}

/* ============ 商户自助注册 ============ */
function RegisterScreen({ onCancel, onRegistered }) {
  const [form, setForm] = React.useState({ username: '', password: '', store_name: '', email: '' });
  const [err, setErr] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErr(''); };

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!form.username.trim() || !form.password || !form.store_name.trim()) {
      setErr('请填写账号、密码和店铺名称');
      return;
    }
    setErr('');
    setLoading(true);
    try {
      await merchantApi.register({
        username: form.username.trim(),
        password: form.password,
        store_name: form.store_name.trim(),
        email: form.email.trim(),
      });
      onRegistered();
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : '提交失败,请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg-page)' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.02em' }}>秒卡 · 商户入驻</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>提交开店申请,待平台审核</div>
        </div>

        <form onSubmit={submit} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 22, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="账号" placeholder="登录账号" value={form.username}
              icon={<Icons.ShieldCheck size={18} />} autoComplete="username"
              onChange={set('username')} />
            <Input label="密码" type="password" placeholder="登录密码" value={form.password}
              icon={<Icons.Lock size={18} />} autoComplete="new-password"
              onChange={set('password')} />
            <Input label="店铺名称" placeholder="对外展示的店铺名" value={form.store_name}
              icon={<Icons.Package size={18} />}
              onChange={set('store_name')} />
            <Input label="邮箱" type="email" placeholder="联系邮箱(选填)" value={form.email}
              icon={<Icons.Inbox size={18} />} autoComplete="email"
              onChange={set('email')} />
          </div>

          {err && (
            <div style={{ marginTop: 14, display: 'flex', gap: 8, padding: '10px 12px', background: 'var(--danger-bg, #fdeced)', border: '1px solid var(--danger-solid)', borderRadius: 'var(--radius-md)', color: 'var(--danger-fg)', fontSize: 13 }}>
              <Icons.AlertTriangle size={16} color="var(--danger-solid)" /><span>{err}</span>
            </div>
          )}

          <div style={{ marginTop: 18 }}>
            <Button type="submit" variant="primary" size="lg" block loading={loading}>
              {loading ? '提交中…' : '提交开店申请'}
            </Button>
          </div>

          <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text-muted)' }}>
            已有账号?
            <button type="button" onClick={onCancel}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--brand)', fontWeight: 700, fontFamily: 'inherit', fontSize: 13, padding: 0 }}>
              返回登录
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============ 控制台布局 ============ */
function Dashboard({ session, onLogout }) {
  const nav = session.role === 'admin' ? ADMIN_NAV : MERCHANT_NAV;
  const [active, setActive] = React.useState(nav[0].key);
  const ActiveScreen = SCREENS[active];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-page)' }}>
      {/* 侧栏 */}
      <aside style={{
        width: 224, flex: 'none', background: '#fff', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-strong)', letterSpacing: '-0.01em' }}>
            秒卡 {session.role === 'admin' ? '· 平台' : '· 商户'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {session.user?.store_name || session.user?.nickname || session.user?.username || '已登录'}
          </div>
        </div>
        <nav style={{ flex: 1, padding: 10, overflowY: 'auto' }}>
          {nav.map((item) => {
            const Icon = Icons[item.icon] || Icons.Package;
            const on = active === item.key;
            return (
              <button key={item.key} onClick={() => setActive(item.key)}
                aria-current={on ? 'page' : undefined}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 2,
                  border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'var(--font-sans)', fontWeight: on ? 700 : 600, fontSize: 14,
                  background: on ? 'var(--brand-soft)' : 'transparent',
                  color: on ? 'var(--brand-active)' : 'var(--text-body)',
                }}>
                <Icon size={18} color={on ? 'var(--brand)' : 'var(--text-muted)'} />{item.label}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
          <Button variant="neutral" size="md" block iconLeft={<Icons.ChevronLeft size={16} />} onClick={onLogout}>退出登录</Button>
        </div>
      </aside>

      {/* 内容 */}
      <main style={{ flex: 1, minWidth: 0, padding: '24px 28px', maxWidth: 1180 }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.02em', margin: '0 0 18px' }}>
          {nav.find((n) => n.key === active)?.label}
        </h1>
        {ActiveScreen ? <ActiveScreen api={session.role === 'admin' ? adminApi : merchantApi} session={session} /> : <Placeholder navKey={active} />}
      </main>
    </div>
  );
}

function Placeholder({ navKey }) {
  return (
    <div style={{ background: '#fff', border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-lg)', padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
      <Icons.Package size={32} color="var(--text-subtle)" />
      <div style={{ marginTop: 10, fontSize: 14 }}>「{navKey}」页面建设中</div>
    </div>
  );
}
