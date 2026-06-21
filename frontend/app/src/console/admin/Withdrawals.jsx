import React from 'react';
import { useAsync, Panel, Toolbar, DataTable, Money, Pill, Modal, Field, StatCard, ErrorBar } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { ApiError } from '../api.js';
import { Button } from '../../../../design-system/components/core/Button.jsx';
import { Input } from '../../../../design-system/components/core/Input.jsx';

// 提现状态(Withdrawal::STATUS_*)
const WD_STATUS = {
  0: { label: '待审核', tone: 'pending' },
  1: { label: '已通过', tone: 'brand' },
  2: { label: '已拒绝', tone: 'danger' },
  3: { label: '已打款', tone: 'success' },
};

// 状态筛选项('' = 全部);与 Withdrawal 模型状态机一致(0待审/1通过/2拒绝/3已打款)
const STATUS_FILTERS = [
  { value: '', label: '全部' },
  { value: '0', label: '待审核' },
  { value: '1', label: '已通过' },
  { value: '3', label: '已打款' },
  { value: '2', label: '已拒绝' },
];

function statusPill(status) {
  const s = WD_STATUS[status] || { label: '未知', tone: 'neutral' };
  return <Pill tone={s.tone}>{s.label}</Pill>;
}

const PAGE_SIZE = 20;

