/* @ds-bundle: {"format":3,"namespace":"MiaoKa_b7a409","components":[{"name":"CardKey","sourcePath":"components/commerce/CardKey.jsx"},{"name":"CheckoutSteps","sourcePath":"components/commerce/CheckoutSteps.jsx"},{"name":"OrderStatusBadge","sourcePath":"components/commerce/OrderStatusBadge.jsx"},{"name":"PaymentOption","sourcePath":"components/commerce/PaymentOption.jsx"},{"name":"ProductCard","sourcePath":"components/commerce/ProductCard.jsx"},{"name":"ProductListItem","sourcePath":"components/commerce/ProductListItem.jsx"},{"name":"ConsoleShell","sourcePath":"components/console/ConsoleShell.jsx"},{"name":"DataTable","sourcePath":"components/console/DataTable.jsx"},{"name":"Panel","sourcePath":"components/console/Panel.jsx"},{"name":"Pill","sourcePath":"components/console/Pill.jsx"},{"name":"StatCard","sourcePath":"components/console/StatCard.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"},{"name":"PriceTag","sourcePath":"components/core/PriceTag.jsx"},{"name":"QuantityStepper","sourcePath":"components/core/QuantityStepper.jsx"}],"sourceHashes":{"components/commerce/CardKey.jsx":"8c53d844cd07","components/commerce/CheckoutSteps.jsx":"c23ed992305f","components/commerce/OrderStatusBadge.jsx":"3f7d39f7cf11","components/commerce/PaymentOption.jsx":"c884c6d30321","components/commerce/ProductCard.jsx":"2ca876b5203c","components/commerce/ProductListItem.jsx":"22c9e12f0772","components/console/ConsoleShell.jsx":"8cc847397ed0","components/console/DataTable.jsx":"56ca567ecf09","components/console/Panel.jsx":"3368deb740d6","components/console/Pill.jsx":"63fd38a20934","components/console/StatCard.jsx":"0b6db0bb264a","components/core/Badge.jsx":"42a553e2fd45","components/core/Button.jsx":"2352c8d8f79d","components/core/Card.jsx":"d163888f26bf","components/core/Input.jsx":"e39b3f15f4f6","components/core/PriceTag.jsx":"73e0c42ecbfb","components/core/QuantityStepper.jsx":"25bff0e23c82","ui_kits/admin/adminapp.js":"395de22f3c94","ui_kits/admin/data.js":"8e9a32e6cf26","ui_kits/admin/helpers.js":"0df2b8fa8434","ui_kits/admin/icons.js":"e0d1d5a90cba","ui_kits/merchant/data.js":"2767272f67da","ui_kits/merchant/helpers.js":"0df2b8fa8434","ui_kits/merchant/icons.js":"e0d1d5a90cba","ui_kits/merchant/merchantapp.js":"985107293fcb","ui_kits/storefront/app.js":"e2c3dae1a967","ui_kits/storefront/data.js":"4a9d9a1378d6","ui_kits/storefront/icons.js":"87b302b5d735","ui_kits/storefront/orderlookup.js":"52a1645aaa86","ui_kits/storefront/paymentscreen.js":"f5484c085906","ui_kits/storefront/productdetail.js":"e7711b7b9dd5","ui_kits/storefront/storefronthome.js":"bcd06e3e4b3d","ui_kits/storefront/topbar.js":"02839b8c1ba9"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.MiaoKa_b7a409 = window.MiaoKa_b7a409 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/commerce/CardKey.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.mk-cardkey{
  border:1.5px solid var(--border); border-radius:var(--radius-md); background:var(--surface-card);
  overflow:hidden; font-family:var(--font-sans);
}
.mk-cardkey__head{ display:flex; align-items:center; justify-content:space-between; gap:8px; padding:10px 14px; border-bottom:1px solid var(--border); background:var(--slate-50); }
.mk-cardkey__title{ font-size:var(--text-sm); font-weight:var(--fw-bold); color:var(--text-strong); display:flex; align-items:center; gap:7px; }
.mk-cardkey__idx{ display:inline-flex; align-items:center; justify-content:center; min-width:20px; height:20px; padding:0 5px; border-radius:var(--radius-pill); background:var(--brand-soft); color:var(--brand-active); font-size:11px; font-weight:var(--fw-bold); }
.mk-cardkey__body{ display:flex; align-items:stretch; }
.mk-cardkey__code{
  flex:1; min-width:0; padding:14px 16px; font-family:var(--font-mono); font-size:var(--text-md);
  font-weight:var(--fw-medium); color:var(--text-strong); letter-spacing:.02em; word-break:break-all;
  display:flex; align-items:center; user-select:all;
}
.mk-cardkey__copy{
  flex:none; border:none; border-left:1px solid var(--border); background:#fff; color:var(--brand);
  font-family:var(--font-sans); font-weight:var(--fw-bold); font-size:var(--text-sm); cursor:pointer;
  padding:0 18px; display:flex; align-items:center; gap:6px; transition:background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
  -webkit-tap-highlight-color:transparent;
}
.mk-cardkey__copy:hover{ background:var(--brand-soft); }
.mk-cardkey__copy:active{ background:var(--orange-100); }
.mk-cardkey__copy svg{ width:16px; height:16px; }
.mk-cardkey__copy--done{ color:var(--success-fg); }

/* locked (unpaid) state */
.mk-cardkey--locked .mk-cardkey__code{ color:var(--text-subtle); letter-spacing:.18em; user-select:none; filter:blur(0.5px); }
.mk-cardkey--locked .mk-cardkey__lockmsg{ display:flex; align-items:center; gap:8px; padding:14px 16px; color:var(--text-muted); font-size:var(--text-sm); }
.mk-cardkey--locked .mk-cardkey__lockmsg svg{ width:16px; height:16px; color:var(--text-subtle); }
`;
if (typeof document !== 'undefined' && !document.getElementById('mk-cardkey-css')) {
  const s = document.createElement('style');
  s.id = 'mk-cardkey-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
const LockIcon = () => /*#__PURE__*/React.createElement("svg", {
  "aria-hidden": "true",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("rect", {
  x: "3",
  y: "11",
  width: "18",
  height: "11",
  rx: "2"
}), /*#__PURE__*/React.createElement("path", {
  d: "M7 11V7a5 5 0 0 1 10 0v4"
}));
const CopyIcon = () => /*#__PURE__*/React.createElement("svg", {
  "aria-hidden": "true",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("rect", {
  x: "9",
  y: "9",
  width: "13",
  height: "13",
  rx: "2"
}), /*#__PURE__*/React.createElement("path", {
  d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
}));
const CheckIcon = () => /*#__PURE__*/React.createElement("svg", {
  "aria-hidden": "true",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2.4",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M20 6 9 17l-5-5"
}));

// 视觉隐藏但对屏幕阅读器可见的样式
const SR_ONLY = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0
};

// document.execCommand('copy') 兜底:创建临时 textarea → select → execCommand
function legacyCopy(text) {
  if (typeof document === 'undefined') return false;
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    return false;
  }
}
function CardKey({
  code,
  label = '卡密',
  index,
  locked = false,
  lockedHint = '支付完成后自动显示',
  onCopy,
  className = '',
  ...rest
}) {
  const [done, setDone] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const succeed = text => {
    setFailed(false);
    setDone(true);
    onCopy && onCopy(text);
    setTimeout(() => setDone(false), 1800);
  };
  const fallback = text => {
    if (legacyCopy(text)) {
      succeed(text);
    } else {
      setDone(false);
      setFailed(true);
      setTimeout(() => setFailed(false), 2500);
    }
  };
  const copy = () => {
    const text = String(code || '');
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      // 成功才显示「已复制」;失败走 execCommand 兜底
      navigator.clipboard.writeText(text).then(() => succeed(text)).catch(() => fallback(text));
    } else {
      // 无 clipboard API 时也走 execCommand 兜底
      fallback(text);
    }
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['mk-cardkey', locked ? 'mk-cardkey--locked' : '', className].filter(Boolean).join(' ')
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "mk-cardkey__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mk-cardkey__title"
  }, index != null && /*#__PURE__*/React.createElement("span", {
    className: "mk-cardkey__idx"
  }, index), label)), /*#__PURE__*/React.createElement("div", {
    className: "mk-cardkey__body"
  }, locked ? /*#__PURE__*/React.createElement("span", {
    className: "mk-cardkey__lockmsg"
  }, /*#__PURE__*/React.createElement(LockIcon, null), lockedHint) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("code", {
    className: "mk-cardkey__code"
  }, code), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `mk-cardkey__copy${done ? ' mk-cardkey__copy--done' : ''}`,
    onClick: copy,
    "aria-label": `复制${label}`
  }, done ? /*#__PURE__*/React.createElement(CheckIcon, null) : /*#__PURE__*/React.createElement(CopyIcon, null), done ? '已复制' : failed ? '请手动复制' : '复制'))), /*#__PURE__*/React.createElement("span", {
    role: "status",
    "aria-live": "polite",
    style: SR_ONLY
  }, done ? '卡密已复制' : ''));
}
Object.assign(__ds_scope, { CardKey });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/commerce/CardKey.jsx", error: String((e && e.message) || e) }); }

// components/commerce/CheckoutSteps.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
  const s = document.createElement('style');
  s.id = 'mk-steps-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
const CheckMini = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  width: "14",
  height: "14",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "3",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M20 6 9 17l-5-5"
}));
function CheckoutSteps({
  steps = ['选购', '下单', '付款', '取卡'],
  current = 0,
  className = '',
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['mk-steps', className].filter(Boolean).join(' ')
  }, rest), steps.map((label, i) => {
    const state = i < current ? 'done' : i === current ? 'active' : 'todo';
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: i
    }, /*#__PURE__*/React.createElement("div", {
      className: `mk-steps__item mk-steps__item--${state}`
    }, /*#__PURE__*/React.createElement("span", {
      className: "mk-steps__dot"
    }, state === 'done' ? /*#__PURE__*/React.createElement(CheckMini, null) : i + 1), /*#__PURE__*/React.createElement("span", {
      className: "mk-steps__label"
    }, label)), i < steps.length - 1 && /*#__PURE__*/React.createElement("span", {
      className: `mk-steps__line${i < current ? ' mk-steps__line--done' : ''}`
    }));
  }));
}
Object.assign(__ds_scope, { CheckoutSteps });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/commerce/CheckoutSteps.jsx", error: String((e && e.message) || e) }); }

// components/commerce/PaymentOption.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.mk-pay{
  display:flex; align-items:center; gap:14px; width:100%; text-align:left;
  padding:14px 16px; border:1.5px solid var(--border-strong); border-radius:var(--radius-md);
  background:#fff; cursor:pointer; font-family:var(--font-sans);
  transition:border-color var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
  -webkit-tap-highlight-color:transparent;
}
.mk-pay:hover{ border-color:var(--slate-400); }
.mk-pay--selected{ border-color:var(--brand); background:var(--brand-soft); box-shadow:var(--shadow-focus); }
.mk-pay__icon{ width:36px; height:36px; border-radius:var(--radius-sm); flex:none; display:flex; align-items:center; justify-content:center; font-size:20px; background:var(--surface-sunken); overflow:hidden; }
.mk-pay__icon img{ width:24px; height:24px; object-fit:contain; }
.mk-pay__main{ flex:1; min-width:0; }
.mk-pay__name{ font-size:var(--text-md); font-weight:var(--fw-bold); color:var(--text-strong); display:flex; align-items:center; gap:8px; }
.mk-pay__desc{ font-size:var(--text-xs); color:var(--text-muted); margin-top:2px; }
.mk-pay__radio{ width:22px; height:22px; border-radius:50%; border:2px solid var(--border-strong); flex:none; position:relative; transition:border-color var(--dur-base) var(--ease-out); }
.mk-pay--selected .mk-pay__radio{ border-color:var(--brand); }
.mk-pay--selected .mk-pay__radio::after{ content:''; position:absolute; inset:3px; border-radius:50%; background:var(--brand); }
.mk-pay__tag{ font-size:11px; font-weight:var(--fw-bold); color:var(--success-fg); background:var(--success-bg); padding:2px 7px; border-radius:var(--radius-pill); }
`;
if (typeof document !== 'undefined' && !document.getElementById('mk-pay-css')) {
  const s = document.createElement('style');
  s.id = 'mk-pay-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}

// 无障碍说明:本组件使用 role="radio" + aria-checked 表达单选语义。
// 由于组件自身无法控制外层容器,使用方需将包裹这些选项的容器设置
// role="radiogroup"(并提供 aria-label),否则单选语义不完整。
function PaymentOption({
  name,
  desc,
  icon,
  tag,
  selected = false,
  onSelect,
  className = '',
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: ['mk-pay', selected ? 'mk-pay--selected' : '', className].filter(Boolean).join(' '),
    onClick: onSelect,
    role: "radio",
    "aria-checked": selected
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "mk-pay__icon"
  }, icon), /*#__PURE__*/React.createElement("span", {
    className: "mk-pay__main"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mk-pay__name"
  }, name, tag && /*#__PURE__*/React.createElement("span", {
    className: "mk-pay__tag"
  }, tag)), desc && /*#__PURE__*/React.createElement("span", {
    className: "mk-pay__desc"
  }, desc)), /*#__PURE__*/React.createElement("span", {
    className: "mk-pay__radio"
  }));
}
Object.assign(__ds_scope, { PaymentOption });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/commerce/PaymentOption.jsx", error: String((e && e.message) || e) }); }

// components/console/DataTable.jsx
try { (() => {
/* Console data table — columns=[{key,title,render?,align?,width?}], rows=[...].
   Handles loading (spinner), error (retry bar) and empty states. Header row is
   muted/uppercase-ish small; body rows hairline-separated, hover-tinted. */
const CSS = `
.mk-dt{ width:100%; overflow-x:auto; }
.mk-dt table{ width:100%; border-collapse:collapse; font-size:13.5px; }
.mk-dt th{ text-align:left; padding:10px 12px; border-bottom:1px solid var(--border); color:var(--text-muted); font-weight:700; font-size:12.5px; white-space:nowrap; }
.mk-dt tbody tr{ border-bottom:1px solid var(--slate-100); transition:background var(--dur-fast) var(--ease-out); }
.mk-dt tbody tr:hover{ background:var(--brand-soft); }
.mk-dt td{ padding:11px 12px; color:var(--text-body); vertical-align:middle; }
.mk-dt__spin{ width:22px; height:22px; border-radius:50%; border:3px solid var(--brand-soft); border-top-color:var(--brand); animation:mk-dt-spin .8s linear infinite; display:inline-block; }
@keyframes mk-dt-spin{ to{ transform:rotate(360deg); } }
`;
if (typeof document !== 'undefined' && !document.getElementById('mk-dt-css')) {
  const s = document.createElement('style');
  s.id = 'mk-dt-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
function DataTable({
  columns,
  rows,
  loading,
  error,
  onReload,
  rowKey = 'id',
  empty = '暂无数据',
  emptyIcon
}) {
  if (loading) return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '40px 0',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mk-dt__spin"
  }));
  if (error) return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 14px',
      background: 'var(--danger-bg)',
      border: '1px solid var(--danger-solid)',
      borderRadius: 'var(--radius-md)',
      color: 'var(--danger-fg)',
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, error), onReload && /*#__PURE__*/React.createElement("button", {
    onClick: onReload,
    style: {
      border: 'none',
      background: 'transparent',
      color: 'var(--danger-fg)',
      fontWeight: 700,
      cursor: 'pointer',
      textDecoration: 'underline'
    }
  }, "\u91CD\u8BD5"));
  if (!rows || rows.length === 0) return /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '40px 20px',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 52,
      height: 52,
      margin: '0 auto 12px',
      borderRadius: '50%',
      background: 'var(--surface-sunken)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, emptyIcon), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--text-body)'
    }
  }, empty));
  return /*#__PURE__*/React.createElement("div", {
    className: "mk-dt"
  }, /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.key,
    style: {
      textAlign: c.align || 'left',
      width: c.width
    }
  }, c.title)))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: r[rowKey] ?? i
  }, columns.map(c => /*#__PURE__*/React.createElement("td", {
    key: c.key,
    style: {
      textAlign: c.align || 'left',
      maxWidth: c.width || 280,
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, c.render ? c.render(r) : r[c.key])))))));
}
Object.assign(__ds_scope, { DataTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/console/DataTable.jsx", error: String((e && e.message) || e) }); }

// components/console/Panel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Console panel — white card with an optional titled header (title +
   subtitle on the left, actions on the right) and a padded body. */
function Panel({
  title,
  subtitle,
  actions,
  children,
  padded = true,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("section", _extends({
    style: {
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden',
      ...style
    }
  }, rest), (title || actions) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '14px 18px',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 800,
      color: 'var(--text-strong)'
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, subtitle)), actions && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flex: 'none'
    }
  }, actions)), /*#__PURE__*/React.createElement("div", {
    style: padded ? {
      padding: 18
    } : undefined
  }, children));
}
Object.assign(__ds_scope, { Panel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/console/Panel.jsx", error: String((e && e.message) || e) }); }

// components/console/Pill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Status pill — small rounded label carrying a semantic tone. Used for order
   states, audit states, risk levels across the consoles. */
const TONE = {
  neutral: ['var(--text-body)', 'var(--surface-sunken)', 'var(--border)'],
  brand: ['var(--brand-active)', 'var(--brand-soft)', 'var(--brand-soft-border)'],
  success: ['var(--success-fg)', 'var(--success-bg)', 'var(--success-border)'],
  pending: ['var(--pending-fg)', 'var(--pending-bg)', 'var(--pending-border)'],
  danger: ['var(--danger-fg)', 'var(--danger-bg)', 'var(--danger-border)'],
  secure: ['var(--secure-fg)', 'var(--secure-bg)', 'var(--teal-50)']
};
function Pill({
  tone = 'neutral',
  dot = false,
  children,
  style,
  ...rest
}) {
  const [fg, bg, bd] = TONE[tone] || TONE.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '3px 10px',
      borderRadius: 'var(--radius-pill)',
      background: bg,
      color: fg,
      border: `1px solid ${bd}`,
      fontSize: 12,
      fontWeight: 700,
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: 'currentColor',
      flex: 'none'
    }
  }), children);
}
Object.assign(__ds_scope, { Pill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/console/Pill.jsx", error: String((e && e.message) || e) }); }

// components/console/StatCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Console stat card — KPI tile. Two variants:
   - default: white card, tinted icon chip, label, big number, sub line.
   - filled: orange gradient solid card for the hero KPI (e.g. 今日成交额). */
const TONE = {
  brand: ['var(--brand-active)', 'var(--brand-soft)'],
  success: ['var(--success-fg)', 'var(--success-bg)'],
  pending: ['var(--pending-fg)', 'var(--pending-bg)'],
  secure: ['var(--secure-fg)', 'var(--secure-bg)'],
  danger: ['var(--danger-fg)', 'var(--danger-bg)'],
  neutral: ['var(--text-body)', 'var(--surface-sunken)']
};
function StatCard({
  label,
  value,
  icon,
  tone = 'brand',
  sub,
  filled = false,
  style,
  ...rest
}) {
  const [fg, bg] = TONE[tone] || TONE.brand;
  if (filled) {
    return /*#__PURE__*/React.createElement("div", _extends({
      style: {
        flex: '1 1 230px',
        minWidth: 210,
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        padding: 18,
        color: '#fff',
        background: 'var(--brand-gradient)',
        ...style
      }
    }, rest), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        opacity: 0.94
      }
    }, label), icon && /*#__PURE__*/React.createElement("span", {
      style: {
        width: 36,
        height: 36,
        borderRadius: 11,
        background: 'rgba(255,255,255,0.2)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none'
      }
    }, icon)), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 12,
        fontSize: 25,
        fontWeight: 800,
        letterSpacing: '-0.02em',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, value), sub && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        marginTop: 5,
        opacity: 0.9
      }
    }, sub));
  }
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      flex: '1 1 180px',
      minWidth: 160,
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      padding: 18,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      color: 'var(--text-muted)',
      fontSize: 13,
      fontWeight: 600
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 28,
      height: 28,
      borderRadius: 8,
      background: bg,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 'none'
    }
  }, icon), label), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 26,
      fontWeight: 800,
      color: 'var(--text-strong)',
      letterSpacing: '-0.02em',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, value), sub && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, sub));
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/console/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.mk-badge{
  display:inline-flex; align-items:center; gap:5px; font-family:var(--font-sans);
  font-size:var(--text-xs); font-weight:var(--fw-bold); line-height:1;
  padding:5px 9px; border-radius:var(--radius-pill); border:1px solid transparent;
  white-space:nowrap; letter-spacing:var(--ls-snug);
}
.mk-badge--soft{ }
.mk-badge__dot{ width:6px; height:6px; border-radius:50%; background:currentColor; flex:none; }
.mk-badge svg{ width:13px; height:13px; }

