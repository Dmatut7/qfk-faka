import React from 'react';
import { useAsync, Panel, Field, Money, Pill, ErrorBar } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { ApiError } from '../api.js';
import { Button } from '../../../../design-system/components/core/Button.jsx';
import { Input } from '../../../../design-system/components/core/Input.jsx';
import { THEMES, THEME_KEYS } from '../../themes.js';

const EMPTY_FORM = {
  logo: '',
  cover: '',
  theme: 'default',
  intro: '',
  announcement: '',
  contact_qq: '',
  contact_wechat: '',
  contact_mobile: '',
};

export default function Shop({ api }) {
  const shop = useAsync(() => api.shop(), []);

  const [form, setForm] = React.useState(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState('');
  const [okMsg, setOkMsg] = React.useState('');

  const data = shop.data || null;

  // 数据到达后回填表单
  React.useEffect(() => {
    if (!data) return;
    setForm({
      logo: data.logo || '',
      cover: data.cover || '',
      theme: data.theme || 'default',
      intro: data.intro || '',
      announcement: data.announcement || '',
      contact_qq: data.contact_qq || '',
      contact_wechat: data.contact_wechat || '',
      contact_mobile: data.contact_mobile || '',
    });
  }, [data]);

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setOkMsg(''); };

  async function submit() {
    setFormError('');
    setOkMsg('');
    setSaving(true);
    try {
      await api.updateShop({
        logo: form.logo.trim(),
        cover: form.cover.trim(),
        theme: form.theme,
        intro: form.intro,
        announcement: form.announcement,
        contact_qq: form.contact_qq.trim(),
        contact_wechat: form.contact_wechat.trim(),
        contact_mobile: form.contact_mobile.trim(),
      });
      setOkMsg('店铺装修已保存');
      shop.reload();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : '保存失败,请重试');
    } finally {
      setSaving(false);
    }
  }

  if (shop.loading) {
    return (
      <Panel title="店铺装修">
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>加载中…</div>
      </Panel>
    );
  }
  if (shop.error) {
    return <ErrorBar message={shop.error} onRetry={shop.reload} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 预览:封面 + logo */}
      <Panel title="店铺预览" subtitle="买家访问店铺首页时看到的头图与标识" padded={false}>
        <div style={{ position: 'relative' }}>
          <div style={{
            height: 160, background: form.cover ? `center/cover no-repeat url(${form.cover})` : 'var(--surface-sunken)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)', fontSize: 13,
          }}>
            {!form.cover && '未设置封面图'}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, padding: '0 20px', marginTop: -34 }}>
            <div style={{
              width: 68, height: 68, borderRadius: 'var(--radius-lg)', border: '3px solid #fff', flex: 'none',
              background: form.logo ? `center/cover no-repeat url(${form.logo})` : 'var(--brand-soft)',
              boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {!form.logo && <Icons.Package size={26} color="var(--brand)" />}
            </div>
            <div style={{ paddingBottom: 6, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 8 }}>
                {data?.store_name || '我的店铺'}
                {Number(data?.verified) === 1 && <Pill tone="secure"><Icons.ShieldCheck size={13} /> 已认证</Pill>}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                {data?.store_slug ? `/s/${data.store_slug}` : ''}
              </div>
            </div>
          </div>
          <div style={{ height: 16 }} />
        </div>
      </Panel>

      {/* 平台控制的只读信息 */}
      <Panel title="店铺信息" subtitle="以下由平台管理,商户不可修改">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
          <ReadItem label="店铺名称">
            <span style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{data?.store_name || '—'}</span>
          </ReadItem>
          <ReadItem label="保证金">
            <Money amount={data?.deposit} strong />
          </ReadItem>
          <ReadItem label="认证状态">
            {Number(data?.verified) === 1
              ? <Pill tone="secure">已认证</Pill>
              : <Pill tone="neutral">未认证</Pill>}
          </ReadItem>
          <ReadItem label="累计成交">
            <span style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{Number(data?.sales_count) || 0}</span>
          </ReadItem>
        </div>
      </Panel>

      {/* 可编辑装修 */}
      <Panel
        title="装修设置"
        subtitle="Logo、封面、简介、公告与联系方式"
        actions={
          <Button size="sm" loading={saving} iconLeft={<Icons.ShieldCheck size={16} />} onClick={submit}>保存装修</Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {formError && <ErrorBar message={formError} />}
          {okMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-md)', color: 'var(--success-fg)', fontSize: 13 }}>
              <Icons.Check size={16} color="var(--success-fg)" /><span>{okMsg}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Logo 图片地址" value={form.logo} onChange={set('logo')} placeholder="https://…/logo.png" />
            <Input label="封面图片地址" value={form.cover} onChange={set('cover')} placeholder="https://…/cover.jpg" />
          </div>

          <Field label="店铺主题" hint="选择店铺前台品牌配色">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {THEME_KEYS.map((k) => {
                const t = THEMES[k];
                const on = form.theme === k;
                return (
                  <button key={k} type="button" onClick={() => { setForm((f) => ({ ...f, theme: k })); setOkMsg(''); }}
                    title={t.label}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer',
                      borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 700,
                      border: on ? `2px solid ${t.swatch}` : '1px solid var(--border)', background: '#fff',
                      color: on ? t.swatch : 'var(--text-muted)',
                    }}>
                    <span style={{ width: 16, height: 16, borderRadius: '50%', background: t.swatch, flex: 'none' }} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="店铺简介" hint="一句话介绍你的店铺(可选)">
            <textarea value={form.intro} onChange={set('intro')} rows={3} style={textareaStyle} placeholder="例如:专业可靠的会员账号供应商,7×24 自动发货" />
          </Field>

          <Field label="店铺公告" hint="展示在店铺首页的公告(可选,支持多行)">
            <textarea value={form.announcement} onChange={set('announcement')} rows={4} style={textareaStyle} placeholder="例如:节假日照常发货,有问题请联系客服 QQ…" />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Input label="客服 QQ" value={form.contact_qq} onChange={set('contact_qq')} placeholder="QQ 号" />
            <Input label="客服微信" value={form.contact_wechat} onChange={set('contact_wechat')} placeholder="微信号" />
            <Input label="客服手机" value={form.contact_mobile} onChange={set('contact_mobile')} placeholder="手机号" />
          </div>
        </div>
      </Panel>
    </div>
  );
}

function ReadItem({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

const textareaStyle = {
  width: '100%', padding: '10px 12px', fontSize: 'var(--text-base)', fontFamily: 'inherit',
  border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
  background: '#fff', color: 'var(--text-strong)', resize: 'vertical',
};
