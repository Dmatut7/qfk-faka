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
.mk-input--error:focus{ box-shadow:0 0 0 3px rgba(250,44,25,.22); }
.mk-input__icon{ position:absolute; left:14px; display:flex; color:var(--text-muted); pointer-events:none; }
.mk-input__icon svg{ width:18px; height:18px; }
.mk-input--has-eye{ padding-right:44px; }
.mk-input__eye{
  position:absolute; right:8px; display:flex; align-items:center; justify-content:center;
  width:32px; height:32px; padding:0; border:none; background:transparent; cursor:pointer;
  color:var(--text-muted); border-radius:var(--radius-md);
  transition:color var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out);
}
.mk-input__eye:hover{ color:var(--brand); background:var(--surface-sunken); }
.mk-input__eye:focus-visible{ outline:none; color:var(--brand); box-shadow:var(--shadow-focus); }
.mk-input__eye svg{ width:18px; height:18px; }
`;
if (typeof document !== 'undefined' && !document.getElementById('mk-input-css')) {
  const s = document.createElement('style'); s.id = 'mk-input-css'; s.textContent = CSS; document.head.appendChild(s);
}

export function Input({
  label, hint, error, required = false, icon, id, type,
  className = '', ...rest
}) {
  const inputId = id || (label ? `mk-${String(label).replace(/\s+/g, '-')}` : undefined);
  const describedById = inputId ? `${inputId}-desc` : undefined;
  const isPassword = type === 'password';
  const [showPassword, setShowPassword] = React.useState(false);
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
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
          type={inputType}
          className={[
            'mk-input', icon ? 'mk-input--has-icon' : '',
            isPassword ? 'mk-input--has-eye' : '',
            error ? 'mk-input--error' : '', className,
          ].filter(Boolean).join(' ')}
          aria-invalid={!!error}
          aria-describedby={(error || hint) ? describedById : undefined}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            className="mk-input__eye"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? '隐藏密码' : '显示密码'}
            aria-pressed={showPassword}
            tabIndex={-1}
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
      {(error || hint) && (
        <span
          id={describedById}
          className={`mk-field__hint${error ? ' mk-field__hint--error' : ''}`}
          {...(error ? { role: 'alert' } : {})}
        >
          {error || hint}
        </span>
      )}
    </div>
  );
}