.mk-badge--neutral{ color:var(--text-muted); background:var(--surface-sunken); border-color:var(--border); }
.mk-badge--brand{ color:var(--brand-active); background:var(--brand-soft); border-color:var(--brand-soft-border); }
.mk-badge--success{ color:var(--success-fg); background:var(--success-bg); border-color:var(--success-border); }
.mk-badge--pending{ color:var(--pending-fg); background:var(--pending-bg); border-color:var(--pending-border); }
.mk-badge--danger{ color:var(--danger-fg); background:var(--danger-bg); border-color:var(--danger-border); }
.mk-badge--secure{ color:var(--secure-fg); background:var(--secure-bg); border-color:var(--teal-50); }

/* solid */
.mk-badge--solid.mk-badge--brand{ color:#fff; background:var(--brand); border-color:transparent; }
.mk-badge--solid.mk-badge--success{ color:#fff; background:var(--success-solid); border-color:transparent; }
.mk-badge--solid.mk-badge--pending{ color:#fff; background:var(--pending-solid); border-color:transparent; }
.mk-badge--solid.mk-badge--danger{ color:#fff; background:var(--danger-solid); border-color:transparent; }
`;
if (typeof document !== 'undefined' && !document.getElementById('mk-badge-css')) {
  const s = document.createElement('style');
  s.id = 'mk-badge-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
function Badge({
  children,
  variant = 'neutral',
  solid = false,
  dot = false,
  icon,
  className = '',
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    className: ['mk-badge', `mk-badge--${variant}`, solid ? 'mk-badge--solid' : 'mk-badge--soft', className].filter(Boolean).join(' ')
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    className: "mk-badge__dot",
    "aria-hidden": "true"
  }), icon, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/commerce/OrderStatusBadge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const MAP = {
  pending: {
    variant: 'pending',
    label: '待支付',
    dot: true
  },
  paid: {
    variant: 'brand',
    label: '已支付 · 发货中',
    dot: true
  },
  delivered: {
    variant: 'success',
    label: '已发货',
    dot: true
  },
  failed: {
    variant: 'danger',
    label: '支付失败',
    dot: true
  },
  exception: {
    variant: 'danger',
    label: '异常待人工',
    dot: true
  },
  refunded: {
    variant: 'neutral',
    label: '已退款',
    dot: true
  },
  closed: {
    variant: 'neutral',
    label: '已关闭',
    dot: true
  }
};
function OrderStatusBadge({
  status = 'pending',
  solid = false,
  label,
  ...rest
}) {
  const m = MAP[status] || MAP.pending;
  return /*#__PURE__*/React.createElement(__ds_scope.Badge, _extends({
    variant: m.variant,
    dot: m.dot,
    solid: solid,
    role: "status"
  }, rest), label || m.label);
}
Object.assign(__ds_scope, { OrderStatusBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/commerce/OrderStatusBadge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* inject component CSS once */
const CSS = `
.mk-btn{
  --_bg:var(--brand); --_fg:var(--text-on-brand); --_bd:transparent;
  display:inline-flex; align-items:center; justify-content:center; gap:8px;
  font-family:var(--font-sans); font-weight:var(--fw-bold); line-height:1;
  border:1.5px solid var(--_bd); background:var(--_bg); color:var(--_fg);
  border-radius:var(--radius-md); cursor:pointer; white-space:nowrap;
  transition:transform var(--dur-fast) var(--ease-out), background var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out);
  -webkit-tap-highlight-color:transparent; text-decoration:none; user-select:none;
}
.mk-btn:focus-visible{ outline:none; box-shadow:var(--shadow-focus); }
.mk-btn:active{ transform:translateY(1px) scale(0.992); }
.mk-btn[disabled],.mk-btn[aria-disabled="true"]{ opacity:.5; cursor:not-allowed; transform:none; }

/* sizes */
.mk-btn--sm{ height:36px; padding:0 14px; font-size:var(--text-sm); border-radius:var(--radius-sm); }
.mk-btn--md{ height:44px; padding:0 20px; font-size:var(--text-base); }
.mk-btn--lg{ height:52px; padding:0 26px; font-size:var(--text-md); border-radius:var(--radius-lg); }
.mk-btn--block{ width:100%; }

/* variants */
.mk-btn--primary{ --_bg:var(--brand); --_fg:var(--text-on-brand); box-shadow:var(--shadow-brand); }
.mk-btn--primary:hover:not([disabled]){ --_bg:var(--brand-hover); }
.mk-btn--primary:active:not([disabled]){ --_bg:var(--brand-active); }

.mk-btn--secondary{ --_bg:#fff; --_fg:var(--brand); --_bd:var(--orange-200); box-shadow:var(--shadow-xs); }
.mk-btn--secondary:hover:not([disabled]){ --_bg:var(--brand-soft); --_bd:var(--orange-300); }

.mk-btn--neutral{ --_bg:#fff; --_fg:var(--text-strong); --_bd:var(--border-strong); box-shadow:var(--shadow-xs); }
.mk-btn--neutral:hover:not([disabled]){ --_bg:var(--surface-sunken); }

.mk-btn--ghost{ --_bg:transparent; --_fg:var(--text-body); box-shadow:none; }
.mk-btn--ghost:hover:not([disabled]){ --_bg:var(--surface-sunken); }

/* Taobao CTA gradients — 立即购买 (red→orange) / 加入购物车 (gold→orange) */
.mk-btn--buy{ --_fg:#fff; background:var(--cta-gradient-buy); box-shadow:var(--shadow-brand); }
.mk-btn--buy:hover:not([disabled]){ filter:brightness(1.04); }
.mk-btn--cart{ --_fg:#fff; background:var(--cta-gradient-cart); box-shadow:0 8px 20px rgba(255,144,0,.28); }
.mk-btn--cart:hover:not([disabled]){ filter:brightness(1.04); }

.mk-btn--danger{ --_bg:var(--danger-solid); --_fg:#fff; box-shadow:0 8px 20px rgba(250,44,25,.26); }
.mk-btn--danger:hover:not([disabled]){ --_bg:var(--red-600); }

.mk-btn--success{ --_bg:var(--success-solid); --_fg:#fff; box-shadow:0 8px 20px rgba(21,166,90,.24); }
.mk-btn--success:hover:not([disabled]){ --_bg:var(--green-600); }

.mk-btn__spinner{ width:1em; height:1em; border-radius:50%; border:2px solid currentColor; border-top-color:transparent; animation:mk-spin .7s linear infinite; }
@keyframes mk-spin{ to{ transform:rotate(360deg); } }
`;
if (typeof document !== 'undefined' && !document.getElementById('mk-btn-css')) {
  const s = document.createElement('style');
  s.id = 'mk-btn-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
function Button({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  as = 'button',
  className = '',
  ...rest
}) {
  const Tag = as;
  const cls = ['mk-btn', `mk-btn--${variant}`, `mk-btn--${size}`, block ? 'mk-btn--block' : '', className].filter(Boolean).join(' ');
  const isDisabled = disabled || loading;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: cls,
    disabled: Tag === 'button' ? isDisabled : undefined,
    "aria-disabled": isDisabled || undefined
  }, rest), loading && /*#__PURE__*/React.createElement("span", {
    className: "mk-btn__spinner",
    "aria-hidden": "true"
  }), !loading && iconLeft, children && /*#__PURE__*/React.createElement("span", null, children), !loading && iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/console/ConsoleShell.jsx
try { (() => {
/* Console application shell — the signature back-office layout:
   a 60px icon rail (one button per nav group) + a 224px text menu (grouped
   items) + a 56px top bar (breadcrumb + user + logout) + the scrolling main
   area. Collapses to a hamburger drawer under 860px.

   nav = [{ group, icon: IconComp, items: [{ key, label, icon: IconComp }] }]
   IconComp is a component called as <IconComp size color />. */

function useIsNarrow(query = '(max-width:860px)') {
  const [narrow, setNarrow] = React.useState(() => typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false);
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mql = window.matchMedia(query);
    const onChange = e => setNarrow(e.matches);
    setNarrow(mql.matches);
    mql.addEventListener ? mql.addEventListener('change', onChange) : mql.addListener(onChange);
    return () => {
      mql.removeEventListener ? mql.removeEventListener('change', onChange) : mql.removeListener(onChange);
    };
  }, [query]);
  return narrow;
}
function flatten(nav) {
  return nav.reduce((a, g) => a.concat(g.items), []);
}
function ConsoleShell({
  nav,
  active,
  onNavigate,
  brandTitle = '秒卡 · 控制台',
  brandSub,
  user,
  onLogout,
  brandMark,
  children
}) {
  const flat = flatten(nav);
  const activeItem = flat.find(n => n.key === active);
  const isNarrow = useIsNarrow();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  React.useEffect(() => {
    if (!isNarrow) setDrawerOpen(false);
  }, [isNarrow]);
  const select = key => {
    onNavigate && onNavigate(key);
    if (isNarrow) setDrawerOpen(false);
  };
  const asideBase = {
    width: 224,
    flex: 'none',
    background: '#fff',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column'
  };
  const asideStyle = isNarrow ? {
    ...asideBase,
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    zIndex: 40,
    transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform .22s ease',
    boxShadow: drawerOpen ? 'var(--shadow-lg)' : 'none'
  } : {
    ...asideBase,
    position: 'sticky',
    top: 0,
    height: '100vh'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg-page)',
      fontFamily: 'var(--font-sans)'
    }
  }, isNarrow && drawerOpen && /*#__PURE__*/React.createElement("div", {
    onClick: () => setDrawerOpen(false),
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(17,20,24,.45)',
      zIndex: 35
    }
  }), !isNarrow && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 60,
      flex: 'none',
      background: '#fff',
      borderRight: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 14,
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 34,
      height: 34,
      borderRadius: 10,
      background: 'var(--brand-gradient)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12
    }
  }, brandMark || /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#fff',
      fontWeight: 900,
      fontSize: 16
    }
  }, "\u79D2")), nav.map(g => {
    const Icon = g.icon;
    const on = g.items.some(it => it.key === active);
    return /*#__PURE__*/React.createElement("button", {
      key: g.group,
      type: "button",
      title: g.group,
      onClick: () => select(g.items[0].key),
      style: {
        width: 46,
        height: 46,
        border: 'none',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        background: on ? 'var(--brand-soft)' : 'transparent',
        fontFamily: 'var(--font-sans)'
      }
    }, Icon && /*#__PURE__*/React.createElement(Icon, {
      size: 18,
      color: on ? 'var(--brand)' : 'var(--text-muted)'
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        fontWeight: 700,
        color: on ? 'var(--brand-active)' : 'var(--text-subtle)'
      }
    }, g.group.slice(0, 2)));
  })), /*#__PURE__*/React.createElement("aside", {
    style: asideStyle
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 18px 14px',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 800,
      fontSize: 16,
      color: 'var(--text-strong)',
      letterSpacing: '-0.01em'
    }
  }, brandTitle), brandSub && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, brandSub)), /*#__PURE__*/React.createElement("nav", {
    style: {
      flex: 1,
      padding: 10,
      overflowY: 'auto'
    }
  }, nav.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.group,
    style: {
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 12px 4px',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '.04em',
      color: 'var(--text-subtle)'
    }
  }, g.group), g.items.map(item => {
    const Icon = item.icon;
    const on = active === item.key;
    return /*#__PURE__*/React.createElement("button", {
      key: item.key,
      onClick: () => select(item.key),
      "aria-current": on ? 'page' : undefined,
      style: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        marginBottom: 2,
        border: 'none',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'var(--font-sans)',
        fontWeight: on ? 700 : 600,
        fontSize: 14,
        background: on ? 'var(--brand-soft)' : 'transparent',
        color: on ? 'var(--brand-active)' : 'var(--text-body)'
      }
    }, Icon && /*#__PURE__*/React.createElement(Icon, {
      size: 18,
      color: on ? 'var(--brand)' : 'var(--text-muted)'
    }), item.label);
  })))), onLogout && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      borderTop: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "neutral",
    size: "md",
    block: true,
    onClick: onLogout
  }, "\u9000\u51FA\u767B\u5F55"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      height: 56,
      flex: 'none',
      padding: isNarrow ? '0 14px' : '0 28px',
      background: '#fff',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      minWidth: 0,
      fontSize: 13.5
    }
  }, isNarrow && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "\u83DC\u5355",
    onClick: () => setDrawerOpen(v => !v),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 'none',
      width: 36,
      height: 36,
      marginRight: 2,
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      background: '#fff',
      cursor: 'pointer',
      color: 'var(--text-body)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("line", {
    x1: "3",
    y1: "6",
    x2: "21",
    y2: "6"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "3",
    y1: "12",
    x2: "21",
    y2: "12"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "3",
    y1: "18",
    x2: "21",
    y2: "18"
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)',
      fontWeight: 600,
      whiteSpace: 'nowrap'
    }
  }, brandTitle), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-subtle)'
    }
  }, "\u203A"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-strong)',
      fontWeight: 800,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, activeItem?.label)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flex: 'none'
    }
  }, user && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      color: 'var(--text-body)',
      fontWeight: 600,
      whiteSpace: 'nowrap'
    }
  }, user), onLogout && /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "ghost",
    size: "sm",
    onClick: onLogout
  }, "\u9000\u51FA"))), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      minWidth: 0,
      padding: isNarrow ? '16px 14px' : '24px 28px',
      maxWidth: 1180
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'var(--text-2xl)',
      fontWeight: 800,
      color: 'var(--text-strong)',
      letterSpacing: '-0.02em',
      margin: '0 0 18px'
    }
  }, activeItem?.label), children)));
}
Object.assign(__ds_scope, { ConsoleShell });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/console/ConsoleShell.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.mk-card{
  background:var(--surface-card); border:1px solid var(--border);
  border-radius:var(--radius-lg); box-shadow:var(--shadow-sm);
  transition:transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out);
}
.mk-card--pad{ padding:var(--space-5); }
.mk-card--interactive{ cursor:pointer; }
.mk-card--interactive:hover{ transform:translateY(-2px); box-shadow:var(--shadow-md); border-color:var(--border-strong); }
.mk-card--interactive:active{ transform:translateY(0); }
.mk-card--flat{ box-shadow:none; }
.mk-card--raised{ box-shadow:var(--shadow-md); border-color:transparent; }
`;
if (typeof document !== 'undefined' && !document.getElementById('mk-card-css')) {
  const s = document.createElement('style');
  s.id = 'mk-card-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
function Card({
  children,
  pad = true,
  interactive = false,
  elevation = 'sm',
  as = 'div',
  className = '',
  ...rest
}) {
  const Tag = as;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: ['mk-card', pad ? 'mk-card--pad' : '', interactive ? 'mk-card--interactive' : '', elevation === 'flat' ? 'mk-card--flat' : '', elevation === 'raised' ? 'mk-card--raised' : '', className].filter(Boolean).join(' ')
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.mk-field{ display:flex; flex-direction:column; gap:6px; font-family:var(--font-sans); }
.mk-field__label{ font-size:var(--text-sm); font-weight:var(--fw-semibold); color:var(--text-strong); display:flex; gap:4px; align-items:center; }
.mk-field__req{ color:var(--danger-solid); }
.mk-field__hint{ font-size:var(--text-xs); color:var(--text-muted); }
.mk-field__hint--error{ color:var(--danger-fg); }

.mk-input-wrap{ position:relative; display:flex; align-items:center; }
.mk-input{
  width:100%; height:48px; padding:0 14px; font-family:inherit; font-size:var(--text-md);
  color:var(--text-strong); background:#fff; border:1.5px solid var(--border-strong);
  border-radius:var(--radius-md); transition:border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
  -webkit-appearance:none; appearance:none;
}
.mk-input::placeholder{ color:var(--text-subtle); }
.mk-input:hover:not(:disabled){ border-color:var(--slate-400); }
.mk-input:focus{ outline:none; border-color:var(--brand); box-shadow:var(--shadow-focus); }
.mk-input:disabled{ background:var(--surface-sunken); color:var(--text-muted); cursor:not-allowed; }
.mk-input--has-icon{ padding-left:42px; }
.mk-input--error{ border-color:var(--danger-solid); }
.mk-input--error:focus{ box-shadow:0 0 0 3px rgba(250,44,25,.22); }
.mk-input__icon{ position:absolute; left:14px; display:flex; color:var(--text-muted); pointer-events:none; }
.mk-input__icon svg{ width:18px; height:18px; }
`;
if (typeof document !== 'undefined' && !document.getElementById('mk-input-css')) {
  const s = document.createElement('style');
  s.id = 'mk-input-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
function Input({
  label,
  hint,
  error,
  required = false,
  icon,
  id,
  className = '',
  ...rest
}) {
  const inputId = id || (label ? `mk-${String(label).replace(/\s+/g, '-')}` : undefined);
  const describedById = inputId ? `${inputId}-desc` : undefined;
  return /*#__PURE__*/React.createElement("div", {
    className: "mk-field"
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "mk-field__label",
    htmlFor: inputId
  }, label, required && /*#__PURE__*/React.createElement("span", {
    className: "mk-field__req"
  }, "*")), /*#__PURE__*/React.createElement("div", {
    className: "mk-input-wrap"
  }, icon && /*#__PURE__*/React.createElement("span", {
    className: "mk-input__icon"
  }, icon), /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    className: ['mk-input', icon ? 'mk-input--has-icon' : '', error ? 'mk-input--error' : '', className].filter(Boolean).join(' '),
    "aria-invalid": !!error,
    "aria-describedby": error || hint ? describedById : undefined
  }, rest))), (error || hint) && /*#__PURE__*/React.createElement("span", _extends({
    id: describedById,
    className: `mk-field__hint${error ? ' mk-field__hint--error' : ''}`
  }, error ? {
    role: 'alert'
  } : {}), error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

// components/core/PriceTag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.mk-price{ display:inline-flex; align-items:baseline; gap:7px; font-family:var(--font-sans); }
.mk-price__main{ display:inline-flex; align-items:baseline; color:var(--price-accent); font-weight:var(--fw-extra); letter-spacing:var(--ls-snug); font-variant-numeric:tabular-nums; line-height:1; }
.mk-price__sym{ font-size:.6em; font-weight:var(--fw-bold); margin-right:1px; align-self:flex-start; margin-top:.16em; }
.mk-price__dec{ font-size:.66em; font-weight:var(--fw-extra); }
.mk-price--neutral .mk-price__main{ color:var(--price-color); }
.mk-price__orig{ color:var(--text-subtle); text-decoration:line-through; font-weight:var(--fw-medium); font-variant-numeric:tabular-nums; }
.mk-price__label{ font-size:var(--text-xs); color:var(--text-muted); font-weight:var(--fw-semibold); align-self:flex-end; margin-bottom:.12em; }
.mk-price--sm .mk-price__main{ font-size:var(--text-lg); }
.mk-price--md .mk-price__main{ font-size:var(--text-2xl); }
.mk-price--lg .mk-price__main{ font-size:var(--text-4xl); }
.mk-price--sm .mk-price__orig{ font-size:var(--text-xs); }
.mk-price--md .mk-price__orig{ font-size:var(--text-sm); }
.mk-price--lg .mk-price__orig{ font-size:var(--text-md); }
`;
if (typeof document !== 'undefined' && !document.getElementById('mk-price-css')) {
  const s = document.createElement('style');
  s.id = 'mk-price-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
function parts(n) {
  if (typeof n !== 'number') return {
    int: String(n),
    dec: ''
  };
  if (!Number.isFinite(n)) return {
    int: '0',
    dec: '.00'
  };
  const s = n.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const i = s.lastIndexOf('.');
  return i === -1 ? {
    int: s,
    dec: ''
  } : {
    int: s.slice(0, i),
    dec: s.slice(i)
  };
}
function PriceTag({
  amount,
  original,
  currency = '¥',
  size = 'md',
  tone = 'accent',
  label,
  splitDecimals = true,
  className = '',
  ...rest
}) {
  const {
    int,
    dec
  } = parts(amount);
  const o = original != null ? parts(original) : null;
  return /*#__PURE__*/React.createElement("span", _extends({
    className: ['mk-price', `mk-price--${size}`, tone === 'neutral' ? 'mk-price--neutral' : '', className].filter(Boolean).join(' ')
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "mk-price__main"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mk-price__sym"
  }, currency), int, dec && (splitDecimals ? /*#__PURE__*/React.createElement("span", {
    className: "mk-price__dec"
  }, dec) : dec)), label && /*#__PURE__*/React.createElement("span", {
    className: "mk-price__label"
  }, label), o && /*#__PURE__*/React.createElement("span", {
    className: "mk-price__orig"
  }, currency, o.int, o.dec));
}
Object.assign(__ds_scope, { PriceTag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/PriceTag.jsx", error: String((e && e.message) || e) }); }

// components/commerce/ProductCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Image-led Taobao-style product card.
   Full-bleed 1:1 image (emoji+gradient placeholder when no art), type badge
   over the image, one corner badge, promo-prefixed 2-line title, red price
   with optional label, subsidy/promo chips, sold count + cart button. */
const CSS = `
.mk-pc{ display:flex; flex-direction:column; height:100%; background:var(--surface-card); border:1px solid var(--border); border-radius:var(--radius-md); overflow:hidden; cursor:pointer; transition:transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out); box-shadow:var(--shadow-xs); }
.mk-pc:hover{ transform:translateY(-2px); box-shadow:var(--shadow-md); }
.mk-pc:active{ transform:translateY(0); }
.mk-pc--out{ opacity:.7; cursor:default; }
.mk-pc--out:hover{ transform:none; box-shadow:var(--shadow-xs); }

.mk-pc__media{ position:relative; aspect-ratio:1/1; background:linear-gradient(150deg,#FFF3EC,#FFE3D1); display:flex; align-items:center; justify-content:center; overflow:hidden; }
.mk-pc__media img{ width:100%; height:100%; object-fit:cover; display:block; }
.mk-pc__emoji{ font-size:64px; filter:drop-shadow(0 6px 14px rgba(122,36,0,.18)); }
.mk-pc__cat{ position:absolute; bottom:8px; left:50%; transform:translateX(-50%); font-size:11px; font-weight:700; color:var(--orange-700); background:rgba(255,255,255,.7); padding:2px 8px; border-radius:var(--radius-pill); white-space:nowrap; }
.mk-pc__type{ position:absolute; top:8px; left:8px; display:inline-flex; align-items:center; gap:3px; height:20px; padding:0 7px; border-radius:var(--radius-sm); font-size:11px; font-weight:800; color:#fff; background:rgba(17,20,24,.55); backdrop-filter:blur(4px); white-space:nowrap; }
.mk-pc__corner{ position:absolute; top:8px; right:8px; display:inline-flex; align-items:center; gap:3px; height:20px; padding:0 7px; border-radius:var(--radius-sm); font-size:11px; font-weight:800; white-space:nowrap; }
.mk-pc__corner--promo{ color:#fff; background:var(--promo-solid); }
.mk-pc__corner--low{ color:#fff; background:var(--pending-solid); }
.mk-pc__corner--out{ color:#fff; background:var(--slate-500); }

.mk-pc__body{ display:flex; flex-direction:column; flex:1; padding:10px 11px 11px; gap:7px; }
.mk-pc__title{ font-size:var(--text-base); font-weight:700; color:var(--text-strong); line-height:1.34; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.mk-pc__promo{ display:inline-flex; align-items:center; height:16px; padding:0 5px; margin-right:5px; border-radius:3px; background:var(--promo-solid); color:#fff; font-size:10.5px; font-weight:800; vertical-align:1px; }
.mk-pc__sub{ font-size:var(--text-xs); color:var(--text-subtle); line-height:1.3; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden; }
.mk-pc__priceRow{ display:flex; align-items:baseline; gap:8px; margin-top:auto; }
.mk-pc__tags{ display:flex; flex-wrap:wrap; gap:5px; }
.mk-pc__tag{ display:inline-flex; align-items:center; height:17px; padding:0 6px; border-radius:3px; font-size:10.5px; font-weight:700; white-space:nowrap; }
.mk-pc__tag--subsidy{ color:var(--subsidy-fg); background:var(--subsidy-bg); }
.mk-pc__tag--promo{ color:var(--promo-soft-fg); background:transparent; border:1px solid var(--promo-soft-border); }
.mk-pc__foot{ display:flex; align-items:center; justify-content:space-between; gap:8px; }
.mk-pc__sold{ font-size:var(--text-xs); color:var(--text-subtle); white-space:nowrap; }
.mk-pc__cart{ flex:none; width:30px; height:30px; border-radius:50%; border:none; display:flex; align-items:center; justify-content:center; background:var(--brand-gradient); color:#fff; cursor:pointer; box-shadow:0 3px 8px rgba(255,80,0,.3); }
.mk-pc__cart:active{ transform:scale(.92); }
.mk-pc__cart svg{ width:16px; height:16px; }
`;
if (typeof document !== 'undefined' && !document.getElementById('mk-pc-css')) {
  const s = document.createElement('style');
  s.id = 'mk-pc-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
function ProductCard({
  name,
  subtitle,
  price,
  original,
  priceLabel,
  stock = 0,
  image,
  thumb,
  category,
  typeLabel,
  promo,
  tags,
  sold,
  onCart,
  onClick,
  className = '',
  ...rest
}) {
  const out = stock <= 0;
  const low = !out && stock > 0 && stock <= 5;
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['mk-pc', out ? 'mk-pc--out' : '', className].filter(Boolean).join(' '),
    onClick: out ? undefined : onClick
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "mk-pc__media"
  }, image ? /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: ""
  }) : /*#__PURE__*/React.createElement("span", {
    className: "mk-pc__emoji"
  }, thumb), typeLabel && /*#__PURE__*/React.createElement("span", {
    className: "mk-pc__type"
  }, typeLabel), out ? /*#__PURE__*/React.createElement("span", {
    className: "mk-pc__corner mk-pc__corner--out"
  }, "\u5DF2\u552E\u7F44") : promo ? /*#__PURE__*/React.createElement("span", {
    className: "mk-pc__corner mk-pc__corner--promo"
  }, "\u9650\u65F6") : low ? /*#__PURE__*/React.createElement("span", {
    className: "mk-pc__corner mk-pc__corner--low"
  }, "\u4EC5\u5269 ", stock) : null, !image && category && /*#__PURE__*/React.createElement("span", {
    className: "mk-pc__cat"
  }, category)), /*#__PURE__*/React.createElement("div", {
    className: "mk-pc__body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mk-pc__title"
  }, promo && /*#__PURE__*/React.createElement("span", {
    className: "mk-pc__promo"
  }, promo), name), subtitle && /*#__PURE__*/React.createElement("div", {
    className: "mk-pc__sub"
  }, subtitle), tags && tags.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "mk-pc__tags"
  }, tags.map((t, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: `mk-pc__tag mk-pc__tag--${t.tone || 'subsidy'}`
  }, t.text))), /*#__PURE__*/React.createElement("div", {
    className: "mk-pc__priceRow"
  }, /*#__PURE__*/React.createElement(__ds_scope.PriceTag, {
    amount: price,
    original: original,
    size: "sm",
    label: priceLabel
  })), /*#__PURE__*/React.createElement("div", {
    className: "mk-pc__foot"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mk-pc__sold"
  }, sold != null ? `已售 ${sold}` : '\u00A0'), !out && /*#__PURE__*/React.createElement("button", {
    className: "mk-pc__cart",
    "aria-label": "\u52A0\u5165\u8D2D\u7269\u8F66",
    onClick: e => {
      e.stopPropagation();
      onCart && onCart();
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "8",
    cy: "21",
    r: "1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "19",
    cy: "21",
    r: "1"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
  }))))));
}
Object.assign(__ds_scope, { ProductCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/commerce/ProductCard.jsx", error: String((e && e.message) || e) }); }

// components/commerce/ProductListItem.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.mk-row{
  display:flex; gap:14px; width:100%; text-align:left; padding:14px; align-items:stretch;
  background:var(--surface-card); border:1px solid var(--border); border-radius:var(--radius-lg);
  box-shadow:var(--shadow-sm); cursor:pointer; font-family:var(--font-sans);
  transition:transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out);
  -webkit-tap-highlight-color:transparent;
}
.mk-row:hover{ transform:translateY(-2px); box-shadow:var(--shadow-md); border-color:var(--border-strong); }
.mk-row:active{ transform:translateY(0); }
.mk-row__thumb{ width:88px; height:88px; flex:none; border-radius:var(--radius-md); background:var(--brand-soft); display:flex; align-items:center; justify-content:center; font-size:40px; overflow:hidden; }
.mk-row__thumb img{ width:100%; height:100%; object-fit:cover; }
.mk-row__main{ flex:1; min-width:0; display:flex; flex-direction:column; }
.mk-row__name{ font-size:var(--text-md); font-weight:var(--fw-bold); color:var(--text-strong); line-height:var(--lh-snug); letter-spacing:var(--ls-snug); display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden; }
.mk-row__desc{ font-size:var(--text-sm); color:var(--text-muted); margin-top:4px; line-height:var(--lh-snug); display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden; }
.mk-row__price{ margin-top:auto; padding-top:8px; }
.mk-row__meta{ display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:8px; }
.mk-row__cat{ font-size:var(--text-xs); color:var(--text-muted); background:var(--surface-sunken); padding:3px 9px; border-radius:var(--radius-pill); font-weight:var(--fw-semibold); }
.mk-row__date{ font-size:var(--text-xs); color:var(--text-subtle); font-variant-numeric:tabular-nums; }
.mk-row--out{ opacity:.64; }
`;
if (typeof document !== 'undefined' && !document.getElementById('mk-row-css')) {
  const s = document.createElement('style');
  s.id = 'mk-row-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
function ProductListItem({
  name,
  desc,
  price,
  original,
  stock = 0,
  thumb,
  category,
  date,
  onClick,
  className = '',
  ...rest
}) {
  const out = stock <= 0;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: out ? undefined : onClick,
    className: ['mk-row', out ? 'mk-row--out' : '', className].filter(Boolean).join(' ')
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "mk-row__thumb"
  }, thumb), /*#__PURE__*/React.createElement("span", {
    className: "mk-row__main"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mk-row__name"
  }, name), desc && /*#__PURE__*/React.createElement("span", {
    className: "mk-row__desc"
  }, desc), /*#__PURE__*/React.createElement("span", {
    className: "mk-row__price"
  }, /*#__PURE__*/React.createElement(__ds_scope.PriceTag, {
    amount: price,
    original: original,
    size: "md"
  })), /*#__PURE__*/React.createElement("span", {
    className: "mk-row__meta"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      minWidth: 0
    }
  }, category && /*#__PURE__*/React.createElement("span", {
    className: "mk-row__cat"
  }, category), out ? /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    variant: "danger",
    dot: true
  }, "\u7F3A\u8D27") : /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    variant: "success",
    dot: true
  }, "\u6709\u8D27")), date && /*#__PURE__*/React.createElement("span", {
    className: "mk-row__date"
  }, date))));
}
Object.assign(__ds_scope, { ProductListItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/commerce/ProductListItem.jsx", error: String((e && e.message) || e) }); }

// components/core/QuantityStepper.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.mk-qty{ display:inline-flex; align-items:center; border:1.5px solid var(--border-strong); border-radius:var(--radius-md); background:#fff; overflow:hidden; height:44px; }
.mk-qty__btn{
  width:44px; height:100%; border:none; background:#fff; color:var(--text-strong);
  font-size:20px; font-weight:var(--fw-bold); cursor:pointer; display:flex; align-items:center; justify-content:center;
  transition:background var(--dur-fast) var(--ease-out); -webkit-tap-highlight-color:transparent;
}
.mk-qty__btn:hover:not(:disabled){ background:var(--surface-sunken); }
.mk-qty__btn:active:not(:disabled){ background:var(--slate-150); }
.mk-qty__btn:disabled{ color:var(--text-subtle); cursor:not-allowed; }
.mk-qty__input{
  width:52px; height:100%; border:none; border-left:1.5px solid var(--border); border-right:1.5px solid var(--border);
  text-align:center; font-family:var(--font-sans); font-size:var(--text-md); font-weight:var(--fw-bold);
  color:var(--text-strong); background:#fff; -moz-appearance:textfield; font-variant-numeric:tabular-nums;
}
.mk-qty__input::-webkit-outer-spin-button,.mk-qty__input::-webkit-inner-spin-button{ -webkit-appearance:none; margin:0; }
.mk-qty__input:focus{ outline:none; box-shadow:var(--shadow-focus); position:relative; z-index:1; }
.mk-qty--sm{ height:36px; }
.mk-qty--sm .mk-qty__btn{ width:36px; font-size:17px; }
.mk-qty--sm .mk-qty__input{ width:42px; font-size:var(--text-sm); }
`;
if (typeof document !== 'undefined' && !document.getElementById('mk-qty-css')) {
  const s = document.createElement('style');
  s.id = 'mk-qty-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
function QuantityStepper({
  value = 1,
  min = 1,
  max = 99,
  size = 'md',
  onChange,
  className = '',
  ...rest
}) {
  // 防御 max<min:用 hi 作为有效上界
  const hi = Math.max(min, max);
  const invalidRange = max < min;
  const clamp = n => Math.max(min, Math.min(hi, n));
  const set = n => onChange && onChange(clamp(n));

  // 本地 string 编辑态:允许空串/中间值,仅在合法数字时同步数值
  const [draft, setDraft] = React.useState(String(value));
  // 外部受控值变化时同步 draft(非编辑场景)
  React.useEffect(() => {
    setDraft(String(value));
  }, [value]);
  const handleChange = e => {
    const raw = e.target.value;
    setDraft(raw);
    // 仅在是合法数字时同步数值,空串/'-' 等中间态不 clamp、不上报
    if (/^\d+$/.test(raw)) {
      const n = parseInt(raw, 10);
      if (!Number.isNaN(n)) set(n);
    }
  };
  const handleBlur = () => {
    const n = parseInt(draft, 10);
    const next = Number.isNaN(n) ? clamp(min) : clamp(n);
    setDraft(String(next));
    set(next);
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['mk-qty', size === 'sm' ? 'mk-qty--sm' : '', className].filter(Boolean).join(' '),
    role: "group",
    "aria-label": "\u8D2D\u4E70\u6570\u91CF"
  }, rest), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "mk-qty__btn",
    "aria-label": "\u51CF\u5C11",
    disabled: value <= min,
    onClick: () => set(value - 1)
  }, "\u2212"), /*#__PURE__*/React.createElement("input", {
    className: "mk-qty__input",
    type: "number",
    inputMode: "numeric",
    value: draft,
    min: min,
    max: hi,
    disabled: invalidRange || hi === min,
    onChange: handleChange,
    onBlur: handleBlur
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "mk-qty__btn",
    "aria-label": "\u589E\u52A0",
    disabled: invalidRange || value >= hi,
    onClick: () => set(value + 1)
  }, "+"));
}
Object.assign(__ds_scope, { QuantityStepper });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/QuantityStepper.jsx", error: String((e && e.message) || e) }); }

