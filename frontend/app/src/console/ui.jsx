import React from 'react';
import { Icons } from '../Icons.jsx';
import { ApiError } from './api.js';

/* 异步数据 hook:统一 loading / error / reload。fn 应返回 Promise。 */
export function useAsync(fn, deps = []) {
  const [state, setState] = React.useState({ loading: true, error: '', data: null });
  const fnRef = React.useRef(fn);
  fnRef.current = fn;
  const aliveRef = React.useRef(true);
  React.useEffect(() => { aliveRef.current = true; return () => { aliveRef.current = false; }; }, []);
  const reload = React.useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    fnRef.current()
      .then((d) => { if (aliveRef.current) setState({ loading: false, error: '', data: d }); })
      .catch((e) => { if (aliveRef.current) setState({ loading: false, error: e instanceof ApiError ? e.message : '加载失败,请重试', data: null }); });
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => { reload(); }, [reload]);
  return { ...state, reload, setData: (d) => setState((s) => ({ ...s, data: d })) };
}

/* 金额(表格数字 + 两位小数) */
export function Money({ amount, strong, color }) {
  return (
    <span className="tnum" style={{ fontWeight: strong ? 800 : 600, color: color || 'var(--text-strong)', whiteSpace: 'nowrap' }}>
      ¥{Number(amount || 0).toFixed(2)}
    </span>
  );
}

const TONE = {
  success: ['var(--success-fg)', 'var(--success-bg)', 'var(--success-border)'],
  pending: ['var(--pending-fg)', 'var(--pending-bg)', 'var(--pending-border)'],
  danger: ['var(--danger-fg)', 'var(--danger-bg)', 'var(--danger-border, var(--danger-solid))'],
  neutral: ['var(--text-body)', 'var(--surface-sunken)', 'var(--border)'],
  secure: ['var(--secure-fg)', 'var(--secure-bg)', 'var(--secure-solid)'],
  brand: ['var(--brand-active)', 'var(--brand-soft)', 'var(--brand-soft-border)'],
};
/* 状态药丸 */
export function Pill({ tone = 'neutral', children }) {
  const [fg, bg, bd] = TONE[tone] || TONE.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 'var(--radius-pill)',
      background: bg, color: fg, border: `1px solid ${bd}`, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

/* 面板容器 */
export function Panel({ title, subtitle, actions, children, padded = true, style }) {
  return (
    <section style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', ...style }}>
      {(title || actions) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ minWidth: 0 }}>
            {title && <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-strong)' }}>{title}</div>}
            {subtitle && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
          </div>
          {actions && <div style={{ display: 'flex', gap: 8, flex: 'none' }}>{actions}</div>}
        </div>
      )}
      <div style={padded ? { padding: 18 } : undefined}>{children}</div>
    </section>
  );
}

/* 顶部工具条(标题 + 右侧操作) */
export function Toolbar({ children, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{children}</div>
      {right && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{right}</div>}
    </div>
  );
}

export function EmptyState({ icon = 'Inbox', text = '暂无数据', sub }) {
  const Icon = Icons[icon] || Icons.Inbox;
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
      <div style={{ width: 52, height: 52, margin: '0 auto 12px', borderRadius: '50%', background: 'var(--surface-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={26} color="var(--text-subtle)" />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-body)' }}>{text}</div>
      {sub && <div style={{ fontSize: 12.5, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export function Spinner({ size = 22 }) {
  return (
    <span style={{ display: 'inline-block', width: size, height: size, borderRadius: '50%', border: '3px solid var(--brand-soft)', borderTopColor: 'var(--brand)', animation: 'mkc-spin .8s linear infinite' }}>
      <style>{'@keyframes mkc-spin{to{transform:rotate(360deg)}}'}</style>
    </span>
  );
}

export function ErrorBar({ message, onRetry, onClose }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--danger-bg, #fdeced)', border: '1px solid var(--danger-solid)', borderRadius: 'var(--radius-md)', color: 'var(--danger-fg)', fontSize: 13 }}>
      <Icons.AlertTriangle size={18} color="var(--danger-solid)" />
      <span style={{ flex: 1 }}>{message}</span>
      {onRetry && <button onClick={onRetry} style={{ border: 'none', background: 'transparent', color: 'var(--danger-fg)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>重试</button>}
      {onClose && <button onClick={onClose} aria-label="关闭" style={{ border: 'none', background: 'transparent', color: 'var(--danger-fg)', fontWeight: 700, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>}
    </div>
  );
}

/* 数据表:columns=[{key,title,render?,align?,width?}],rows=[...] */
export function DataTable({ columns, rows, loading, error, onReload, rowKey = 'id', empty = '暂无数据', emptyIcon = 'Inbox' }) {
  if (loading) return <div style={{ padding: '40px 0', textAlign: 'center' }}><Spinner /></div>;
  if (error) return <ErrorBar message={error} onRetry={onReload} />;
  if (!rows || rows.length === 0) return <EmptyState icon={emptyIcon} text={empty} />;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ textAlign: c.align || 'left', padding: '10px 12px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 700, fontSize: 12.5, whiteSpace: 'nowrap', width: c.width }}>{c.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r[rowKey] ?? i} style={{ borderBottom: '1px solid var(--slate-100)' }}>
              {columns.map((c) => (
                <td key={c.key} style={{ padding: '11px 12px', textAlign: c.align || 'left', color: 'var(--text-body)', verticalAlign: 'middle' }}>
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

/* 表单字段包裹 */
export function Field({ label, hint, children }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 6 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{hint}</div>}
    </label>
  );
}

/* 轻量弹窗(表单/确认) */
export function Modal({ open, title, onClose, children, footer, width = 460 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'var(--surface-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}
        style={{ width: '100%', maxWidth: width, background: '#fff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-strong)' }}>{title}</span>
          <button onClick={onClose} aria-label="关闭" style={{ width: 32, height: 32, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto' }}>{children}</div>
        {footer && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: '1px solid var(--border)' }}>{footer}</div>}
      </div>
    </div>
  );
}

/* 统计卡(概览数字) */
export function StatCard({ label, value, icon, tone = 'brand', sub }) {
  const [fg, bg] = TONE[tone] || TONE.brand;
  const Icon = Icons[icon] || Icons.Zap;
  return (
    <div style={{ flex: '1 1 180px', minWidth: 160, background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={16} color={fg} /></span>
        {label}
      </div>
      <div style={{ marginTop: 10, fontSize: 26, fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
