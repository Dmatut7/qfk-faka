import React from 'react';
import { useAsync, Panel, Toolbar, DataTable, Money, Pill, StatCard, ErrorBar } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { ApiError } from '../api.js';
import { Button } from '../../../../design-system/components/core/Button.jsx';
import { Input } from '../../../../design-system/components/core/Input.jsx';

// 净额(应结商户)= 销售额 - 平台佣金。
// 两个加数均为后端返回的两位小数金额字符串,这里按分计算后再除回,避免浮点累计误差。
function netAmount(sales, commission) {
  const cents = (v) => Math.round(Number(v || 0) * 100);
  return (cents(sales) - cents(commission)) / 100;
}

export default function Settlement({ api, session }) {
  // 受控的时间范围输入;applied 才真正参与请求依赖,点查询时同步。
  const [start, setStart] = React.useState('');
  const [end, setEnd] = React.useState('');
  const [applied, setApplied] = React.useState({ start: '', end: '' });

  const report = useAsync(() => {
    const params = {};
    if (applied.start) params.start = applied.start;
    if (applied.end) params.end = applied.end;
    return api.settlementReport(params);
  }, [applied.start, applied.end]);

  const data = report.data || {};
  const total = data.total || {};
  const items = data.items || [];

  const totalSales = Number(total.sales || 0);
  const totalCommission = Number(total.commission || 0);
  const totalNet = netAmount(total.sales, total.commission);

  const onQuery = () => setApplied({ start: start.trim(), end: end.trim() });
  const onReset = () => {
    setStart('');
    setEnd('');
    setApplied({ start: '', end: '' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Toolbar
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" onClick={onReset} disabled={report.loading}>
              重置
            </Button>
            <Button onClick={onQuery} disabled={report.loading} icon={<Icons.Search />}>
              查询
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Icons.Clock />
          <Input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            placeholder="开始时间"
            aria-label="开始时间"
          />
          <span style={{ opacity: 0.6 }}>至</span>
          <Input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            placeholder="结束时间"
            aria-label="结束时间"
          />
          <Pill tone="neutral">
            {applied.start || applied.end
              ? `${applied.start || '不限'} ~ ${applied.end || '不限'}`
              : '全部时间'}
          </Pill>
        </div>
      </Toolbar>

      {report.error ? <ErrorBar error={report.error} onRetry={report.reload} /> : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        <StatCard
          label="总销售额"
          value={<Money amount={totalSales} strong />}
          icon="Zap"
          tone="brand"
          sub="已支付 + 已发货订单"
        />
        <StatCard
          label="总佣金"
          value={<Money amount={totalCommission} strong />}
          icon="ShieldCheck"
          tone="pending"
          sub="平台抽成合计"
        />
        <StatCard
          label="应结商户金额"
          value={<Money amount={totalNet} strong />}
          icon="Check"
          tone="success"
          sub="销售额 − 佣金"
        />
      </div>

      <Panel title="商户对账明细" subtitle="按商户分组的销售额、平台佣金与应结净额">
        <DataTable
          columns={[
            {
              key: 'merchant_id',
              title: '店铺',
              render: (r) => (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Icons.Package />
                  {'商户 #' + r.merchant_id}
                </span>
              ),
            },
            {
              key: 'sales',
              title: '销售额',
              align: 'right',
              render: (r) => <Money amount={Number(r.sales || 0)} strong />,
            },
            {
              key: 'commission',
              title: '佣金',
              align: 'right',
              render: (r) => <Money amount={Number(r.commission || 0)} />,
            },
            {
              key: 'net',
              title: '净额',
              align: 'right',
              render: (r) => <Money amount={netAmount(r.sales, r.commission)} strong />,
            },
          ]}
          rows={items}
          loading={report.loading}
          error={report.error}
          onReload={report.reload}
          empty="该时间范围内暂无对账数据"
        />
      </Panel>
    </div>
  );
}
