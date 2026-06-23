import React from 'react';
import { useAsync, Panel, Toolbar, DataTable, Pill, Modal, Field, ErrorBar } from '../ui.jsx';
import { Icons } from '../../Icons.jsx';
import { ApiError } from '../api.js';
import { Button } from '../../../../design-system/components/core/Button.jsx';
import { Input } from '../../../../design-system/components/core/Input.jsx';

// 已知平台配置键(对标鲸发卡设置):站点 / 客服 / 订单查询提示。
// 公开接口 GET /config 据这些键名组装 data;后台用 KV settings 逐项管理。
const KNOWN_KEYS = [
  'site_title',
  'kefu_qq',
  'kefu_wechat',
  'kefu_mobile',
  'kefu_qrcode',
  'order_query_tips',
  'default_commission_rate',
  'withdraw_fee_rate',
  'registration_require_invite',
];

// 费率字段(金融高危):0~1 之间的小数。展示换算百分比、保存前严格校验。
// 返回 { pct } 用于「当前 5%」展示;非法值返回 { error } 阻止提交。
function validateRate(raw) {
  const s = (raw == null ? '' : String(raw)).trim();
  if (s === '') return { error: '请填写费率(0~1 之间的小数,如 0.05 表示 5%)' };
  if (!/^\d*\.?\d+$/.test(s) || !Number.isFinite(Number(s))) {
    return { error: '费率必须是数字(0~1 之间的小数,如 0.05 表示 5%)' };
  }
  const n = Number(s);
  if (n < 0 || n > 1) {
    return { error: '费率必须在 0~1 之间(如 0.05 表示 5%,不要填 5)' };
  }
  // 保留两位百分比展示,去掉多余的尾随 0
  const pct = parseFloat((n * 100).toFixed(2));
  return { pct };
}