// ui_kits/admin/adminapp.js
try { (() => {
/* 平台运营后台 (platform admin console) — ConsoleShell + console DS components.
   Screens: 仪表盘 · 商户审核 · 跨商户订单(含退款) · 投诉仲裁. */
const {
  ConsoleShell,
  StatCard,
  Panel,
  DataTable,
  Pill,
  Button
} = window.MiaoKa_b7a409;
const I = window.Icons;
const A_NAV = [{
  group: '概览',
  icon: I.Zap,
  items: [{
    key: 'a-dashboard',
    label: '仪表盘',
    icon: I.Zap
  }, {
    key: 'a-bigscreen',
    label: '大屏数据',
    icon: I.QrCode
  }]
}, {
  group: '商户管理',
  icon: I.ShieldCheck,
  items: [{
    key: 'a-merchants',
    label: '商户审核',
    icon: I.ShieldCheck
  }, {
    key: 'a-invite',
    label: '邀请码',
    icon: I.Mail
  }]
}, {
  group: '交易',
  icon: I.Search,
  items: [{
    key: 'a-orders',
    label: '订单(跨商户)',
    icon: I.Search
  }, {
    key: 'a-complaints',
    label: '投诉仲裁',
    icon: I.AlertTriangle
  }, {
    key: 'a-blacklist',
    label: '买家黑名单',
    icon: I.Lock
  }]
}, {
  group: '财务',
  icon: I.Star,
  items: [{
    key: 'a-withdrawals',
    label: '提现审核',
    icon: I.RefreshCw
  }, {
    key: 'a-settlement',
    label: '对账报表',
    icon: I.Star
  }]
}, {
  group: '运营',
  icon: I.Megaphone,
  items: [{
    key: 'a-content',
    label: '内容管理',
    icon: I.Megaphone
  }, {
    key: 'a-channels',
    label: '支付渠道',
    icon: I.QrCode
  }]
}, {
  group: '系统',
  icon: I.Lock,
  items: [{
    key: 'a-settings',
    label: '平台配置',
    icon: I.Lock
  }, {
    key: 'a-oplog',
    label: '操作日志',
    icon: I.Search
  }]
}];
function AGreeting({
  onReload
}) {
  const h = new Date().getHours();
  const hi = h < 6 ? '夜深了' : h < 12 ? '早上好' : h < 14 ? '中午好' : h < 18 ? '下午好' : '晚上好';
  return /*#__PURE__*/React.createElement("section", {
    style: {
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      background: 'linear-gradient(120deg, var(--orange-600) 0%, var(--brand) 55%, var(--orange-400) 100%)',
      color: '#fff',
      padding: '22px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 800
    }
  }, hi, ",\u5E73\u53F0\u7BA1\u7406\u5458 \uD83D\uDC4B"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      marginTop: 6,
      opacity: .92
    }
  }, "\u53C8\u662F\u5143\u6C14\u6EE1\u6EE1\u7684\u4E00\u5929,\u613F\u4ECA\u5929\u8BA2\u5355\u4E0D\u65AD\u3001\u5BF9\u8D26\u65E0\u5FE7\u3002")), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    iconLeft: /*#__PURE__*/React.createElement(I.RefreshCw, {
      size: 15
    }),
    onClick: onReload
  }, "\u5237\u65B0\u6570\u636E"));
}
function TodoRow({
  icon,
  tone,
  label,
  count,
  extra,
  onClick
}) {
  const TONE = {
    pending: ['var(--pending-fg)', 'var(--pending-bg)'],
    brand: ['var(--brand-active)', 'var(--brand-soft)'],
    danger: ['var(--danger-fg)', 'var(--danger-bg)']
  };
  const [fg, bg] = TONE[tone] || TONE.brand;
  const Icon = I[icon] || I.Clock;
  const has = Number(count) > 0;
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      textAlign: 'left',
      padding: '12px 14px',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      background: '#fff',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      flex: 'none',
      borderRadius: 10,
      background: bg,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    size: 18,
    color: fg
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 13.5,
      fontWeight: 700,
      color: 'var(--text-strong)'
    }
  }, label), extra && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 12,
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, "\u5F85\u5904\u7406\u91D1\u989D ", extra)), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      fontWeight: 800,
      color: has ? 'var(--pending-fg)' : 'var(--text-subtle)'
    }
  }, count), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16,
    color: "var(--text-subtle)"
  })));
}
function ADashboard({
  go
}) {
  const d = window.AD.dashboard;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(AGreeting, {
    onReload: () => go('a-dashboard')
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--text-muted)',
      marginBottom: 10
    }
  }, "\u4ECA\u65E5 \xB7 \u6982\u89C8"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    filled: true,
    label: "\u4ECA\u65E5\u6210\u4EA4\u989D",
    icon: /*#__PURE__*/React.createElement(I.Zap, {
      size: 18,
      color: "#fff"
    }),
    value: /*#__PURE__*/React.createElement(Money, {
      amount: d.sales.today,
      strong: true
    }),
    sub: `昨日 ¥${d.sales.yesterday.toLocaleString()} · 累计 ¥${(d.sales.total / 10000).toFixed(0)}万`
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "\u4ECA\u65E5\u8BA2\u5355",
    tone: "brand",
    icon: /*#__PURE__*/React.createElement(I.Search, {
      size: 16,
      color: "var(--brand-active)"
    }),
    value: d.orders.today,
    sub: /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        gap: 8,
        whiteSpace: 'nowrap'
      }
    }, "\u6628\u65E5 ", d.orders.yesterday, " ", /*#__PURE__*/React.createElement(Delta, {
      today: d.orders.today,
      yesterday: d.orders.yesterday
    }))
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "\u5E73\u53F0\u5229\u6DA6",
    tone: "secure",
    icon: /*#__PURE__*/React.createElement(I.Lock, {
      size: 16,
      color: "var(--secure-fg)"
    }),
    value: /*#__PURE__*/React.createElement(Money, {
      amount: d.profit.today,
      strong: true
    }),
    sub: /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        gap: 8,
        whiteSpace: 'nowrap'
      }
    }, "\u6628\u65E5 ", /*#__PURE__*/React.createElement(Money, {
      amount: d.profit.yesterday
    }), " ", /*#__PURE__*/React.createElement(Delta, {
      money: true,
      today: d.profit.today,
      yesterday: d.profit.yesterday
    }))
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "\u5165\u9A7B\u5546\u6237",
    tone: "success",
    icon: /*#__PURE__*/React.createElement(I.Package, {
      size: 16,
      color: "var(--success-fg)"
    }),
    value: d.merchants.total,
    sub: `今日 +${d.merchants.today} · 待审 ${d.merchants.pending} · 冻结 ${d.merchants.frozen}`
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "\u5728\u552E\u5546\u54C1",
    tone: "pending",
    icon: /*#__PURE__*/React.createElement(I.Inbox, {
      size: 16,
      color: "var(--pending-fg)"
    }),
    value: d.products.on_sale,
    sub: `未售卡密 ${d.products.cards_unsold.toLocaleString()}`
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      flexWrap: 'wrap',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "\u5F85\u5904\u7406",
    subtitle: "\u9700\u8981\u53CA\u65F6\u8DDF\u8FDB\u7684\u4E8B\u9879",
    style: {
      flex: '1 1 360px',
      minWidth: 300
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(TodoRow, {
    icon: "RefreshCw",
    tone: "pending",
    label: "\u5F85\u5BA1\u6838\u63D0\u73B0",
    count: d.withdrawals.pending_count,
    extra: /*#__PURE__*/React.createElement(Money, {
      amount: d.withdrawals.pending_amount
    }),
    onClick: () => go('a-withdrawals')
  }), /*#__PURE__*/React.createElement(TodoRow, {
    icon: "Clock",
    tone: "brand",
    label: "\u5F85\u5BA1\u6838\u5546\u6237",
    count: d.merchants.pending,
    onClick: () => go('a-merchants')
  }), /*#__PURE__*/React.createElement(TodoRow, {
    icon: "AlertTriangle",
    tone: "danger",
    label: "\u5F02\u5E38\u5F85\u4EBA\u5DE5\u8BA2\u5355",
    count: d.orders.exception,
    onClick: () => go('a-orders')
  }), /*#__PURE__*/React.createElement(TodoRow, {
    icon: "AlertTriangle",
    tone: "danger",
    label: "\u6295\u8BC9\u5F85\u4EF2\u88C1",
    count: d.complaints.intervene,
    onClick: () => go('a-complaints')
  }))), /*#__PURE__*/React.createElement(Panel, {
    title: "\u5E38\u7528\u529F\u80FD",
    subtitle: "\u5FEB\u901F\u8FDB\u5165\u5404\u7BA1\u7406\u6A21\u5757",
    style: {
      flex: '2 1 460px',
      minWidth: 320
    }
  }, /*#__PURE__*/React.createElement(QuickGrid, {
    onGo: go,
    items: [{
      key: 'a-merchants',
      label: '商户审核',
      icon: 'ShieldCheck',
      tone: 'brand'
    }, {
      key: 'a-withdrawals',
      label: '提现审核',
      icon: 'RefreshCw',
      tone: 'success'
    }, {
      key: 'a-complaints',
      label: '投诉仲裁',
      icon: 'AlertTriangle',
      tone: 'danger'
    }, {
      key: 'a-settlement',
      label: '对账报表',
      icon: 'Star',
      tone: 'secure'
    }, {
      key: 'a-channels',
      label: '支付渠道',
      icon: 'QrCode',
      tone: 'pending'
    }, {
      key: 'a-content',
      label: '内容管理',
      icon: 'Megaphone',
      tone: 'brand'
    }, {
      key: 'a-invite',
      label: '邀请码',
      icon: 'Mail',
      tone: 'secure'
    }, {
      key: 'a-settings',
      label: '平台配置',
      icon: 'Lock',
      tone: 'neutral'
    }]
  }))));
}
function AMerchants({
  toast
}) {
  return /*#__PURE__*/React.createElement(Panel, {
    title: "\u5546\u6237\u5BA1\u6838 / \u7BA1\u7406",
    subtitle: `共 ${window.AD.merchants.length} 家商户`,
    actions: /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "sm",
      iconLeft: /*#__PURE__*/React.createElement(I.Plus, {
        size: 15
      }),
      onClick: () => toast('新建商户')
    }, "\u65B0\u5EFA\u5546\u6237"),
    padded: false
  }, /*#__PURE__*/React.createElement(DataTable, {
    rowKey: "id",
    columns: [{
      key: 'shop',
      title: '店铺',
      render: r => /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
        style: {
          fontWeight: 700,
          color: 'var(--text-strong)'
        }
      }, r.shop), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12,
          color: 'var(--text-subtle)'
        }
      }, "@", r.owner))
    }, {
      key: 'rate',
      title: '佣金',
      align: 'right'
    }, {
      key: 'deposit',
      title: '保证金',
      align: 'right',
      render: r => /*#__PURE__*/React.createElement(Money, {
        amount: r.deposit
      })
    }, {
      key: 'status',
      title: '状态',
      render: r => /*#__PURE__*/React.createElement(Pill, {
        tone: r.tone,
        dot: true
      }, r.status)
    }, {
      key: 'time',
      title: '入驻',
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          color: 'var(--text-subtle)',
          fontSize: 12.5
        }
      }, r.time)
    }, {
      key: 'op',
      title: '操作',
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          display: 'flex',
          gap: 6
        }
      }, r.status === '待审核' && /*#__PURE__*/React.createElement(Button, {
        variant: "primary",
        size: "sm",
        onClick: () => toast('已通过审核')
      }, "\u901A\u8FC7"), r.status === '冻结' ? /*#__PURE__*/React.createElement(Button, {
        variant: "secondary",
        size: "sm",
        onClick: () => toast('已解冻')
      }, "\u89E3\u51BB") : /*#__PURE__*/React.createElement(Button, {
        variant: "ghost",
        size: "sm",
        onClick: () => toast('已冻结')
      }, "\u51BB\u7ED3"))
    }],
    rows: window.AD.merchants
  }));
}
function AOrders({
  toast
}) {
  const [confirm, setConfirm] = React.useState(null);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Panel, {
    title: "\u8DE8\u5546\u6237\u8BA2\u5355",
    subtitle: "\u5168\u5E73\u53F0\u8BA2\u5355 \xB7 \u53EF\u53D1\u8D77\u9000\u6B3E",
    padded: false
  }, /*#__PURE__*/React.createElement(DataTable, {
    rowKey: "no",
    columns: [{
      key: 'no',
      title: '订单号',
      render: r => /*#__PURE__*/React.createElement("span", {
        className: "ds-mono",
        style: {
          fontSize: 12.5
        }
      }, r.no)
    }, {
      key: 'shop',
      title: '商户',
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          color: 'var(--text-muted)'
        }
      }, r.shop)
    }, {
      key: 'goods',
      title: '商品'
    }, {
      key: 'amt',
      title: '金额',
      align: 'right',
      render: r => /*#__PURE__*/React.createElement(Money, {
        amount: r.amt,
        strong: true,
        color: "var(--price-accent)"
      })
    }, {
      key: 'st',
      title: '状态',
      render: r => /*#__PURE__*/React.createElement(Pill, {
        tone: r.tone,
        dot: true
      }, r.st)
    }, {
      key: 'op',
      title: '操作',
      render: r => /*#__PURE__*/React.createElement(Button, {
        variant: "ghost",
        size: "sm",
        onClick: () => setConfirm(r),
        disabled: r.st === '已退款'
      }, "\u9000\u6B3E")
    }],
    rows: window.AD.orders
  })), confirm && /*#__PURE__*/React.createElement("div", {
    onClick: () => setConfirm(null),
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 80,
      background: 'var(--surface-overlay)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: '100%',
      maxWidth: 420,
      background: '#fff',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-lg)',
      padding: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 800,
      color: 'var(--text-strong)'
    }
  }, "\u786E\u8BA4\u9000\u6B3E"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13.5,
      color: 'var(--text-muted)',
      marginTop: 8,
      lineHeight: 1.6
    }
  }, "\u5C06\u5BF9\u8BA2\u5355 ", /*#__PURE__*/React.createElement("span", {
    className: "ds-mono"
  }, confirm.no), " \u9000\u6B3E ", /*#__PURE__*/React.createElement(Money, {
    amount: confirm.amt,
    strong: true,
    color: "var(--price-accent)"
  }), ",\u539F\u8DEF\u9000\u56DE\u4E70\u5BB6\u3002\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 10,
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "neutral",
    size: "md",
    onClick: () => setConfirm(null)
  }, "\u53D6\u6D88"), /*#__PURE__*/React.createElement(Button, {
    variant: "danger",
    size: "md",
    onClick: () => {
      toast('已退款 ' + confirm.no);
      setConfirm(null);
    }
  }, "\u786E\u8BA4\u9000\u6B3E")))));
}
function AComplaints({
  toast
}) {
  return /*#__PURE__*/React.createElement(Panel, {
    title: "\u6295\u8BC9\u4EF2\u88C1",
    subtitle: "\u4E70\u5BB6\u6295\u8BC9 \xB7 \u5E73\u53F0\u88C1\u51B3",
    padded: false
  }, /*#__PURE__*/React.createElement(DataTable, {
    rowKey: "id",
    columns: [{
      key: 'no',
      title: '订单号',
      render: r => /*#__PURE__*/React.createElement("span", {
        className: "ds-mono",
        style: {
          fontSize: 12.5
        }
      }, r.no)
    }, {
      key: 'shop',
      title: '商户',
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          color: 'var(--text-muted)'
        }
      }, r.shop)
    }, {
      key: 'type',
      title: '投诉类型',
      render: r => /*#__PURE__*/React.createElement(Pill, {
        tone: "neutral"
      }, r.type)
    }, {
      key: 'buyer',
      title: '买家',
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          color: 'var(--text-muted)',
          fontSize: 12.5
        }
      }, r.buyer)
    }, {
      key: 'st',
      title: '状态',
      render: r => /*#__PURE__*/React.createElement(Pill, {
        tone: r.tone,
        dot: true
      }, r.st)
    }, {
      key: 'op',
      title: '操作',
      render: r => r.st === '待仲裁' ? /*#__PURE__*/React.createElement(Button, {
        variant: "primary",
        size: "sm",
        onClick: () => toast('打开裁决弹窗')
      }, "\u88C1\u51B3") : /*#__PURE__*/React.createElement(Button, {
        variant: "ghost",
        size: "sm",
        onClick: () => toast('查看 ' + r.no)
      }, "\u67E5\u770B")
    }],
    rows: window.AD.complaints
  }));
}
function Placeholder({
  label
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      border: '1px dashed var(--border-strong)',
      borderRadius: 'var(--radius-lg)',
      padding: '48px 24px',
      textAlign: 'center',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(I.Package, {
    size: 32,
    color: "var(--text-subtle)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 14
    }
  }, "\u300C", label, "\u300D\u9875\u9762 \u2014 \u6F14\u793A\u4E2D\u4EE5\u6838\u5FC3\u9875\u9762\u4E3A\u4E3B"));
}
function AdminApp() {
  const [active, setActive] = React.useState('a-dashboard');
  const [toast, setToast] = React.useState(null);
  const flash = React.useCallback(m => {
    setToast(m);
    clearTimeout(window.__at);
    window.__at = setTimeout(() => setToast(null), 1800);
  }, []);
  const flat = A_NAV.reduce((a, g) => a.concat(g.items), []);
  const label = flat.find(n => n.key === active)?.label;
  let screen;
  if (active === 'a-dashboard') screen = /*#__PURE__*/React.createElement(ADashboard, {
    go: setActive
  });else if (active === 'a-merchants') screen = /*#__PURE__*/React.createElement(AMerchants, {
    toast: flash
  });else if (active === 'a-orders') screen = /*#__PURE__*/React.createElement(AOrders, {
    toast: flash
  });else if (active === 'a-complaints') screen = /*#__PURE__*/React.createElement(AComplaints, {
    toast: flash
  });else screen = /*#__PURE__*/React.createElement(Placeholder, {
    label: label
  });
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(ConsoleShell, {
    nav: A_NAV,
    active: active,
    onNavigate: setActive,
    brandTitle: "\u79D2\u5361 \xB7 \u5E73\u53F0",
    brandSub: "\u8FD0\u8425\u63A7\u5236\u53F0",
    user: "\u5E73\u53F0\u7BA1\u7406\u5458",
    onLogout: () => flash('已退出登录(演示)')
  }, screen), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      top: 70,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 90,
      background: 'rgba(17,20,24,.9)',
      color: '#fff',
      padding: '10px 18px',
      borderRadius: 'var(--radius-pill)',
      fontSize: 13.5,
      fontWeight: 700,
      boxShadow: 'var(--shadow-lg)',
      whiteSpace: 'nowrap'
    }
  }, toast));
}
if (window.__MK_KIT) ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(AdminApp, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/adminapp.js", error: String((e && e.message) || e) }); }

// ui_kits/admin/data.js
try { (() => {
/* Platform (admin) console demo data. */
window.AD = {
  dashboard: {
    sales: {
      today: 184320.6,
      yesterday: 152800,
      total: 6820400
    },
    orders: {
      today: 1842,
      yesterday: 1560,
      exception: 7
    },
    profit: {
      today: 9216,
      yesterday: 7640,
      month: 184200,
      total: 682040
    },
    merchants: {
      total: 86,
      today: 2,
      active: 78,
      pending: 3,
      frozen: 1
    },
    products: {
      on_sale: 1240,
      total: 1560,
      cards_unsold: 38600
    },
    withdrawals: {
      pending_count: 5,
      pending_amount: 42800
    },
    complaints: {
      intervene: 2
    }
  },
  merchants: [{
    id: 'm1',
    shop: '极客发卡 · GeekCards',
    owner: 'geekcards',
    rate: '5%',
    deposit: 10000,
    status: '正常',
    tone: 'success',
    time: '2025-12-04'
  }, {
    id: 'm2',
    shop: '云端会员小铺',
    owner: 'cloudvip',
    rate: '6%',
    deposit: 5000,
    status: '正常',
    tone: 'success',
    time: '2026-01-18'
  }, {
    id: 'm3',
    shop: '次元游戏点卡',
    owner: 'aniacg',
    rate: '5%',
    deposit: 8000,
    status: '待审核',
    tone: 'pending',
    time: '2026-06-21'
  }, {
    id: 'm4',
    shop: '极速软件授权',
    owner: 'fastsoft',
    rate: '5%',
    deposit: 6000,
    status: '待审核',
    tone: 'pending',
    time: '2026-06-20'
  }, {
    id: 'm5',
    shop: '违规测试店',
    owner: 'baduser',
    rate: '8%',
    deposit: 2000,
    status: '冻结',
    tone: 'danger',
    time: '2026-03-02'
  }],
  orders: [{
    no: 'MK20260622A3F9',
    shop: '极客发卡',
    goods: 'Netflix 高级会员',
    amt: 29.9,
    st: '已发货',
    tone: 'success',
    time: '06-22 14:08'
  }, {
    no: 'MK20260622C2D5',
    shop: '云端会员小铺',
    goods: 'YouTube Premium',
    amt: 35,
    st: '发货中',
    tone: 'brand',
    time: '06-22 13:59'
  }, {
    no: 'MK20260622D1E8',
    shop: '次元游戏点卡',
    goods: 'Steam 充值卡 100元',
    amt: 96,
    st: '待支付',
    tone: 'pending',
    time: '06-22 13:40'
  }, {
    no: 'MK20260621J9M3',
    shop: '极客发卡',
    goods: 'Midjourney 提示词包',
    amt: 19.9,
    st: '异常待人工',
    tone: 'danger',
    time: '06-21 18:46'
  }, {
    no: 'MK20260621F5A1',
    shop: '极速软件授权',
    goods: 'Office 2021 密钥',
    amt: 68,
    st: '已退款',
    tone: 'danger',
    time: '06-21 22:13'
  }],
  complaints: [{
    id: 'c1',
    no: 'MK20260621J9M3',
    buyer: 'sun***@foxmail.com',
    shop: '极客发卡',
    type: '未收到货',
    st: '待仲裁',
    tone: 'pending',
    time: '06-21 19:02'
  }, {
    id: 'c2',
    no: 'MK20260620K2L1',
    buyer: 'liu***@qq.com',
    shop: '云端会员小铺',
    type: '卡密失效',
    st: '待仲裁',
    tone: 'pending',
    time: '06-20 21:40'
  }, {
    id: 'c3',
    no: 'MK20260619M5N3',
    buyer: 'zhou***@163.com',
    shop: '次元游戏点卡',
    type: '描述不符',
    st: '已解决',
    tone: 'success',
    time: '06-19 10:11'
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/data.js", error: String((e && e.message) || e) }); }

// ui_kits/admin/helpers.js
try { (() => {
/* Kit-local console helpers (not bundled DS components): money formatting,
   day-over-day delta, and a tiny quick-action grid. window globals. */
function Money({
  amount,
  strong,
  color
}) {
  const n = Number(amount);
  const text = Number.isFinite(n) ? `¥${n.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}` : '—';
  return /*#__PURE__*/React.createElement("span", {
    className: "tnum",
    style: {
      fontWeight: strong ? 800 : 600,
      color: color || 'inherit',
      whiteSpace: 'nowrap'
    }
  }, text);
}
function Delta({
  today,
  yesterday,
  money
}) {
  const a = Number(today),
    b = Number(yesterday);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  const diff = a - b,
    up = diff > 0,
    down = diff < 0;
  const color = up ? 'var(--success-fg)' : down ? 'var(--danger-fg)' : 'var(--text-subtle)';
  const arrow = up ? '↑' : down ? '↓' : '→';
  const mag = Math.abs(diff);
  return /*#__PURE__*/React.createElement("span", {
    style: {
      color,
      fontWeight: 700,
      whiteSpace: 'nowrap'
    }
  }, arrow, " ", money ? `¥${mag.toFixed(2)}` : mag);
}
function QuickGrid({
  items,
  onGo
}) {
  const TONE = {
    brand: ['var(--brand-active)', 'var(--brand-soft)'],
    secure: ['var(--secure-fg)', 'var(--secure-bg)'],
    success: ['var(--success-fg)', 'var(--success-bg)'],
    pending: ['var(--pending-fg)', 'var(--pending-bg)'],
    danger: ['var(--danger-fg)', 'var(--danger-bg)'],
    neutral: ['var(--text-body)', 'var(--surface-sunken)']
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(98px, 1fr))',
      gap: 10
    }
  }, items.map(q => {
    const Icon = window.Icons[q.icon] || window.Icons.Package;
    const [fg, bg] = TONE[q.tone] || TONE.brand;
    return /*#__PURE__*/React.createElement("button", {
      key: q.key,
      onClick: () => onGo && onGo(q.key),
      title: q.label,
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '14px 8px',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        background: '#fff',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 40,
        height: 40,
        borderRadius: 12,
        background: bg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      size: 20,
      color: fg
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 600,
        color: 'var(--text-body)',
        textAlign: 'center'
      }
    }, q.label));
  }));
}
Object.assign(window, {
  Money,
  Delta,
  QuickGrid
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/helpers.js", error: String((e && e.message) || e) }); }

// ui_kits/admin/icons.js
try { (() => {
/* Lucide-style icons (2px stroke, round caps) for the console kits.
   Superset of the storefront set + back-office glyphs. window.Icons global. */
const _ic = (paths, extra = {}) => ({
  size = 18,
  color = 'currentColor',
  strokeWidth = 2,
  ...rest
} = {}) => React.createElement('svg', {
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: color,
  strokeWidth,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  ...extra,
  ...rest
}, paths.map((d, i) => React.createElement('path', {
  key: i,
  d
})));
const Icons = {
  Shield: _ic(['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z']),
  ShieldCheck: _ic(['M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z', 'm9 12 2 2 4-4']),
  Zap: _ic(['M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z']),
  Mail: _ic(['m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7', 'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z']),
  Search: _ic(['m21 21-4.34-4.34', 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z']),
  Copy: _ic(['M8 8a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2z', 'M16 6V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h1']),
  Check: _ic(['M20 6 9 17l-5-5']),
  ChevronLeft: _ic(['m15 18-6-6 6-6']),
  ChevronRight: _ic(['m9 18 6-6-6-6']),
  Lock: _ic(['M7 11V7a5 5 0 0 1 10 0v4', 'M5 11h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2']),
  Headset: _ic(['M3 11a9 9 0 0 1 18 0', 'M21 16v2a4 4 0 0 1-4 4h-5', 'M3 11v3a2 2 0 0 0 2 2h1a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H3z', 'M21 11v3a2 2 0 0 1-2 2h-1a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3z']),
  RefreshCw: _ic(['M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8', 'M21 3v5h-5', 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16', 'M8 16H3v5']),
  Star: _ic(['M11.5 2.5 14 8l6 .5-4.5 4 1.4 6L11.5 15 6 18.5l1.4-6L3 8.5 9 8z']),
  Clock: _ic(['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 6v6l4 2']),
  Package: _ic(['m7.5 4.27 9 5.15', 'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z', 'm3.3 7 8.7 5 8.7-5', 'M12 22V12']),
  AlertTriangle: _ic(['m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z', 'M12 9v4', 'M12 17h.01']),
  Inbox: _ic(['M22 12h-6l-2 3h-4l-2-3H2', 'M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z']),
  Megaphone: _ic(['m3 11 18-5v12L3 14v-3z', 'M11.6 16.8a3 3 0 1 1-5.8-1.6']),
  QrCode: _ic(['M3 4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z', 'M15 4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z', 'M3 16a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z', 'M14 15h3v3', 'M20 15v.01', 'M14 21h7', 'M21 18v3']),
  Plus: _ic(['M12 5v14', 'M5 12h14']),
  Wallet: _ic(['M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2', 'M3 7h16a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H3', 'M16 12h.01']),
  Tag: _ic(['M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z', 'M7.5 7.5h.01'])
};
window.Icons = Icons;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/admin/icons.js", error: String((e && e.message) || e) }); }

// ui_kits/merchant/data.js
try { (() => {
/* Merchant console demo data. */
window.MC = {
  shop: '极客发卡 · GeekCards',
  summary: {
    sales_today: 12840.5,
    sales_yesterday: 9610,
    sales_total: 386200,
    orders_today: 128,
    orders_yesterday: 96,
    order_total: 38600,
    profit_today: 3210.4,
    profit_yesterday: 2480,
    profit_month: 64200
  },
  top: [{
    id: 1,
    title: 'Steam 充值卡 · 100元',
    qty: 842,
    orders: 760,
    sales: 80832
  }, {
    id: 2,
    title: 'Windows 11 Pro 密钥',
    qty: 521,
    orders: 498,
    sales: 20319
  }, {
    id: 3,
    title: 'Office 高效办公专栏',
    qty: 410,
    orders: 410,
    sales: 5289
  }, {
    id: 4,
    title: 'Netflix 高级会员 · 1月',
    qty: 304,
    orders: 290,
    sales: 9089
  }, {
    id: 5,
    title: 'ChatGPT Plus 代充',
    qty: 189,
    orders: 189,
    sales: 22491
  }],
  products: [{
    id: 'g1',
    title: 'Netflix 高级会员 · 1个月',
    type: '卡密',
    deliver: '自动',
    price: 29.9,
    original: 49,
    stock: 128,
    sold: 2304,
    status: '在售'
  }, {
    id: 'g2',
    title: 'ChatGPT Plus 代充 · 1个月',
    type: '权益',
    deliver: '手动',
    price: 119,
    original: 158,
    stock: 56,
    sold: 1890,
    status: '在售'
  }, {
    id: 'g3',
    title: 'Windows 11 Pro 专业版密钥',
    type: '权益',
    deliver: '自动',
    price: 39,
    original: 99,
    stock: 999,
    sold: 5621,
    status: '在售'
  }, {
    id: 'g4',
    title: 'Office 高效办公技巧专栏',
    type: '知识',
    deliver: '自动',
    price: 12.9,
    original: 29,
    stock: '—',
    sold: 3120,
    status: '在售'
  }, {
    id: 'g5',
    title: 'Spotify Premium · 3个月',
    type: '卡密',
    deliver: '自动',
    price: 45,
    original: 60,
    stock: 0,
    sold: 980,
    status: '缺货'
  }, {
    id: 'g6',
    title: 'Midjourney 提示词包 · 2000条',
    type: '资源',
    deliver: '自动',
    price: 19.9,
    original: 39,
    stock: '—',
    sold: 432,
    status: '待审'
  }],
  orders: [{
    no: 'MK20260622A3F9',
    goods: 'Netflix 高级会员 · 1月',
    buyer: 'buyer***@qq.com',
    amt: 29.9,
    st: '已发货',
    tone: 'success',
    time: '06-22 14:08'
  }, {
    no: 'MK20260622B7C2',
    goods: 'ChatGPT Plus 代充',
    buyer: 'li***@163.com',
    amt: 119,
    st: '发货中',
    tone: 'brand',
    time: '06-22 13:55'
  }, {
    no: 'MK20260622D1E8',
    goods: 'Steam 充值卡 100元',
    buyer: 'wang***@gmail.com',
    amt: 96,
    st: '待支付',
    tone: 'pending',
    time: '06-22 13:40'
  }, {
    no: 'MK20260621F5A1',
    goods: 'Office 2021 密钥',
    buyer: 'zhao***@qq.com',
    amt: 68,
    st: '已退款',
    tone: 'danger',
    time: '06-21 22:13'
  }, {
    no: 'MK20260621H2K7',
    goods: 'Windows 11 Pro 密钥',
    buyer: 'chen***@outlook.com',
    amt: 39,
    st: '已发货',
    tone: 'success',
    time: '06-21 20:01'
  }, {
    no: 'MK20260621J9M3',
    goods: 'Midjourney 提示词包',
    buyer: 'sun***@foxmail.com',
    amt: 19.9,
    st: '异常待人工',
    tone: 'danger',
    time: '06-21 18:46'
  }],
  wallet: {
    balance: 28640.18,
    pending: 3210.4,
    frozen: 1000,
    flow: [{
      id: 1,
      type: '收入',
      desc: '订单 MK…A3F9 成交',
      amt: 29.9,
      time: '06-22 14:08',
      tone: 'success'
    }, {
      id: 2,
      type: '佣金',
      desc: '平台佣金 5%',
      amt: -1.5,
      time: '06-22 14:08',
      tone: 'pending'
    }, {
      id: 3,
      type: '提现',
      desc: '提现至 支付宝 ****8821',
      amt: -5000,
      time: '06-21 10:30',
      tone: 'neutral'
    }, {
      id: 4,
      type: '退款',
      desc: '订单 MK…F5A1 原路退回',
      amt: -68,
      time: '06-21 22:13',
      tone: 'danger'
    }]
  }
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/merchant/data.js", error: String((e && e.message) || e) }); }

// ui_kits/merchant/helpers.js
try { (() => {
/* Kit-local console helpers (not bundled DS components): money formatting,
   day-over-day delta, and a tiny quick-action grid. window globals. */
function Money({
  amount,
  strong,
  color
}) {
  const n = Number(amount);
  const text = Number.isFinite(n) ? `¥${n.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}` : '—';
  return /*#__PURE__*/React.createElement("span", {
    className: "tnum",
    style: {
      fontWeight: strong ? 800 : 600,
      color: color || 'inherit',
      whiteSpace: 'nowrap'
    }
  }, text);
}
function Delta({
  today,
  yesterday,
  money
}) {
  const a = Number(today),
    b = Number(yesterday);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  const diff = a - b,
    up = diff > 0,
    down = diff < 0;
  const color = up ? 'var(--success-fg)' : down ? 'var(--danger-fg)' : 'var(--text-subtle)';
  const arrow = up ? '↑' : down ? '↓' : '→';
  const mag = Math.abs(diff);
  return /*#__PURE__*/React.createElement("span", {
    style: {
      color,
      fontWeight: 700,
      whiteSpace: 'nowrap'
    }
  }, arrow, " ", money ? `¥${mag.toFixed(2)}` : mag);
}
function QuickGrid({
  items,
  onGo
}) {
  const TONE = {
    brand: ['var(--brand-active)', 'var(--brand-soft)'],
    secure: ['var(--secure-fg)', 'var(--secure-bg)'],
    success: ['var(--success-fg)', 'var(--success-bg)'],
    pending: ['var(--pending-fg)', 'var(--pending-bg)'],
    danger: ['var(--danger-fg)', 'var(--danger-bg)'],
    neutral: ['var(--text-body)', 'var(--surface-sunken)']
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(98px, 1fr))',
      gap: 10
    }
  }, items.map(q => {
    const Icon = window.Icons[q.icon] || window.Icons.Package;
    const [fg, bg] = TONE[q.tone] || TONE.brand;
    return /*#__PURE__*/React.createElement("button", {
      key: q.key,
      onClick: () => onGo && onGo(q.key),
      title: q.label,
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '14px 8px',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        background: '#fff',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 40,
        height: 40,
        borderRadius: 12,
        background: bg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      size: 20,
      color: fg
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 600,
        color: 'var(--text-body)',
        textAlign: 'center'
      }
    }, q.label));
  }));
}
Object.assign(window, {
  Money,
  Delta,
  QuickGrid
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/merchant/helpers.js", error: String((e && e.message) || e) }); }

// ui_kits/merchant/icons.js
try { (() => {
/* Lucide-style icons (2px stroke, round caps) for the console kits.
   Superset of the storefront set + back-office glyphs. window.Icons global. */
const _ic = (paths, extra = {}) => ({
  size = 18,
  color = 'currentColor',
  strokeWidth = 2,
  ...rest
} = {}) => React.createElement('svg', {
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: color,
  strokeWidth,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  ...extra,
  ...rest
}, paths.map((d, i) => React.createElement('path', {
  key: i,
  d
})));
const Icons = {
  Shield: _ic(['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z']),
  ShieldCheck: _ic(['M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z', 'm9 12 2 2 4-4']),
  Zap: _ic(['M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z']),
  Mail: _ic(['m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7', 'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z']),
  Search: _ic(['m21 21-4.34-4.34', 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z']),
  Copy: _ic(['M8 8a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2z', 'M16 6V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h1']),
  Check: _ic(['M20 6 9 17l-5-5']),
  ChevronLeft: _ic(['m15 18-6-6 6-6']),
  ChevronRight: _ic(['m9 18 6-6-6-6']),
  Lock: _ic(['M7 11V7a5 5 0 0 1 10 0v4', 'M5 11h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2']),
  Headset: _ic(['M3 11a9 9 0 0 1 18 0', 'M21 16v2a4 4 0 0 1-4 4h-5', 'M3 11v3a2 2 0 0 0 2 2h1a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H3z', 'M21 11v3a2 2 0 0 1-2 2h-1a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3z']),
  RefreshCw: _ic(['M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8', 'M21 3v5h-5', 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16', 'M8 16H3v5']),
  Star: _ic(['M11.5 2.5 14 8l6 .5-4.5 4 1.4 6L11.5 15 6 18.5l1.4-6L3 8.5 9 8z']),
  Clock: _ic(['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 6v6l4 2']),
  Package: _ic(['m7.5 4.27 9 5.15', 'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z', 'm3.3 7 8.7 5 8.7-5', 'M12 22V12']),
  AlertTriangle: _ic(['m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z', 'M12 9v4', 'M12 17h.01']),
  Inbox: _ic(['M22 12h-6l-2 3h-4l-2-3H2', 'M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z']),
  Megaphone: _ic(['m3 11 18-5v12L3 14v-3z', 'M11.6 16.8a3 3 0 1 1-5.8-1.6']),
  QrCode: _ic(['M3 4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z', 'M15 4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z', 'M3 16a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z', 'M14 15h3v3', 'M20 15v.01', 'M14 21h7', 'M21 18v3']),
  Plus: _ic(['M12 5v14', 'M5 12h14']),
  Wallet: _ic(['M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2', 'M3 7h16a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H3', 'M16 12h.01']),
  Tag: _ic(['M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z', 'M7.5 7.5h.01'])
};
window.Icons = Icons;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/merchant/icons.js", error: String((e && e.message) || e) }); }

// ui_kits/merchant/merchantapp.js
try { (() => {
/* 商户后台 (merchant console) — composes ConsoleShell + console DS components.
   Screens: 数据概览 · 商品管理 · 卡密管理 · 订单管理 · 钱包提现. */
const {
  ConsoleShell,
  StatCard,
  Panel,
  DataTable,
  Pill,
  Button,
  Input
} = window.MiaoKa_b7a409;
const I = window.Icons;
const M_NAV = [{
  group: '概览',
  icon: I.Zap,
  items: [{
    key: 'm-stats',
    label: '数据概览',
    icon: I.Zap
  }]
}, {
  group: '商品',
  icon: I.Package,
  items: [{
    key: 'm-products',
    label: '商品管理',
    icon: I.Package
  }, {
    key: 'm-categories',
    label: '分类管理',
    icon: I.Inbox
  }, {
    key: 'm-cards',
    label: '卡密管理',
    icon: I.Lock
  }]
}, {
  group: '交易',
  icon: I.Search,
  items: [{
    key: 'm-orders',
    label: '订单管理',
    icon: I.Search
  }, {
    key: 'm-complaints',
    label: '投诉处理',
    icon: I.AlertTriangle
  }]
}, {
  group: '营销',
  icon: I.Star,
  items: [{
    key: 'm-coupons',
    label: '优惠券',
    icon: I.Tag
  }, {
    key: 'm-promotions',
    label: '满减满折',
    icon: I.Star
  }]
}, {
  group: '资金',
  icon: I.Wallet,
  items: [{
    key: 'm-wallet',
    label: '钱包 / 提现',
    icon: I.Wallet
  }]
}, {
  group: '店铺',
  icon: I.ShieldCheck,
  items: [{
    key: 'm-shop',
    label: '店铺装修',
    icon: I.ShieldCheck
  }]
}];
function GreetingCard() {
  const h = new Date().getHours();
  const hi = h < 6 ? '夜深了' : h < 12 ? '早上好' : h < 14 ? '中午好' : h < 18 ? '下午好' : '晚上好';
  return /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      flexWrap: 'wrap',
      padding: '20px 22px',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      background: 'linear-gradient(120deg, var(--brand-soft), #fff)',
      border: '1px solid var(--brand-soft-border)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 800,
      color: 'var(--text-strong)'
    }
  }, "\u60A8\u597D,", window.MC.shop, " \uD83D\uDC4B"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: 'var(--text-muted)',
      marginTop: 4
    }
  }, hi, ",\u53C8\u662F\u5143\u6C14\u6EE1\u6EE1\u7684\u4E00\u5929,\u795D\u4F60\u5F00\u5355\u987A\u5229")), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 52,
      height: 52,
      flex: 'none',
      borderRadius: 16,
      background: '#fff',
      boxShadow: 'var(--shadow-xs)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(I.Zap, {
    size: 26,
    color: "var(--brand)"
  })));
}
function MStats({
  go
}) {
  const s = window.MC.summary;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(GreetingCard, null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    filled: true,
    label: "\u4ECA\u65E5\u6210\u4EA4\u989D",
    icon: /*#__PURE__*/React.createElement(I.Zap, {
      size: 18,
      color: "#fff"
    }),
    value: /*#__PURE__*/React.createElement(Money, {
      amount: s.sales_today,
      strong: true
    }),
    sub: /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        gap: 8,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("span", null, "\u6628\u65E5 ", /*#__PURE__*/React.createElement(Money, {
      amount: s.sales_yesterday
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        opacity: .9
      }
    }, "\u7D2F\u8BA1 ", /*#__PURE__*/React.createElement(Money, {
      amount: s.sales_total
    })))
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "\u4ECA\u65E5\u8BA2\u5355",
    tone: "success",
    icon: /*#__PURE__*/React.createElement(I.Package, {
      size: 16,
      color: "var(--success-fg)"
    }),
    value: s.orders_today,
    sub: /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        gap: 8,
        whiteSpace: 'nowrap'
      }
    }, "\u6628\u65E5 ", s.orders_yesterday, " ", /*#__PURE__*/React.createElement(Delta, {
      today: s.orders_today,
      yesterday: s.orders_yesterday
    }))
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "\u4ECA\u65E5\u6BDB\u5229",
    tone: "secure",
    icon: /*#__PURE__*/React.createElement(I.Lock, {
      size: 16,
      color: "var(--secure-fg)"
    }),
    value: /*#__PURE__*/React.createElement(Money, {
      amount: s.profit_today,
      strong: true
    }),
    sub: /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        gap: 8,
        whiteSpace: 'nowrap'
      }
    }, "\u6628\u65E5 ", /*#__PURE__*/React.createElement(Money, {
      amount: s.profit_yesterday
    }), " ", /*#__PURE__*/React.createElement(Delta, {
      money: true,
      today: s.profit_today,
      yesterday: s.profit_yesterday
    }))
  })), /*#__PURE__*/React.createElement(Panel, {
    title: "\u5E38\u7528\u529F\u80FD",
    subtitle: "\u5FEB\u901F\u8FDB\u5165\u5404\u4E1A\u52A1\u6A21\u5757"
  }, /*#__PURE__*/React.createElement(QuickGrid, {
    onGo: go,
    items: [{
      key: 'm-products',
      label: '商品管理',
      icon: 'Package',
      tone: 'brand'
    }, {
      key: 'm-cards',
      label: '卡密管理',
      icon: 'Lock',
      tone: 'secure'
    }, {
      key: 'm-orders',
      label: '订单管理',
      icon: 'Search',
      tone: 'success'
    }, {
      key: 'm-wallet',
      label: '钱包提现',
      icon: 'Wallet',
      tone: 'pending'
    }, {
      key: 'm-shop',
      label: '店铺装修',
      icon: 'ShieldCheck',
      tone: 'neutral'
    }]
  })), /*#__PURE__*/React.createElement(Panel, {
    title: "\u70ED\u9500\u5546\u54C1",
    subtitle: "\u6309\u9500\u91CF\u6392\u5E8F Top 5",
    padded: false
  }, /*#__PURE__*/React.createElement(DataTable, {
    rowKey: "id",
    columns: [{
      key: 'title',
      title: '商品'
    }, {
      key: 'qty',
      title: '销量',
      align: 'right'
    }, {
      key: 'orders',
      title: '订单数',
      align: 'right'
    }, {
      key: 'sales',
      title: '销售额',
      align: 'right',
      render: r => /*#__PURE__*/React.createElement(Money, {
        amount: r.sales,
        strong: true
      })
    }],
    rows: window.MC.top
  })));
}
const TYPE_TONE = {
  卡密: 'brand',
  知识: 'secure',
  资源: 'pending',
  权益: 'success'
};
function MProducts({
  toast
}) {
  return /*#__PURE__*/React.createElement(Panel, {
    title: "\u5546\u54C1\u7BA1\u7406",
    subtitle: `共 ${window.MC.products.length} 件商品`,
    actions: /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "sm",
      iconLeft: /*#__PURE__*/React.createElement(I.Plus, {
        size: 15
      }),
      onClick: () => toast('打开新建商品表单')
    }, "\u65B0\u5EFA\u5546\u54C1"),
    padded: false
  }, /*#__PURE__*/React.createElement(DataTable, {
    rowKey: "id",
    columns: [{
      key: 'title',
      title: '商品',
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          fontWeight: 700,
          color: 'var(--text-strong)'
        }
      }, r.title)
    }, {
      key: 'type',
      title: '类型',
      render: r => /*#__PURE__*/React.createElement(Pill, {
        tone: TYPE_TONE[r.type]
      }, r.type)
    }, {
      key: 'deliver',
      title: '发货',
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          color: 'var(--text-muted)'
        }
      }, r.deliver)
    }, {
      key: 'price',
      title: '价格',
      align: 'right',
      render: r => /*#__PURE__*/React.createElement(Money, {
        amount: r.price,
        strong: true,
        color: "var(--price-accent)"
      })
    }, {
      key: 'stock',
      title: '库存',
      align: 'right',
      render: r => /*#__PURE__*/React.createElement("span", {
        className: "tnum"
      }, r.stock)
    }, {
      key: 'sold',
      title: '已售',
      align: 'right',
      render: r => /*#__PURE__*/React.createElement("span", {
        className: "tnum"
      }, r.sold)
    }, {
      key: 'status',
      title: '状态',
      render: r => /*#__PURE__*/React.createElement(Pill, {
        tone: r.status === '在售' ? 'success' : r.status === '缺货' ? 'danger' : 'pending',
        dot: true
      }, r.status)
    }, {
      key: 'op',
      title: '操作',
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          display: 'flex',
          gap: 6
        }
      }, /*#__PURE__*/React.createElement(Button, {
        variant: "ghost",
        size: "sm",
        onClick: () => toast('编辑「' + r.title + '」')
      }, "\u7F16\u8F91"))
    }],
    rows: window.MC.products
  }));
}
function MOrders({
  toast
}) {
  const [f, setF] = React.useState('全部');
  const filters = ['全部', '待支付', '发货中', '已发货', '已退款', '异常待人工'];
  const rows = window.MC.orders.filter(o => f === '全部' || o.st === f);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, filters.map(x => /*#__PURE__*/React.createElement("button", {
    key: x,
    onClick: () => setF(x),
    style: {
      height: 32,
      padding: '0 14px',
      borderRadius: 'var(--radius-pill)',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      fontWeight: f === x ? 800 : 600,
      border: f === x ? '1.5px solid var(--brand)' : '1px solid var(--border)',
      background: f === x ? 'var(--brand-soft)' : '#fff',
      color: f === x ? 'var(--brand-active)' : 'var(--text-body)'
    }
  }, x))), /*#__PURE__*/React.createElement(Panel, {
    padded: false
  }, /*#__PURE__*/React.createElement(DataTable, {
    rowKey: "no",
    empty: "\u8BE5\u72B6\u6001\u4E0B\u6682\u65E0\u8BA2\u5355",
    columns: [{
      key: 'no',
      title: '订单号',
      render: r => /*#__PURE__*/React.createElement("span", {
        className: "ds-mono",
        style: {
          fontSize: 12.5
        }
      }, r.no)
    }, {
      key: 'goods',
      title: '商品'
    }, {
      key: 'buyer',
      title: '买家',
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          color: 'var(--text-muted)'
        }
      }, r.buyer)
    }, {
      key: 'amt',
      title: '实付',
      align: 'right',
      render: r => /*#__PURE__*/React.createElement(Money, {
        amount: r.amt,
        strong: true,
        color: "var(--price-accent)"
      })
    }, {
      key: 'st',
      title: '状态',
      render: r => /*#__PURE__*/React.createElement(Pill, {
        tone: r.tone,
        dot: true
      }, r.st)
    }, {
      key: 'time',
      title: '时间',
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          color: 'var(--text-subtle)',
          fontSize: 12.5
        }
      }, r.time)
    }, {
      key: 'op',
      title: '操作',
      render: r => /*#__PURE__*/React.createElement(Button, {
        variant: "ghost",
        size: "sm",
        onClick: () => toast('查看订单 ' + r.no)
      }, "\u8BE6\u60C5")
    }],
    rows: rows
  })));
}
function MCards({
  toast
}) {
  const keys = ['NFLX-8K2D-···-9F1A', 'NFLX-3M7Q-···-2C8E', 'NFLX-PZ4R-···-7T0K', 'WINP-A1B2-···-X9Y8', 'WINP-K3L4-···-Q2W1'];
  const states = ['未售', '未售', '已售', '已售', '锁定'];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "\u672A\u552E\u5361\u5BC6",
    tone: "success",
    icon: /*#__PURE__*/React.createElement(I.Lock, {
      size: 16,
      color: "var(--success-fg)"
    }),
    value: "312",
    sub: "\u53EF\u552E\u5E93\u5B58"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "\u5DF2\u552E\u5361\u5BC6",
    tone: "neutral",
    icon: /*#__PURE__*/React.createElement(I.Check, {
      size: 16,
      color: "var(--text-body)"
    }),
    value: "2,304"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "\u9501\u5B9A\u4E2D",
    tone: "pending",
    icon: /*#__PURE__*/React.createElement(I.Clock, {
      size: 16,
      color: "var(--pending-fg)"
    }),
    value: "6",
    sub: "\u4E0B\u5355\u672A\u4ED8\u6B3E\u5360\u7528"
  })), /*#__PURE__*/React.createElement(Panel, {
    title: "\u5361\u5BC6\u5217\u8868",
    subtitle: "Netflix \u9AD8\u7EA7\u4F1A\u5458 \xB7 1\u4E2A\u6708 \xB7 \u8131\u654F\u663E\u793A",
    actions: /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      onClick: () => toast('批量导入卡密')
    }, "\u6279\u91CF\u5BFC\u5165"), /*#__PURE__*/React.createElement(Button, {
      variant: "neutral",
      size: "sm",
      onClick: () => toast('已导出')
    }, "\u5BFC\u51FA")),
    padded: false
  }, /*#__PURE__*/React.createElement(DataTable, {
    rowKey: "k",
    columns: [{
      key: 'k',
      title: '卡密 (脱敏)',
      render: r => /*#__PURE__*/React.createElement("span", {
        className: "ds-mono"
      }, r.k)
    }, {
      key: 's',
      title: '状态',
      render: r => /*#__PURE__*/React.createElement(Pill, {
        tone: r.s === '未售' ? 'success' : r.s === '已售' ? 'neutral' : 'pending',
        dot: true
      }, r.s)
    }, {
      key: 'op',
      title: '操作',
      render: r => /*#__PURE__*/React.createElement(Button, {
        variant: "ghost",
        size: "sm",
        onClick: () => toast('作废卡密'),
        disabled: r.s === '已售'
      }, "\u4F5C\u5E9F")
    }],
    rows: keys.map((k, i) => ({
      k,
      s: states[i]
    }))
  })));
}
function MWallet({
  toast
}) {
  const w = window.MC.wallet;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    filled: true,
    label: "\u53EF\u63D0\u73B0\u4F59\u989D",
    icon: /*#__PURE__*/React.createElement(I.Wallet, {
      size: 18,
      color: "#fff"
    }),
    value: /*#__PURE__*/React.createElement(Money, {
      amount: w.balance,
      strong: true
    }),
    sub: "T+1 \u5230\u8D26"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "\u5F85\u7ED3\u7B97",
    tone: "pending",
    icon: /*#__PURE__*/React.createElement(I.Clock, {
      size: 16,
      color: "var(--pending-fg)"
    }),
    value: /*#__PURE__*/React.createElement(Money, {
      amount: w.pending,
      strong: true
    })
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "\u51BB\u7ED3(\u4FDD\u8BC1\u91D1)",
    tone: "secure",
    icon: /*#__PURE__*/React.createElement(I.ShieldCheck, {
      size: 16,
      color: "var(--secure-fg)"
    }),
    value: /*#__PURE__*/React.createElement(Money, {
      amount: w.frozen,
      strong: true
    })
  })), /*#__PURE__*/React.createElement(Panel, {
    title: "\u8D44\u91D1\u6D41\u6C34",
    subtitle: "\u6536\u5165 / \u4F63\u91D1 / \u63D0\u73B0 / \u9000\u6B3E",
    actions: /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "sm",
      onClick: () => toast('打开提现申请')
    }, "\u7533\u8BF7\u63D0\u73B0"),
    padded: false
  }, /*#__PURE__*/React.createElement(DataTable, {
    rowKey: "id",
    columns: [{
      key: 'type',
      title: '类型',
      render: r => /*#__PURE__*/React.createElement(Pill, {
        tone: r.tone
      }, r.type)
    }, {
      key: 'desc',
      title: '说明'
    }, {
      key: 'amt',
      title: '金额',
      align: 'right',
      render: r => /*#__PURE__*/React.createElement(Money, {
        amount: r.amt,
        strong: true,
        color: r.amt >= 0 ? 'var(--success-fg)' : 'var(--text-strong)'
      })
    }, {
      key: 'time',
      title: '时间',
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          color: 'var(--text-subtle)',
          fontSize: 12.5
        }
      }, r.time)
    }],
    rows: w.flow
  })));
}
function Placeholder({
  label
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      border: '1px dashed var(--border-strong)',
      borderRadius: 'var(--radius-lg)',
      padding: '48px 24px',
      textAlign: 'center',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(I.Package, {
    size: 32,
    color: "var(--text-subtle)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 14
    }
  }, "\u300C", label, "\u300D\u9875\u9762 \u2014 \u6F14\u793A\u4E2D\u4EE5\u6838\u5FC3\u9875\u9762\u4E3A\u4E3B"));
}
function MerchantApp() {
  const [active, setActive] = React.useState('m-stats');
  const [toast, setToast] = React.useState(null);
  const flash = React.useCallback(m => {
    setToast(m);
    clearTimeout(window.__t);
    window.__t = setTimeout(() => setToast(null), 1800);
  }, []);
  const flat = M_NAV.reduce((a, g) => a.concat(g.items), []);
  const label = flat.find(n => n.key === active)?.label;
  let screen;
  if (active === 'm-stats') screen = /*#__PURE__*/React.createElement(MStats, {
    go: setActive
  });else if (active === 'm-products') screen = /*#__PURE__*/React.createElement(MProducts, {
    toast: flash
  });else if (active === 'm-cards') screen = /*#__PURE__*/React.createElement(MCards, {
    toast: flash
  });else if (active === 'm-orders') screen = /*#__PURE__*/React.createElement(MOrders, {
    toast: flash
  });else if (active === 'm-wallet') screen = /*#__PURE__*/React.createElement(MWallet, {
    toast: flash
  });else screen = /*#__PURE__*/React.createElement(Placeholder, {
    label: label
  });
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(ConsoleShell, {
    nav: M_NAV,
    active: active,
    onNavigate: setActive,
    brandTitle: "\u79D2\u5361 \xB7 \u5546\u6237",
    brandSub: window.MC.shop,
    user: window.MC.shop,
    onLogout: () => flash('已退出登录(演示)')
  }, screen), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      top: 70,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 90,
      background: 'rgba(17,20,24,.9)',
      color: '#fff',
      padding: '10px 18px',
      borderRadius: 'var(--radius-pill)',
      fontSize: 13.5,
      fontWeight: 700,
      boxShadow: 'var(--shadow-lg)',
      whiteSpace: 'nowrap'
    }
  }, toast));
}
if (window.__MK_KIT) ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(MerchantApp, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/merchant/merchantapp.js", error: String((e && e.message) || e) }); }

// ui_kits/storefront/app.js
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* App shell — orchestrates the browse → order → pay → retrieve flow. */
function mkKeys(product, qty) {
  const seg = () => Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').padEnd(4, 'X').slice(0, 4);
  const prefix = (product.name.match(/[A-Za-z]+/) || ['CARD'])[0].toUpperCase().slice(0, 5);
  return Array.from({
    length: qty
  }, () => `${prefix}-${seg()}-${seg()}-${seg()}-${seg()}`);
}
function mkOrderNo() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  return `MK${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${rand}`;
}
/* sample delivered order for manual lookups in the demo */
window.MK_SAMPLE_ORDER = function (query) {
  const p = window.MK_PRODUCTS[2];
  const qty = 1;
  return {
    orderNo: query && /^MK/i.test(query) ? query.toUpperCase() : mkOrderNo(),
    product: p,
    qty,
    email: query && query.includes('@') ? query : 'buyer@example.com',
    total: p.price * qty,
    status: 'delivered',
    keys: mkKeys(p, qty)
  };
};
function App() {
  const [screen, setScreen] = React.useState('home');
  const [product, setProduct] = React.useState(null);
  const [order, setOrder] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const go = s => {
    setScreen(s);
    window.scrollTo(0, 0);
  };
  const flashToast = React.useCallback(msg => {
    setToast(msg);
    clearTimeout(window.__mkToastT);
    window.__mkToastT = setTimeout(() => setToast(null), 1800);
  }, []);
  const selectProduct = p => {
    setProduct(p);
    go('detail');
  };
  const buy = o => {
    setOrder({
      ...o,
      orderNo: mkOrderNo(),
      status: 'pending'
    });
    go('pay');
  };
  const paid = o => {
    setOrder({
      ...o,
      status: 'delivered',
      keys: mkKeys(o.product, o.qty)
    });
    go('lookup');
  };
  const barProps = screen === 'detail' ? {
    back: true,
    onBack: () => go('home'),
    title: '商品详情'
  } : screen === 'pay' ? {
    back: true,
    onBack: () => go('detail'),
    title: '确认支付'
  } : screen === 'lookup' ? {
    back: true,
    onBack: () => go('home'),
    title: '订单查询 / 取卡'
  } : {};
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh'
    }
  }, /*#__PURE__*/React.createElement(TopBar, _extends({
    onHome: () => go('home'),
    onLookup: () => {
      go('lookup');
    }
  }, barProps)), screen === 'home' && /*#__PURE__*/React.createElement(StorefrontHome, {
    onSelect: selectProduct,
    flashToast: flashToast
  }), screen === 'detail' && product && /*#__PURE__*/React.createElement(ProductDetail, {
    product: product,
    onBuy: buy
  }), screen === 'pay' && order && /*#__PURE__*/React.createElement(PaymentScreen, {
    order: order,
    onPaid: paid
  }), screen === 'lookup' && /*#__PURE__*/React.createElement(OrderLookup, {
    order: order && order.status === 'delivered' ? order : null,
    onShop: () => go(order ? 'pay' : 'home')
  }), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      top: 76,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 60,
      background: 'rgba(17,20,24,.9)',
      color: '#fff',
      padding: '10px 18px',
      borderRadius: 'var(--radius-pill)',
      fontSize: 13.5,
      fontWeight: 700,
      boxShadow: 'var(--shadow-lg)',
      whiteSpace: 'nowrap',
      backdropFilter: 'blur(8px)'
    }
  }, toast));
}
if (window.__MK_KIT) ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/app.js", error: String((e && e.message) || e) }); }

