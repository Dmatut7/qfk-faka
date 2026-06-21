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
.mk-qty__input:focus{ outline:none; }
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
  const clamp = (n) => Math.max(min, Math.min(max, n));
  const set = (n) => onChange && onChange(clamp(n));
  return (
    <div className={['mk-qty', size === 'sm' ? 'mk-qty--sm' : '', className].filter(Boolean).join(' ')} {...rest}>
      <button type="button" className="mk-qty__btn" aria-label="减少" disabled={value <= min} onClick={() => set(value - 1)}>−</button>
      <input
        className="mk-qty__input" type="number" inputMode="numeric" value={value} min={min} max={max}
        onChange={(e) => { const n = parseInt(e.target.value, 10); set(Number.isNaN(n) ? min : n); }}
      />
      <button type="button" className="mk-qty__btn" aria-label="增加" disabled={value >= max} onClick={() => set(value + 1)}>+</button>
    </div>
  );
}
