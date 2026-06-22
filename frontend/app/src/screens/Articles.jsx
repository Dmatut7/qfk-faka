import React from 'react';
import { api, ApiError } from '../api.js';
import { Icons } from '../Icons.jsx';

/* 门户资讯 / 常见问题页(对标鲸商城PRO「最新资讯 / 常见问题」)。
   type=1 资讯,type=2 常见问题。列表点击进详情;详情走 /index/articles/:id(自增浏览量)。
   纯前端,数据来自已就绪的门户公开 API。 */

const TYPE_META = {
  1: { title: '最新资讯', icon: 'Megaphone', empty: '暂无资讯' },
  2: { title: '常见问题', icon: 'Headset', empty: '暂无常见问题' },
};

function fmtDate(s) {
  if (!s) return '';
  return String(s).slice(0, 10);
}

export default function Articles({ type = 1, onBack }) {
  const meta = TYPE_META[type] || TYPE_META[1];
  const [list, setList] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [detail, setDetail] = React.useState(null);     // 当前打开的详情
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [cat, setCat] = React.useState('');             // FAQ 分类筛选

  const load = React.useCallback(() => {
    setLoading(true);
    setError('');
    api.articles({ type })
      .then((d) => setList(Array.isArray(d.items) ? d.items : []))
      .catch((e) => setError(e instanceof ApiError ? e.message : '加载失败,请重试'))
      .finally(() => setLoading(false));
  }, [type]);

  React.useEffect(() => { load(); setDetail(null); setCat(''); }, [load]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    window.scrollTo(0, 0);
    try {
      const d = await api.article(id);
      setDetail(d);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '内容加载失败');
    } finally {
      setDetailLoading(false);
    }
  };

  // FAQ 分类(从列表聚合,带「全部」)
  const cats = React.useMemo(() => {
    const set = [];
    for (const a of (list || [])) {
      const c = (a.category || '').trim();
      if (c && !set.includes(c)) set.push(c);
    }
    return set;
  }, [list]);

  const shown = (list || []).filter((a) => !cat || (a.category || '').trim() === cat);

  // ===== 详情视图 =====
  if (detail) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '18px 16px 80px' }}>
        <BackLink onClick={() => setDetail(null)} text={'返回' + meta.title} />
        <article style={{ marginTop: 12, background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px 22px', boxShadow: 'var(--shadow-sm)' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.3 }}>{detail.title}</h1>
          <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 12.5, color: 'var(--text-subtle)' }}>
            <span>{fmtDate(detail.create_time)}</span>
            {detail.category ? <span>· {detail.category}</span> : null}
            <span>· {detail.views ?? 0} 次浏览</span>
          </div>
          <div
            style={{ marginTop: 18, fontSize: 14.5, lineHeight: 1.8, color: 'var(--text-body)', wordBreak: 'break-word' }}
            dangerouslySetInnerHTML={{ __html: detail.content || '' }}
          />
        </article>
      </div>
    );
  }

  // ===== 列表视图 =====
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '18px 16px 80px' }}>
      {onBack && <BackLink onClick={onBack} text="返回首页" />}
      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text-strong)', letterSpacing: '-0.02em', margin: '12px 0 0' }}>{meta.title}</h1>

      {/* FAQ 分类筛选 */}
      {cats.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          {['', ...cats].map((c) => {
            const on = c === cat;
            return (
              <button key={c || 'all'} onClick={() => setCat(c)} style={{
                padding: '6px 14px', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700,
                border: on ? '1.5px solid var(--brand)' : '1px solid var(--border)',
                background: on ? 'var(--brand-soft)' : '#fff',
                color: on ? 'var(--brand-active)' : 'var(--text-muted)',
              }}>{c || '全部'}</button>
            );
          })}
        </div>
      )}

      {(loading || detailLoading) ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-subtle)' }}>加载中…</div>
      ) : error ? (
        <div style={{ marginTop: 18, textAlign: 'center', padding: '40px 0' }}>
          <Icons.AlertTriangle size={36} color="var(--danger-solid)" />
          <div style={{ marginTop: 10, fontSize: 14, color: 'var(--text-strong)' }}>{error}</div>
          <button onClick={load} style={{ marginTop: 12, height: 38, padding: '0 18px', border: 'none', background: 'var(--brand)', color: '#fff', borderRadius: 'var(--radius-pill)', fontWeight: 700, cursor: 'pointer' }}>重试</button>
        </div>
      ) : shown.length === 0 ? (
        <div style={{ marginTop: 18, textAlign: 'center', padding: '50px 0', color: 'var(--text-subtle)' }}>
          <Icons.Inbox size={42} />
          <div style={{ marginTop: 10, fontSize: 14 }}>{meta.empty}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
          {shown.map((a) => (
            <button key={a.id} onClick={() => openDetail(a.id)} style={{
              display: 'block', textAlign: 'left', width: '100%', cursor: 'pointer',
              background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
              padding: '16px 18px', fontFamily: 'var(--font-sans)', boxShadow: 'var(--shadow-xs)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</span>
                <Icons.ChevronRight size={16} color="var(--text-subtle)" />
              </div>
              {a.summary ? <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.summary}</div> : null}
              <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 8, display: 'flex', gap: 12 }}>
                <span>{fmtDate(a.create_time)}</span>
                {a.category ? <span>{a.category}</span> : null}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BackLink({ onClick, text }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'transparent',
      color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
      cursor: 'pointer', padding: 0,
    }}><Icons.ChevronLeft size={18} />{text}</button>
  );
}
