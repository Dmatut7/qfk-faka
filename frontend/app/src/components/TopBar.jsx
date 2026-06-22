import React from 'react';
import { Icons } from '../Icons.jsx';
import { Button } from '../../../design-system/components/core/Button.jsx';
import logoMark from '../../../design-system/assets/logo-mark.svg';

/*
 * 顶栏 — logo / 店名 / 门户入口 / 取卡入口。
 * 从设计系统 storefront 端口为新橙色淘宝 UI Kit 布局(--brand #FF5000 橙色 blur sticky)。
 * 纯展示组件:无 useState/useEffect/api;业务事实 = props 导航回调 + 返回态。
 * 全部回调(onHome/onLookup/onNews/onFaq/onPortal)与 back/onBack/title 返回态原样保留。
 * 配色全走 CSS 变量,无硬编码蓝/靛/紫。
 */
export default function TopBar({ shopName, shopIntro, onHome, onLookup, onNews, onFaq, onPortal, back, onBack, title }) {
  return (
    <>
      {/* 顶栏高度抽成全局 CSS 变量,供 sticky 分类 tab 等用 top:var(--topbar-h) 对齐,避免硬编码 60。 */}
      <style>{`
        :root{ --topbar-h:60px; }
        @media(max-width:480px){ .mk-topbar-navlabel{ display:none; } .mk-topbar-intro{ display:none; } .mk-cta-full{ display:none; } }
        .mk-topbar-navbtn{ height:44px; padding:0 10px; }
        .mk-topbar-navbtn span{ font-size:13px; }
        .mk-topbar-logo{
          width:36px; height:36px; border-radius:var(--radius-md);
          background:var(--brand-gradient); display:flex; align-items:center; justify-content:center;
          box-shadow:var(--shadow-brand); cursor:pointer; flex:none;
          transition:transform var(--dur-fast,140ms) var(--ease-out,ease);
        }
        .mk-topbar-logo:active{ transform:translateY(1px) scale(0.98); }
        .mk-topbar-logo img{ width:22px; height:22px; display:block; filter:brightness(0) invert(1); }
      `}</style>
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
          {/* 左:返回态 = 返回箭头 + title;普通态 = 橙色渐变 logo 砖 + 店名/简介 */}
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
              <div
                className="mk-topbar-logo"
                role="button"
                aria-label="店铺首页"
                onClick={onHome}
              >
                <img src={logoMark} alt="" />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, minWidth: 0 }}>
              <span
                style={{
                  fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 16, color: 'var(--text-strong)',
                  letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}
              >
                {title || shopName || '极客发卡'}
              </span>
              {!title && shopIntro && (
                <span className="mk-topbar-intro" style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {shopIntro}
                </span>
              )}
            </div>
          </div>

          {/* 右:门户入口(详情/支付等返回态隐藏,保持沉浸) + 取卡/查单 CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 'none' }}>
            {!back && onPortal && (
              <Button
                variant="ghost"
                size="sm"
                className="mk-topbar-navbtn"
                onClick={onPortal}
                title="平台首页"
                iconLeft={<Icons.ShieldCheck size={15} color="var(--text-muted)" />}
              >
                <span className="mk-topbar-navlabel">平台</span>
              </Button>
            )}
            {!back && onNews && (
              <Button
                variant="ghost"
                size="sm"
                className="mk-topbar-navbtn"
                onClick={onNews}
                title="最新资讯"
                iconLeft={<Icons.Megaphone size={15} color="var(--text-muted)" />}
              >
                <span className="mk-topbar-navlabel">资讯</span>
              </Button>
            )}
            {!back && onFaq && (
              <Button
                variant="ghost"
                size="sm"
                className="mk-topbar-navbtn"
                onClick={onFaq}
                title="常见问题"
                iconLeft={<Icons.Headset size={15} color="var(--text-muted)" />}
              >
                <span className="mk-topbar-navlabel">帮助</span>
              </Button>
            )}
            <Button
              variant="secondary"
              size="md"
              onClick={onLookup}
              style={{ borderRadius: 'var(--radius-pill)' }}
              iconLeft={<Icons.Package size={16} color="var(--brand)" />}
            >
              取卡<span className="mk-cta-full"> / 查单</span>
            </Button>
          </div>
        </div>
      </header>
    </>
  );
}
