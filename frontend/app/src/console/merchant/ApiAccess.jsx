import React from 'react';
import { Panel } from '../ui.jsx';
import { Button } from '../../../../design-system/components/core/Button.jsx';
import { Icons } from '../../Icons.jsx';
import { merchantApi, ApiError } from '../api.js';

/** 商户开放 API:生成/重置签名凭据 + 调用说明。 */
export default function ApiAccess() {
  const [creds, setCreds] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');

  const generate = async () => {
    if (busy) return;
    setErr(''); setBusy(true);
    try {
      setCreds(await merchantApi.generateApiCredentials());
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : '生成失败,请重试');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel title="开放 API" subtitle="供你的系统程序化拉取本店商品/库存与订单(签名鉴权,只读)">
      <div style={{ marginBottom: 16 }}>
        <Button onClick={generate} loading={busy} iconLeft={<Icons.Lock size={16} />}>
          {creds ? '重置凭据' : '生成 API 凭据'}
        </Button>
        {err ? <div style={{ marginTop: 8, color: 'var(--danger-fg)', fontSize: 13 }}>{err}</div> : null}
        <div style={{ marginTop: 8, fontSize: 12.5, color: 'var(--text-muted)' }}>
          重置会使旧凭据立即失效。
        </div>
      </div>

      {creds ? (
        <div style={{ border: '1px solid var(--pending-border, #fdba74)', background: 'var(--pending-bg, #fffbeb)', borderRadius: 8, padding: 14, marginBottom: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 10, color: 'var(--pending-fg, #92400e)', fontSize: 13.5 }}>
            ⚠ api_secret 仅此一次显示,请立即保存(离开本页不再可见)
          </div>
          <CredField label="app_key" value={creds.api_key} />
          <CredField label="api_secret" value={creds.api_secret} />
        </div>
      ) : null}

      <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.85 }}>
        <div style={{ fontWeight: 700, color: 'var(--text-strong)', marginBottom: 6 }}>调用方式</div>
        <p>所有请求用 <b>POST</b>,参数须含 <code>app_key</code>、<code>timestamp</code>(秒级)、<code>sign</code>。</p>
        <p>签名:剔除 <code>sign</code>,其余参数按<b>键名升序</b>拼成 <code>k=v&amp;k=v</code>,对该串做 <code>HMAC-SHA256(明文, api_secret)</code> 取小写 hex;<code>timestamp</code> 与服务器偏差须 ≤ ±300 秒(防重放)。</p>
        <p>端点:<code>POST /api/products</code>(本店商品+库存)、<code>POST /api/order/query</code>(传 <code>order_no</code>,查本店订单状态/发货内容)。响应统一 <code>{'{'} code, msg, data {'}'}</code>。</p>
      </div>
    </Panel>
  );
}

function CredField({ label, value }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    try {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <code style={{ flex: 1, minWidth: 0, fontSize: 13, wordBreak: 'break-all', background: '#fff', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>{value}</code>
        <Button size="sm" variant="ghost" onClick={copy}>{copied ? '已复制' : '复制'}</Button>
      </div>
    </div>
  );
}
