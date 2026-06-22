import React from 'react';
import { useAsync, Panel, Toolbar, DataTable, Money, Pill, Modal, Field, StatCard, ErrorBar } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { ApiError } from '../api.js';
import { Button } from '../../../../design-system/components/core/Button.jsx';
import { Input } from '../../../../design-system/components/core/Input.jsx';

/* 商户状态:0 待审核 / 1 正常 / 2 冻结(对齐 app\model\Merchant) */
const STATUS = {
  0: { tone: 'pending', label: '待审核' },
  1: { tone: 'success', label: '正常' },
  2: { tone: 'danger', label: '冻结' },
};

function fmtRate(rate) {
  // commission_rate 为 0~1 的 DECIMAL(5,4) 字符串,展示为百分比
  const pct = Number(rate || 0) * 100;
  return `${pct.toFixed(2).replace(/\.?0+$/, '')}%`;
}

export default function Merchants({ api }) {
  const [keyword, setKeyword] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [query, setQuery] = React.useState({ keyword: '', status: '' });
  const [page, setPage] = React.useState(1);

  const list = useAsync(
    () => api.merchants({ keyword: query.keyword, status: query.status, page }),
    [query.keyword, query.status, page]
  );

  const items = list.data?.items || [];
  const total = list.data?.total || 0;
  const curPage = list.data?.page || page;

  const submitSearch = () => { setPage(1); setQuery({ keyword: keyword.trim(), status }); };

  // 行操作弹窗状态:{ type: 'commission'|'reset', row }
  const [dlg, setDlg] = React.useState(null);
  const [busyId, setBusyId] = React.useState(null);
  const [rowErr, setRowErr] = React.useState('');

  const runAction = async (id, fn) => {
    if (busyId) return; // 防跨行并发审批:已有进行中操作时直接忽略
    setBusyId(id);
    setRowErr('');
    try {
      await fn();
      list.reload();
    } catch (e) {
      setRowErr(e instanceof ApiError ? e.message : '操作失败,请重试');
    } finally {
      setBusyId(null);
    }
  };

  // 全局各状态计数(后端 list.data.status_counts);后端缺省时兜底退化为本页 reduce 口径
  const pageCounts = items.reduce((acc, m) => {
    acc[m.status] = (acc[m.status] || 0) + 1;
    return acc;
  }, {});
  const counts = list.data?.status_counts || pageCounts;
  // 商户总数:全局口径优先用各状态之和,否则用分页 total
  const hasGlobalCounts = !!list.data?.status_counts;
  const totalMerchants = hasGlobalCounts
    ? (counts[0] || 0) + (counts[1] || 0) + (counts[2] || 0)
    : total;

  const columns = [
    {
      key: 'store', title: '店铺 / 账号', render: (r) => (
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{r.store_name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            @{r.username}
            {r.store_slug ? <span style={{ color: 'var(--text-subtle)' }}> · /{r.store_slug}</span> : null}
          </div>
        </div>
      ),
    },
    {
      key: 'status', title: '状态', render: (r) => {
        const s = STATUS[r.status] || { tone: 'neutral', label: r.status };
        return <Pill tone={s.tone}>{s.label}</Pill>;
      },
    },
    { key: 'balance', title: '可提现余额', align: 'right', render: (r) => <Money amount={r.balance} strong /> },
    { key: 'frozen_balance', title: '冻结中', align: 'right', render: (r) => <Money amount={r.frozen_balance} /> },
    {
      key: 'commission_rate', title: '抽佣率', align: 'right',
      render: (r) => <span className="tnum" style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{fmtRate(r.commission_rate)}</span>,
    },
    {
      key: 'create_time', title: '注册时间', render: (r) => (
        <span style={{ fontSize: 12.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{r.create_time || '—'}</span>
      ),
    },
    {
      key: 'ops', title: '操作', align: 'right', width: 1, nowrap: true, render: (r) => {
        const busy = busyId === r.id;
        // 任一行操作进行中时,禁用所有行内按钮(防跨行并发审批)
        const otherBusy = busyId != null && busyId !== r.id;
        return (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {r.status === 0 && (
              <Button size="sm" variant="success" loading={busy} disabled={otherBusy}
                iconLeft={<Icons.Check size={15} />}
                onClick={() => runAction(r.id, () => api.approveMerchant(r.id))}>通过</Button>
            )}
            {r.status === 2 && (
              <Button size="sm" variant="secondary" loading={busy} disabled={otherBusy}
                iconLeft={<Icons.ShieldCheck size={15} />}
                onClick={() => runAction(r.id, () => api.unfreezeMerchant(r.id))}>解冻</Button>
            )}
            {r.status !== 2 && (
              <Button size="sm" variant="danger" loading={busy} disabled={otherBusy}
                iconLeft={<Icons.Lock size={15} />}
                onClick={() => runAction(r.id, () => api.freezeMerchant(r.id))}>冻结</Button>
            )}
            <Button size="sm" variant="neutral" disabled={busy || otherBusy}
              onClick={() => setDlg({ type: 'commission', row: r })}>改抽佣</Button>
            <Button size="sm" variant="ghost" disabled={busy || otherBusy}
              iconLeft={<Icons.Lock size={14} />}
              onClick={() => setDlg({ type: 'reset', row: r })}>重置密码</Button>
          </div>
        );
      },
    },
  ];

  const pages = Math.max(1, Math.ceil(total / 20));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <StatCard label="商户总数" value={totalMerchants} icon="Package" tone="brand" sub={`共 ${total} 家`} />
        <StatCard label="待审核" value={counts[0] || 0} icon="Clock" tone="pending" />
        <StatCard label="正常" value={counts[1] || 0} icon="ShieldCheck" tone="success" />
        <StatCard label="冻结" value={counts[2] || 0} icon="Lock" tone="danger" />
      </div>

      <Panel title="商户审核" subtitle="审核入驻、冻结/解冻、调整抽佣率与重置密码" padded={false}>
        <div style={{ padding: 18 }}>
          {rowErr ? (
            <div style={{ marginBottom: 12 }}>
              <ErrorBar message={rowErr} onClose={() => setRowErr('')} />
            </div>
          ) : null}
          <Toolbar right={
            <>
              <Button variant="primary" size="sm" iconLeft={<Icons.Plus size={15} />}
                onClick={() => setDlg({ type: 'create' })}>新建商户</Button>
              <Button variant="secondary" size="sm" iconLeft={<Icons.RefreshCw size={15} />}
                onClick={list.reload}>刷新</Button>
            </>
          }>
            <div style={{ width: 240 }}>
              <Input value={keyword} icon={<Icons.Search />} placeholder="店铺名 / 账号 / 邮箱"
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitSearch(); }} />
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              style={{
                height: 48, padding: '0 14px', borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--border-strong)', background: '#fff',
                color: 'var(--text-strong)', fontSize: 'var(--text-md)', fontFamily: 'inherit',
              }}>
              <option value="">全部状态</option>
              <option value="0">待审核</option>
              <option value="1">正常</option>
              <option value="2">冻结</option>
            </select>
            <Button variant="primary" size="sm" iconLeft={<Icons.Search size={15} />}
              onClick={submitSearch}>搜索</Button>
          </Toolbar>

          <DataTable
            columns={columns}
            rows={items}
            loading={list.loading}
            error={list.error}
            onReload={list.reload}
            empty="暂无符合条件的商户"
            emptyIcon="Inbox"
          />

          {total > 0 && pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
              <Button size="sm" variant="neutral" disabled={curPage <= 1 || list.loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}>上一页</Button>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>第 {curPage} / {pages} 页</span>
              <Button size="sm" variant="neutral" disabled={curPage >= pages || list.loading}
                onClick={() => setPage((p) => p + 1)}>下一页</Button>
            </div>
          )}
        </div>
      </Panel>

      {dlg?.type === 'create' && (
        <NewMerchantModal
          api={api}
          onClose={() => setDlg(null)}
          onSaved={() => { setDlg(null); list.reload(); }}
        />
      )}
      {dlg?.type === 'commission' && (
        <CommissionModal
          row={dlg.row}
          api={api}
          onClose={() => setDlg(null)}
          onSaved={() => { setDlg(null); list.reload(); }}
        />
      )}
      {dlg?.type === 'reset' && (
        <ResetPasswordModal
          row={dlg.row}
          api={api}
          onClose={() => setDlg(null)}
          onSaved={() => { setDlg(null); list.reload(); }}
        />
      )}
    </div>
  );
}