// ui_kits/storefront/data.js
try { (() => {
/* Storefront demo data. Attaches to window for the babel scripts to share. */
window.MK_SHOP = {
  name: '极客发卡 · GeekCards',
  intro: '期待为您服务 · 官方授权 · 自动发货秒到账',
  verified: true,
  stats: {
    products: '36',
    deals: '38.6万',
    deposit: '10,000.00'
  }
};
window.MK_ANNOUNCE = ['平台公告:618 年中购物节进行中,全场卡密低至 5 折,政府补贴叠加可用。', '平台公告:所有商户均缴纳保证金,平台担保交易,假一赔十。'];

/* 四类销售类型(店铺顶部横排卡) */
window.MK_TYPES = [{
  id: 'card',
  name: '数字卡密',
  emoji: '🎫',
  count: 18,
  desc: '一卡一售 · 自动发货'
}, {
  id: 'knowledge',
  name: '知识文章',
  emoji: '📚',
  count: 6,
  desc: '购后解锁 · 站内阅读'
}, {
  id: 'resource',
  name: '资源下载',
  emoji: '📦',
  count: 8,
  desc: '限时签名 · 安全下载'
}, {
  id: 'right',
  name: '数字权益',
  emoji: '👑',
  count: 4,
  desc: '权益码 · 一权一售'
}];
window.MK_CATEGORIES = [{
  id: 'all',
  name: '全部',
  count: 36
}, {
  id: 'stream',
  name: '流媒体会员',
  count: 12
}, {
  id: 'ai',
  name: 'AI 工具',
  count: 8
}, {
  id: 'software',
  name: '软件授权',
  count: 9
}, {
  id: 'game',
  name: '游戏充值',
  count: 7
}];
window.MK_SORTS = ['综合', '销量', '上新', '价格'];
const SUB = {
  text: '平台担保',
  tone: 'subsidy'
};
window.MK_PRODUCTS = [{
  id: 'p1',
  cat: 'stream',
  type: '卡密',
  thumb: '🎬',
  name: 'Netflix 高级会员 · 1个月',
  subtitle: '本店流媒体热销第1名',
  desc: '4K 超清 · 独享车位 · 自动发货秒到账',
  price: 29.9,
  original: 49,
  priceLabel: '补贴后',
  stock: 128,
  sold: 2304,
  date: '06-21',
  promo: '超级立减',
  tags: [SUB, {
    text: '立减20%',
    tone: 'promo'
  }],
  detail: '官方独享车位,非合租。下单后系统自动发货,卡密含账号与密码,登录即用。支持 4K UHD 与 4 台设备同时观看。如遇问题 24 小时内包补。'
}, {
  id: 'p2',
  cat: 'ai',
  type: '权益',
  thumb: '🤖',
  name: 'ChatGPT Plus 代充 · 1个月',
  subtitle: '本店 AI 工具热销第1名',
  desc: '官方直充本号 · 稳定不掉 · 含 GPT-4o',
  price: 119,
  original: 158,
  priceLabel: '首单价',
  stock: 56,
  sold: 1890,
  date: '06-20',
  tags: [SUB, {
    text: '7天包售后',
    tone: 'promo'
  }],
  detail: '代充至您自己的 ChatGPT 账号(非共享号),下单后填写登录信息,30 分钟内充值完成。包含 GPT-4o、高级语音、联网与数据分析。'
}, {
  id: 'p3',
  cat: 'software',
  type: '权益',
  thumb: '🪟',
  name: 'Windows 11 Pro 专业版密钥',
  subtitle: '本店软件授权热销第1名',
  desc: '全新正版密钥 · 在线激活 · 永久使用',
  price: 39,
  original: 99,
  priceLabel: '补贴后',
  stock: 999,
  sold: 5621,
  date: '06-21',
  promo: '超级立减',
  tags: [SUB, {
    text: '立减60%',
    tone: 'promo'
  }],
  detail: '全新未使用的零售密钥,支持在线数字激活,绑定微软账号后永久有效,可重装。适用于 Windows 10/11 专业版升级与全新安装。'
}, {
  id: 'p4',
  cat: 'stream',
  type: '卡密',
  thumb: '🎵',
  name: 'Spotify Premium · 3个月',
  subtitle: '官方车位 · 无广告畅听',
  desc: '无广告 · 离线下载 · 官方车位',
  price: 45,
  original: 60,
  stock: 0,
  sold: 980,
  date: '06-18',
  tags: [SUB],
  detail: '官方独享 Premium,无广告畅听,支持离线下载与无损音质。'
}, {
  id: 'p5',
  cat: 'ai',
  type: '资源',
  thumb: '🎨',
  name: 'Midjourney 出图提示词包 · 2000条',
  subtitle: '资源下载 · 购后限时获取',
  desc: '高质量中文提示词 · 可商用',
  price: 19.9,
  original: 39,
  priceLabel: '首单价',
  stock: 23,
  sold: 432,
  date: '06-19',
  tags: [SUB, {
    text: '立减50%',
    tone: 'promo'
  }],
  detail: '2000 条精选 Midjourney 中文提示词,涵盖摄影、插画、电商、海报等场景。购买后获得 30 分钟有效的签名下载链。'
}, {
  id: 'p6',
  cat: 'game',
  type: '卡密',
  thumb: '🎮',
  name: 'Steam 充值卡 · 100元',
  subtitle: '本店游戏充值热销第1名',
  desc: '国区钱包 · 秒到账 · 官方面值',
  price: 96,
  original: 100,
  stock: 320,
  sold: 8742,
  date: '06-21',
  tags: [SUB, {
    text: '秒发货',
    tone: 'promo'
  }],
  detail: '国区 Steam 钱包充值码,面值 100 元,下单自动发货,在 Steam 客户端兑换即可到账。'
}, {
  id: 'p7',
  cat: 'software',
  type: '知识',
  thumb: '📚',
  name: 'Office 高效办公技巧 · 精品专栏',
  subtitle: '知识文章 · 购后站内阅读',
  desc: '32 章图文 · 永久回看 · 即买即读',
  price: 12.9,
  original: 29,
  priceLabel: '补贴后',
  stock: 410,
  sold: 3120,
  date: '06-17',
  promo: '超级立减',
  tags: [SUB],
  detail: '32 章 Office 三件套实战技巧,购买后立即解锁全部章节,站内阅读,永久回看,持续更新。'
}, {
  id: 'p8',
  cat: 'game',
  type: '权益',
  thumb: '⚔️',
  name: '原神 创世结晶 · 6480',
  subtitle: '官方直充 · 大额优惠',
  desc: '官方渠道 · 直充 UID · 大额优惠',
  price: 408,
  original: 488,
  priceLabel: '补贴后',
  stock: 4,
  sold: 1564,
  date: '06-16',
  tags: [SUB, {
    text: '大额优惠',
    tone: 'promo'
  }],
  detail: '官方渠道直充至您的 UID,填写服务器与 UID 后 10 分钟内到账,大额更优惠。'
}];
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/data.js", error: String((e && e.message) || e) }); }

// ui_kits/storefront/icons.js
try { (() => {
/* Lucide-style icons (2px stroke, round caps) — used across the storefront kit.
   See readme ICONOGRAPHY: Lucide is the chosen icon system. */
const _ic = (paths, extra = {}) => ({
  size = 18,
  color = 'currentColor',
  strokeWidth = 2,
  ...rest
} = {}) => React.createElement('svg', {
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: color,
  strokeWidth,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  ...extra,
  ...rest
}, paths.map((d, i) => React.createElement('path', {
  key: i,
  d
})));
const Icons = {
  Shield: _ic(['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z']),
  ShieldCheck: _ic(['M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z', 'm9 12 2 2 4-4']),
  Zap: _ic(['M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z']),
  Mail: _ic(['m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7', 'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z']),
  Search: _ic(['m21 21-4.34-4.34', 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z']),
  Copy: _ic(['M8 8a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2z', 'M16 6V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h1']),
  Check: _ic(['M20 6 9 17l-5-5']),
  ChevronLeft: _ic(['m15 18-6-6 6-6']),
  ChevronRight: _ic(['m9 18 6-6-6-6']),
  Lock: _ic(['M7 11V7a5 5 0 0 1 10 0v4', 'M5 11h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2']),
  Headset: _ic(['M3 11a9 9 0 0 1 18 0', 'M21 16v2a4 4 0 0 1-4 4h-5', 'M3 11v3a2 2 0 0 0 2 2h1a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H3z', 'M21 11v3a2 2 0 0 1-2 2h-1a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3z']),
  RefreshCw: _ic(['M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8', 'M21 3v5h-5', 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16', 'M8 16H3v5']),
  Star: _ic(['M11.5 2.5 14 8l6 .5-4.5 4 1.4 6L11.5 15 6 18.5l1.4-6L3 8.5 9 8z']),
  Clock: _ic(['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 6v6l4 2']),
  Package: _ic(['m7.5 4.27 9 5.15', 'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z', 'm3.3 7 8.7 5 8.7-5', 'M12 22V12']),
  Home: _ic(['M3 10.5 12 3l9 7.5', 'M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5']),
  Grid: _ic(['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M14 14h7v7h-7z', 'M3 14h7v7H3z']),
  Store: _ic(['M3 9 4.5 4h15L21 9', 'M4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9', 'M3 9h18', 'M9 21v-6h6v6']),
  Sparkles: _ic(['M12 3l1.8 4.8L18 9.6l-4.2 1.8L12 16l-1.8-4.6L6 9.6l4.2-1.8z', 'M19 14l.9 2.4L22 17.3l-2.1.9L19 20l-.9-1.8L16 17.3l2.1-.9z']),
  ChevronDown: _ic(['m6 9 6 6 6-6']),
  Plus: _ic(['M12 5v14', 'M5 12h14'])
};
window.Icons = Icons;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/icons.js", error: String((e && e.message) || e) }); }

// ui_kits/storefront/orderlookup.js
try { (() => {
/* Order lookup + card retrieval — the page where buyers receive their goods. */
function genKeys(product, qty) {
  const seg = () => Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').padEnd(4, 'X').slice(0, 4);
  const prefix = (product.name.match(/[A-Za-z]+/) || ['CARD'])[0].toUpperCase().slice(0, 5);
  return Array.from({
    length: qty
  }, () => `${prefix}-${seg()}-${seg()}-${seg()}-${seg()}`);
}
function OrderLookup({
  order,
  onShop
}) {
  const {
    Input,
    Button,
    OrderStatusBadge,
    CardKey
  } = window.MiaoKa_b7a409;
  const [mode, setMode] = React.useState('order');
  const [q, setQ] = React.useState('');
  const [error, setError] = React.useState('');
  const [toast, setToast] = React.useState('');
  const [result, setResult] = React.useState(order || null);
  React.useEffect(() => {
    if (order) setResult(order);
  }, [order]);
  const flashToast = m => {
    setToast(m);
    setTimeout(() => setToast(''), 1800);
  };
  const search = () => {
    const v = q.trim();
    if (!v) {
      setError('请输入订单号或邮箱');
      return;
    }
    setError('');
    // demo: any non-empty query returns the active order, else a sample delivered one
    if (order && (v === order.orderNo || v === order.email)) {
      setResult(order);
      return;
    }
    setResult(window.MK_SAMPLE_ORDER(v));
  };
  const copyAll = keys => {
    const text = keys.join('\n');
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    flashToast('已复制全部卡密');
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 560,
      margin: '0 auto',
      padding: '20px 16px 60px'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'var(--text-2xl)',
      fontWeight: 800,
      color: 'var(--text-strong)',
      letterSpacing: '-0.02em'
    }
  }, "\u8BA2\u5355\u67E5\u8BE2 / \u53D6\u5361"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: 'var(--text-muted)',
      marginTop: 6
    }
  }, "\u8F93\u5165\u4E0B\u5355\u65F6\u7684\u8BA2\u5355\u53F7\u6216\u90AE\u7BB1,\u5373\u53EF\u67E5\u770B\u8BA2\u5355\u72B6\u6001\u5E76\u9886\u53D6\u5361\u5BC6\u3002"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: 18,
      boxShadow: 'var(--shadow-sm)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginBottom: 14,
      background: 'var(--surface-sunken)',
      padding: 4,
      borderRadius: 'var(--radius-md)'
    }
  }, [['order', '按订单号'], ['email', '按邮箱']].map(([k, label]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setMode(k),
    style: {
      flex: 1,
      height: 36,
      border: 'none',
      borderRadius: 'var(--radius-sm)',
      cursor: 'pointer',
      background: mode === k ? '#fff' : 'transparent',
      color: mode === k ? 'var(--text-strong)' : 'var(--text-muted)',
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 14,
      boxShadow: mode === k ? 'var(--shadow-xs)' : 'none'
    }
  }, label))), /*#__PURE__*/React.createElement(Input, {
    placeholder: mode === 'order' ? '如 MK20260621A8F3' : '下单时填写的邮箱',
    icon: mode === 'order' ? /*#__PURE__*/React.createElement(Icons.Search, {
      size: 18
    }) : /*#__PURE__*/React.createElement(Icons.Mail, {
      size: 18
    }),
    value: q,
    onChange: e => {
      setQ(e.target.value);
      setError('');
    },
    error: error,
    onKeyDown: e => e.key === 'Enter' && search()
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    block: true,
    onClick: search,
    iconLeft: /*#__PURE__*/React.createElement(Icons.Search, {
      size: 18
    })
  }, "\u67E5\u8BE2\u8BA2\u5355"))), result && /*#__PURE__*/React.createElement(OrderResult, {
    result: result,
    onCopyAll: copyAll,
    onShop: onShop,
    flashToast: flashToast
  }), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      bottom: 28,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 60,
      background: 'var(--slate-900)',
      color: '#fff',
      padding: '11px 20px',
      borderRadius: 'var(--radius-pill)',
      fontSize: 14,
      fontWeight: 600,
      boxShadow: 'var(--shadow-lg)',
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Icons.Check, {
    size: 16,
    color: "var(--green-100)"
  }), toast));
}
function OrderResult({
  result,
  onCopyAll,
  onShop,
  flashToast
}) {
  const {
    OrderStatusBadge,
    CardKey,
    Button
  } = window.MiaoKa_b7a409;
  const delivered = result.status === 'delivered';
  const r = result;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-md)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 18px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-mono",
    style: {
      fontSize: 13,
      color: 'var(--text-muted)'
    }
  }, r.orderNo), /*#__PURE__*/React.createElement(OrderStatusBadge, {
    status: r.status
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 46,
      height: 46,
      borderRadius: 11,
      background: 'var(--brand-soft)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 24,
      flex: 'none'
    }
  }, r.product.thumb), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 700,
      color: 'var(--text-strong)'
    }
  }, r.product.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, "\u6570\u91CF \xD7", r.qty, " \xB7 \u5B9E\u4ED8 \xA5", r.total.toFixed(2), " \xB7 ", r.email))), delivered ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      margin: '4px 0 12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      fontSize: 13,
      fontWeight: 800,
      color: 'var(--success-fg)'
    }
  }, /*#__PURE__*/React.createElement(Icons.ShieldCheck, {
    size: 16,
    color: "var(--success-solid)"
  }), "\u5361\u5BC6\u5DF2\u53D1\u653E(", r.keys.length, ")"), r.keys.length > 1 && /*#__PURE__*/React.createElement("button", {
    onClick: () => onCopyAll(r.keys),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      border: '1.5px solid var(--border-strong)',
      background: '#fff',
      borderRadius: 'var(--radius-pill)',
      padding: '5px 12px',
      fontSize: 12.5,
      fontWeight: 700,
      color: 'var(--text-strong)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Icons.Copy, {
    size: 14
  }), "\u590D\u5236\u5168\u90E8")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, r.keys.map((code, i) => /*#__PURE__*/React.createElement(CardKey, {
    key: i,
    index: r.keys.length > 1 ? i + 1 : undefined,
    label: r.product.name.split(' ')[0] + ' 卡密',
    code: code,
    onCopy: () => flashToast('已复制卡密')
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: 'flex',
      gap: 9,
      padding: '12px 14px',
      background: 'var(--pending-bg)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--pending-border)'
    }
  }, /*#__PURE__*/React.createElement(Icons.Clock, {
    size: 16,
    color: "var(--pending-solid)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: 'var(--pending-fg)',
      lineHeight: 1.5
    }
  }, "\u8BF7\u5C3D\u5FEB\u590D\u5236\u5E76\u59A5\u5584\u4FDD\u7BA1\u5361\u5BC6\u3002\u5361\u5BC6\u4EC5\u5C55\u793A\u7ED9\u672C\u8BA2\u5355,\u5982\u9047\u95EE\u9898\u8BF7\u5728 24 \u5C0F\u65F6\u5185\u8054\u7CFB\u5BA2\u670D\u3002"))) : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(CardKey, {
    locked: true,
    label: "\u5361\u5BC6",
    lockedHint: "\u8BA2\u5355\u5F85\u652F\u4ED8,\u5B8C\u6210\u4ED8\u6B3E\u540E\u5361\u5BC6\u5C06\u5728\u6B64\u81EA\u52A8\u663E\u793A"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    block: true,
    onClick: onShop
  }, "\u53BB\u652F\u4ED8")))));
}
window.OrderLookup = OrderLookup;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/orderlookup.js", error: String((e && e.message) || e) }); }

