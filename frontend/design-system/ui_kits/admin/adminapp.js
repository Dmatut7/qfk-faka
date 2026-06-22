/* 平台运营后台 (platform admin console) — ConsoleShell + console DS components.
   Screens: 仪表盘 · 商户审核 · 跨商户订单(含退款) · 投诉仲裁. */
const { ConsoleShell, StatCard, Panel, DataTable, Pill, Button } = window.MiaoKa_b7a409;
const I = window.Icons;

const A_NAV = [
  { group: '概览', icon: I.Zap, items: [
    { key: 'a-dashboard', label: '仪表盘', icon: I.Zap },
    { key: 'a-bigscreen', label: '大屏数据', icon: I.QrCode },
  ] },
  { group: '商户管理', icon: I.ShieldCheck, items: [
    { key: 'a-merchants', label: '商户审核', icon: I.ShieldCheck },
    { key: 'a-invite', label: '邀请码', icon: I.Mail },
  ] },
  { group: '交易', icon: I.Search, items: [
    { key: 'a-orders', label: '订单(跨商户)', icon: I.Search },
    { key: 'a-complaints', label: '投诉仲裁', icon: I.AlertTriangle },
    { key: 'a-blacklist', label: '买家黑名单', icon: I.Lock },
  ] },
  { group: '财务', icon: I.Star, items: [
    { key: 'a-withdrawals', label: '提现审核', icon: I.RefreshCw },
    { key: 'a-settlement', label: '对账报表', icon: I.Star },
  ] },
  { group: '运营', icon: I.Megaphone, items: [
    { key: 'a-content', label: '内容管理', icon: I.Megaphone },
    { key: 'a-channels', label: '支付渠道', icon: I.QrCode },
  ] },
  { group: '系统', icon: I.Lock, items: [
    { key: 'a-settings', label: '平台配置', icon: I.Lock },
    { key: 'a-oplog', label: '操作日志', icon: I.Search },
  ] },
];

function AGreeting({ onReload }) {
  const h = new Date().getHours();
  const hi = h < 6 ? '夜深了' : h < 12 ? '早上好' : h < 14 ? '中午好' : h < 18 ? '下午好' : '晚上好';
  return (
    <section style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', background: 'linear-gradient(120deg, var(--orange-600) 0%, var(--brand) 55%, var(--orange-400) 100%)', color: '#fff', padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>{hi},平台管理员 👋</div>
        <div style={{ fontSize: 13.5, marginTop: 6, opacity: .92 }}>又是元气满满的一天,愿今天订单不断、对账无忧。</div>
      </div>
      <Button variant="secondary" size="sm" iconLeft={<I.RefreshCw size={15} />} onClick={onReload}>刷新数据</Button>
    </section>
  );
}

function TodoRow({ icon, tone, label, count, extra, onClick }) {
  const TONE = { pending: ['var(--pending-fg)', 'var(--pending-bg)'], brand: ['var(--brand-active)', 'var(--brand-soft)'], danger: ['var(--danger-fg)', 'var(--danger-bg)'] };
  const [fg, bg] = TONE[tone] || TONE.brand;
  const Icon = I[icon] || I.Clock;
  const has = Number(count) > 0;
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: '#fff', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
      <span style={{ width: 36, height: 36, flex: 'none', borderRadius: 10, background: bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={18} color={fg} /></span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--text-strong)' }}>{label}</span>
        {extra && <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>待处理金额 {extra}</span>}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 'none' }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: has ? 'var(--pending-fg)' : 'var(--text-subtle)' }}>{count}</span>
        <I.ChevronRight size={16} color="var(--text-subtle)" />
      </span>
    </button>
  );
}

