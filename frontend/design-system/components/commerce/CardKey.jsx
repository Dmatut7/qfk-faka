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
.mk-cardkey__copy:active{ background:var(--orange-100); }
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
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);
const CopyIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
);
const CheckIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
);

// 视觉隐藏但对屏幕阅读器可见的样式
const SR_ONLY = {
  position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px',
  overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0,
};

// document.execCommand('copy') 兜底:创建临时 textarea → select → execCommand
function legacyCopy(text) {
  if (typeof document === 'undefined') return false;
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    return false;
  }
}

export function CardKey({
  code, label = '卡密', index, locked = false, lockedHint = '支付完成后自动显示',
  onCopy, className = '', ...rest
}) {
  const [done, setDone] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const succeed = (text) => {
    setFailed(false); setDone(true); onCopy && onCopy(text);
    setTimeout(() => setDone(false), 1800);
  };
  const fallback = (text) => {
    if (legacyCopy(text)) { succeed(text); }
    else { setDone(false); setFailed(true); setTimeout(() => setFailed(false), 2500); }
  };
  const copy = () => {
    const text = String(code || '');
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      // 成功才显示「已复制」;失败走 execCommand 兜底
      navigator.clipboard.writeText(text).then(() => succeed(text)).catch(() => fallback(text));
    } else {
      // 无 clipboard API 时也走 execCommand 兜底
      fallback(text);
    }
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
            <button
              type="button"
              className={`mk-cardkey__copy${done ? ' mk-cardkey__copy--done' : ''}`}
              onClick={copy}
              aria-label={`复制${label}`}
            >
              {done ? <CheckIcon /> : <CopyIcon />}{done ? '已复制' : (failed ? '请手动复制' : '复制')}
            </button>
          </>
        )}
      </div>
      <span role="status" aria-live="polite" style={SR_ONLY}>{done ? '卡密已复制' : ''}</span>
    </div>
  );
}
