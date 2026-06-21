import React from 'react';

const CSS = `
.mk-cardkey{
  border:1.5px solid var(--border); border-radius:var(--radius-md); background:var(--surface-card);
  overflow:hidden; font-family:var(--font-sans);
}
.mk-cardkey__head{ display:flex; align-items:center; justify-content:space-between; gap:8px; padding:10px 14px; border-bottom:1px solid var(--border); background:var(--slate-50); }
.mk-cardkey__title{ font-size:var(--text-sm); font-weight:var(--fw-bold); color:var(--text-strong); display:flex; align-items:center; gap:7px; }
.mk-cardkey__idx{ display:inline-flex; align-items:center; justify-content:center; min-width:20px; height:20px; padding:0 5px; border-radius:var(--radius-pill); background:var(--brand-soft); color:var(--brand-active); font-size:11px; font-weight:var(--fw-bold); }
.mk-cardkey__body{ display:flex; align-items:stretch; }
.mk-cardkey__code{
  flex:1; min-width:0; padding:14px 16px; font-family:var(--font-mono); font-size:var(--text-md);
  font-weight:var(--fw-medium); color:var(--text-strong); letter-spacing:.02em; word-break:break-all;
  display:flex; align-items:center; user-select:all;
}
.mk-cardkey__copy{
  flex:none; border:none; border-left:1px solid var(--border); background:#fff; color:var(--brand);
  font-family:var(--font-sans); font-weight:var(--fw-bold); font-size:var(--text-sm); cursor:pointer;
  padding:0 18px; display:flex; align-items:center; gap:6px; transition:background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
  -webkit-tap-highlight-color:transparent;
}
.mk-cardkey__copy:hover{ background:var(--brand-soft); }
.mk-cardkey__copy:active{ background:var(--blue-100); }
.mk-cardkey__copy svg{ width:16px; height:16px; }
.mk-cardkey__copy--done{ color:var(--success-fg); }

/* locked (unpaid) state */
.mk-cardkey--locked .mk-cardkey__code{ color:var(--text-subtle); letter-spacing:.18em; user-select:none; filter:blur(0.5px); }
.mk-cardkey--locked .mk-cardkey__lockmsg{ display:flex; align-items:center; gap:8px; padding:14px 16px; color:var(--text-muted); font-size:var(--text-sm); }
.mk-cardkey--locked .mk-cardkey__lockmsg svg{ width:16px; height:16px; color:var(--text-subtle); }
`;
if (typeof document !== 'undefined' && !document.getElementById('mk-cardkey-css')) {
  const s = document.createElement('style'); s.id = 'mk-cardkey-css'; s.textContent = CSS; document.head.appendChild(s);
}

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);
const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
);

export function CardKey({
  code, label = '卡密', index, locked = false, lockedHint = '支付完成后自动显示',
  onCopy, className = '', ...rest
}) {
  const [done, setDone] = React.useState(false);
  const copy = () => {
    const text = String(code || '');
    const finish = () => { setDone(true); onCopy && onCopy(text); setTimeout(() => setDone(false), 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(finish).catch(finish);
    } else { finish(); }
  };
  return (
    <div className={['mk-cardkey', locked ? 'mk-cardkey--locked' : '', className].filter(Boolean).join(' ')} {...rest}>
      <div className="mk-cardkey__head">
        <span className="mk-cardkey__title">
          {index != null && <span className="mk-cardkey__idx">{index}</span>}
          {label}
        </span>
      </div>
      <div className="mk-cardkey__body">
        {locked ? (
          <span className="mk-cardkey__lockmsg"><LockIcon />{lockedHint}</span>
        ) : (
          <>
            <code className="mk-cardkey__code">{code}</code>
            <button type="button" className={`mk-cardkey__copy${done ? ' mk-cardkey__copy--done' : ''}`} onClick={copy}>
              {done ? <CheckIcon /> : <CopyIcon />}{done ? '已复制' : '复制'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
