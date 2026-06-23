import React from 'react';
import { Panel, DataTable, Pill } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';

/* 任务计划:对标鲸发卡「任务计划」。
   只读信息表,列出系统内置的定时任务命令(以 config/console.php 与 app/command/* 为准):
     - order:clean      回收过期未支付订单
     - stock:reconcile  库存/资金对账
     - db:seed          幂等创建演示数据
   不伪造「上次执行时间 / 状态」等无真实数据来源的字段。 */
export default function CronJobs() {
  const jobs = [
    {
      id: 'order-clean',
      name: '过期订单回收',
      command: 'order:clean',
      purpose: '回收过期未支付订单:关单 + 释放锁定卡密 + 回补库存',
      freq: '每分钟',
      manual: 'php think order:clean',
    },
    {
      id: 'stock-reconcile',
      name: '库存资金对账',
      command: 'stock:reconcile',
      purpose: '重算各商品在售库存,核对资金流水与余额差异',
      freq: '每小时',
      manual: 'php think stock:reconcile',
    },
    {
      id: 'db-seed',
      name: '演示数据初始化',
      command: 'db:seed',
      purpose: '幂等地创建演示数据(管理员 / 支付渠道 / 商户 / 商品 / 卡密)',
      freq: '手动 / 按需',
      manual: 'php think db:seed',
    },
  ];

  const columns = [
    {
      key: 'name', title: '任务',
      render: (r) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 30, height: 30, flex: 'none', borderRadius: 8,
            background: 'var(--brand-soft)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icons.RefreshCw size={15} color="var(--brand)" />
          </span>
          <span style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{r.name}</span>
        </span>
      ),
    },
    {
      key: 'command', title: '命令',
      render: (r) => <code style={codeStyle}>php think {r.command}</code>,
    },
    {
      key: 'purpose', title: '用途',
      render: (r) => <span style={{ color: 'var(--text-body)' }}>{r.purpose}</span>,
    },
    {
      key: 'freq', title: '建议频率', align: 'center',
      render: (r) => <Pill tone="brand">{r.freq}</Pill>,
    },
    {
      key: 'manual', title: '手动执行', width: 220,
      render: (r) => <code style={codeStyle}>{r.manual}</code>,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 说明横幅 */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '12px 14px', borderRadius: 'var(--radius-md)',
        background: 'var(--pending-bg)', border: '1px solid var(--pending-border, var(--pending-fg))',
        color: 'var(--pending-fg)', fontSize: 13, lineHeight: 1.6,
      }}>
        <Icons.AlertTriangle size={18} color="var(--pending-fg)" style={{ flex: 'none', marginTop: 1 }} />
        <span>
          以下为系统内置计划任务,需在服务器配置 <strong>crontab</strong> 定时调用
          <code style={{ ...codeStyle, margin: '0 4px' }}>php think &lt;命令&gt;</code>
          才会自动运行。本页为只读说明,不在此处触发或调度任务。
        </span>
      </div>

      <Panel title="系统定时任务" subtitle="内置命令清单 · 以 config/console.php 与 app/command 为准" padded={false}>
        <DataTable columns={columns} rows={jobs} rowKey="id" />
      </Panel>

      {/* crontab 配置示例 */}
      <Panel title="crontab 配置示例" subtitle="将以下条目加入服务器 crontab(频率以实际运维需求为准)">
        <pre style={{
          margin: 0, padding: '14px 16px', borderRadius: 'var(--radius-md)',
          background: 'var(--surface-sunken)', border: '1px solid var(--border)',
          color: 'var(--text-body)', fontSize: 12.5, lineHeight: 1.7, overflowX: 'auto',
          fontFamily: 'var(--font-mono, ui-monospace, monospace)', whiteSpace: 'pre',
        }}>
{`* * * * *   cd /path/to/qfk && php think order:clean      >> /dev/null 2>&1
0 * * * *   cd /path/to/qfk && php think stock:reconcile  >> /dev/null 2>&1`}
        </pre>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
          db:seed 仅用于初始化演示数据,通常手动执行,不建议加入 crontab。
        </div>
      </Panel>
    </div>
  );
}

const codeStyle = {
  display: 'inline-block', padding: '2px 8px', borderRadius: 6,
  background: 'var(--surface-sunken)', border: '1px solid var(--border)',
  color: 'var(--text-strong)', fontSize: 12.5,
  fontFamily: 'var(--font-mono, ui-monospace, monospace)', whiteSpace: 'nowrap',
};
