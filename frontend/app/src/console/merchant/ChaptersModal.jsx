import React from 'react';
import { Modal, Pill } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { ApiError } from '../api.js';
import { Button } from '../../../../design-system/components/core/Button.jsx';
import { Input } from '../../../../design-system/components/core/Input.jsx';

/* 知识类商品章节管理(课程/小说/电子书)。在商品列表对知识类商品打开。 */
export default function ChaptersModal({ api, product, onClose }) {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState(null); // 当前编辑/新建中的章节
  const [form, setForm] = React.useState({ title: '', content: '', sort: '0', status: 1 });
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');

  const load = React.useCallback(() => {
    setLoading(true);
    api.chapters(product.id).then((d) => setItems(d.items || [])).catch(() => setItems([])).finally(() => setLoading(false));
  }, [api, product.id]);
  React.useEffect(() => { load(); }, [load]);

  const startNew = () => { setEditing({ id: null }); setForm({ title: '', content: '', sort: String(items.length + 1), status: 1 }); setErr(''); };
  const startEdit = (c) => { setEditing(c); setForm({ title: c.title || '', content: c.content || '', sort: String(c.sort ?? 0), status: Number(c.status) }); setErr(''); };

  async function save() {
    if (!form.title.trim()) { setErr('请填写章节标题'); return; }
    setBusy(true); setErr('');
    const payload = { title: form.title.trim(), content: form.content, sort: Number(form.sort) || 0, status: Number(form.status) };
    try {
      if (editing.id) await api.updateChapter(editing.id, payload);
      else await api.createChapter(product.id, payload);
      setEditing(null); load();
    } catch (e) { setErr(e instanceof ApiError ? e.message : '保存失败'); }
    finally { setBusy(false); }
  }

  async function remove(c) {
    if (typeof window !== 'undefined' && !window.confirm(`删除章节「${c.title}」?`)) return;
    try { await api.deleteChapter(c.id); load(); } catch { /* 静默 */ }
  }

  return (
    <Modal open title={`章节管理 · ${product.title}`} onClose={onClose}
      footer={<Button variant="ghost" onClick={onClose}>关闭</Button>}>
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {err ? <Pill tone="danger">{err}</Pill> : null}
          <Input label="章节标题" value={form.title} maxLength={200} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="如 第一章 入门" />
          <div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 6 }}>章节正文(支持 HTML)</div>
            <textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={8}
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', fontFamily: 'var(--font-sans)', fontSize: 13.5, resize: 'vertical' }}
              placeholder="章节内容…(购买后买家可在订单页阅读)" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="排序" type="number" value={form.sort} onChange={(e) => setForm((f) => ({ ...f, sort: e.target.value }))} />
            <div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 6 }}>状态</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button size="sm" variant={Number(form.status) === 1 ? 'primary' : 'ghost'} onClick={() => setForm((f) => ({ ...f, status: 1 }))}>上架</Button>
                <Button size="sm" variant={Number(form.status) === 0 ? 'primary' : 'ghost'} onClick={() => setForm((f) => ({ ...f, status: 0 }))}>下架</Button>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <Button variant="primary" onClick={save} loading={busy}>保存章节</Button>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={busy}>返回列表</Button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>共 {items.length} 章</span>
            <Button size="sm" variant="primary" iconLeft={<Icons.Package size={14} />} onClick={startNew}>新增章节</Button>
          </div>
          {loading ? (
            <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-subtle)' }}>加载中…</div>
          ) : items.length === 0 ? (
            <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13 }}>暂无章节,点击「新增章节」</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((c) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-subtle)', width: 28 }}>#{c.sort}</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                  {Number(c.status) === 0 ? <Pill tone="neutral">下架</Pill> : <Pill tone="success">上架</Pill>}
                  <Button size="sm" variant="ghost" onClick={() => startEdit(c)}>编辑</Button>
                  <Button size="sm" variant="danger" onClick={() => remove(c)}>删</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
