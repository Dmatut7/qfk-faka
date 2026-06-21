import React from 'react';
import { useAsync, Panel, Toolbar, DataTable, Pill, Modal, Field } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { ApiError } from '../api.js';
import { Button } from '../../../../design-system/components/core/Button.jsx';
import { Input } from '../../../../design-system/components/core/Input.jsx';

/* 邀请码状态:1 启用 / 0 停用(对齐 invite_codes.status) */
const STATUS = {
  1: { tone: 'success', label: '启用' },
  0: { tone: 'neutral', label: '停用' },
};

/* 已用 / 上限展示;max_uses=0 表示不限 */
function fmtUses(r) {
  const used = Number(r.used_count || 0);
  const max = Number(r.max_uses || 0);
  return max === 0 ? `${used} / 不限` : `${used} / ${max}`;
}

export default function InviteCodes({ api }) {
  const list = useAsync(() => api.inviteCodes(), []);
  const items = list.data?.items || list.data || [];

  const [showCreate, setShowCreate] = React.useState(false);
  const [busyId, setBusyId] = React.useState(null);

  const runAction = async (id, fn) => {
    setBusyId(id);
    try {
      await fn();
      list.reload();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : '操作失败,请重试');
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = (r) => {
    if (!window.confirm(`确认删除邀请码「${r.code}」?该操作不可撤销。`)) return;
    runAction(r.id, () => api.deleteInviteCode(r.id));
  };

  const columns = [
    {
      key: 'code', title: '邀请码', render: (r) => (
        <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: 'var(--text-strong)' }}>{r.code}</span>
      ),
    },
    {
      key: 'status', title: '状态', render: (r) => {
        const s = STATUS[r.status] || { tone: 'neutral', label: r.status };
        return <Pill tone={s.tone}>{s.label}</Pill>;
      },
    },
    {
      key: 'uses', title: '已用 / 上限', align: 'right',
      render: (r) => <span className="tnum" style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{fmtUses(r)}</span>,
    },
    {
      key: 'note', title: '备注', render: (r) => (
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.note || '—'}</span>
      ),
    },
    {
      key: 'create_time', title: '生成时间', render: (r) => (
        <span style={{ fontSize: 12.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{r.create_time || '—'}</span>
      ),
    },
    {
      key: 'ops', title: '操作', align: 'right', width: 1, render: (r) => {
        const busy = busyId === r.id;
        const used = Number(r.used_count || 0);
        return (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {r.status === 1 && (
              <Button size="sm" variant="secondary" loading={busy}
                iconLeft={<Icons.Lock size={14} />}
                onClick={() => runAction(r.id, () => api.disableInviteCode(r.id))}>停用</Button>
            )}
            <Button size="sm" variant="danger" loading={busy} disabled={used > 0}
              iconLeft={<Icons.X size={14} />}
              onClick={() => onDelete(r)}>删除</Button>
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Panel title="邀请码" subtitle="批量生成注册邀请码,控制商户自助开店准入" padded={false}>
        <div style={{ padding: 18 }}>
          <Toolbar right={
            <Button variant="secondary" size="sm" iconLeft={<Icons.RefreshCw size={15} />}
              onClick={list.reload}>刷新</Button>
          }>
            <Button variant="primary" size="sm" iconLeft={<Icons.ShieldCheck size={15} />}
              onClick={() => setShowCreate(true)}>生成邀请码</Button>
          </Toolbar>

          <DataTable
            columns={columns}
            rows={items}
            loading={list.loading}
            error={list.error}
            onReload={list.reload}
            empty="暂无邀请码"
            emptyIcon="Inbox"
          />
        </div>
      </Panel>

      {showCreate && (
        <CreateModal
          api={api}
          onClose={() => setShowCreate(false)}
          onCreated={() => list.reload()}
        />
      )}
    </div>
  );
}

/* 生成弹窗:数量 count + 备注 note + max_uses,生成后展示新码 */
function CreateModal({ api, onClose, onCreated }) {
  const [count, setCount] = React.useState('1');
  const [note, setNote] = React.useState('');
  const [maxUses, setMaxUses] = React.useState('1');
  const [err, setErr] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [created, setCreated] = React.useState(null); // 新生成的码列表

  const save = async () => {
    const c = Number(count);
    const m = Number(maxUses);
    if (!Number.isInteger(c) || c < 1) { setErr('生成数量须为不小于 1 的整数'); return; }
    if (!Number.isInteger(m) || m < 0) { setErr('使用上限须为不小于 0 的整数(0 表示不限)'); return; }
    setSaving(true); setErr('');
    try {
      const data = await api.createInviteCodes({ count: c, note: note.trim(), max_uses: m });
      const codes = (data?.items || data?.codes || (Array.isArray(data) ? data : []))
        .map((x) => (typeof x === 'string' ? x : x.code));
      setCreated(codes);
      onCreated();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : '生成失败,请重试');
    } finally {
      setSaving(false);
    }
  };

  if (created) {
    return (
      <Modal open title="邀请码已生成" onClose={onClose}
        footer={<Button variant="primary" size="sm" onClick={onClose}>完成</Button>}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
          共生成 {created.length} 个邀请码,请复制保存:
        </div>
        <div style={{
          maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6,
          padding: 12, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)',
        }}>
          {created.length === 0
            ? <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>已生成,请在列表查看。</span>
            : created.map((code, i) => (
              <code key={i} style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: 'var(--text-strong)', fontSize: 14 }}>{code}</code>
            ))}
        </div>
      </Modal>
    );
  }

  return (
    <Modal open title="生成邀请码" onClose={onClose}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>取消</Button>
          <Button variant="primary" size="sm" loading={saving} onClick={save}>生成</Button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="生成数量" hint="一次批量生成的随机码数量。">
          <Input value={count} inputMode="numeric" placeholder="1"
            onChange={(e) => { setCount(e.target.value); setErr(''); }} />
        </Field>
        <Field label="使用上限(max_uses)" hint="每个码可被使用的次数,0 表示不限。">
          <Input value={maxUses} inputMode="numeric" placeholder="1"
            onChange={(e) => { setMaxUses(e.target.value); setErr(''); }} />
        </Field>
        <Field label="备注(选填)" hint="便于区分用途,如「秋季推广」。">
          <Input value={note} placeholder="备注"
            onChange={(e) => { setNote(e.target.value); setErr(''); }} />
        </Field>
      </div>
      {err && (
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--danger-fg)' }}>{err}</div>
      )}
    </Modal>
  );
}
