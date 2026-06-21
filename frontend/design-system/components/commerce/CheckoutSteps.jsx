import React from 'react';

const CSS = `
.mk-steps{ display:flex; align-items:center; width:100%; font-family:var(--font-sans); }
.mk-steps__item{ display:flex; align-items:center; gap:9px; flex:none; }
.mk-steps__dot{
  width:28px; height:28px; border-radius:50%; flex:none; display:flex; align-items:center; justify-content:center;
  font-size:13px; font-weight:var(--fw-bold); background:var(--surface-sunken); color:var(--text-subtle);
  border:2px solid var(--border); transition:all var(--dur-base) var(--ease-out);
}
.mk-steps__label{ font-size:var(--text-sm); font-weight:var(--fw-semibold); color:var(--text-subtle); white-space:nowrap; }
.mk-steps__line{ flex:1; height:2px; background:var(--border); margin:0 10px; border-radius:2px; min-width:16px; transition:background var(--dur-base) var(--ease-out); }
.mk-steps__item--done .mk-steps__dot{ background:var(--success-solid); border-color:var(--success-solid); color:#fff; }
.mk-steps__item--done .mk-steps__label{ color:var(--text-body); }
.mk-steps__item--active .mk-steps__dot{ background:var(--brand); border-color:var(--brand); color:#fff; box-shadow:var(--shadow-focus); }
.mk-steps__item--active .mk-steps__label{ color:var(--brand-active); font-weight:var(--fw-bold); }
.mk-steps__line--done{ background:var(--success-solid); }
`;
if (typeof document !== 'undefined' && !document.getElementById('mk-steps-css')) {
  const s = document.createElement('style'); s.id = 'mk-steps-css'; s.textContent = CSS; document.head.appendChild(s);
}

const CheckMini = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
);

export function CheckoutSteps({
  steps = ['选购', '下单', '付款', '取卡'], current = 0, className = '', ...rest
}) {
  return (
    <div className={['mk-steps', className].filter(Boolean).join(' ')} {...rest}>
      {steps.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : 'todo';
        return (
          <React.Fragment key={i}>
            <div className={`mk-steps__item mk-steps__item--${state}`}>
              <span className="mk-steps__dot">{state === 'done' ? <CheckMini /> : i + 1}</span>
              <span className="mk-steps__label">{label}</span>
            </div>
            {i < steps.length - 1 && <span className={`mk-steps__line${i < current ? ' mk-steps__line--done' : ''}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
