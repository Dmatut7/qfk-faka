import React from 'react';
import { useAsync, Panel, Toolbar, DataTable, Money, Pill, Modal, Field, StatCard, ErrorBar } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { ApiError } from '../api.js';
import { Button } from '../../../../design-system/components/core/Button.jsx';
import { Input } from '../../../../design-system/components/core/Input.jsx';

// 资金流水类型(MerchantFundLog::TYPE_*)
const FUND_TYPE = {
  1: { label: '订单收入', tone: 'success', icon: 'Zap' },
  2: { label: '平台佣金', tone: 'neutral', icon: 'ShieldCheck' },
  3: { label: '提现', tone: 'pending', icon: 'Clock' },
  4: { label: '退款', tone: 'danger', icon: 'AlertTriangle' },
};

// 提现状态(Withdrawal::STATUS_*)
const WD_STATUS = {
  0: { label: '待审核', tone: 'pending' },
  1: { label: '已通过', tone: 'brand' },
  2: { label: '已拒绝', tone: 'danger' },
  3: { label: '已打款', tone: 'success' },
};

// 判断金额字符串/数字是否为负(支出/冻结显示红色)
function isNegative(amount) {
  return Number(amount || 0) < 0;
}

// 收款方式(仅前端用于结构化录入,提交仍拼成单一 account_info 字符串)
const PAY_METHODS = [
  { value: 'alipay', label: '支付宝', bank: false },
  { value: 'bank', label: '银行卡', bank: true },
  { value: 'wechat', label: '微信', bank: false },
];

const emptyForm = { amount: '', method: 'alipay', account: '', name: '', bank: '' };

// 把结构化收款字段拼成后端约定的 account_info 单字符串
function composeAccountInfo(form) {
  const m = PAY_METHODS.find((x) => x.value === form.method) || PAY_METHODS[0];
  const parts = [m.label, `账号:${form.account.trim()}`, `户名:${form.name.trim()}`];
  if (m.bank && form.bank.trim()) parts.push(`开户行:${form.bank.trim()}`);
  return parts.join(' / ');
}

const PAGE_SIZE = 20;

