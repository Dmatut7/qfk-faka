import React from 'react';

/* Console data table — columns=[{key,title,render?,align?,width?}], rows=[...].
   Handles loading (spinner), error (retry bar) and empty states. Header row is
   muted/uppercase-ish small; body rows hairline-separated, hover-tinted. */
const CSS = `
.mk-dt{ width:100%; overflow-x:auto; }
.mk-dt table{ width:100%; border-collapse:collapse; font-size:13.5px; }
.mk-dt th{ text-align:left; padding:10px 12px; border-bottom:1px solid var(--border); color:var(--text-muted); font-weight:700; font-size:12.5px; white-space:nowrap; }
.mk-dt tbody tr{ border-bottom:1px solid var(--slate-100); transition:background var(--dur-fast) var(--ease-out); }
.mk-dt tbody tr:hover{ background:var(--brand-soft); }
.mk-dt td{ padding:11px 12px; color:var(--text-body); vertical-align:middle; }
.mk-dt__spin{ width:22px; height:22px; border-radius:50%; border:3px solid var(--brand-soft); border-top-color:var(--brand); animation:mk-dt-spin .8s linear infinite; display:inline-block; }
@keyframes mk-dt-spin{ to{ transform:rotate(360deg); } }
`;
if (typeof document !== 'undefined' && !document.getElementById('mk-dt-css')) {
  const s = document.createElement('style'); s.id = 'mk-dt-css'; s.textContent = CSS; document.head.appendChild(s);
}

export function DataTable({ columns, rows, loading, error, onReload, rowKey = 'id', empty = '暂无数据', emptyIcon }) {
  if (loading) return <div style={{ padding: '40px 0', textAlign: 'center' }}><span className="mk-dt__spin" /></div>;
  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-solid)', borderRadius: 'var(--radius-md)', color: 'var(--danger-fg)', fontSize: 13 }}>
      <span style={{ flex: 1 }}>{error}</span>
      {onReload && <button onClick={onReload} style={{ border: 'none', background: 'transparent', color: 'var(--danger-fg)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>重试</button>}
    </div>
  );
  if (!rows || rows.length === 0) return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
      <div style={{ width: 52, height: 52, margin: '0 auto 12px', borderRadius: '50%', background: 'var(--surface-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{emptyIcon}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-body)' }}>{empty}</div>
    </div>
  );
  return (
    <div className="mk-dt">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ textAlign: c.align || 'left', width: c.width }}>{c.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r[rowKey] ?? i}>
              {columns.map((c) => (
                <td key={c.key} style={{ textAlign: c.align || 'left', maxWidth: c.width || 280, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
