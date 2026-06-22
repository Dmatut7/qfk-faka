import React from 'react';
import { useAsync, Panel, Toolbar, DataTable, Pill, Modal, Field } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { ApiError } from '../api.js';
import { Button } from '../../../../design-system/components/core/Button.jsx';
import { Input } from '../../../../design-system/components/core/Input.jsx';

/* 平台公告(announcements 表):{id,title,content,status(1显示/0隐藏),sort,create_time}。
   买家店铺页顶部展示 status=1 的公告(按 sort,desc)。 */

const emptyForm = { title: '', content: '', status: 1, sort: '0' };

export default function Announcements({ api }) {
  // 后端 GET /admin/announcements 返回 { items:[...] } 或直接数组,两者兼容。
  const list = useAsync(() => api.announcements(), []);
  const rows = (list.data && (list.data.items || (Array.isArray(list.data) ? list.data : []))) || [];

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null); // null=新建,否则为公告行
  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [formErr, setFormErr] = React.useState('');

  const [delRow, setDelRow] = React.useState(null); // 待删除确认的行
  const [delBusy, setDelBusy] = React.useState(false);
  const [delErr, setDelErr] = React.useState('');

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormErr('');
    setOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      title: row.title ?? '',
      content: row.content ?? '',
      status: Number(row.status) === 0 ? 0 : 1,
      sort: String(row.sort ?? 0),
    });
    setFormErr('');
    setOpen(true);
  }

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    const title = form.title.trim();
    if (!title) { setFormErr('请填写公告标题'); return; }
    if (!form.content.trim()) { setFormErr('请填写公告内容'); return; }
    const payload = {
      title,
      content: form.content.trim(),
      status: form.status ? 1 : 0,
      sort: parseInt(form.sort, 10) || 0,
    };
    setSaving(true); setFormErr('');
    try {
      if (editing) await api.updateAnnouncement(editing.id, payload);
      else await api.createAnnouncement(payload);
      setOpen(false);
      list.reload();
    } catch (e) {
      setFormErr(e instanceof ApiError ? e.message : '保存失败,请重试');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!delRow) return;
    setDelBusy(true); setDelErr('');
    try {
      await api.deleteAnnouncement(delRow.id);
      setDelRow(null);
      list.reload();
    } catch (e) {
      setDelErr(e instanceof ApiError ? e.message : '删除失败,请重试');
    } finally {
      setDelBusy(false);
    }
  }

  const columns = [
    {
      key: 'title', title: '标题 / 内容', render: (r) => (
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{r.title}</div>
          <div style={{
            fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3, maxWidth: 420,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{r.content}</div>
        </div>
      ),
    },
    {
      key: 'status', title: '状态', render: (r) => (
        Number(r.status) === 1
          ? <Pill tone="success">显示</Pill>
          : <Pill tone="neutral">隐藏</Pill>
      ),
    },
    {
      key: 'sort', title: '排序', align: 'right',
      render: (r) => <span className="tnum" style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{r.sort ?? 0}</span>,
    },
    {
      key: 'create_time', title: '创建时间', render: (r) => (
        <span style={{ fontSize: 12.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{r.create_time || '—'}</span>
      ),
    },
    {
      key: 'ops', title: '操作', align: 'right', width: 1, nowrap: true, render: (r) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <Button size="sm" variant="neutral"
            onClick={() => openEdit(r)}>编辑</Button>
          <Button size="sm" variant="danger" iconLeft={<Icons.X size={14} />}
            onClick={() => { setDelErr(''); setDelRow(r); }}>删除</Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Panel title="内容管理" subtitle="平台公告将展示在所有店铺买家页顶部(显示状态、按排序倒序)" padded={false}>
        <div style={{ padding: 18 }}>
          <Toolbar right={
            <Button variant="secondary" size="sm" iconLeft={<Icons.RefreshCw size={15} />}
              onClick={list.reload}>刷新</Button>
          }>
            <Button variant="primary" size="sm" iconLeft={<Icons.Megaphone size={15} />}
              onClick={openCreate}>新建公告</Button>
          </Toolbar>

          <DataTable
            columns={columns}
            rows={rows}
            loading={list.loading}
            error={list.error}
            onReload={list.reload}
            empty="暂无平台公告"
            emptyIcon="Inbox"
          />
        </div>
      </Panel>

      {open && (
        <Modal open title={editing ? '编辑公告' : '新建公告'} width={520} onClose={() => !saving && setOpen(false)}
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={saving}>取消</Button>
              <Button variant="primary" size="sm" loading={saving} onClick={save}>保存</Button>
            </>
          }>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="标题">
              <Input value={form.title} placeholder="公告标题"
                onChange={(e) => { set('title')(e.target.value); setFormErr(''); }} />
            </Field>
            <Field label="内容">
              <textarea
                value={form.content}
                placeholder="公告正文(支持多行)"
                rows={5}
                onChange={(e) => { set('content')(e.target.value); setFormErr(''); }}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '12px 14px', resize: 'vertical',
                  borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-strong)',
                  background: '#fff', color: 'var(--text-strong)', fontSize: 'var(--text-md)',
                  fontFamily: 'inherit', lineHeight: 1.55, outline: 'none',
                }}
              />
            </Field>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Field label="显示状态">
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 48, cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!form.status}
                    onChange={(e) => set('status')(e.target.checked ? 1 : 0)}
                    style={{ width: 18, height: 18, accentColor: 'var(--brand)' }} />
                  <span style={{ fontSize: 14, color: 'var(--text-body)' }}>
                    {form.status ? '显示中' : '已隐藏'}
                  </span>
                </label>
              </Field>
              <div style={{ width: 120 }}>
                <Field label="排序" hint="越大越靠前">
                  <Input value={form.sort} inputMode="numeric" placeholder="0"
                    onChange={(e) => set('sort')(e.target.value.replace(/[^\d-]/g, ''))} />
                </Field>
              </div>
            </div>
            {formErr && (
              <div style={{ display: 'flex', gap: 8, padding: '10px 12px', background: 'var(--danger-bg, #fdeced)', border: '1px solid var(--danger-solid)', borderRadius: 'var(--radius-md)', color: 'var(--danger-fg)', fontSize: 13 }}>
                <Icons.AlertTriangle size={16} color="var(--danger-solid)" /><span>{formErr}</span>
              </div>
            )}
          </div>
        </Modal>
      )}

      {delRow && (
        <Modal open title="删除公告" onClose={() => !delBusy && setDelRow(null)}
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={() => setDelRow(null)} disabled={delBusy}>取消</Button>
              <Button variant="danger" size="sm" loading={delBusy} onClick={confirmDelete}>确认删除</Button>
            </>
          }>
          <div style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.6 }}>
            确认删除公告「<strong style={{ color: 'var(--text-strong)' }}>{delRow.title}</strong>」?删除后将不再展示于买家页,此操作不可撤销。
          </div>
          {delErr && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8, padding: '10px 12px', background: 'var(--danger-bg, #fdeced)', border: '1px solid var(--danger-solid)', borderRadius: 'var(--radius-md)', color: 'var(--danger-fg)', fontSize: 13 }}>
              <Icons.AlertTriangle size={16} color="var(--danger-solid)" /><span>{delErr}</span>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
