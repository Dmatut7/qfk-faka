import React from 'react';
import { useAsync, Panel, Toolbar, DataTable, Pill, Modal, Field } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { ApiError } from '../api.js';
import { Button } from '../../../../design-system/components/core/Button.jsx';
import { Input } from '../../../../design-system/components/core/Input.jsx';

const STATUS_SHOWN = 1;
const STATUS_HIDDEN = 0;

const emptyForm = { name: '', image: '', sort: '0', status: STATUS_SHOWN };

export default function Categories({ api, session }) {
  const list = useAsync(() => api.categories(), []);

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null); // null=新建,否则为行对象
  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [formErr, setFormErr] = React.useState('');

  const [removing, setRemoving] = React.useState(null); // 待删除行
  const [delErr, setDelErr] = React.useState('');
  const [delBusy, setDelBusy] = React.useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormErr('');
    setOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      name: row.name ?? '',
      image: row.image ?? '',
      sort: String(row.sort ?? 0),
      status: Number(row.status),
    });
    setFormErr('');
    setOpen(true);
  }

  async function submit() {
    if (!form.name.trim()) {
      setFormErr('分类名必填');
      return;
    }
    setSaving(true);
    setFormErr('');
    const payload = {
      name: form.name.trim(),
      image: form.image.trim(),
      sort: Number(form.sort) || 0,
      status: Number(form.status),
    };
    try {
      if (editing) {
        await api.updateCategory(editing.id, payload);
      } else {
        await api.createCategory(payload);
      }
      setOpen(false);
      list.reload();
    } catch (e) {
      setFormErr(e instanceof ApiError ? e.message : '保存失败,请重试');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!removing) return;
    setDelBusy(true);
    setDelErr('');
    try {
      await api.deleteCategory(removing.id);
      setRemoving(null);
      list.reload();
    } catch (e) {
      setDelErr(e instanceof ApiError ? e.message : '删除失败,请重试');
    } finally {
      setDelBusy(false);
    }
  }

  const columns = [
    { key: 'sort', title: '排序', width: 80, align: 'right', render: (row) => row.sort },
    {
      key: 'image',
      title: '分类图',
      width: 72,
      render: (row) => row.image
        ? <div aria-label="分类图" style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'var(--surface-sunken)', backgroundImage: `url("${row.image}")`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />
        : <span style={{ color: 'var(--text-subtle)', fontSize: 12 }}>—</span>,
    },
    { key: 'name', title: '分类名', render: (row) => row.name },
    {
      key: 'status',
      title: '状态',
      width: 100,
      render: (row) =>
        Number(row.status) === STATUS_SHOWN ? (
          <Pill tone="success">显示</Pill>
        ) : (
          <Pill tone="neutral">隐藏</Pill>
        ),
    },
    {
      key: 'actions',
      title: '操作',
      width: 160,
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>
            编辑
          </Button>
          <Button size="sm" variant="danger" onClick={() => { setDelErr(''); setRemoving(row); }}>
            删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Panel
      title="分类管理"
      subtitle="管理本店商品分类的展示顺序与可见性"
      actions={
        <Button onClick={openCreate} iconLeft={<Icons.Package />}>
          新建分类
        </Button>
      }
    >
      <Toolbar right={<Button variant="ghost" iconLeft={<Icons.RefreshCw />} onClick={list.reload}>刷新</Button>}>
        共 {(list.data || []).length} 个分类
      </Toolbar>

      <DataTable
        columns={columns}
        rows={list.data || []}
        loading={list.loading}
        error={list.error}
        onReload={list.reload}
        empty="暂无分类,点击右上角新建"
      />

      <Modal
        open={open}
        title={editing ? '编辑分类' : '新建分类'}
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
        <Field label="分类名" hint="必填,最多 64 字">
          <Input
            value={form.name}
            maxLength={64}
            placeholder="如:游戏点卡"
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </Field>
        <Field label="分类图(选填)" hint="图片 URL,显示在店铺分类 Tab;留空则不显示">
          <Input
            value={form.image}
            placeholder="https://…/category.png"
            onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
          />
          {form.image.trim() ? (
            <img src={form.image.trim()} alt="" style={{ marginTop: 8, width: 56, height: 56, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--border)' }} />
          ) : null}
        </Field>
        <Field label="排序" hint="数字越小越靠前">
          <Input
            type="number"
            value={form.sort}
            onChange={(e) => setForm((f) => ({ ...f, sort: e.target.value }))}
          />
        </Field>
        <Field label="状态">
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant={Number(form.status) === STATUS_SHOWN ? 'primary' : 'ghost'}
              onClick={() => setForm((f) => ({ ...f, status: STATUS_SHOWN }))}
            >
              显示
            </Button>
            <Button
              variant={Number(form.status) === STATUS_HIDDEN ? 'primary' : 'ghost'}
              onClick={() => setForm((f) => ({ ...f, status: STATUS_HIDDEN }))}
            >
              隐藏
            </Button>
          </div>
        </Field>
      </Modal>

      <Modal
        open={!!removing}
        title="删除分类"
        onClose={() => (delBusy ? null : setRemoving(null))}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRemoving(null)} disabled={delBusy}>
              取消
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={delBusy}>
              确认删除
            </Button>
          </>
        }
      >
        {delErr ? (
          <div style={{ marginBottom: 12 }}>
            <Pill tone="danger">{delErr}</Pill>
          </div>
        ) : null}
        确定删除分类「{removing?.name}」吗?此操作不可撤销。
      </Modal>
    </Panel>
  );
}