// ui_kits/storefront/paymentscreen.js
try { (() => {
/* Payment screen — order summary, method selection, pay action. */
function PaymentScreen({
  order,
  onPaid
}) {
  const {
    CheckoutSteps,
    PaymentOption,
    PriceTag,
    Button
  } = window.MiaoKa_b7a409;
  const [method, setMethod] = React.useState('wechat');
  const [paying, setPaying] = React.useState(false);
  const p = order.product;
  const pay = () => {
    setPaying(true);
    setTimeout(() => onPaid(order), 1400);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 560,
      margin: '0 auto',
      padding: '18px 16px 120px'
    }
  }, /*#__PURE__*/React.createElement(CheckoutSteps, {
    current: 2
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22,
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 800,
      color: 'var(--text-strong)'
    }
  }, "\u8BA2\u5355\u4FE1\u606F"), /*#__PURE__*/React.createElement("span", {
    className: "ds-mono",
    style: {
      fontSize: 12.5,
      color: 'var(--text-muted)'
    }
  }, order.orderNo)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 52,
      height: 52,
      borderRadius: 12,
      background: 'var(--brand-soft)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 28,
      flex: 'none'
    }
  }, p.thumb), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: 'var(--text-strong)',
      lineHeight: 1.35
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      marginTop: 3
    }
  }, "\u6570\u91CF \xD7", order.qty, " \xB7 \u53D1\u5F80 ", order.email))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      paddingTop: 14,
      borderTop: '1px dashed var(--border)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: 'var(--text-strong)'
    }
  }, "\u5E94\u4ED8\u91D1\u989D"), /*#__PURE__*/React.createElement(PriceTag, {
    amount: order.total,
    size: "md"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 800,
      color: 'var(--text-subtle)',
      letterSpacing: '.06em',
      textTransform: 'uppercase',
      marginBottom: 12
    }
  }, "\u9009\u62E9\u652F\u4ED8\u65B9\u5F0F"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(PaymentOption, {
    name: "\u5FAE\u4FE1\u652F\u4ED8",
    desc: "\u6570\u4EBF\u7528\u6237\u7684\u9009\u62E9,\u5373\u65F6\u5230\u8D26",
    tag: "\u63A8\u8350",
    icon: "\uD83D\uDC9A",
    selected: method === 'wechat',
    onSelect: () => setMethod('wechat')
  }), /*#__PURE__*/React.createElement(PaymentOption, {
    name: "\u652F\u4ED8\u5B9D",
    desc: "\u5B89\u5168\u4FBF\u6377,\u652F\u6301\u82B1\u5457\u5206\u671F",
    icon: "\uD83C\uDD70\uFE0F",
    selected: method === 'alipay',
    onSelect: () => setMethod('alipay')
  }), /*#__PURE__*/React.createElement(PaymentOption, {
    name: "USDT \u6570\u5B57\u8D27\u5E01",
    desc: "TRC20 \xB7 \u5927\u989D\u8BA2\u5355\u53EF\u7528",
    icon: "\u20AE",
    selected: method === 'usdt',
    onSelect: () => setMethod('usdt')
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      display: 'flex',
      gap: 10,
      padding: '14px 16px',
      background: 'var(--secure-bg)',
      border: '1px solid var(--teal-50)',
      borderRadius: 'var(--radius-md)'
    }
  }, /*#__PURE__*/React.createElement(Icons.Lock, {
    size: 18,
    color: "var(--secure-solid)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--secure-fg)',
      lineHeight: 1.5
    }
  }, "\u652F\u4ED8\u901A\u8FC7\u6301\u724C\u7B2C\u4E09\u65B9\u52A0\u5BC6\u901A\u9053\u5B8C\u6210,\u5E73\u53F0\u4E0D\u5B58\u50A8\u60A8\u7684\u652F\u4ED8\u4FE1\u606F\u3002\u4ED8\u6B3E\u6210\u529F\u540E\u5361\u5BC6", /*#__PURE__*/React.createElement("b", null, "\u5373\u65F6\u81EA\u52A8\u53D1\u653E"), "\u3002")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 30,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderTop: '1px solid var(--border)',
      boxShadow: '0 -6px 24px rgba(18,27,42,.06)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 560,
      margin: '0 auto',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      lineHeight: 1.15
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)'
    }
  }, "\u5E94\u4ED8"), /*#__PURE__*/React.createElement(PriceTag, {
    amount: order.total,
    size: "md"
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    block: true,
    loading: paying,
    onClick: pay,
    style: {
      flex: 1
    },
    iconLeft: !paying && /*#__PURE__*/React.createElement(Icons.Lock, {
      size: 18
    })
  }, paying ? '正在跳转支付…' : `确认支付 ¥${order.total.toFixed(2)}`))));
}
window.PaymentScreen = PaymentScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/paymentscreen.js", error: String((e && e.message) || e) }); }

