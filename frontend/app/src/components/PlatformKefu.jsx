import React from 'react';
import { Icons } from '../Icons.jsx';

/* 平台级客服(区别于店铺商户客服):
   - 全局右下角固定「客服」悬浮按钮(买家所有页面共用,挂在 App 层)
   - 点击弹出 Modal,展示平台 kefu 的 QQ/微信/手机(可复制)+ 二维码图(有则显示)
   复用 StorefrontHome 里 ContactRow 的复制兜底写法(clipboard → execCommand)。 */

/* —— 可复制联系方式行 —— */
function ContactRow({ icon, label, value }) {
  const [copied, setCopied] = React.useState(false);
  if (!value) return null;
  const copy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(String(value));
      else {
        const ta = document.createElement('textarea');
        ta.value = String(value); document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta);
      }
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    } catch { /* 复制失败静默 */ }
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ display: 'flex', color: 'var(--brand-active)', flex: 'none' }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)', wordBreak: 'break-all' }}>{value}</div>
      </div>
      <button type="button" onClick={copy} style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, height: 32, padding: '0 12px', flex: 'none',
        border: '1px solid var(--brand-soft-border)', background: copied ? 'var(--success-bg)' : 'var(--brand-soft)',
        color: copied ? 'var(--success-fg)' : 'var(--brand-active)', borderRadius: 'var(--radius-pill)',
        fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', whiteSpace: 'nowrap',
      }}>
        {copied ? <><Icons.Check size={14} />已复制</> : <><Icons.Copy size={14} />复制</>}
      </button>
    </div>
  );
}

/* —— 平台客服弹窗 —— */
function PlatformKefuModal({ kefu, onClose }) {
  const k = kefu || {};
  const qrcode = (k.qrcode || '').trim();
  const empty = !k.qq && !k.wechat && !k.mobile && !qrcode;
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(18,27,42,.5)',
        backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="平台客服"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460, maxHeight: '82vh', overflowY: 'auto', background: '#fff',
          borderRadius: '18px 18px 0 0', padding: '18px 18px calc(18px + env(safe-area-inset-bottom, 0px))',
          boxShadow: 'var(--shadow-lg, 0 -10px 40px rgba(18,27,42,.18))', animation: 'mk-sheet-up .22s ease-out',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800, color: 'var(--text-strong)' }}>
            <Icons.Headset size={20} color="var(--brand-active)" />平台客服
          </div>
          <button type="button" onClick={onClose} aria-label="关闭" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32,
            border: 'none', background: 'var(--surface-sunken)', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-muted)',
          }}><Icons.X size={18} /></button>
        </div>
        {empty ? (
          <div style={{ padding: '28px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            平台暂未提供客服联系方式
          </div>
        ) : (
          <div>
            <ContactRow icon={<Icons.MessageCircle size={18} />} label="平台客服 QQ" value={k.qq} />
            <ContactRow icon={<Icons.MessageCircle size={18} />} label="平台客服微信" value={k.wechat} />
            <ContactRow icon={<Icons.Phone size={18} />} label="平台客服手机" value={k.mobile} />
            {qrcode && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 0 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-muted)' }}>
                  <Icons.QrCode size={15} color="var(--text-muted)" />扫码联系平台客服
                </div>
                <img
                  src={qrcode}
                  alt="平台客服二维码"
                  style={{
                    width: 168, height: 168, objectFit: 'contain', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)', background: '#fff',
                  }}
                />
              </div>
            )}
          </div>
        )}
        <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-subtle)', textAlign: 'center', lineHeight: 1.5 }}>
          这是平台官方客服;交易问题可咨询此处,谨防站外私下转账。
        </div>
      </div>
      <style>{'@keyframes mk-sheet-up{from{transform:translateY(100%)}to{transform:translateY(0)}}'}</style>
    </div>
  );
}

/* —— 全局右下角悬浮「客服」按钮 + 弹窗 —— */
export default function PlatformKefu({ kefu }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="联系平台客服"
        style={{
          position: 'fixed', right: 16, bottom: 'calc(20px + env(safe-area-inset-bottom, 0px))', zIndex: 90,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
          width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'var(--brand)', color: '#fff', fontFamily: 'var(--font-sans)',
          boxShadow: 'var(--shadow-brand, 0 6px 18px rgba(255,80,0,.4))',
        }}
      >
        <Icons.Headset size={20} color="#fff" />
        <span style={{ fontSize: 10, fontWeight: 700, lineHeight: 1 }}>客服</span>
      </button>
      {open && <PlatformKefuModal kefu={kefu} onClose={() => setOpen(false)} />}
    </>
  );
}
