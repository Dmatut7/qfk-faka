import React from 'react';
import { Icons } from '../Icons.jsx';
import { ApiError } from './api.js';

/* 图片上传 + URL 双模:点击上传本地图片(走 api.uploadImage)或粘贴 URL。
   props: { api, value, onChange(url), label, hint } */
export function ImageUpload({ api, value, onChange, label, hint }) {
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const inputRef = React.useRef(null);

  async function pick(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // 允许重选同一文件
    if (!file) return;
    setErr('');
    setBusy(true);
    try {
      const r = await api.uploadImage(file);
      onChange(r && r.url ? r.url : '');
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : '上传失败,请重试');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {label && <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 6 }}>{label}</div>}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 64, height: 64, flex: 'none', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
          backgroundColor: 'var(--surface-sunken)', backgroundImage: value ? `url("${value}")` : 'none',
          backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {!value && <Icons.Package size={22} color="var(--text-subtle)" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" onClick={() => inputRef.current && inputRef.current.click()} disabled={busy}
              style={{
                height: 36, padding: '0 14px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--brand)',
                background: 'var(--brand-soft)', color: 'var(--brand-active)', fontWeight: 700, fontSize: 13,
                cursor: busy ? 'default' : 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap',
              }}>
              {busy ? '上传中…' : (value ? '更换图片' : '上传图片')}
            </button>
            {value && <button type="button" onClick={() => onChange('')}
              style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>移除</button>}
          </div>
          <input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="或粘贴图片 URL"
            style={{
              marginTop: 8, width: '100%', boxSizing: 'border-box', height: 34, padding: '0 10px',
              borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: 13,
              color: 'var(--text-body)', fontFamily: 'inherit', outline: 'none',
            }} />
        </div>
        <input ref={inputRef} type="file" accept="image/*" onChange={pick} style={{ display: 'none' }} />
      </div>
      {err ? <div style={{ fontSize: 12, color: 'var(--danger-fg)', marginTop: 6 }}>{err}</div>
        : (hint && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{hint}</div>)}
    </div>
  );
}
