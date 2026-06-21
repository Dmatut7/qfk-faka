import React from 'react';

/* inject component CSS once */
const CSS = `
.mk-btn{
  --_bg:var(--brand); --_fg:var(--text-on-brand); --_bd:transparent;
  display:inline-flex; align-items:center; justify-content:center; gap:8px;
  font-family:var(--font-sans); font-weight:var(--fw-bold); line-height:1;
  border:1.5px solid var(--_bd); background:var(--_bg); color:var(--_fg);
  border-radius:var(--radius-md); cursor:pointer; white-space:nowrap;
  transition:transform var(--dur-fast) var(--ease-out), background var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out);
  -webkit-tap-highlight-color:transparent; text-decoration:none; user-select:none;
}
.mk-btn:focus-visible{ outline:none; box-shadow:var(--shadow-focus); }
.mk-btn:active{ transform:translateY(1px) scale(0.992); }
.mk-btn[disabled],.mk-btn[aria-disabled="true"]{ opacity:.5; cursor:not-allowed; transform:none; }

/* sizes */
.mk-btn--sm{ height:36px; padding:0 14px; font-size:var(--text-sm); border-radius:var(--radius-sm); }
.mk-btn--md{ height:44px; padding:0 20px; font-size:var(--text-base); }
.mk-btn--lg{ height:52px; padding:0 26px; font-size:var(--text-md); border-radius:var(--radius-lg); }
.mk-btn--block{ width:100%; }

/* variants */
.mk-btn--primary{ --_bg:var(--brand); --_fg:var(--text-on-brand); box-shadow:var(--shadow-brand); }
.mk-btn--primary:hover:not([disabled]){ --_bg:var(--brand-hover); }
.mk-btn--primary:active:not([disabled]){ --_bg:var(--brand-active); }

.mk-btn--secondary{ --_bg:#fff; --_fg:var(--brand); --_bd:var(--blue-200); box-shadow:var(--shadow-xs); }
.mk-btn--secondary:hover:not([disabled]){ --_bg:var(--brand-soft); --_bd:var(--blue-300); }

.mk-btn--neutral{ --_bg:#fff; --_fg:var(--text-strong); --_bd:var(--border-strong); box-shadow:var(--shadow-xs); }
.mk-btn--neutral:hover:not([disabled]){ --_bg:var(--surface-sunken); }

.mk-btn--ghost{ --_bg:transparent; --_fg:var(--text-body); box-shadow:none; }
.mk-btn--ghost:hover:not([disabled]){ --_bg:var(--surface-sunken); }

.mk-btn--danger{ --_bg:var(--danger-solid); --_fg:#fff; box-shadow:0 8px 20px rgba(224,68,74,.26); }
.mk-btn--danger:hover:not([disabled]){ --_bg:var(--red-600); }

.mk-btn--success{ --_bg:var(--success-solid); --_fg:#fff; box-shadow:0 8px 20px rgba(21,166,90,.24); }
.mk-btn--success:hover:not([disabled]){ --_bg:var(--green-600); }

.mk-btn__spinner{ width:1em; height:1em; border-radius:50%; border:2px solid currentColor; border-top-color:transparent; animation:mk-spin .7s linear infinite; }
@keyframes mk-spin{ to{ transform:rotate(360deg); } }
`;
if (typeof document !== 'undefined' && !document.getElementById('mk-btn-css')) {
  const s = document.createElement('style'); s.id = 'mk-btn-css'; s.textContent = CSS; document.head.appendChild(s);
}

export function Button({
  children, variant = 'primary', size = 'md', block = false,
  loading = false, disabled = false, iconLeft, iconRight,
  as = 'button', className = '', ...rest
}) {
  const Tag = as;
  const cls = [
    'mk-btn', `mk-btn--${variant}`, `mk-btn--${size}`,
    block ? 'mk-btn--block' : '', className,
  ].filter(Boolean).join(' ');
  const isDisabled = disabled || loading;
  return (
    <Tag
      className={cls}
      disabled={Tag === 'button' ? isDisabled : undefined}
      aria-disabled={isDisabled || undefined}
      {...rest}
    >
      {loading && <span className="mk-btn__spinner" aria-hidden="true" />}
      {!loading && iconLeft}
      {children && <span>{children}</span>}
      {!loading && iconRight}
    </Tag>
  );
}
