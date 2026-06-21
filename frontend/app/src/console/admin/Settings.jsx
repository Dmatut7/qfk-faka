import React from 'react';
import { useAsync, Panel, Toolbar, DataTable, Pill, Modal, Field } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { ApiError } from '../api.js';
import { Button } from '../../../../design-system/components/core/Button.jsx';
import { Input } from '../../../../design-system/components/core/Input.jsx';

export default function Settings({ api, session }) {
  // 后端 admin/System::settings 返回 { items: { setting_key: setting_value, ... } }
  // SettingService::all() 是 key=>value 映射;无独立“说明”字段,故仅渲染 key/value。
  const cfg = useAsync(() => api.settings(), []);

  // items 是对象映射,转成 [{ key, value }] 列表渲染
  const rows = React.useMemo(() => {
    const items = (cfg.data && cfg.data.items) || {};
    return Object.keys(items).map((k) => ({ key: k, value: items[k] }));
  }, [cfg.data]);

  const [editing, setEditing] = React.useState(null); // 正在编辑的配置项 { key, value }
  const [value, setValue] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [formErr, setFormErr] = React.useState('');

  function openEdit(row) {
    setEditing(row);
    setValue(row.value != null ? String(row.value) : '');
    setFormErr('');
  }

  async function submit() {
    if (!editing) return;
    setSaving(true);
    setFormErr('');
    try {
      await api.setSetting(editing.key, value);
      setEditing(null);
      cfg.reload();
    } catch (e) {
      setFormErr(e instanceof ApiError ? e.message : '保存失败,请重试');
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    {
      key: 'key',
      title: '配置项',
      width: 280,
      render: (row) => <code style={{ fontSize: 13 }}>{row.key}</code>,
    },
    {
      key: 'value',
      title: '当前值',
      render: (row) =>
        row.value == null || row.value === '' ? (
          <Pill tone="neutral">未设置</Pill>
        ) : (
          <span style={{ wordBreak: 'break-all' }}>{String(row.value)}</span>
        ),
    },
    {
      key: 'actions',
      title: '操作',
      width: 120,
      align: 'right',
      render: (row) => (
        <Button size="sm" variant="ghost" iconLeft={<Icons.Lock />} onClick={() => openEdit(row)}>
          编辑
        </Button>
      ),
    },
  ];

  return (
    <Panel title="平台配置" subtitle="读写平台 KV 配置项(setting_key / setting_value)">
      <Toolbar
        right={
          <Button variant="ghost" iconLeft={<Icons.RefreshCw />} onClick={cfg.reload}>
            刷新
          </Button>
        }
      >
        共 {rows.length} 项配置
      </Toolbar>

      <DataTable
        columns={columns}
        rows={rows}
        loading={cfg.loading}
        error={cfg.error}
        onReload={cfg.reload}
        empty="暂无平台配置项"
      />

      <Modal
        open={!!editing}
        title="编辑配置项"
        onClose={() => (saving ? null : setEditing(null))}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
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

        <Field label="配置项 Key" hint="setting_key,唯一标识,创建后不可修改">
          <Input value={editing ? editing.key : ''} disabled />
        </Field>
        <Field label="配置值 Value" hint="setting_value,留空表示置空(null)">
          <Input
            value={value}
            placeholder="配置值"
            onChange={(e) => setValue(e.target.value)}
          />
        </Field>
      </Modal>
    </Panel>
  );
}