// ui_kits/storefront/productdetail.js
try { (() => {
/* Product detail + order form. */
function InfoRow({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '11px 0',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--text-muted)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: 'var(--text-strong)'
    }
  }, children));
}
function ProductDetail({
  product,
  onBuy
}) {
  const {
    CheckoutSteps,
    QuantityStepper,
    Input,
    Badge,
    PriceTag,
    Button
  } = window.MiaoKa_b7a409;
  const [qty, setQty] = React.useState(1);
  const [email, setEmail] = React.useState('');
  const [touched, setTouched] = React.useState(false);
  const p = product;
  const out = p.stock <= 0;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const total = p.price * qty;
  const submit = () => {
    setTouched(true);
    if (!emailOk || out) return;
    onBuy({
      product: p,
      qty,
      email,
      total
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 760,
      margin: '0 auto',
      padding: '18px 16px 120px'
    }
  }, /*#__PURE__*/React.createElement(CheckoutSteps, {
    current: 1
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      marginTop: 22,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 72,
      height: 72,
      borderRadius: 16,
      background: 'var(--brand-soft)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 38,
      flex: 'none'
    }
  }, p.thumb), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'var(--text-xl)',
      fontWeight: 800,
      color: 'var(--text-strong)',
      letterSpacing: '-0.01em',
      lineHeight: 1.3
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 8,
      flexWrap: 'wrap'
    }
  }, out ? /*#__PURE__*/React.createElement(Badge, {
    variant: "danger",
    dot: true
  }, "\u7F3A\u8D27") : /*#__PURE__*/React.createElement(Badge, {
    variant: "success",
    dot: true
  }, "\u6709\u8D27 ", p.stock), /*#__PURE__*/React.createElement(Badge, {
    variant: "secure",
    icon: /*#__PURE__*/React.createElement(Icons.Zap, {
      size: 13
    })
  }, "\u81EA\u52A8\u53D1\u8D27"), /*#__PURE__*/React.createElement(Badge, {
    variant: "neutral"
  }, "\u5DF2\u552E ", p.sold)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 12,
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(PriceTag, {
    amount: p.price,
    original: p.original,
    size: "lg"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--success-fg)',
      fontWeight: 700,
      background: 'var(--success-bg)',
      padding: '3px 9px',
      borderRadius: 99
    }
  }, "\u7701 \xA5", (p.original - p.price).toFixed(0))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22,
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: 18,
      boxShadow: 'var(--shadow-xs)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 800,
      color: 'var(--text-subtle)',
      letterSpacing: '.06em',
      textTransform: 'uppercase',
      marginBottom: 10
    }
  }, "\u5546\u54C1\u8BF4\u660E"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      color: 'var(--text-body)',
      lineHeight: 1.7,
      textWrap: 'pretty'
    }
  }, p.detail)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: 18,
      boxShadow: 'var(--shadow-sm)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: 'var(--text-strong)'
    }
  }, "\u8D2D\u4E70\u6570\u91CF"), /*#__PURE__*/React.createElement(QuantityStepper, {
    value: qty,
    min: 1,
    max: Math.max(1, p.stock),
    onChange: setQty
  })), /*#__PURE__*/React.createElement(Input, {
    label: "\u63A5\u6536\u90AE\u7BB1",
    required: true,
    type: "email",
    placeholder: "you@example.com",
    icon: /*#__PURE__*/React.createElement(Icons.Mail, {
      size: 18
    }),
    value: email,
    onChange: e => setEmail(e.target.value),
    error: touched && !emailOk ? '请输入有效的邮箱地址,卡密将发送至此' : '',
    hint: "\u5361\u5BC6\u5C06\u81EA\u52A8\u53D1\u9001\u5230\u6B64\u90AE\u7BB1,\u5E76\u53EF\u5728\u300C\u53D6\u5361 / \u67E5\u5355\u300D\u9875\u67E5\u770B"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      paddingTop: 16,
      borderTop: '1px dashed var(--border)'
    }
  }, /*#__PURE__*/React.createElement(InfoRow, {
    label: "\u5355\u4EF7"
  }, "\xA5", p.price.toFixed(2)), /*#__PURE__*/React.createElement(InfoRow, {
    label: "\u6570\u91CF"
  }, "\xD7", qty), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: 'var(--text-strong)'
    }
  }, "\u5E94\u4ED8\u91D1\u989D"), /*#__PURE__*/React.createElement(PriceTag, {
    amount: total,
    size: "md"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      justifyContent: 'center',
      marginTop: 16,
      color: 'var(--text-muted)',
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement(Icons.ShieldCheck, {
    size: 15,
    color: "var(--secure-solid)"
  }), "\u5E73\u53F0\u62C5\u4FDD \xB7 \u4ED8\u6B3E\u540E\u5361\u5BC6\u5373\u65F6\u53D1\u653E,\u5047\u4E00\u8D54\u5341"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 30,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderTop: '1px solid var(--border)',
      boxShadow: '0 -6px 24px rgba(18,27,42,.06)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 760,
      margin: '0 auto',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      lineHeight: 1.15
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)'
    }
  }, "\u5E94\u4ED8"), /*#__PURE__*/React.createElement(PriceTag, {
    amount: total,
    size: "md"
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    block: true,
    disabled: out,
    onClick: submit,
    style: {
      flex: 1
    },
    iconRight: /*#__PURE__*/React.createElement(Icons.ChevronRight, {
      size: 20
    })
  }, out ? '暂时缺货' : '立即购买'))));
}
window.ProductDetail = ProductDetail;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/productdetail.js", error: String((e && e.message) || e) }); }

