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

const emptyForm = { amount: '', account_info: '' };

const PAGE_SIZE = 20;

export default function Wallet({ api, session }) {
  const [logPage, setLogPage] = React.useState(1);
  const [wdPage, setWdPage] = React.useState(1);

  const wallet = useAsync(() => api.wallet(), []);
  const logs = useAsync(() => api.fundLogs({ page: logPage }), [logPage]);
  const withdrawals = useAsync(() => api.withdrawals({ page: wdPage }), [wdPage]);

  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [formErr, setFormErr] = React.useState('');

  // 可用余额(用于前端校验上限,后端仍是权威)
  const available = wallet.data ? String(wallet.data.balance ?? '0') : '0';

  function openApply() {
    setForm(emptyForm);
    setFormErr('');
    setOpen(true);
  }

  async function submitWithdrawal() {
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
    if (!form.account_info.trim()) {
      setFormErr('请填写收款信息');
      return;
    }
    setSaving(true);
    setFormErr('');
    try {
      await api.applyWithdrawal({ amount: raw, account_info: form.account_info.trim() });
      setOpen(false);
      // 提现冻结余额、生成流水与提现单,三处一并刷新;回到第 1 页以便看到最新记录
      wallet.reload();
      if (logPage === 1) logs.reload(); else setLogPage(1);
      if (wdPage === 1) withdrawals.reload(); else setWdPage(1);
    } catch (e) {
      setFormErr(e instanceof ApiError ? e.message : '申请失败,请重试');
    } finally {
      setSaving(false);
    }
  }

  const logRows = (logs.data && logs.data.items) || [];
  const wdRows = (withdrawals.data && withdrawals.data.items) || [];
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
      render: (row) => <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{row.processed_at || '—'}</span>,
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
        <DataTable
          columns={logColumns}
          rows={logRows}
          loading={logs.loading}
          error={logs.error}
          onReload={logs.reload}
          empty="暂无资金流水"
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
        <DataTable
          columns={wdColumns}
          rows={wdRows}
          loading={withdrawals.loading}
          error={withdrawals.error}
          onReload={withdrawals.reload}
          empty="暂无提现记录"
          emptyIcon="Inbox"
        />
        <Pager total={wdTotal} page={wdPage} totalPages={wdTotalPages} loading={withdrawals.loading} onGo={goWdPage} />
      </Panel>

      {/* 申请提现弹窗 */}
      <Modal
        open={open}
        title="申请提现"
        onClose={() => (saving ? null : setOpen(false))}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              取消
            </Button>
            <Button onClick={submitWithdrawal} loading={saving}>
              提交申请
            </Button>
          </>
        }
      >
        {formErr ? (
          <div style={{ marginBottom: 12 }}>
            <Pill tone="danger">{formErr}</Pill>
          </div>
        ) : null}
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
        <Field label="收款信息" hint="如:支付宝账号 / 银行卡号及户名(最多 255 字)">
          <Input
            value={form.account_info}
            maxLength={255}
            placeholder="收款账户信息"
            onChange={(e) => setForm((f) => ({ ...f, account_info: e.target.value }))}
          />
        </Field>
      </Modal>
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