/* 新建商户弹窗:后端 create 校验 username(3~64)/password(min:6)/store_name/store_slug(alphaDash);commission_rate 可选(0~1) */
function NewMerchantModal({ api, onClose, onSaved }) {
  const [form, setForm] = React.useState({
    username: '', password: '', store_name: '', store_slug: '', commission_rate: '',
  });
  const [err, setErr] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErr(''); };

  const save = async () => {
    const username = form.username.trim();
    const store_name = form.store_name.trim();
    const store_slug = form.store_slug.trim();
    const rate = form.commission_rate.trim();
    if (username.length < 3 || username.length > 64) { setErr('用户名须为 3~64 个字符'); return; }
    if (form.password.length < 6) { setErr('密码至少 6 位'); return; }
    if (!store_name) { setErr('请填写店名'); return; }
    if (!/^[A-Za-z0-9_-]+$/.test(store_slug)) { setErr('店铺标识只能是字母/数字/下划线/破折号'); return; }
    if (rate && (!/^\d(\.\d{1,4})?$/.test(rate) || Number(rate) < 0 || Number(rate) > 1)) {
      setErr('抽佣比例须为 0~1 之间的小数(最多 4 位)'); return;
    }
    const payload = { username, password: form.password, store_name, store_slug };
    if (rate) payload.commission_rate = rate;
    setSaving(true); setErr('');
    try {
      await api.createMerchant(payload);
      onSaved();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : '创建失败,请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open title="新建商户" onClose={onClose}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>取消</Button>
          <Button variant="primary" size="sm" loading={saving} onClick={save}>创建</Button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="用户名" hint="3~64 个字符,商户登录账号">
          <Input value={form.username} placeholder="商户登录账号"
            onChange={set('username')} />
        </Field>
        <Field label="密码" hint="至少 6 位">
          <Input type="password" value={form.password} placeholder="至少 6 位"
            onChange={set('password')} />
        </Field>
        <Field label="店名">
          <Input value={form.store_name} placeholder="对外展示的店铺名称"
            onChange={set('store_name')} />
        </Field>
        <Field label="店铺标识(slug)" hint="字母/数字/下划线/破折号,用于店铺访问路径">
          <Input value={form.store_slug} placeholder="例:my-shop"
            onChange={set('store_slug')} />
        </Field>
        <Field label="初始抽佣率(0~1,可选)" hint="例:0.05 表示抽佣 5%;留空则用平台默认值">
          <Input value={form.commission_rate} placeholder="0.0500" inputMode="decimal"
            error={err || undefined}
            onChange={set('commission_rate')}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); }} />
        </Field>
      </div>
    </Modal>
  );
}