function ADashboard({ go }) {
  const d = window.AD.dashboard;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <AGreeting onReload={() => go('a-dashboard')} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10 }}>今日 · 概览</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <StatCard filled label="今日成交额" icon={<I.Zap size={18} color="#fff" />} value={<Money amount={d.sales.today} strong />} sub={`昨日 ¥${d.sales.yesterday.toLocaleString()} · 累计 ¥${(d.sales.total/10000).toFixed(0)}万`} />
          <StatCard label="今日订单" tone="brand" icon={<I.Search size={16} color="var(--brand-active)" />} value={d.orders.today} sub={<span style={{ display: 'inline-flex', gap: 8, whiteSpace: 'nowrap' }}>昨日 {d.orders.yesterday} <Delta today={d.orders.today} yesterday={d.orders.yesterday} /></span>} />
          <StatCard label="平台利润" tone="secure" icon={<I.Lock size={16} color="var(--secure-fg)" />} value={<Money amount={d.profit.today} strong />} sub={<span style={{ display: 'inline-flex', gap: 8, whiteSpace: 'nowrap' }}>昨日 <Money amount={d.profit.yesterday} /> <Delta money today={d.profit.today} yesterday={d.profit.yesterday} /></span>} />
          <StatCard label="入驻商户" tone="success" icon={<I.Package size={16} color="var(--success-fg)" />} value={d.merchants.total} sub={`今日 +${d.merchants.today} · 待审 ${d.merchants.pending} · 冻结 ${d.merchants.frozen}`} />
          <StatCard label="在售商品" tone="pending" icon={<I.Inbox size={16} color="var(--pending-fg)" />} value={d.products.on_sale} sub={`未售卡密 ${d.products.cards_unsold.toLocaleString()}`} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Panel title="待处理" subtitle="需要及时跟进的事项" style={{ flex: '1 1 360px', minWidth: 300 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <TodoRow icon="RefreshCw" tone="pending" label="待审核提现" count={d.withdrawals.pending_count} extra={<Money amount={d.withdrawals.pending_amount} />} onClick={() => go('a-withdrawals')} />
            <TodoRow icon="Clock" tone="brand" label="待审核商户" count={d.merchants.pending} onClick={() => go('a-merchants')} />
            <TodoRow icon="AlertTriangle" tone="danger" label="异常待人工订单" count={d.orders.exception} onClick={() => go('a-orders')} />
            <TodoRow icon="AlertTriangle" tone="danger" label="投诉待仲裁" count={d.complaints.intervene} onClick={() => go('a-complaints')} />
          </div>
        </Panel>
        <Panel title="常用功能" subtitle="快速进入各管理模块" style={{ flex: '2 1 460px', minWidth: 320 }}>
          <QuickGrid onGo={go} items={[
            { key: 'a-merchants', label: '商户审核', icon: 'ShieldCheck', tone: 'brand' },
            { key: 'a-withdrawals', label: '提现审核', icon: 'RefreshCw', tone: 'success' },
            { key: 'a-complaints', label: '投诉仲裁', icon: 'AlertTriangle', tone: 'danger' },
            { key: 'a-settlement', label: '对账报表', icon: 'Star', tone: 'secure' },
            { key: 'a-channels', label: '支付渠道', icon: 'QrCode', tone: 'pending' },
            { key: 'a-content', label: '内容管理', icon: 'Megaphone', tone: 'brand' },
            { key: 'a-invite', label: '邀请码', icon: 'Mail', tone: 'secure' },
            { key: 'a-settings', label: '平台配置', icon: 'Lock', tone: 'neutral' },
          ]} />
        </Panel>
      </div>
    </div>
  );
}

function AMerchants({ toast }) {
  return (
    <Panel title="商户审核 / 管理" subtitle={`共 ${window.AD.merchants.length} 家商户`} actions={<Button variant="primary" size="sm" iconLeft={<I.Plus size={15} />} onClick={() => toast('新建商户')}>新建商户</Button>} padded={false}>
      <DataTable rowKey="id" columns={[
        { key: 'shop', title: '店铺', render: r => <span><span style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{r.shop}</span><br /><span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>@{r.owner}</span></span> },
        { key: 'rate', title: '佣金', align: 'right' },
        { key: 'deposit', title: '保证金', align: 'right', render: r => <Money amount={r.deposit} /> },
        { key: 'status', title: '状态', render: r => <Pill tone={r.tone} dot>{r.status}</Pill> },
        { key: 'time', title: '入驻', render: r => <span style={{ color: 'var(--text-subtle)', fontSize: 12.5 }}>{r.time}</span> },
        { key: 'op', title: '操作', render: r => (
          <span style={{ display: 'flex', gap: 6 }}>
            {r.status === '待审核' && <Button variant="primary" size="sm" onClick={() => toast('已通过审核')}>通过</Button>}
            {r.status === '冻结' ? <Button variant="secondary" size="sm" onClick={() => toast('已解冻')}>解冻</Button> : <Button variant="ghost" size="sm" onClick={() => toast('已冻结')}>冻结</Button>}
          </span>
        ) },
      ]} rows={window.AD.merchants} />
    </Panel>
  );
}