// ui_kits/storefront/storefronthome.js
try { (() => {
/* Storefront home — Taobao-style shop: announcement bar, store header
   (cover + avatar + 认证/保证金/三联统计 + trust band), 4 sales-type cards,
   search + sort filter, 2-col image-led product grid, bottom tab bar. */
function TrustChip({
  icon,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 12.5,
      fontWeight: 600,
      color: 'var(--text-body)',
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      color: 'var(--secure-solid)'
    }
  }, icon), children);
}
function VerifiedBadge() {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      height: 22,
      padding: '0 9px 0 7px',
      background: 'var(--brand-gradient)',
      color: '#fff',
      borderRadius: 'var(--radius-pill)',
      fontSize: 12,
      fontWeight: 800,
      flex: 'none',
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement(Icons.ShieldCheck, {
    size: 13,
    color: "#fff"
  }), "\u5DF2\u8BA4\u8BC1");
}
function Stat({
  value,
  label,
  seal
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      textAlign: 'center',
      lineHeight: 1.2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 800,
      fontSize: 17,
      color: 'var(--text-strong)',
      fontVariantNumeric: 'tabular-nums',
      whiteSpace: 'nowrap'
    }
  }, value), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--text-muted)',
      marginTop: 3,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4
    }
  }, seal && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      width: 14,
      height: 14,
      borderRadius: '50%',
      background: 'var(--secure-solid)',
      color: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 9,
      fontWeight: 800
    }
  }, "\u4FDD"), label));
}
function AnnounceBar() {
  const [i, setI] = React.useState(0);
  const [show, setShow] = React.useState(true);
  React.useEffect(() => {
    const t = setInterval(() => setI(v => (v + 1) % window.MK_ANNOUNCE.length), 4000);
    return () => clearInterval(t);
  }, []);
  if (!show) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--brand-soft)',
      borderBottom: '1px solid var(--brand-soft-border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-page)',
      margin: '0 auto',
      padding: '0 16px',
      height: 36,
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13
    }
  }, "\uD83D\uDCE3"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 12.5,
      fontWeight: 600,
      color: 'var(--orange-700)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, window.MK_ANNOUNCE[i]), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShow(false),
    "aria-label": "\u5173\u95ED",
    style: {
      flex: 'none',
      width: 22,
      height: 22,
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      color: 'var(--orange-600)',
      fontSize: 15,
      lineHeight: 1
    }
  }, "\xD7")));
}
function StorefrontHome({
  onSelect,
  flashToast
}) {
  const {
    ProductCard
  } = window.MiaoKa_b7a409;
  const [cat, setCat] = React.useState('all');
  const [sort, setSort] = React.useState('综合');
  const [priceDir, setPriceDir] = React.useState('desc');
  const catName = Object.fromEntries(window.MK_CATEGORIES.map(c => [c.id, c.name]));
  let list = window.MK_PRODUCTS.filter(p => cat === 'all' || p.cat === cat);
  if (sort === '销量') list = [...list].sort((a, b) => b.sold - a.sold);else if (sort === '上新') list = [...list].sort((a, b) => b.date.localeCompare(a.date));else if (sort === '价格') list = [...list].sort((a, b) => priceDir === 'asc' ? a.price - b.price : b.price - a.price);
  const S = window.MK_SHOP;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      paddingBottom: 64
    }
  }, /*#__PURE__*/React.createElement(AnnounceBar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 150,
      position: 'relative',
      background: 'radial-gradient(120% 140% at 80% 0%, #FF7B33 0%, #FF5000 45%, #C23A00 100%)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'radial-gradient(60% 80% at 18% 120%, rgba(255,193,77,.55), transparent 60%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 18,
      bottom: 12,
      color: 'rgba(255,255,255,.6)',
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '.04em'
    }
  }, "MiaoKa \xB7 Verified Store")), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-page)',
      margin: '0 auto',
      padding: '0 16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: -24,
      position: 'relative',
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-md)',
      padding: '0 18px 18px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 84,
      height: 84,
      borderRadius: 22,
      marginTop: -34,
      flex: 'none',
      background: 'var(--brand-gradient)',
      boxShadow: 'var(--shadow-brand)',
      border: '4px solid #fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-mark-light.svg",
    width: "48",
    height: "48",
    alt: ""
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      paddingTop: 14,
      paddingBottom: 2
    }
  }, /*#__PURE__*/React.createElement(Stat, {
    value: S.stats.products,
    label: "\u5728\u552E\u5546\u54C1"
  }), /*#__PURE__*/React.createElement(Stat, {
    value: S.stats.deals,
    label: "\u7D2F\u8BA1\u6210\u4EA4"
  }), /*#__PURE__*/React.createElement(Stat, {
    value: '¥' + S.stats.deposit,
    label: "\u4FDD\u8BC1\u91D1",
    seal: true
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'var(--text-xl)',
      fontWeight: 800,
      color: 'var(--text-strong)',
      letterSpacing: '-0.01em'
    }
  }, S.name), S.verified && /*#__PURE__*/React.createElement(VerifiedBadge, null), /*#__PURE__*/React.createElement("button", {
    style: {
      marginLeft: 'auto',
      flex: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      height: 36,
      padding: '0 14px',
      border: '1.5px solid var(--brand-soft-border)',
      background: 'var(--brand-soft)',
      color: 'var(--brand-active)',
      borderRadius: 'var(--radius-pill)',
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 13,
      cursor: 'pointer',
      whiteSpace: 'nowrap'
    },
    onClick: () => flashToast && flashToast('已联系客服,稍后回复您')
  }, /*#__PURE__*/React.createElement(Icons.Headset, {
    size: 16
  }), "\u8054\u7CFB\u5546\u5BB6")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: 'var(--text-muted)',
      marginTop: 6
    }
  }, S.intro), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      flexWrap: 'wrap',
      marginTop: 14,
      paddingTop: 14,
      borderTop: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement(TrustChip, {
    icon: /*#__PURE__*/React.createElement(Icons.ShieldCheck, {
      size: 16
    })
  }, "\u5E73\u53F0\u62C5\u4FDD\u4EA4\u6613"), /*#__PURE__*/React.createElement(TrustChip, {
    icon: /*#__PURE__*/React.createElement(Icons.Zap, {
      size: 16
    })
  }, "\u81EA\u52A8\u53D1\u8D27 \xB7 \u79D2\u5230\u8D26"), /*#__PURE__*/React.createElement(TrustChip, {
    icon: /*#__PURE__*/React.createElement(Icons.RefreshCw, {
      size: 16
    })
  }, "\u975E\u4EBA\u4E3A\u95EE\u9898\u5305\u8865"), /*#__PURE__*/React.createElement(TrustChip, {
    icon: /*#__PURE__*/React.createElement(Icons.Headset, {
      size: 16
    })
  }, "7\xD724 \u5728\u7EBF\u5BA2\u670D"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      height: 42,
      padding: '0 14px',
      background: '#fff',
      border: '1.5px solid var(--border)',
      borderRadius: 'var(--radius-pill)'
    }
  }, /*#__PURE__*/React.createElement(Icons.Search, {
    size: 18,
    color: "var(--text-subtle)"
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "\u641C\u7D22\u5E97\u5185\u5546\u54C1",
    style: {
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      color: 'var(--text-strong)'
    }
  })), /*#__PURE__*/React.createElement("button", {
    style: {
      flex: 'none',
      height: 42,
      padding: '0 22px',
      border: 'none',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--cta-gradient-buy)',
      color: '#fff',
      fontFamily: 'var(--font-sans)',
      fontWeight: 800,
      fontSize: 14,
      cursor: 'pointer',
      boxShadow: 'var(--shadow-brand)'
    }
  }, "\u641C\u7D22"))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: 60,
      zIndex: 10,
      background: 'rgba(245,245,246,.9)',
      backdropFilter: 'blur(8px)',
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-page)',
      margin: '0 auto',
      padding: '0 16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      overflowX: 'auto',
      paddingBottom: 10,
      scrollbarWidth: 'none'
    }
  }, window.MK_CATEGORIES.map(c => {
    const on = c.id === cat;
    return /*#__PURE__*/React.createElement("button", {
      key: c.id,
      onClick: () => setCat(c.id),
      style: {
        flex: 'none',
        height: 32,
        padding: '0 14px',
        borderRadius: 'var(--radius-pill)',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontWeight: on ? 800 : 600,
        fontSize: 13,
        whiteSpace: 'nowrap',
        border: on ? '1.5px solid var(--brand)' : '1px solid var(--border)',
        background: on ? 'var(--brand-soft)' : '#fff',
        color: on ? 'var(--brand-active)' : 'var(--text-body)',
        transition: 'all .15s'
      }
    }, c.name, " ", /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 600,
        opacity: .65
      }
    }, c.count));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      height: 42,
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)'
    }
  }, window.MK_SORTS.map(s => {
    const on = s === sort;
    const isPrice = s === '价格';
    return /*#__PURE__*/React.createElement("button", {
      key: s,
      onClick: () => {
        if (isPrice && on) setPriceDir(d => d === 'asc' ? 'desc' : 'asc');
        setSort(s);
      },
      style: {
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        height: 30,
        padding: '0 14px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontWeight: on ? 800 : 600,
        fontSize: 13.5,
        color: on ? 'var(--brand)' : 'var(--text-body)'
      }
    }, s, isPrice && /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        flexDirection: 'column',
        lineHeight: .5,
        marginLeft: 1
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 8,
        color: on && priceDir === 'asc' ? 'var(--brand)' : 'var(--text-subtle)'
      }
    }, "\u25B2"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 8,
        color: on && priceDir === 'desc' ? 'var(--brand)' : 'var(--text-subtle)'
      }
    }, "\u25BC")));
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      color: 'var(--text-muted)',
      padding: '0 6px'
    }
  }, /*#__PURE__*/React.createElement(Icons.Grid, {
    size: 18
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-page)',
      margin: '0 auto',
      padding: '12px 16px 24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))',
      gap: 10
    }
  }, list.map(p => /*#__PURE__*/React.createElement(ProductCard, {
    key: p.id,
    name: p.name,
    subtitle: p.subtitle,
    price: p.price,
    original: p.original,
    priceLabel: p.priceLabel,
    stock: p.stock,
    thumb: p.thumb,
    category: catName[p.cat],
    typeLabel: p.type,
    promo: p.promo,
    tags: p.tags,
    sold: p.sold,
    onCart: () => flashToast && flashToast('已加入购物车'),
    onClick: () => onSelect(p)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      color: 'var(--text-subtle)',
      fontSize: 13,
      marginTop: 24
    }
  }, "\u2014 \u6CA1\u6709\u66F4\u591A\u4E86 \u2014")), /*#__PURE__*/React.createElement("nav", {
    style: {
      position: 'sticky',
      bottom: 0,
      zIndex: 15,
      background: 'rgba(255,255,255,.94)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      maxWidth: 'var(--container-page)',
      margin: '0 auto'
    }
  }, [{
    k: 'home',
    label: '首页',
    icon: Icons.Home
  }, {
    k: 'goods',
    label: '宝贝',
    icon: Icons.Grid,
    active: true
  }, {
    k: 'store',
    label: '门店',
    icon: Icons.Store
  }, {
    k: 'new',
    label: '新品',
    icon: Icons.Sparkles
  }, {
    k: 'service',
    label: '客服',
    icon: Icons.Headset
  }].map(it => /*#__PURE__*/React.createElement("button", {
    key: it.k,
    onClick: () => flashToast && flashToast(it.label),
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 3,
      padding: '8px 0 10px',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      color: it.active ? 'var(--brand)' : 'var(--text-muted)',
      fontFamily: 'var(--font-sans)',
      fontWeight: it.active ? 800 : 600,
      fontSize: 11
    }
  }, /*#__PURE__*/React.createElement(it.icon, {
    size: 22
  }), it.label))));
}
window.StorefrontHome = StorefrontHome;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/storefronthome.js", error: String((e && e.message) || e) }); }