/* 改抽佣弹窗:输入 0~1 的小数比例(后端 setCommission 校验 0~1) */
function CommissionModal({ row, api, onClose, onSaved }) {
  const [rate, setRate] = React.useState(String(row.commission_rate ?? ''));
  const [err, setErr] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    const v = rate.trim();
    if (!/^\d(\.\d{1,4})?$/.test(v) || Number(v) < 0 || Number(v) > 1) {
      setErr('抽佣比例须为 0~1 之间的小数(最多 4 位)');
      return;
    }
    setSaving(true); setErr('');
    try {
      await api.setCommission(row.id, v);
      onSaved();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : '保存失败,请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open title={`调整抽佣率 · ${row.store_name}`} onClose={onClose}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>取消</Button>
          <Button variant="primary" size="sm" loading={saving} onClick={save}>保存</Button>
        </>
      }>
      <Field label="抽佣比例(0~1)" hint={`例:0.05 表示抽佣 5%。当前 ${fmtRate(row.commission_rate)}`}>
        <Input value={rate} placeholder="0.0500" inputMode="decimal"
          error={err || undefined}
          onChange={(e) => { setRate(e.target.value); setErr(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); }} />
      </Field>
    </Modal>
  );
}

/* 重置密码弹窗:后端要求 min:6 */
function ResetPasswordModal({ row, api, onClose, onSaved }) {
  const [pwd, setPwd] = React.useState('');
  const [err, setErr] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    if (pwd.length < 6) { setErr('新密码至少 6 位'); return; }
    setSaving(true); setErr('');
    try {
      await api.resetMerchantPassword(row.id, pwd);
      onSaved();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : '重置失败,请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open title={`重置密码 · ${row.store_name}`} onClose={onClose}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>取消</Button>
          <Button variant="danger" size="sm" loading={saving} onClick={save}>确认重置</Button>
        </>
      }>
      <Field label="新密码" hint="重置后该商户的全部登录令牌将被吊销,需重新登录。">
        <Input type="password" value={pwd} placeholder="至少 6 位"
          error={err || undefined}
          onChange={(e) => { setPwd(e.target.value); setErr(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); }} />
      </Field>
    </Modal>
  );
}
