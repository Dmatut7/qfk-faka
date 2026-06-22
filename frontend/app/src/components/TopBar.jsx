import React from 'react';
import { Icons } from '../Icons.jsx';
import logoMark from '../../../design-system/assets/logo-mark.svg';

const navLinkStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 5, height: 44, padding: '0 10px',
  border: 'none', background: 'transparent', borderRadius: 'var(--radius-sm)',
  fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13, color: 'var(--text-muted)',
  cursor: 'pointer', whiteSpace: 'nowrap', flex: 'none',
};

/* 顶栏 — logo / 店名 / 门户入口 / 取卡入口。从设计系统 storefront 端口为 ESM。 */
export default function TopBar({ shopName, shopIntro, onHome, onLookup, onNews, onFaq, onPortal, back, onBack, title }) {
  return (
    <>
    {/* 顶栏高度抽成全局 CSS 变量,供 sticky 分类 tab 等用 top:var(--topbar-h) 对齐,避免硬编码 60。 */}
    <style>{':root{--topbar-h:60px;}@media(max-width:380px){.mk-navlabel{display:none;}}'}</style>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 'none' }}>
          {/* 门户入口:平台 / 资讯 / 常见问题(详情/支付等返回态隐藏,保持沉浸) */}
          {!back && onPortal && (
            <button onClick={onPortal} title="平台首页" style={navLinkStyle}>
              <Icons.ShieldCheck size={15} color="var(--text-muted)" />
              <span className="mk-navlabel">平台</span>
            </button>
          )}
          {!back && onNews && (
            <button onClick={onNews} title="最新资讯" style={navLinkStyle}>
              <Icons.Megaphone size={15} color="var(--text-muted)" />
              <span className="mk-navlabel">资讯</span>
            </button>
          )}
          {!back && onFaq && (
            <button onClick={onFaq} title="常见问题" style={navLinkStyle}>
              <Icons.Headset size={15} color="var(--text-muted)" />
              <span className="mk-navlabel">帮助</span>
            </button>
          )}
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
      </div>
    </header>
    </>
  );
}