// 单项「保存」行:回填现值,变更后调 api.setSetting(key,value)。
// rate=true 时为费率字段:展示换算百分比并在保存前做 0~1 范围校验。
function SettingRow({ settingKey, label, hint, initial, multiline, onSaved, api, rate, boolean }) {
  const [value, setValue] = React.useState(initial != null ? String(initial) : '');
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [ok, setOk] = React.useState(false);

  // 现值异步加载完成后回填(initial 变化时同步)
  React.useEffect(() => {
    setValue(initial != null ? String(initial) : '');
    setErr('');
    setOk(false);
  }, [initial]);

  const dirty = value !== (initial != null ? String(initial) : '');

  // 费率换算展示:仅当 rate 且当前值能解析为合法 0~1 小数时显示「当前 N%」
  const rateInfo = rate ? validateRate(value) : null;

  async function save() {
    // 费率字段:保存前严格校验,非法直接 setErr 阻止提交(杜绝误填 5 当 500%)
    if (rate) {
      const v = validateRate(value);
      if (v.error) {
        setErr(v.error);
        setOk(false);
        return;
      }
    }
    setSaving(true);
    setErr('');
    setOk(false);
    try {
      await api.setSetting(settingKey, value);
      setOk(true);
      if (onSaved) onSaved();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : '保存失败,请重试');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Field label={label} hint={hint}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        {boolean ? (
          <select
            value={value === '1' ? '1' : '0'}
            onChange={(e) => { setValue(e.target.value); setOk(false); }}
            style={{
              flex: 1, minWidth: 0, padding: '10px 12px', borderRadius: 8,
              border: '1px solid var(--ds-border, #d0d5dd)', font: 'inherit', fontSize: 14,
              background: 'var(--ds-surface, #fff)', color: 'inherit',
            }}
          >
            <option value="0">否(关闭)</option>
            <option value="1">是(开启)</option>
          </select>
        ) : multiline ? (
          <textarea
            value={value}
            placeholder={hint}
            rows={4}
            onChange={(e) => {
              setValue(e.target.value);
              setOk(false);
            }}
            style={{
              flex: 1,
              minWidth: 0,
              resize: 'vertical',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid var(--ds-border, #d0d5dd)',
              font: 'inherit',
              fontSize: 14,
              lineHeight: 1.5,
              background: 'var(--ds-surface, #fff)',
              color: 'inherit',
            }}
          />
        ) : (
          <div style={{ flex: 1, minWidth: 0 }}>
            <Input
              value={value}
              placeholder={hint}
              onChange={(e) => {
                setValue(e.target.value);
                setOk(false);
              }}
            />
            {rate && rateInfo && rateInfo.error == null ? (
              <div style={{ marginTop: 4, fontSize: 12, fontWeight: 600 }}>
                <span style={{ color: 'var(--brand)' }}>当前 {rateInfo.pct}%</span>
              </div>
            ) : null}
          </div>
        )}
        <Button
          size="sm"
          onClick={save}
          loading={saving}
          disabled={saving || !dirty}
          iconLeft={<Icons.Check />}
        >
          保存
        </Button>
      </div>
      {err ? (
        <div style={{ marginTop: 6 }}>
          <ErrorBar message={err} />
        </div>
      ) : ok ? (
        <div style={{ marginTop: 6 }}>
          <Pill tone="success">已保存</Pill>
        </div>
      ) : null}
    </Field>
  );
}

export default function Settings({ api }) {
  // 后端 admin/System::settings 返回 { items: { setting_key: setting_value, ... } }
  const cfg = useAsync(() => api.settings(), []);

  const items = React.useMemo(() => (cfg.data && cfg.data.items) || {}, [cfg.data]);

  // 其他配置项:剔除已知键后的原始 KV(兼容任意键)
  const rows = React.useMemo(() => {
    return Object.keys(items)
      .filter((k) => !KNOWN_KEYS.includes(k))
      .map((k) => ({ key: k, value: items[k] }));
  }, [items]);

  const get = (k) => (items[k] != null ? items[k] : '');

  /* ---- 其他配置项编辑(裸 KV)---- */
  const [editing, setEditing] = React.useState(null);
  const [value, setValue] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [formErr, setFormErr] = React.useState('');

  function openEdit(row) {
    setEditing(row);
    setValue(row.value != null ? String(row.value) : '');
    setFormErr('');
  }

  async function submit() {
    if (!editing) return;
    setSaving(true);
    setFormErr('');
    try {
      await api.setSetting(editing.key, value);
      setEditing(null);
      cfg.reload();
    } catch (e) {
      setFormErr(e instanceof ApiError ? e.message : '保存失败,请重试');
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    {
      key: 'key',
      title: '配置项',
      width: 280,
      render: (row) => <code style={{ fontSize: 13 }}>{row.key}</code>,
    },
    {
      key: 'value',
      title: '当前值',
      render: (row) =>
        row.value == null || row.value === '' ? (
          <Pill tone="neutral">未设置</Pill>
        ) : (
          <span style={{ wordBreak: 'break-all' }}>{String(row.value)}</span>
        ),
    },
    {
      key: 'actions',
      title: '操作',
      width: 120,
      align: 'right',
      render: (row) => (
        <Button size="sm" variant="ghost" iconLeft={<Icons.Lock />} onClick={() => openEdit(row)}>
          编辑
        </Button>
      ),
    },
  ];

  const reload = cfg.reload;

  return (
    <>
      <Panel
        title="平台配置"
        subtitle="站点信息、客服方式与订单查询提示(公开接口 GET /config 据此展示)"
        actions={
          <Button variant="ghost" iconLeft={<Icons.RefreshCw />} onClick={reload}>
            刷新
          </Button>
        }
      >
        {cfg.loading ? (
          <div style={{ padding: 24, opacity: 0.6 }}>加载中…</div>
        ) : cfg.error ? (
          <div style={{ padding: 24 }}>
            <Pill tone="danger">加载失败</Pill>{' '}
            <Button size="sm" variant="ghost" onClick={reload}>
              重试
            </Button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 24 }}>
            {/* 站点 */}
            <section>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icons.Shield /> 站点信息
              </h3>
              <SettingRow
                api={api}
                settingKey="site_title"
                label="站点标题"
                hint="浏览器标签与页面标题,如「QFK 发卡平台」"
                initial={get('site_title')}
                onSaved={reload}
              />
            </section>

            {/* 客服 */}
            <section>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icons.Headset /> 客服方式
              </h3>
              <SettingRow
                api={api}
                settingKey="kefu_qq"
                label="客服 QQ"
                hint="客服 QQ 号"
                initial={get('kefu_qq')}
                onSaved={reload}
              />
              <SettingRow
                api={api}
                settingKey="kefu_wechat"
                label="客服微信"
                hint="客服微信号"
                initial={get('kefu_wechat')}
                onSaved={reload}
              />
              <SettingRow
                api={api}
                settingKey="kefu_mobile"
                label="客服电话"
                hint="客服手机号 / 座机"
                initial={get('kefu_mobile')}
                onSaved={reload}
              />
              <SettingRow
                api={api}
                settingKey="kefu_qrcode"
                label="客服二维码"
                hint="二维码图片 URL"
                initial={get('kefu_qrcode')}
                onSaved={reload}
              />
              {get('kefu_qrcode') ? (
                <div style={{ marginTop: 4, marginBottom: 8 }}>
                  <img
                    src={get('kefu_qrcode')}
                    alt="客服二维码预览"
                    style={{
                      width: 120,
                      height: 120,
                      objectFit: 'contain',
                      border: '1px solid var(--ds-border, #e4e7ec)',
                      borderRadius: 8,
                      background: '#fff',
                    }}
                  />
                </div>
              ) : null}
            </section>

            {/* 费率配置 */}
            <section>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icons.Zap /> 费率配置
              </h3>
              <SettingRow
                api={api}
                settingKey="default_commission_rate"
                label="默认抽佣率"
                hint="平台对商户订单的默认抽佣比例,0~1 之间的小数(如 0.05 表示 5%)"
                initial={get('default_commission_rate')}
                rate
                onSaved={reload}
              />
              <SettingRow
                api={api}
                settingKey="withdraw_fee_rate"
                label="提现手续费率"
                hint="商户提现时扣取的手续费比例,0~1 之间的小数(如 0.01 表示 1%)"
                initial={get('withdraw_fee_rate')}
                rate
                onSaved={reload}
              />
              <SettingRow
                api={api}
                settingKey="registration_require_invite"
                label="商户注册需邀请码"
                hint="开启后,新商户注册必须填写有效邀请码(在「邀请码」页生成);关闭则开放注册"
                initial={get('registration_require_invite')}
                boolean
                onSaved={reload}
              />
            </section>

            {/* 订单查询提示 */}
            <section>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icons.MessageCircle /> 订单查询提示
              </h3>
              <SettingRow
                api={api}
                settingKey="order_query_tips"
                label="提示文案"
                hint="买家查询订单页展示的说明文案,支持多行"
                initial={get('order_query_tips')}
                multiline
                onSaved={reload}
              />
            </section>
          </div>
        )}
      </Panel>

      <Panel
        style={{ marginTop: 18 }}
        title="其他配置项"
        subtitle="读写平台原始 KV 配置(setting_key / setting_value),兼容任意键"
      >
        <Toolbar>共 {rows.length} 项</Toolbar>
        <DataTable
          columns={columns}
          rows={rows}
          loading={cfg.loading}
          error={cfg.error}
          onReload={reload}
          empty="暂无其他配置项"
        />
      </Panel>

      <Modal
        open={!!editing}
        title="编辑配置项"
        onClose={() => (saving ? null : setEditing(null))}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
              取消
            </Button>
            <Button onClick={submit} loading={saving}>
              保存
            </Button>
          </>
        }
      >
        {formErr ? (
          <div style={{ marginBottom: 12 }}>
            <ErrorBar message={formErr} />
          </div>
        ) : null}

        <Field label="配置项 Key" hint="setting_key,唯一标识,创建后不可修改">
          <Input value={editing ? editing.key : ''} disabled />
        </Field>
        <Field label="配置值 Value" hint="setting_value,留空表示置空(null)">
          <Input value={value} placeholder="配置值" onChange={(e) => setValue(e.target.value)} />
        </Field>
      </Modal>
    </>
  );
}