export default function Withdrawals({ api, session }) {
  const [status, setStatus] = React.useState('0'); // 默认聚焦待审核
  const [merchantId, setMerchantId] = React.useState('');
  const [wdPage, setWdPage] = React.useState(1);

  // 切换状态 / 商户筛选时回到第 1 页
  React.useEffect(() => { setWdPage(1); }, [status, merchantId]);

  // 真实列表:{ total, page, items[] }
  const list = useAsync(
    () => api.withdrawals({ status, ...(merchantId.trim() ? { merchant_id: merchantId.trim() } : {}), page: wdPage }),
    [status, merchantId, wdPage]
  );

  const rows = list.data?.items || [];
  const total = list.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const goPage = (p) => setWdPage(Math.min(Math.max(1, p), totalPages));

  // 审批/拒绝成功后重载当前页;若该页因数量变化越界则回退到有效页
  function reloadAfterMutate() {
    const nextTotalPages = Math.max(1, Math.ceil(Math.max(0, total - 1) / PAGE_SIZE));
    if (wdPage > nextTotalPages) setWdPage(nextTotalPages);
    else list.reload();
  }

  // 行内操作错误提示
  const [rowErr, setRowErr] = React.useState('');
  // 正在处理的提现单 id(按钮 loading 与防重复)
  const [busyId, setBusyId] = React.useState(null);

  // 拒绝 Modal 状态
  const [rejecting, setRejecting] = React.useState(null); // 当前要拒绝的提现单
  const [reason, setReason] = React.useState('');
  const [rejectErr, setRejectErr] = React.useState('');
  const [rejectSaving, setRejectSaving] = React.useState(false);

  // 通过 = 扣冻结 + 视为打款(frozen-=A,balance 不动)
  async function approve(row) {
    if (busyId) return;
    setRowErr('');
    setBusyId(row.id);
    try {
      await api.approveWithdrawal(row.id);
      reloadAfterMutate();
    } catch (e) {
      setRowErr(e instanceof ApiError ? e.message : '审核打款失败,请重试');
    } finally {
      setBusyId(null);
    }
  }

  function openReject(row) {
    setRejecting(row);
    setReason('');
    setRejectErr('');
  }

  // 拒绝 = 解冻退回可用(frozen-=A、balance+=A,记 +A 退回流水)
  async function submitReject() {
    if (!rejecting) return;
    const r = reason.trim();
    if (!r) {
      setRejectErr('请填写拒绝原因');
      return;
    }
    setRejectSaving(true);
    setRejectErr('');
    try {
      await api.rejectWithdrawal(rejecting.id, { reason: r });
      setRejecting(null);
      reloadAfterMutate();
    } catch (e) {
      setRejectErr(e instanceof ApiError ? e.message : '拒绝失败,请重试');
    } finally {
      setRejectSaving(false);
    }
  }

  // 概览:待审核笔数与待审核金额合计(仅当前页可见行,以后端列表为准)
  const pendingRows = rows.filter((r) => Number(r.status) === 0);
  const pendingCount = pendingRows.length;
  // 金额按整数分累加再除回,避免浮点累计误差
  const pendingSum = pendingRows.reduce((acc, r) => acc + Math.round(Number(r.amount || 0) * 100), 0) / 100;

  const columns = [
    { key: 'id', title: '单号', width: 80, render: (r) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>#{r.id}</span> },
    { key: 'merchant_id', title: '商户', render: (r) => <span>商户 #{r.merchant_id}</span> },
    {
      key: 'amount',
      title: '提现金额',
      align: 'right',
      render: (r) => <Money amount={r.amount} strong />,
    },
    {
      key: 'fee',
      title: '手续费',
      align: 'right',
      render: (r) => <Money amount={r.fee} />,
    },
    {
      key: 'account_info',
      title: '收款信息',
      render: (r) => <span style={{ wordBreak: 'break-all' }}>{r.account_info || '—'}</span>,
    },
    { key: 'create_time', title: '申请时间', render: (r) => <span>{r.create_time || '—'}</span> },
    { key: 'processed_at', title: '处理时间', render: (r) => <span>{r.processed_at || '—'}</span> },
    { key: 'status', title: '状态', render: (r) => statusPill(r.status) },
    {
      key: 'ops',
      title: '操作',
      align: 'right',
      render: (r) =>
        Number(r.status) === 0 ? (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button
              size="sm"
              iconLeft={<Icons.Check />}
              loading={busyId === r.id}
              disabled={busyId != null && busyId !== r.id}
              onClick={() => approve(r)}
            >
              通过打款
            </Button>
            <Button
              size="sm"
              variant="danger"
              iconLeft={<Icons.AlertTriangle />}
              disabled={busyId != null}
              onClick={() => openReject(r)}
            >
              拒绝
            </Button>
          </div>
        ) : (
          <span style={{ color: 'var(--color-text-muted)' }}>已处理</span>
        ),
    },
  ];

  return (
    <Panel
      title="提现审核"
      subtitle="审核商户提现申请;通过=扣减冻结并打款,拒绝=解冻退回商户可用余额"
    >
      {/* 概览(当前列表中的待审核情况) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
        <StatCard
          label="当前待审核笔数"
          value={pendingCount}
          icon="Clock"
          tone="pending"
          sub="仅统计本页可见的待审核单"
        />
        <StatCard
          label="待审核金额合计"
          value={<Money amount={pendingSum} strong />}
          icon="ShieldCheck"
          tone="brand"
          sub="通过后将从冻结余额中打款"
        />
      </div>

      <Toolbar
        right={
          <Button variant="ghost" iconLeft={<Icons.RefreshCw />} onClick={list.reload}>
            刷新
          </Button>
        }
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {STATUS_FILTERS.map((f) => (
              <Button
                key={f.value}
                size="sm"
                variant={status === f.value ? 'primary' : 'ghost'}
                onClick={() => setStatus(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>
          <div style={{ width: 180 }}>
            <Input
              placeholder="按商户ID筛选"
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              icon={<Icons.Search />}
            />
          </div>
          <span style={{ color: 'var(--color-text-muted)' }}>共 {total} 笔</span>
        </div>
      </Toolbar>

      {rowErr ? (
        <div style={{ marginBottom: 12 }}>
          <ErrorBar message={rowErr} onClose={() => setRowErr('')} />
        </div>
      ) : null}

      <DataTable
        columns={columns}
        rows={rows}
        loading={list.loading}
        error={list.error}
        onReload={list.reload}
        empty="暂无提现申请"
      />

      <Pager total={total} page={wdPage} totalPages={totalPages} loading={list.loading} onGo={goPage} />

      {/* 拒绝 Modal:填原因 → 解冻退回 */}
      <Modal
        open={rejecting != null}
        title="拒绝提现申请"
        onClose={() => (rejectSaving ? null : setRejecting(null))}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejecting(null)} disabled={rejectSaving}>
              取消
            </Button>
            <Button variant="danger" onClick={submitReject} loading={rejectSaving} iconLeft={<Icons.AlertTriangle />}>
              确认拒绝并退回
            </Button>
          </>
        }
      >
        {rejecting ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
              拒绝后将把冻结的{' '}
              <Money amount={rejecting.amount} strong /> 解冻退回商户 #{rejecting.merchant_id} 的可用余额,并记录一条退回流水。
            </div>
            {rejectErr ? <ErrorBar message={rejectErr} onClose={() => setRejectErr('')} /> : null}
            <Field label="拒绝原因" hint="将记录在退回备注中">
              <Input
                placeholder="例如:收款账户信息不完整"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                autoFocus
              />
            </Field>
          </div>
        ) : null}
      </Modal>
    </Panel>
  );
}

/* 分页器:与 Wallet 的 Pager 写法一致(上一页/下一页) */
function Pager({ total, page, totalPages, loading, onGo }) {
  if (!total) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '12px 16px', fontSize: 13, color: 'var(--color-text-muted)' }}>
      <span>共 {total} 条 · 第 {page}/{totalPages} 页</span>
      <Button size="sm" variant="ghost" disabled={page <= 1 || loading} onClick={() => onGo(page - 1)}>上一页</Button>
      <Button size="sm" variant="ghost" disabled={page >= totalPages || loading} onClick={() => onGo(page + 1)}>下一页</Button>
    </div>
  );
}
