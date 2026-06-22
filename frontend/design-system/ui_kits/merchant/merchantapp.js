/* 商户后台 (merchant console) — composes ConsoleShell + console DS components.
   Screens: 数据概览 · 商品管理 · 卡密管理 · 订单管理 · 钱包提现. */
const { ConsoleShell, StatCard, Panel, DataTable, Pill, Button, Input } = window.MiaoKa_b7a409;
const I = window.Icons;

const M_NAV = [
  { group: '概览', icon: I.Zap, items: [{ key: 'm-stats', label: '数据概览', icon: I.Zap }] },
  { group: '商品', icon: I.Package, items: [
    { key: 'm-products', label: '商品管理', icon: I.Package },
    { key: 'm-categories', label: '分类管理', icon: I.Inbox },
    { key: 'm-cards', label: '卡密管理', icon: I.Lock },
  ] },
  { group: '交易', icon: I.Search, items: [
    { key: 'm-orders', label: '订单管理', icon: I.Search },
    { key: 'm-complaints', label: '投诉处理', icon: I.AlertTriangle },
  ] },
  { group: '营销', icon: I.Star, items: [
    { key: 'm-coupons', label: '优惠券', icon: I.Tag },
    { key: 'm-promotions', label: '满减满折', icon: I.Star },
  ] },
  { group: '资金', icon: I.Wallet, items: [{ key: 'm-wallet', label: '钱包 / 提现', icon: I.Wallet }] },
  { group: '店铺', icon: I.ShieldCheck, items: [{ key: 'm-shop', label: '店铺装修', icon: I.ShieldCheck }] },
];

function GreetingCard() {
  const h = new Date().getHours();
  const hi = h < 6 ? '夜深了' : h < 12 ? '早上好' : h < 14 ? '中午好' : h < 18 ? '下午好' : '晚上好';
  return (
    <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', padding: '20px 22px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', background: 'linear-gradient(120deg, var(--brand-soft), #fff)', border: '1px solid var(--brand-soft-border)' }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-strong)' }}>您好,{window.MC.shop} 👋</div>
        <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 4 }}>{hi},又是元气满满的一天,祝你开单顺利</div>
      </div>
      <span style={{ width: 52, height: 52, flex: 'none', borderRadius: 16, background: '#fff', boxShadow: 'var(--shadow-xs)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><I.Zap size={26} color="var(--brand)" /></span>
    </section>
  );
}

function MStats({ go }) {
  const s = window.MC.summary;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <GreetingCard />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        <StatCard filled label="今日成交额" icon={<I.Zap size={18} color="#fff" />} value={<Money amount={s.sales_today} strong />}
          sub={<span style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}><span>昨日 <Money amount={s.sales_yesterday} /></span><span style={{ opacity: .9 }}>累计 <Money amount={s.sales_total} /></span></span>} />
        <StatCard label="今日订单" tone="success" icon={<I.Package size={16} color="var(--success-fg)" />} value={s.orders_today}
          sub={<span style={{ display: 'inline-flex', gap: 8, whiteSpace: 'nowrap' }}>昨日 {s.orders_yesterday} <Delta today={s.orders_today} yesterday={s.orders_yesterday} /></span>} />
        <StatCard label="今日毛利" tone="secure" icon={<I.Lock size={16} color="var(--secure-fg)" />} value={<Money amount={s.profit_today} strong />}
          sub={<span style={{ display: 'inline-flex', gap: 8, whiteSpace: 'nowrap' }}>昨日 <Money amount={s.profit_yesterday} /> <Delta money today={s.profit_today} yesterday={s.profit_yesterday} /></span>} />
      </div>
      <Panel title="常用功能" subtitle="快速进入各业务模块">
        <QuickGrid onGo={go} items={[
          { key: 'm-products', label: '商品管理', icon: 'Package', tone: 'brand' },
          { key: 'm-cards', label: '卡密管理', icon: 'Lock', tone: 'secure' },
          { key: 'm-orders', label: '订单管理', icon: 'Search', tone: 'success' },
          { key: 'm-wallet', label: '钱包提现', icon: 'Wallet', tone: 'pending' },
          { key: 'm-shop', label: '店铺装修', icon: 'ShieldCheck', tone: 'neutral' },
        ]} />
      </Panel>
      <Panel title="热销商品" subtitle="按销量排序 Top 5" padded={false}>
        <DataTable rowKey="id" columns={[
          { key: 'title', title: '商品' },
          { key: 'qty', title: '销量', align: 'right' },
          { key: 'orders', title: '订单数', align: 'right' },
          { key: 'sales', title: '销售额', align: 'right', render: r => <Money amount={r.sales} strong /> },
        ]} rows={window.MC.top} />
      </Panel>
    </div>
  );
}

