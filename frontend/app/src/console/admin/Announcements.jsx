import React from 'react';
import { useAsync, Panel, Toolbar, DataTable, Pill, Modal, Field } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { ApiError } from '../api.js';
import { Button } from '../../../../design-system/components/core/Button.jsx';
import { Input } from '../../../../design-system/components/core/Input.jsx';

/* 平台内容管理:
   - 平台公告(announcements 表):买家店铺页顶部展示 status=1 的公告(按 sort,desc)。
   - 门户内容(articles 表,type 1资讯/2常见问题/3单页):门户站资讯列表 / FAQ / 单页。 */

const TABS = [
  { key: 'announce', label: '平台公告' },
  { key: 'a1', label: '资讯', type: 1 },
  { key: 'a2', label: '常见问题', type: 2 },
  { key: 'a3', label: '单页', type: 3 },
];

export default function Announcements({ api }) {
  const [tab, setTab] = React.useState('announce');
  const active = TABS.find((t) => t.key === tab) || TABS[0];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Tab 切换(胶囊) */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {TABS.map((t) => {
          const on = t.key === tab;
          return (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              style={{
                height: 38, padding: '0 18px', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14,
                border: `1.5px solid ${on ? 'var(--brand)' : 'var(--border)'}`,
                background: on ? 'var(--brand-soft)' : '#fff',
                color: on ? 'var(--brand-active)' : 'var(--text-body)',
              }}>{t.label}</button>
          );
        })}
      </div>

      {active.key === 'announce'
        ? <AnnouncementPanel api={api} />
        : <ArticlePanel key={active.key} api={api} type={active.type} label={active.label} />}
    </div>
  );
}

/* ============ 平台公告 ============ */
const emptyAnn = { title: '', content: '', status: 1, sort: '0' };

