import React from 'react';
import { useAsync, Panel, Toolbar, DataTable, Pill, Modal, Field } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { ApiError } from '../api.js';
import { Button } from '../../../../design-system/components/core/Button.jsx';
import { Input } from '../../../../design-system/components/core/Input.jsx';

const STATUS_ENABLED = 1;
const STATUS_DISABLED = 0;

const emptyForm = {
  code: '',
  name: '',
  driver: 'epay',
  pid: '',
  key: '',
  gateway: '',
  sort: '0',
};

export default function Channels({ api, session }) {
  // 后端 AdminChannelService::list() 返回 { items: [...] };
  // 每项含 id/code/name/driver/status/sort/config(json)。
  const list = useAsync(() => api.channels(), []);
  const rows = (list.data && list.data.items) || [];

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null); // null=新建,否则为渠道行
  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [formErr, setFormErr] = React.useState('');

  const [statusBusy, setStatusBusy] = React.useState(null); // 正在启停的 id
  const [rowErr, setRowErr] = React.useState('');

  const [signFor, setSignFor] = React.useState(null); // 正在验签自测的渠道行
  const [signBusy, setSignBusy] = React.useState(false);
  const [signErr, setSignErr] = React.useState('');
  const [signResult, setSignResult] = React.useState(null); // { valid: bool }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormErr('');
    setOpen(true);
  }

  function openEdit(row) {
    const cfg = (row.config && typeof row.config === 'object') ? row.config : {};
    setEditing(row);
    setForm({
      code: row.code ?? '',
      name: row.name ?? '',
      driver: row.driver ?? 'epay',
      pid: cfg.pid != null ? String(cfg.pid) : '',
      key: cfg.key != null ? String(cfg.key) : '',
      gateway: cfg.gateway != null ? String(cfg.gateway) : '',
      sort: String(row.sort ?? 0),
    });
    setFormErr('');
    setOpen(true);
  }

  async function submit() {
    if (!editing && !form.code.trim()) {
      setFormErr('渠道 code 必填(2-32 字符)');
      return;
    }
    if (!form.name.trim()) {
      setFormErr('渠道名称必填');
      return;
    }
    if (!form.driver.trim()) {
      setFormErr('驱动 driver 必填');
      return;
    }
    if (!form.key.trim()) {
      // 后端 assertConfig 会拒绝空 key,前端先拦一道
      setFormErr('config.key(密钥)不能为空');
      return;
    }

    const config = { key: form.key.trim() };
    if (form.pid.trim() !== '') config.pid = form.pid.trim();
    if (form.gateway.trim() !== '') config.gateway = form.gateway.trim();

    setSaving(true);
    setFormErr('');
    try {
      if (editing) {
        await api.updateChannel(editing.id, {
          name: form.name.trim(),
          driver: form.driver.trim(),
          config,
          sort: Number(form.sort) || 0,
        });
      } else {
        await api.createChannel({
          code: form.code.trim(),
          name: form.name.trim(),
          driver: form.driver.trim(),
          config,
          sort: Number(form.sort) || 0,
        });
      }
      setOpen(false);
      list.reload();
    } catch (e) {
      setFormErr(e instanceof ApiError ? e.message : '保存失败,请重试');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(row) {
    const next = Number(row.status) === STATUS_ENABLED ? STATUS_DISABLED : STATUS_ENABLED;
    setStatusBusy(row.id);
    setRowErr('');
    try {
      await api.setChannelStatus(row.id, next);
      list.reload();
    } catch (e) {
      setRowErr(e instanceof ApiError ? e.message : '操作失败,请重试');
    } finally {
      setStatusBusy(null);
    }
  }

  async function openTestSign(row) {
    setSignFor(row);
    setSignErr('');
    setSignResult(null);
    setSignBusy(true);
    try {
      const res = await api.testSign(row.id);
      setSignResult(res || {});
    } catch (e) {
      setSignErr(e instanceof ApiError ? e.message : '验签自测失败,请重试');
    } finally {
      setSignBusy(false);
    }
  }

  const columns = [
    { key: 'sort', title: '排序', width: 72, align: 'right', render: (row) => row.sort },
    { key: 'name', title: '名称', render: (row) => row.name },
    {
      key: 'code',
      title: 'Code',
      width: 140,
      render: (row) => <code style={{ fontSize: 13 }}>{row.code}</code>,
    },
    {
      key: 'driver',
      title: '驱动',
      width: 120,
      render: (row) => <Pill tone="brand">{row.driver}</Pill>,
    },
    {
      key: 'status',
      title: '状态',
      width: 100,
      render: (row) =>
        Number(row.status) === STATUS_ENABLED ? (
          <Pill tone="success">启用</Pill>
        ) : (
          <Pill tone="neutral">停用</Pill>
        ),
    },
    {
      key: 'actions',
      title: '操作',
      width: 280,
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button size="sm" variant="ghost" iconLeft={<Icons.ShieldCheck />} onClick={() => openTestSign(row)}>
            验签自测
          </Button>
          <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>
            编辑
          </Button>
          <Button
            size="sm"
            variant="ghost"
            tone={Number(row.status) === STATUS_ENABLED ? 'danger' : undefined}
            loading={statusBusy === row.id}
            onClick={() => toggleStatus(row)}
          >
            {Number(row.status) === STATUS_ENABLED ? '停用' : '启用'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Panel
      title="支付渠道"
      subtitle="管理平台支付驱动、密钥配置与启停状态"
      actions={
        <Button onClick={openCreate} iconLeft={<Icons.Zap />}>
          新建渠道
        </Button>
      }
    >
      <Toolbar right={<Button variant="ghost" iconLeft={<Icons.RefreshCw />} onClick={list.reload}>刷新</Button>}>
        共 {rows.length} 个渠道
      </Toolbar>

      {rowErr ? (
        <div style={{ marginBottom: 12 }}>
          <Pill tone="danger">{rowErr}</Pill>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        rows={rows}
        loading={list.loading}
        error={list.error}
        onReload={list.reload}
        empty="暂无支付渠道,点击右上角新建"
      />

      {/* 新建 / 编辑 */}
      <Modal
        open={open}
        title={editing ? '编辑渠道' : '新建渠道'}
        onClose={() => (saving ? null : setOpen(false))}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              取消
            </Button>
            <Button onClick={submit} loading={saving}>
              保存
            </Button>
          </>
        }
      >
        {formErr ? (
          <div style={{ marginBottom: 12 }}>
            <Pill tone="danger">{formErr}</Pill>
          </div>
        ) : null}

        <Field label="渠道 Code" hint={editing ? 'Code 创建后不可修改' : '唯一标识,2-32 字符,如 epay'}>
          <Input
            value={form.code}
            maxLength={32}
            disabled={!!editing}
            placeholder="epay"
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
          />
        </Field>
        <Field label="渠道名称" hint="必填,最多 64 字">
          <Input
            value={form.name}
            maxLength={64}
            placeholder="如:易支付"
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </Field>
        <Field label="驱动 Driver" hint="支付驱动标识,如 epay">
          <Input
            value={form.driver}
            maxLength={64}
            placeholder="epay"
            onChange={(e) => setForm((f) => ({ ...f, driver: e.target.value }))}
          />
        </Field>
        <Field label="商户 PID" hint="config.pid,易支付商户号(可选)">
          <Input
            value={form.pid}
            placeholder="如:1000"
            onChange={(e) => setForm((f) => ({ ...f, pid: e.target.value }))}
          />
        </Field>
        <Field label="密钥 Key" hint="config.key,必填,空密钥会被后端拒绝">
          <Input
            value={form.key}
            placeholder="商户密钥"
            onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
          />
        </Field>
        <Field label="网关 Gateway" hint="config.gateway,支付网关地址(可选)">
          <Input
            value={form.gateway}
            placeholder="https://pay.example.com/submit.php"
            onChange={(e) => setForm((f) => ({ ...f, gateway: e.target.value }))}
          />
        </Field>
        <Field label="排序" hint="数字越小越靠前">
          <Input
            type="number"
            value={form.sort}
            onChange={(e) => setForm((f) => ({ ...f, sort: e.target.value }))}
          />
        </Field>
      </Modal>

      {/* 验签自测 */}
      <Modal
        open={!!signFor}
        title="验签自测"
        onClose={() => (signBusy ? null : setSignFor(null))}
        footer={
          <Button variant="ghost" onClick={() => setSignFor(null)} disabled={signBusy}>
            关闭
          </Button>
        }
      >
        <div style={{ marginBottom: 12 }}>
          渠道「{signFor?.name}」(<code>{signFor?.code}</code>)验签结果:
        </div>
        {signBusy ? (
          <Pill tone="pending">验签中…</Pill>
        ) : signErr ? (
          <Pill tone="danger">{signErr}</Pill>
        ) : signResult ? (
          signResult.valid ? (
            <Pill tone="success">验签通过(valid)</Pill>
          ) : (
            <Pill tone="danger">验签未通过(invalid)</Pill>
          )
        ) : null}
      </Modal>
    </Panel>
  );
}