const TYPE_TONE = { 卡密: 'brand', 知识: 'secure', 资源: 'pending', 权益: 'success' };
function MProducts({ toast }) {
  return (
    <Panel title="商品管理" subtitle={`共 ${window.MC.products.length} 件商品`} actions={<Button variant="primary" size="sm" iconLeft={<I.Plus size={15} />} onClick={() => toast('打开新建商品表单')}>新建商品</Button>} padded={false}>
      <DataTable rowKey="id" columns={[
        { key: 'title', title: '商品', render: r => <span style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{r.title}</span> },
        { key: 'type', title: '类型', render: r => <Pill tone={TYPE_TONE[r.type]}>{r.type}</Pill> },
        { key: 'deliver', title: '发货', render: r => <span style={{ color: 'var(--text-muted)' }}>{r.deliver}</span> },
        { key: 'price', title: '价格', align: 'right', render: r => <Money amount={r.price} strong color="var(--price-accent)" /> },
        { key: 'stock', title: '库存', align: 'right', render: r => <span className="tnum">{r.stock}</span> },
        { key: 'sold', title: '已售', align: 'right', render: r => <span className="tnum">{r.sold}</span> },
        { key: 'status', title: '状态', render: r => <Pill tone={r.status === '在售' ? 'success' : r.status === '缺货' ? 'danger' : 'pending'} dot>{r.status}</Pill> },
        { key: 'op', title: '操作', render: r => <span style={{ display: 'flex', gap: 6 }}><Button variant="ghost" size="sm" onClick={() => toast('编辑「' + r.title + '」')}>编辑</Button></span> },
      ]} rows={window.MC.products} />
    </Panel>
  );
}

