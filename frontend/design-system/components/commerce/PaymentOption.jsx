import React from 'react';

const CSS = `
.mk-pay{
  display:flex; align-items:center; gap:14px; width:100%; text-align:left;
  padding:14px 16px; border:1.5px solid var(--border-strong); border-radius:var(--radius-md);
  background:#fff; cursor:pointer; font-family:var(--font-sans);
  transition:border-color var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
  -webkit-tap-highlight-color:transparent;
}
.mk-pay:hover{ border-color:var(--slate-400); }
.mk-pay--selected{ border-color:var(--brand); background:var(--brand-soft); box-shadow:var(--shadow-focus); }
.mk-pay__icon{ width:36px; height:36px; border-radius:var(--radius-sm); flex:none; display:flex; align-items:center; justify-content:center; font-size:20px; background:var(--surface-sunken); overflow:hidden; }
.mk-pay__icon img{ width:24px; height:24px; object-fit:contain; }
.mk-pay__main{ flex:1; min-width:0; }
.mk-pay__name{ font-size:var(--text-md); font-weight:var(--fw-bold); color:var(--text-strong); display:flex; align-items:center; gap:8px; }
.mk-pay__desc{ font-size:var(--text-xs); color:var(--text-muted); margin-top:2px; }
.mk-pay__radio{ width:22px; height:22px; border-radius:50%; border:2px solid var(--border-strong); flex:none; position:relative; transition:border-color var(--dur-base) var(--ease-out); }
.mk-pay--selected .mk-pay__radio{ border-color:var(--brand); }
.mk-pay--selected .mk-pay__radio::after{ content:''; position:absolute; inset:3px; border-radius:50%; background:var(--brand); }
.mk-pay__tag{ font-size:11px; font-weight:var(--fw-bold); color:var(--success-fg); background:var(--success-bg); padding:2px 7px; border-radius:var(--radius-pill); }
`;
if (typeof document !== 'undefined' && !document.getElementById('mk-pay-css')) {
  const s = document.createElement('style'); s.id = 'mk-pay-css'; s.textContent = CSS; document.head.appendChild(s);
}

// 无障碍说明:本组件使用 role="radio" + aria-checked 表达单选语义。
// 由于组件自身无法控制外层容器,使用方需将包裹这些选项的容器设置
// role="radiogroup"(并提供 aria-label),否则单选语义不完整。
export function PaymentOption({
  name, desc, icon, tag, selected = false, onSelect, className = '', ...rest
}) {
  return (
    <button
      type="button"
      className={['mk-pay', selected ? 'mk-pay--selected' : '', className].filter(Boolean).join(' ')}
      onClick={onSelect}
      role="radio"
      aria-checked={selected}
      {...rest}
    >
      <span className="mk-pay__icon">{icon}</span>
      <span className="mk-pay__main">
        <span className="mk-pay__name">{name}{tag && <span className="mk-pay__tag">{tag}</span>}</span>
        {desc && <span className="mk-pay__desc">{desc}</span>}
      </span>
      <span className="mk-pay__radio" />
    </button>
  );
}