function AnnouncementPanel({ api }) {
  const list = useAsync(() => api.announcements(), []);
  const rows = (list.data && (list.data.items || (Array.isArray(list.data) ? list.data : []))) || [];

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [form, setForm] = React.useState(emptyAnn);
  const [saving, setSaving] = React.useState(false);
  const [formErr, setFormErr] = React.useState('');
  const [delRow, setDelRow] = React.useState(null);
  const [delBusy, setDelBusy] = React.useState(false);
  const [delErr, setDelErr] = React.useState('');

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  function openCreate() { setEditing(null); setForm(emptyAnn); setFormErr(''); setOpen(true); }
  function openEdit(row) {
    setEditing(row);
    setForm({ title: row.title ?? '', content: row.content ?? '', status: Number(row.status) === 0 ? 0 : 1, sort: String(row.sort ?? 0) });
    setFormErr(''); setOpen(true);
  }
  async function save() {
    const title = form.title.trim();
    if (!title) { setFormErr('请填写公告标题'); return; }
    if (!form.content.trim()) { setFormErr('请填写公告内容'); return; }
    const payload = { title, content: form.content.trim(), status: form.status ? 1 : 0, sort: parseInt(form.sort, 10) || 0 };
    setSaving(true); setFormErr('');
    try {
      if (editing) await api.updateAnnouncement(editing.id, payload);
      else await api.createAnnouncement(payload);
      setOpen(false); list.reload();
    } catch (e) { setFormErr(e instanceof ApiError ? e.message : '保存失败,请重试'); } finally { setSaving(false); }
  }
  async function confirmDelete() {
    if (!delRow) return;
    setDelBusy(true); setDelErr('');
    try { await api.deleteAnnouncement(delRow.id); setDelRow(null); list.reload(); }
    catch (e) { setDelErr(e instanceof ApiError ? e.message : '删除失败,请重试'); } finally { setDelBusy(false); }
  }

  const columns = [
    {
      key: 'title', title: '标题 / 内容', render: (r) => (
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{r.title}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3, maxWidth: 420, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.content}</div>
        </div>
      ),
    },
    { key: 'status', title: '状态', render: (r) => (Number(r.status) === 1 ? <Pill tone="success">显示</Pill> : <Pill tone="neutral">隐藏</Pill>) },
    { key: 'sort', title: '排序', align: 'right', render: (r) => <span className="tnum" style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{r.sort ?? 0}</span> },
    { key: 'create_time', title: '创建时间', render: (r) => <span style={{ fontSize: 12.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{r.create_time || '—'}</span> },
    {
      key: 'ops', title: '操作', align: 'right', width: 1, nowrap: true, render: (r) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <Button size="sm" variant="neutral" onClick={() => openEdit(r)}>编辑</Button>
          <Button size="sm" variant="danger" iconLeft={<Icons.X size={14} />} onClick={() => { setDelErr(''); setDelRow(r); }}>删除</Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Panel title="平台公告" subtitle="展示在所有店铺买家页顶部(显示状态、按排序倒序)" padded={false}>
        <div style={{ padding: 18 }}>
          <Toolbar right={<Button variant="secondary" size="sm" iconLeft={<Icons.RefreshCw size={15} />} onClick={list.reload}>刷新</Button>}>
            <Button variant="primary" size="sm" iconLeft={<Icons.Plus size={15} />} onClick={openCreate}>新建公告</Button>
          </Toolbar>
          <DataTable columns={columns} rows={rows} loading={list.loading} error={list.error} onReload={list.reload} empty="暂无平台公告" emptyIcon="Inbox" />
        </div>
      </Panel>

      {open && (
        <Modal open title={editing ? '编辑公告' : '新建公告'} width={520} onClose={() => !saving && setOpen(false)}
          footer={<><Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={saving}>取消</Button><Button variant="primary" size="sm" loading={saving} onClick={save}>保存</Button></>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="标题"><Input value={form.title} placeholder="公告标题" onChange={(e) => { set('title')(e.target.value); setFormErr(''); }} /></Field>
            <Field label="内容"><TextArea value={form.content} placeholder="公告正文(支持多行)" rows={5} onChange={(v) => { set('content')(v); setFormErr(''); }} /></Field>
            <StatusSortRow form={form} set={set} />
            {formErr && <FormErr msg={formErr} />}
          </div>
        </Modal>
      )}

      {delRow && (
        <Modal open title="删除公告" onClose={() => !delBusy && setDelRow(null)}
          footer={<><Button variant="ghost" size="sm" onClick={() => setDelRow(null)} disabled={delBusy}>取消</Button><Button variant="danger" size="sm" loading={delBusy} onClick={confirmDelete}>确认删除</Button></>}>
          <div style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.6 }}>确认删除公告「<strong style={{ color: 'var(--text-strong)' }}>{delRow.title}</strong>」?此操作不可撤销。</div>
          {delErr && <div style={{ marginTop: 12 }}><FormErr msg={delErr} /></div>}
        </Modal>
      )}
    </>
  );
}

/* ============ 门户内容(资讯 / 常见问题 / 单页)============ */
const emptyArt = { title: '', category: '', summary: '', content: '', status: 1, sort: '0' };

function ArticlePanel({ api, type, label }) {
  const list = useAsync(() => api.articles(type), [type]);
  const rows = (list.data && (list.data.items || (Array.isArray(list.data) ? list.data : []))) || [];

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [form, setForm] = React.useState(emptyArt);
  const [saving, setSaving] = React.useState(false);
  const [formErr, setFormErr] = React.useState('');
  const [delRow, setDelRow] = React.useState(null);
  const [delBusy, setDelBusy] = React.useState(false);
  const [delErr, setDelErr] = React.useState('');

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  function openCreate() { setEditing(null); setForm(emptyArt); setFormErr(''); setOpen(true); }
  function openEdit(row) {
    setEditing(row);
    setForm({ title: row.title ?? '', category: row.category ?? '', summary: row.summary ?? '', content: row.content ?? '', status: Number(row.status) === 0 ? 0 : 1, sort: String(row.sort ?? 0) });
    setFormErr(''); setOpen(true);
  }
  async function save() {
    const title = form.title.trim();
    if (!title) { setFormErr('请填写标题'); return; }
    if (!form.content.trim()) { setFormErr('请填写正文内容'); return; }
    const payload = {
      type, title, category: form.category.trim(), summary: form.summary.trim(),
      content: form.content.trim(), status: form.status ? 1 : 0, sort: parseInt(form.sort, 10) || 0,
    };
    setSaving(true); setFormErr('');
    try {
      if (editing) await api.updateArticle(editing.id, payload);
      else await api.createArticle(payload);
      setOpen(false); list.reload();
    } catch (e) { setFormErr(e instanceof ApiError ? e.message : '保存失败,请重试'); } finally { setSaving(false); }
  }
  async function confirmDelete() {
    if (!delRow) return;
    setDelBusy(true); setDelErr('');
    try { await api.deleteArticle(delRow.id); setDelRow(null); list.reload(); }
    catch (e) { setDelErr(e instanceof ApiError ? e.message : '删除失败,请重试'); } finally { setDelBusy(false); }
  }

  const columns = [
    {
      key: 'title', title: '标题 / 摘要', render: (r) => (
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{r.title}</div>
          {r.summary ? <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3, maxWidth: 420, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.summary}</div> : null}
        </div>
      ),
    },
    { key: 'category', title: '分类', render: (r) => (r.category ? <Pill tone="neutral">{r.category}</Pill> : <span style={{ color: 'var(--text-subtle)' }}>—</span>) },
    { key: 'views', title: '浏览', align: 'right', render: (r) => <span className="tnum" style={{ color: 'var(--text-muted)' }}>{r.views ?? 0}</span> },
    { key: 'status', title: '状态', render: (r) => (Number(r.status) === 1 ? <Pill tone="success">显示</Pill> : <Pill tone="neutral">隐藏</Pill>) },
    { key: 'sort', title: '排序', align: 'right', render: (r) => <span className="tnum" style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{r.sort ?? 0}</span> },
    {
      key: 'ops', title: '操作', align: 'right', width: 1, nowrap: true, render: (r) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <Button size="sm" variant="neutral" onClick={() => openEdit(r)}>编辑</Button>
          <Button size="sm" variant="danger" iconLeft={<Icons.X size={14} />} onClick={() => { setDelErr(''); setDelRow(r); }}>删除</Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Panel title={label} subtitle={`门户站「${label}」内容,展示状态/排序生效于前台`} padded={false}>
        <div style={{ padding: 18 }}>
          <Toolbar right={<Button variant="secondary" size="sm" iconLeft={<Icons.RefreshCw size={15} />} onClick={list.reload}>刷新</Button>}>
            <Button variant="primary" size="sm" iconLeft={<Icons.Plus size={15} />} onClick={openCreate}>新建{label}</Button>
          </Toolbar>
          <DataTable columns={columns} rows={rows} loading={list.loading} error={list.error} onReload={list.reload} empty={`暂无${label}`} emptyIcon="Inbox" />
        </div>
      </Panel>

      {open && (
        <Modal open title={`${editing ? '编辑' : '新建'}${label}`} width={580} onClose={() => !saving && setOpen(false)}
          footer={<><Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={saving}>取消</Button><Button variant="primary" size="sm" loading={saving} onClick={save}>保存</Button></>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="标题"><Input value={form.title} placeholder={`${label}标题`} onChange={(e) => { set('title')(e.target.value); setFormErr(''); }} /></Field>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}><Field label="分类" hint="选填,如「公告 / 教程」"><Input value={form.category} placeholder="分类(选填)" onChange={(e) => set('category')(e.target.value)} /></Field></div>
            </div>
            <Field label="摘要" hint="选填,列表/卡片预览文案"><TextArea value={form.summary} placeholder="一句话摘要(选填)" rows={2} onChange={(v) => set('summary')(v)} /></Field>
            <Field label="正文内容" hint="支持 HTML / 多行文本"><TextArea value={form.content} placeholder="正文内容" rows={8} onChange={(v) => { set('content')(v); setFormErr(''); }} /></Field>
            <StatusSortRow form={form} set={set} />
            {formErr && <FormErr msg={formErr} />}
          </div>
        </Modal>
      )}

      {delRow && (
        <Modal open title={`删除${label}`} onClose={() => !delBusy && setDelRow(null)}
          footer={<><Button variant="ghost" size="sm" onClick={() => setDelRow(null)} disabled={delBusy}>取消</Button><Button variant="danger" size="sm" loading={delBusy} onClick={confirmDelete}>确认删除</Button></>}>
          <div style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.6 }}>确认删除「<strong style={{ color: 'var(--text-strong)' }}>{delRow.title}</strong>」?此操作不可撤销。</div>
          {delErr && <div style={{ marginTop: 12 }}><FormErr msg={delErr} /></div>}
        </Modal>
      )}
    </>
  );
}