function MOrders({ toast }) {
  const [f, setF] = React.useState('全部');
  const filters = ['全部', '待支付', '发货中', '已发货', '已退款', '异常待人工'];
  const rows = window.MC.orders.filter(o => f === '全部' || o.st === f);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {filters.map(x => (
          <button key={x} onClick={() => setF(x)} style={{ height: 32, padding: '0 14px', borderRadius: 'var(--radius-pill)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: f === x ? 800 : 600, border: f === x ? '1.5px solid var(--brand)' : '1px solid var(--border)', background: f === x ? 'var(--brand-soft)' : '#fff', color: f === x ? 'var(--brand-active)' : 'var(--text-body)' }}>{x}</button>
        ))}
      </div>
      <Panel padded={false}>
        <DataTable rowKey="no" empty="该状态下暂无订单" columns={[
          { key: 'no', title: '订单号', render: r => <span className="ds-mono" style={{ fontSize: 12.5 }}>{r.no}</span> },
          { key: 'goods', title: '商品' },
          { key: 'buyer', title: '买家', render: r => <span style={{ color: 'var(--text-muted)' }}>{r.buyer}</span> },
          { key: 'amt', title: '实付', align: 'right', render: r => <Money amount={r.amt} strong color="var(--price-accent)" /> },
          { key: 'st', title: '状态', render: r => <Pill tone={r.tone} dot>{r.st}</Pill> },
          { key: 'time', title: '时间', render: r => <span style={{ color: 'var(--text-subtle)', fontSize: 12.5 }}>{r.time}</span> },
          { key: 'op', title: '操作', render: r => <Button variant="ghost" size="sm" onClick={() => toast('查看订单 ' + r.no)}>详情</Button> },
        ]} rows={rows} />
      </Panel>
    </div>
  );
}

function MCards({ toast }) {
  const keys = ['NFLX-8K2D-···-9F1A', 'NFLX-3M7Q-···-2C8E', 'NFLX-PZ4R-···-7T0K', 'WINP-A1B2-···-X9Y8', 'WINP-K3L4-···-Q2W1'];
  const states = ['未售', '未售', '已售', '已售', '锁定'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        <StatCard label="未售卡密" tone="success" icon={<I.Lock size={16} color="var(--success-fg)" />} value="312" sub="可售库存" />
        <StatCard label="已售卡密" tone="neutral" icon={<I.Check size={16} color="var(--text-body)" />} value="2,304" />
        <StatCard label="锁定中" tone="pending" icon={<I.Clock size={16} color="var(--pending-fg)" />} value="6" sub="下单未付款占用" />
      </div>
      <Panel title="卡密列表" subtitle="Netflix 高级会员 · 1个月 · 脱敏显示" actions={<span style={{ display: 'flex', gap: 8 }}><Button variant="secondary" size="sm" onClick={() => toast('批量导入卡密')}>批量导入</Button><Button variant="neutral" size="sm" onClick={() => toast('已导出')}>导出</Button></span>} padded={false}>
        <DataTable rowKey="k" columns={[
          { key: 'k', title: '卡密 (脱敏)', render: r => <span className="ds-mono">{r.k}</span> },
          { key: 's', title: '状态', render: r => <Pill tone={r.s === '未售' ? 'success' : r.s === '已售' ? 'neutral' : 'pending'} dot>{r.s}</Pill> },
          { key: 'op', title: '操作', render: r => <Button variant="ghost" size="sm" onClick={() => toast('作废卡密')} disabled={r.s === '已售'}>作废</Button> },
        ]} rows={keys.map((k, i) => ({ k, s: states[i] }))} />
      </Panel>
    </div>
  );
}

function MWallet({ toast }) {
  const w = window.MC.wallet;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        <StatCard filled label="可提现余额" icon={<I.Wallet size={18} color="#fff" />} value={<Money amount={w.balance} strong />} sub="T+1 到账" />
        <StatCard label="待结算" tone="pending" icon={<I.Clock size={16} color="var(--pending-fg)" />} value={<Money amount={w.pending} strong />} />
        <StatCard label="冻结(保证金)" tone="secure" icon={<I.ShieldCheck size={16} color="var(--secure-fg)" />} value={<Money amount={w.frozen} strong />} />
      </div>
      <Panel title="资金流水" subtitle="收入 / 佣金 / 提现 / 退款" actions={<Button variant="primary" size="sm" onClick={() => toast('打开提现申请')}>申请提现</Button>} padded={false}>
        <DataTable rowKey="id" columns={[
          { key: 'type', title: '类型', render: r => <Pill tone={r.tone}>{r.type}</Pill> },
          { key: 'desc', title: '说明' },
          { key: 'amt', title: '金额', align: 'right', render: r => <Money amount={r.amt} strong color={r.amt >= 0 ? 'var(--success-fg)' : 'var(--text-strong)'} /> },
          { key: 'time', title: '时间', render: r => <span style={{ color: 'var(--text-subtle)', fontSize: 12.5 }}>{r.time}</span> },
        ]} rows={w.flow} />
      </Panel>
    </div>
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

function MerchantApp() {
  const [active, setActive] = React.useState('m-stats');
  const [toast, setToast] = React.useState(null);
  const flash = React.useCallback((m) => { setToast(m); clearTimeout(window.__t); window.__t = setTimeout(() => setToast(null), 1800); }, []);
  const flat = M_NAV.reduce((a, g) => a.concat(g.items), []);
  const label = flat.find(n => n.key === active)?.label;
  let screen;
  if (active === 'm-stats') screen = <MStats go={setActive} />;
  else if (active === 'm-products') screen = <MProducts toast={flash} />;
  else if (active === 'm-cards') screen = <MCards toast={flash} />;
  else if (active === 'm-orders') screen = <MOrders toast={flash} />;
  else if (active === 'm-wallet') screen = <MWallet toast={flash} />;
  else screen = <Placeholder label={label} />;

  return (
    <React.Fragment>
      <ConsoleShell nav={M_NAV} active={active} onNavigate={setActive} brandTitle="秒卡 · 商户" brandSub={window.MC.shop} user={window.MC.shop} onLogout={() => flash('已退出登录(演示)')}>
        {screen}
      </ConsoleShell>
      {toast && <div style={{ position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 90, background: 'rgba(17,20,24,.9)', color: '#fff', padding: '10px 18px', borderRadius: 'var(--radius-pill)', fontSize: 13.5, fontWeight: 700, boxShadow: 'var(--shadow-lg)', whiteSpace: 'nowrap' }}>{toast}</div>}
    </React.Fragment>
  );
}
if (window.__MK_KIT) ReactDOM.createRoot(document.getElementById('root')).render(<MerchantApp />);