export default function Wallet({ api, session }) {
  const [logPage, setLogPage] = React.useState(1);
  const [wdPage, setWdPage] = React.useState(1);

  const wallet = useAsync(() => api.wallet(), []);
  const logs = useAsync(() => api.fundLogs({ page: logPage }), [logPage]);
  const withdrawals = useAsync(() => api.withdrawals({ page: wdPage }), [wdPage]);

  const [open, setOpen] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false); // true = 进入二次确认步骤
  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [formErr, setFormErr] = React.useState('');

  // 资金流水「类型」前端筛选('' = 全部,否则为 FUND_TYPE 的 key)
  const [logType, setLogType] = React.useState('');
  // 提现记录「状态」前端筛选('' = 全部,否则为 WD_STATUS 的 key)
  const [wdStatus, setWdStatus] = React.useState('');

  // 可用余额(用于前端校验上限,后端仍是权威)
  const available = wallet.data ? String(wallet.data.balance ?? '0') : '0';

  // 当前选中的收款方式定义
  const curMethod = PAY_METHODS.find((m) => m.value === form.method) || PAY_METHODS[0];

  function openApply() {
    setForm(emptyForm);
    setFormErr('');
    setConfirming(false);
    setOpen(true);
  }

  function closeApply() {
    if (saving) return;
    setOpen(false);
    setConfirming(false);
  }

  // 第一步:校验金额与结构化收款字段,通过后进入二次确认
  function reviewWithdrawal() {
    const raw = form.amount.trim();
    const num = Number(raw);
    if (!raw || !Number.isFinite(num) || num <= 0) {
      setFormErr('提现金额必须大于 0');
      return;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
      setFormErr('金额最多两位小数');
      return;
    }
    if (num > Number(available || 0)) {
      setFormErr('提现金额不能超过可用余额');
      return;
    }
    if (!form.account.trim()) {
      setFormErr(`请填写${curMethod.label}账号`);
      return;
    }
    if (!form.name.trim()) {
      setFormErr('请填写收款户名');
      return;
    }
    if (curMethod.bank && !form.bank.trim()) {
      setFormErr('请填写开户行');
      return;
    }
    setFormErr('');
    setConfirming(true);
  }

  // 第二步:二次确认后真正提交(金额/请求逻辑不变,account_info 由结构化字段拼成)
  async function submitWithdrawal() {
    const raw = form.amount.trim();
    setSaving(true);
    setFormErr('');
    try {
      await api.applyWithdrawal({ amount: raw, account_info: composeAccountInfo(form) });
      setOpen(false);
      setConfirming(false);
      // 提现冻结余额、生成流水与提现单,三处一并刷新;回到第 1 页以便看到最新记录
      wallet.reload();
      if (logPage === 1) logs.reload(); else setLogPage(1);
      if (wdPage === 1) withdrawals.reload(); else setWdPage(1);
    } catch (e) {
      setFormErr(e instanceof ApiError ? e.message : '申请失败,请重试');
      setConfirming(false); // 回到表单步以便修改后重试
    } finally {
      setSaving(false);
    }
  }

  const allLogRows = (logs.data && logs.data.items) || [];
  const allWdRows = (withdrawals.data && withdrawals.data.items) || [];
  // 前端按类型/状态过滤当前页数据(后端分页仍是权威,这里只过滤已加载行)
  const logRows = logType === '' ? allLogRows : allLogRows.filter((r) => String(r.type) === String(logType));
  const wdRows = wdStatus === '' ? allWdRows : allWdRows.filter((r) => String(r.status) === String(wdStatus));
  const logTotal = Number((logs.data && logs.data.total) || 0);
  const wdTotal = Number((withdrawals.data && withdrawals.data.total) || 0);
  const logTotalPages = Math.max(1, Math.ceil(logTotal / PAGE_SIZE));
  const wdTotalPages = Math.max(1, Math.ceil(wdTotal / PAGE_SIZE));
  const goLogPage = (p) => setLogPage(Math.min(Math.max(1, p), logTotalPages));
  const goWdPage = (p) => setWdPage(Math.min(Math.max(1, p), wdTotalPages));

  const logColumns = [
    {
      key: 'type',
      title: '类型',
      width: 110,
      render: (row) => {
        const t = FUND_TYPE[Number(row.type)] || { label: '其他', tone: 'neutral' };
        return <Pill tone={t.tone}>{t.label}</Pill>;
      },
    },
    {
      key: 'amount',
      title: '金额',
      align: 'right',
      width: 130,
      render: (row) => {
        const neg = isNegative(row.amount);
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <span style={{ color: neg ? 'var(--danger-fg)' : 'var(--success-fg)', fontWeight: 800 }}>
              {neg ? '−' : '+'}
            </span>
            <Money amount={Math.abs(Number(row.amount || 0))} strong color={neg ? 'var(--danger-fg)' : 'var(--success-fg)'} />
          </span>
        );
      },
    },
    {
      key: 'balance_after',
      title: '余额(后)',
      align: 'right',
      width: 130,
      render: (row) => <Money amount={row.balance_after} />,
    },
    {
      key: 'remark',
      title: '备注',
      render: (row) => <span style={{ color: 'var(--text-body)' }}>{row.remark || '—'}</span>,
    },
    {
      key: 'create_time',
      title: '时间',
      width: 170,
      render: (row) => <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{row.create_time || '—'}</span>,
    },
  ];

  const wdColumns = [
    {
      key: 'amount',
      title: '提现金额',
      align: 'right',
      width: 130,
      render: (row) => <Money amount={row.amount} strong />,
    },
    {
      key: 'fee',
      title: '手续费',
      align: 'right',
      width: 110,
      render: (row) => <Money amount={row.fee} />,
    },
    {
      key: 'account_info',
      title: '收款信息',
      render: (row) => <span style={{ color: 'var(--text-body)' }}>{row.account_info || '—'}</span>,
    },
    {
      key: 'status',
      title: '状态',
      width: 110,
      render: (row) => {
        const s = WD_STATUS[Number(row.status)] || { label: '未知', tone: 'neutral' };
        return <Pill tone={s.tone}>{s.label}</Pill>;
      },
    },
    {
      key: 'create_time',
      title: '申请时间',
      width: 170,
      render: (row) => <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{row.create_time || '—'}</span>,
    },
    {
      key: 'processed_at',
      title: '处理时间',
      width: 170,
      // 已拒绝(2)/已打款(3)必已处理:旧数据 processed_at 为空时回退到 update_time(即处理时刻)
      render: (row) => {
        const done = Number(row.status) === 2 || Number(row.status) === 3;
        const t = row.processed_at || (done ? row.update_time : '');
        return <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{t || '—'}</span>;
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 余额概览 */}
      {wallet.error ? (
        <ErrorBar message={wallet.error} onRetry={wallet.reload} />
      ) : (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <StatCard
            label="可用余额"
            value={<Money amount={wallet.data ? wallet.data.balance : 0} strong />}
            icon="Zap"
            tone="success"
            sub="可申请提现的金额"
          />
          <StatCard
            label="冻结余额"
            value={<Money amount={wallet.data ? wallet.data.frozen_balance : 0} strong />}
            icon="Lock"
            tone="pending"
            sub="提现审核中暂被冻结"
          />
          <StatCard
            label="佣金费率"
            value={wallet.data ? `${(Number(wallet.data.commission_rate || 0) * 100).toFixed(2)}%` : '—'}
            icon="ShieldCheck"
            tone="brand"
            sub="平台按成交额抽取"
          />
          {wallet.data && Number(wallet.data.debt || 0) > 0 && (
            <StatCard
              label="未清偿负欠"
              value={<Money amount={wallet.data.debt} strong />}
              icon="AlertTriangle"
              tone="danger"
              sub="已提现订单被退款产生;清零前不可提现,后续入账将先抵扣"
            />
          )}
        </div>
      )}

      {/* 资金流水 */}
      <Panel
        title="资金流水"
        subtitle="收入为绿色(+),支出/冻结为红色(−)"
        actions={
          <Button variant="ghost" iconLeft={<Icons.RefreshCw />} onClick={logs.reload}>
            刷新
          </Button>
        }
      >
        <FilterTabs
          value={logType}
          onChange={setLogType}
          options={[{ value: '', label: '全部' }, ...Object.entries(FUND_TYPE).map(([k, v]) => ({ value: k, label: v.label }))]}
        />
        <DataTable
          columns={logColumns}
          rows={logRows}
          loading={logs.loading}
          error={logs.error}
          onReload={logs.reload}
          empty={logType === '' ? '暂无资金流水' : '当前类型暂无记录'}
          emptyIcon="Inbox"
        />
        <Pager total={logTotal} page={logPage} totalPages={logTotalPages} loading={logs.loading} onGo={goLogPage} />
      </Panel>

      {/* 提现记录 */}
      <Panel
        title="提现记录"
        actions={
          <Button onClick={openApply} iconLeft={<Icons.Zap />} disabled={wallet.loading || !!wallet.error}>
            申请提现
          </Button>
        }
      >
        <Toolbar right={<Button variant="ghost" iconLeft={<Icons.RefreshCw />} onClick={withdrawals.reload}>刷新</Button>}>
          可用余额 <Money amount={available} strong />
        </Toolbar>
        <FilterTabs
          value={wdStatus}
          onChange={setWdStatus}
          options={[{ value: '', label: '全部' }, ...Object.entries(WD_STATUS).map(([k, v]) => ({ value: k, label: v.label }))]}
        />
        <DataTable
          columns={wdColumns}
          rows={wdRows}
          loading={withdrawals.loading}
          error={withdrawals.error}
          onReload={withdrawals.reload}
          empty={wdStatus === '' ? '暂无提现记录' : '当前状态暂无记录'}
          emptyIcon="Inbox"
        />
        <Pager total={wdTotal} page={wdPage} totalPages={wdTotalPages} loading={withdrawals.loading} onGo={goWdPage} />
      </Panel>

      {/* 申请提现弹窗:第一步填表,第二步二次确认 */}
      <Modal
        open={open}
        title={confirming ? '确认提现申请' : '申请提现'}
        onClose={closeApply}
        footer={
          confirming ? (
            <>
              <Button variant="ghost" onClick={() => setConfirming(false)} disabled={saving}>
                返回修改
              </Button>
              <Button onClick={submitWithdrawal} loading={saving}>
                确认提交
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={closeApply} disabled={saving}>
                取消
              </Button>
              <Button onClick={reviewWithdrawal}>
                下一步
              </Button>
            </>
          )
        }
      >
        {formErr ? (
          <div style={{ marginBottom: 12 }}>
            <Pill tone="danger">{formErr}</Pill>
          </div>
        ) : null}

        {confirming ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>请核对以下信息后提交,提交后将冻结相应余额:</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--surface-subtle, #fafafa)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>提现金额</span>
              <Money amount={form.amount} strong />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--surface-subtle, #fafafa)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>收款方式</span>
              <span style={{ color: 'var(--text-strong)', fontWeight: 700 }}>{curMethod.label}</span>
            </div>
            <div style={{ padding: '10px 14px', background: 'var(--surface-subtle, #fafafa)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 4 }}>收款信息</div>
              <div style={{ color: 'var(--text-body)', wordBreak: 'break-all' }}>{composeAccountInfo(form)}</div>
            </div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
              当前可用余额 <Money amount={available} strong />
            </div>
            <Field label="提现金额" hint="必须大于 0 且不超过可用余额,最多两位小数">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                placeholder="0.00"
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </Field>
            <Field label="收款方式">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {PAY_METHODS.map((m) => (
                  <Button
                    key={m.value}
                    size="sm"
                    variant={form.method === m.value ? 'primary' : 'ghost'}
                    onClick={() => setForm((f) => ({ ...f, method: m.value }))}
                  >
                    {m.label}
                  </Button>
                ))}
              </div>
            </Field>
            <div style={{ marginTop: 12 }}>
              <Field label={`${curMethod.label}账号`} hint={curMethod.bank ? '请填写银行卡号' : '请填写收款账号'}>
                <Input
                  value={form.account}
                  maxLength={255}
                  placeholder={curMethod.bank ? '银行卡号' : `${curMethod.label}账号`}
                  onChange={(e) => setForm((f) => ({ ...f, account: e.target.value }))}
                />
              </Field>
            </div>
            <div style={{ marginTop: 12 }}>
              <Field label="收款户名">
                <Input
                  value={form.name}
                  maxLength={64}
                  placeholder="收款人姓名"
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </Field>
            </div>
            {curMethod.bank ? (
              <div style={{ marginTop: 12 }}>
                <Field label="开户行" hint="如:招商银行深圳分行">
                  <Input
                    value={form.bank}
                    maxLength={128}
                    placeholder="开户银行及支行"
                    onChange={(e) => setForm((f) => ({ ...f, bank: e.target.value }))}
                  />
                </Field>
              </div>
            ) : null}
          </>
        )}
      </Modal>
    </div>
  );
}

/* 类型/状态前端筛选标签组(复用 Orders 的按钮组写法,选中走 primary 橙色) */
function FilterTabs({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '0 16px 14px' }}>
      {options.map((o) => (
        <Button
          key={o.value === '' ? 'all' : o.value}
          size="sm"
          variant={String(value) === String(o.value) ? 'primary' : 'ghost'}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  );
}

/* 分页器:复用 Orders 的上一页/下一页写法 */
function Pager({ total, page, totalPages, loading, onGo }) {
  if (!total) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
      <span>共 {total} 条 · 第 {page}/{totalPages} 页</span>
      <Button size="sm" variant="ghost" disabled={page <= 1 || loading} onClick={() => onGo(page - 1)}>上一页</Button>
      <Button size="sm" variant="ghost" disabled={page >= totalPages || loading} onClick={() => onGo(page + 1)}>下一页</Button>
    </div>
  );
}
