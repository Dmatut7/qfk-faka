import React from 'react';

const CSS = `
.mk-qty{ display:inline-flex; align-items:center; border:1.5px solid var(--border-strong); border-radius:var(--radius-md); background:#fff; overflow:hidden; height:44px; }
.mk-qty__btn{
  width:44px; height:100%; border:none; background:#fff; color:var(--text-strong);
  font-size:20px; font-weight:var(--fw-bold); cursor:pointer; display:flex; align-items:center; justify-content:center;
  transition:background var(--dur-fast) var(--ease-out); -webkit-tap-highlight-color:transparent;
}
.mk-qty__btn:hover:not(:disabled){ background:var(--surface-sunken); }
.mk-qty__btn:active:not(:disabled){ background:var(--slate-150); }
.mk-qty__btn:disabled{ color:var(--text-subtle); cursor:not-allowed; }
.mk-qty__input{
  width:52px; height:100%; border:none; border-left:1.5px solid var(--border); border-right:1.5px solid var(--border);
  text-align:center; font-family:var(--font-sans); font-size:var(--text-md); font-weight:var(--fw-bold);
  color:var(--text-strong); background:#fff; -moz-appearance:textfield; font-variant-numeric:tabular-nums;
}
.mk-qty__input::-webkit-outer-spin-button,.mk-qty__input::-webkit-inner-spin-button{ -webkit-appearance:none; margin:0; }
.mk-qty__input:focus{ outline:none; box-shadow:var(--shadow-focus); position:relative; z-index:1; }
.mk-qty--sm{ height:36px; }
.mk-qty--sm .mk-qty__btn{ width:36px; font-size:17px; }
.mk-qty--sm .mk-qty__input{ width:42px; font-size:var(--text-sm); }
`;
if (typeof document !== 'undefined' && !document.getElementById('mk-qty-css')) {
  const s = document.createElement('style'); s.id = 'mk-qty-css'; s.textContent = CSS; document.head.appendChild(s);
}

export function QuantityStepper({
  value = 1, min = 1, max = 99, size = 'md', onChange, className = '', ...rest
}) {
  // 防御 max<min:用 hi 作为有效上界
  const hi = Math.max(min, max);
  const invalidRange = max < min;
  const clamp = (n) => Math.max(min, Math.min(hi, n));
  const set = (n) => onChange && onChange(clamp(n));

  // 本地 string 编辑态:允许空串/中间值,仅在合法数字时同步数值
  const [draft, setDraft] = React.useState(String(value));
  // 外部受控值变化时同步 draft(非编辑场景)
  React.useEffect(() => { setDraft(String(value)); }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value;
    setDraft(raw);
    // 仅在是合法数字时同步数值,空串/'-' 等中间态不 clamp、不上报
    if (/^\d+$/.test(raw)) {
      const n = parseInt(raw, 10);
      if (!Number.isNaN(n)) set(n);
    }
  };
  const handleBlur = () => {
    const n = parseInt(draft, 10);
    const next = Number.isNaN(n) ? clamp(min) : clamp(n);
    setDraft(String(next));
    set(next);
  };

  return (
    <div
      className={['mk-qty', size === 'sm' ? 'mk-qty--sm' : '', className].filter(Boolean).join(' ')}
      role="group"
      aria-label="购买数量"
      {...rest}
    >
      <button type="button" className="mk-qty__btn" aria-label="减少" disabled={value <= min} onClick={() => set(value - 1)}>−</button>
      <input
        className="mk-qty__input" type="number" inputMode="numeric" value={draft} min={min} max={hi}
        disabled={invalidRange}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      <button type="button" className="mk-qty__btn" aria-label="增加" disabled={invalidRange || value >= hi} onClick={() => set(value + 1)}>+</button>
    </div>
  );
}
