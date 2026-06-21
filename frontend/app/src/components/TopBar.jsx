import React from 'react';
import { Icons } from '../Icons.jsx';
import logoMark from '../../../design-system/assets/logo-mark.svg';

/* 顶栏 — logo / 店名 / 取卡入口。从设计系统 storefront 端口为 ESM。 */
export default function TopBar({ shopName, shopIntro, onHome, onLookup, back, onBack, title }) {
  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 20, background: 'rgba(255,255,255,0.86)',
        backdropFilter: 'saturate(180%) blur(12px)', WebkitBackdropFilter: 'saturate(180%) blur(12px)',
        borderBottom: '1px solid var(--border)',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div
        style={{
          maxWidth: 'var(--container-page)', margin: '0 auto', height: 'var(--topbar-h, 60px)', padding: '0 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {back ? (
            <button
              onClick={onBack}
              aria-label="返回"
              style={{
                width: 44, height: 44, marginLeft: -8, border: 'none', background: 'transparent',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: 'var(--text-strong)',
              }}
            >
              <Icons.ChevronLeft size={24} />
            </button>
          ) : (
            <img
              src={logoMark}
              width="32"
              height="32"
              alt=""
              style={{ cursor: 'pointer' }}
              onClick={onHome}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, minWidth: 0 }}>
            <span
              style={{
                fontWeight: 800, fontSize: 16, color: 'var(--text-strong)', letterSpacing: '-0.01em',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}
            >
              {title || shopName || '极客发卡'}
            </span>
            {!title && shopIntro && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{shopIntro}</span>
            )}
          </div>
        </div>
        <button
          onClick={onLookup}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 44, padding: '0 14px',
            border: '1.5px solid var(--border-strong)', background: '#fff', borderRadius: 'var(--radius-pill)',
            fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13, color: 'var(--text-strong)',
            cursor: 'pointer', whiteSpace: 'nowrap', flex: 'none',
          }}
        >
          <Icons.Package size={16} color="var(--brand)" />
          取卡 / 查单
        </button>
      </div>
    </header>
  );
}