// ui_kits/storefront/topbar.js
try { (() => {
/* Top app bar — logo, shop name, and a 取卡 (order lookup) entry. */
function TopBar({
  onHome,
  onLookup,
  back,
  onBack,
  title
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 20,
      background: 'rgba(255,255,255,0.86)',
      backdropFilter: 'saturate(180%) blur(12px)',
      WebkitBackdropFilter: 'saturate(180%) blur(12px)',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-page)',
      margin: '0 auto',
      height: 60,
      padding: '0 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      minWidth: 0
    }
  }, back ? /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    "aria-label": "\u8FD4\u56DE",
    style: {
      width: 38,
      height: 38,
      marginLeft: -6,
      border: 'none',
      background: 'transparent',
      borderRadius: 'var(--radius-sm)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-strong)'
    }
  }, /*#__PURE__*/React.createElement(Icons.ChevronLeft, {
    size: 24
  })) : /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-mark.svg",
    width: "32",
    height: "32",
    alt: "",
    style: {
      cursor: 'pointer'
    },
    onClick: onHome
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      lineHeight: 1.1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 800,
      fontSize: 16,
      color: 'var(--text-strong)',
      letterSpacing: '-0.01em',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, title || window.MK_SHOP.name), !title && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)',
      fontWeight: 600
    }
  }, window.MK_SHOP.intro))), /*#__PURE__*/React.createElement("button", {
    onClick: onLookup,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      height: 38,
      padding: '0 14px',
      border: '1.5px solid var(--border-strong)',
      background: '#fff',
      borderRadius: 'var(--radius-pill)',
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 13,
      color: 'var(--text-strong)',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement(Icons.Package, {
    size: 16,
    color: "var(--brand)"
  }), "\u53D6\u5361 / \u67E5\u5355")));
}
window.TopBar = TopBar;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/topbar.js", error: String((e && e.message) || e) }); }

__ds_ns.CardKey = __ds_scope.CardKey;

__ds_ns.CheckoutSteps = __ds_scope.CheckoutSteps;

__ds_ns.OrderStatusBadge = __ds_scope.OrderStatusBadge;

__ds_ns.PaymentOption = __ds_scope.PaymentOption;

__ds_ns.ProductCard = __ds_scope.ProductCard;

__ds_ns.ProductListItem = __ds_scope.ProductListItem;

__ds_ns.ConsoleShell = __ds_scope.ConsoleShell;

__ds_ns.DataTable = __ds_scope.DataTable;

__ds_ns.Panel = __ds_scope.Panel;

__ds_ns.Pill = __ds_scope.Pill;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.PriceTag = __ds_scope.PriceTag;

__ds_ns.QuantityStepper = __ds_scope.QuantityStepper;

})();