function AOrders({ toast }) {
  const [confirm, setConfirm] = React.useState(null);
  return (
    <React.Fragment>
      <Panel title="跨商户订单" subtitle="全平台订单 · 可发起退款" padded={false}>
        <DataTable rowKey="no" columns={[
          { key: 'no', title: '订单号', render: r => <span className="ds-mono" style={{ fontSize: 12.5 }}>{r.no}</span> },
          { key: 'shop', title: '商户', render: r => <span style={{ color: 'var(--text-muted)' }}>{r.shop}</span> },
          { key: 'goods', title: '商品' },
          { key: 'amt', title: '金额', align: 'right', render: r => <Money amount={r.amt} strong color="var(--price-accent)" /> },
          { key: 'st', title: '状态', render: r => <Pill tone={r.tone} dot>{r.st}</Pill> },
          { key: 'op', title: '操作', render: r => <Button variant="ghost" size="sm" onClick={() => setConfirm(r)} disabled={r.st === '已退款'}>退款</Button> },
        ]} rows={window.AD.orders} />
      </Panel>
      {confirm && (
        <div onClick={() => setConfirm(null)} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'var(--surface-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', padding: 22 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-strong)' }}>确认退款</div>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6 }}>将对订单 <span className="ds-mono">{confirm.no}</span> 退款 <Money amount={confirm.amt} strong color="var(--price-accent)" />,原路退回买家。此操作不可撤销。</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <Button variant="neutral" size="md" onClick={() => setConfirm(null)}>取消</Button>
              <Button variant="danger" size="md" onClick={() => { toast('已退款 ' + confirm.no); setConfirm(null); }}>确认退款</Button>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

function AComplaints({ toast }) {
  return (
    <Panel title="投诉仲裁" subtitle="买家投诉 · 平台裁决" padded={false}>
      <DataTable rowKey="id" columns={[
        { key: 'no', title: '订单号', render: r => <span className="ds-mono" style={{ fontSize: 12.5 }}>{r.no}</span> },
        { key: 'shop', title: '商户', render: r => <span style={{ color: 'var(--text-muted)' }}>{r.shop}</span> },
        { key: 'type', title: '投诉类型', render: r => <Pill tone="neutral">{r.type}</Pill> },
        { key: 'buyer', title: '买家', render: r => <span style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>{r.buyer}</span> },
        { key: 'st', title: '状态', render: r => <Pill tone={r.tone} dot>{r.st}</Pill> },
        { key: 'op', title: '操作', render: r => r.st === '待仲裁' ? <Button variant="primary" size="sm" onClick={() => toast('打开裁决弹窗')}>裁决</Button> : <Button variant="ghost" size="sm" onClick={() => toast('查看 ' + r.no)}>查看</Button> },
      ]} rows={window.AD.complaints} />
    </Panel>
  );
}

function Placeholder({ label }) {
  return (
    <div style={{ background: '#fff', border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
      <I.Package size={32} color="var(--text-subtle)" />
      <div style={{ marginTop: 10, fontSize: 14 }}>「{label}」页面 — 演示中以核心页面为主</div>
    </div>
  );
}

function AdminApp() {
  const [active, setActive] = React.useState('a-dashboard');
  const [toast, setToast] = React.useState(null);
  const flash = React.useCallback((m) => { setToast(m); clearTimeout(window.__at); window.__at = setTimeout(() => setToast(null), 1800); }, []);
  const flat = A_NAV.reduce((a, g) => a.concat(g.items), []);
  const label = flat.find(n => n.key === active)?.label;
  let screen;
  if (active === 'a-dashboard') screen = <ADashboard go={setActive} />;
  else if (active === 'a-merchants') screen = <AMerchants toast={flash} />;
  else if (active === 'a-orders') screen = <AOrders toast={flash} />;
  else if (active === 'a-complaints') screen = <AComplaints toast={flash} />;
  else screen = <Placeholder label={label} />;

  return (
    <React.Fragment>
      <ConsoleShell nav={A_NAV} active={active} onNavigate={setActive} brandTitle="秒卡 · 平台" brandSub="运营控制台" user="平台管理员" onLogout={() => flash('已退出登录(演示)')}>
        {screen}
      </ConsoleShell>
      {toast && <div style={{ position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 90, background: 'rgba(17,20,24,.9)', color: '#fff', padding: '10px 18px', borderRadius: 'var(--radius-pill)', fontSize: 13.5, fontWeight: 700, boxShadow: 'var(--shadow-lg)', whiteSpace: 'nowrap' }}>{toast}</div>}
    </React.Fragment>
  );
}
if (window.__MK_KIT) ReactDOM.createRoot(document.getElementById('root')).render(<AdminApp />);
