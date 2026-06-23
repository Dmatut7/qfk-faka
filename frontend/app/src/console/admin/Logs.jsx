import React from 'react';
import { useAsync, Panel, Toolbar, DataTable, Pill } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { Button } from '../../../../design-system/components/core/Button.jsx';

/* 级别 → 药丸色调(error 红 / warning 琥珀 / info 灰) */
const LEVEL = {
  error: { tone: 'danger', label: '错误' },
  warning: { tone: 'pending', label: '警告' },
  info: { tone: 'neutral', label: '信息' },
};

/* 常见日志类型(对齐 system_logs.type) */
const TYPES = [
  'pay_verify_fail',
  'settle_exception',
  'stock_not_enough',
  'withdraw_approve',
  'withdraw_reject',
  'login_fail',
];

/* 类型 → 中文标签 + 语义色调(异常红/橙,操作类绿/中性);避免裸英文枚举误读 */
const TYPE_LABELS = {
  pay_verify_fail:  { label: '支付验签失败', tone: 'danger' },
  settle_exception: { label: '结算异常', tone: 'danger' },
  stock_not_enough: { label: '库存不足', tone: 'pending' },
  login_fail:       { label: '登录失败', tone: 'pending' },
  withdraw_approve: { label: '提现打款', tone: 'success' },
  withdraw_reject:  { label: '驳回提现', tone: 'neutral' },
};

const PAGE_SIZE = 20;

const selectStyle = {
  height: 48, padding: '0 14px', borderRadius: 'var(--radius-md)',
  border: '1.5px solid var(--border-strong)', background: '#fff',
  color: 'var(--text-strong)', fontSize: 'var(--text-md)', fontFamily: 'inherit',
};

export default function Logs({ api }) {
  const [type, setType] = React.useState('');
  const [level, setLevel] = React.useState('');
  const [query, setQuery] = React.useState({ type: '', level: '' });
  const [page, setPage] = React.useState(1);

  const list = useAsync(
    () => api.logs({ type: query.type, level: query.level, page }),
    [query.type, query.level, page]
  );

  const items = list.data?.items || [];
  const total = list.data?.total || 0;
  const curPage = list.data?.page || page;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const submitSearch = () => {
    setPage(1);
    setQuery({ type, level });
  };

  const columns = [
    {
      key: 'create_time', title: '时间', render: (r) => (
        <span style={{ fontSize: 12.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{r.create_time || '—'}</span>
      ),
    },
    {
      key: 'type', title: '类型', render: (r) => {
        const m = TYPE_LABELS[r.type] || { label: r.type, tone: 'neutral' };
        return <Pill tone={m.tone}>{m.label}</Pill>;
      },
    },
    {
      key: 'level', title: '级别', render: (r) => {
        const l = LEVEL[r.level] || { tone: 'neutral', label: r.level };
        return <Pill tone={l.tone}>{l.label}</Pill>;
      },
    },
    {
      key: 'order_no', title: '订单号', render: (r) => (
        <span className="tnum" style={{ fontSize: 12.5, color: 'var(--text-body)' }}>{r.order_no || '—'}</span>
      ),
    },
    {
      key: 'message', title: '消息', render: (r) => (
        <span style={{ color: 'var(--text-strong)' }}>{r.message || '—'}</span>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Panel title="异常日志" subtitle="平台系统日志:支付验签 / 结算 / 库存 / 登录异常,及提现打款等关键操作留痕,按类型 / 级别筛选" padded={false}>
        <div style={{ padding: 18 }}>
          <Toolbar right={
            <Button variant="secondary" size="sm" iconLeft={<Icons.RefreshCw size={15} />}
              onClick={list.reload}>刷新</Button>
          }>
            <select value={type} onChange={(e) => setType(e.target.value)} style={selectStyle}>
              <option value="">全部类型</option>
              {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]?.label || t}</option>)}
            </select>
            <select value={level} onChange={(e) => setLevel(e.target.value)} style={selectStyle}>
              <option value="">全部级别</option>
              <option value="error">错误</option>
              <option value="warning">警告</option>
              <option value="info">信息</option>
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
            empty="暂无符合条件的日志"
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
    </div>
  );
}