/* ============ 共享小组件 ============ */
function TextArea({ value, placeholder, rows, onChange }) {
  return (
    <textarea value={value} placeholder={placeholder} rows={rows}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%', boxSizing: 'border-box', padding: '12px 14px', resize: 'vertical',
        borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-strong)',
        background: '#fff', color: 'var(--text-strong)', fontSize: 'var(--text-md)',
        fontFamily: 'inherit', lineHeight: 1.55, outline: 'none',
      }} />
  );
}

function StatusSortRow({ form, set }) {
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
      <Field label="显示状态">
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 48, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!form.status} onChange={(e) => set('status')(e.target.checked ? 1 : 0)} style={{ width: 18, height: 18, accentColor: 'var(--brand)' }} />
          <span style={{ fontSize: 14, color: 'var(--text-body)' }}>{form.status ? '显示中' : '已隐藏'}</span>
        </label>
      </Field>
      <div style={{ width: 120 }}>
        <Field label="排序" hint="越大越靠前">
          <Input value={form.sort} inputMode="numeric" placeholder="0" onChange={(e) => set('sort')(e.target.value.replace(/[^\d-]/g, ''))} />
        </Field>
      </div>
    </div>
  );
}

function FormErr({ msg }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '10px 12px', background: 'var(--danger-bg, #fdeced)', border: '1px solid var(--danger-solid)', borderRadius: 'var(--radius-md)', color: 'var(--danger-fg)', fontSize: 13 }}>
      <Icons.AlertTriangle size={16} color="var(--danger-solid)" /><span>{msg}</span>
    </div>
  );
}
