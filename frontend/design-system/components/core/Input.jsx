import React from 'react';

const CSS = `
.mk-field{ display:flex; flex-direction:column; gap:6px; font-family:var(--font-sans); }
.mk-field__label{ font-size:var(--text-sm); font-weight:var(--fw-semibold); color:var(--text-strong); display:flex; gap:4px; align-items:center; }
.mk-field__req{ color:var(--danger-solid); }
.mk-field__hint{ font-size:var(--text-xs); color:var(--text-muted); }
.mk-field__hint--error{ color:var(--danger-fg); }

.mk-input-wrap{ position:relative; display:flex; align-items:center; }
.mk-input{
  width:100%; height:48px; padding:0 14px; font-family:inherit; font-size:var(--text-md);
  color:var(--text-strong); background:#fff; border:1.5px solid var(--border-strong);
  border-radius:var(--radius-md); transition:border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
  -webkit-appearance:none; appearance:none;
}
.mk-input::placeholder{ color:var(--text-subtle); }
.mk-input:hover:not(:disabled){ border-color:var(--slate-400); }
.mk-input:focus{ outline:none; border-color:var(--brand); box-shadow:var(--shadow-focus); }
.mk-input:disabled{ background:var(--surface-sunken); color:var(--text-muted); cursor:not-allowed; }
.mk-input--has-icon{ padding-left:42px; }
.mk-input--error{ border-color:var(--danger-solid); }
.mk-input--error:focus{ box-shadow:0 0 0 3px rgba(224,68,74,.24); }
.mk-input__icon{ position:absolute; left:14px; display:flex; color:var(--text-muted); pointer-events:none; }
.mk-input__icon svg{ width:18px; height:18px; }
`;
if (typeof document !== 'undefined' && !document.getElementById('mk-input-css')) {
  const s = document.createElement('style'); s.id = 'mk-input-css'; s.textContent = CSS; document.head.appendChild(s);
}

export function Input({
  label, hint, error, required = false, icon, id,
  className = '', ...rest
}) {
  const inputId = id || (label ? `mk-${String(label).replace(/\s+/g, '-')}` : undefined);
  return (
    <div className="mk-field">
      {label && (
        <label className="mk-field__label" htmlFor={inputId}>
          {label}{required && <span className="mk-field__req">*</span>}
        </label>
      )}
      <div className="mk-input-wrap">
        {icon && <span className="mk-input__icon">{icon}</span>}
        <input
          id={inputId}
          className={[
            'mk-input', icon ? 'mk-input--has-icon' : '',
            error ? 'mk-input--error' : '', className,
          ].filter(Boolean).join(' ')}
          aria-invalid={!!error}
          {...rest}
        />
      </div>
      {(error || hint) && (
        <span className={`mk-field__hint${error ? ' mk-field__hint--error' : ''}`}>
          {error || hint}
        </span>
      )}
    </div>
  );
}
