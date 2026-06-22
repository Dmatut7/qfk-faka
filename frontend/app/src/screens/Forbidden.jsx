import React from 'react';
import { api, ApiError } from '../api.js';
import { Icons } from '../Icons.jsx';

/* 门户禁售目录(对标鲸商城PRO 网站「禁售目录」)。按类目分组展示平台违禁商品。 */
export default function Forbidden({ onBack }) {
  const [groups, setGroups] = React.useState(null);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let alive = true;
    api.forbiddenCatalog()
      .then((d) => alive && setGroups(Array.isArray(d.groups) ? d.groups : []))
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : '加载失败'));
    return () => { alive = false; };
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '18px 16px 80px' }}>
      {onBack && (
        <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'transparent', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
          <Icons.ChevronLeft size={18} />返回
        </button>
      )}
      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.02em', margin: '12px 0 6px' }}>禁售目录</h1>
      <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>以下类目商品禁止在本平台销售。商家上架请遵守平台规则,违规商品将被下架并追责。</p>

      <div style={{ marginTop: 14, display: 'flex', gap: 10, padding: '12px 14px', background: 'var(--danger-bg, #fdeced)', border: '1px solid var(--danger-solid)', borderRadius: 'var(--radius-md)' }}>
        <Icons.AlertTriangle size={18} color="var(--danger-solid)" style={{ flex: 'none', marginTop: 1 }} />
        <span style={{ fontSize: 12.5, color: 'var(--danger-fg)', lineHeight: 1.5 }}>请勿购买或销售下列商品;如遇违规商品,欢迎向平台举报。</span>
      </div>

      {error ? (
        <div style={{ marginTop: 18, textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0' }}>{error}</div>
      ) : groups == null ? (
        <div style={{ marginTop: 18, textAlign: 'center', color: 'var(--text-subtle)', padding: '40px 0' }}>加载中…</div>
      ) : groups.length === 0 ? (
        <div style={{ marginTop: 18, textAlign: 'center', color: 'var(--text-subtle)', padding: '40px 0' }}>暂无禁售目录</div>
      ) : (
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {groups.map((g) => (
            <section key={g.category} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xs)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 14.5, fontWeight: 800, color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icons.Lock size={15} color="var(--danger-solid)" />{g.category}
              </div>
              <div>
                {(g.items || []).map((it) => (
                  <div key={it.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-strong)' }}>{it.title}</div>
                    {it.description ? <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.5 }}>{it.description}</div> : null}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
