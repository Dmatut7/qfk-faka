/* @ds-bundle: {"format":3,"namespace":"MiaoKa_cadc89","components":[{"name":"CardKey","sourcePath":"components/commerce/CardKey.jsx"},{"name":"CheckoutSteps","sourcePath":"components/commerce/CheckoutSteps.jsx"},{"name":"OrderStatusBadge","sourcePath":"components/commerce/OrderStatusBadge.jsx"},{"name":"PaymentOption","sourcePath":"components/commerce/PaymentOption.jsx"},{"name":"ProductCard","sourcePath":"components/commerce/ProductCard.jsx"},{"name":"ProductListItem","sourcePath":"components/commerce/ProductListItem.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"},{"name":"PriceTag","sourcePath":"components/core/PriceTag.jsx"},{"name":"QuantityStepper","sourcePath":"components/core/QuantityStepper.jsx"}],"sourceHashes":{"components/commerce/CardKey.jsx":"ba2d121b586d","components/commerce/CheckoutSteps.jsx":"c23ed992305f","components/commerce/OrderStatusBadge.jsx":"86e992e0eff0","components/commerce/PaymentOption.jsx":"bb42a6733de0","components/commerce/ProductCard.jsx":"18ab657766d8","components/commerce/ProductListItem.jsx":"22c9e12f0772","components/core/Badge.jsx":"ffab6d0bc09a","components/core/Button.jsx":"142c34bd07c1","components/core/Card.jsx":"d163888f26bf","components/core/Input.jsx":"fcbad4e4fc5f","components/core/PriceTag.jsx":"e6dfd7b855f7","components/core/QuantityStepper.jsx":"4cff59bc4033","ui_kits/storefront/App.jsx":"618a12837f97","ui_kits/storefront/Icons.jsx":"f2a956a88894","ui_kits/storefront/OrderLookup.jsx":"515643c8b950","ui_kits/storefront/PaymentScreen.jsx":"696afd6c7b6d","ui_kits/storefront/ProductDetail.jsx":"f9ebe89921c9","ui_kits/storefront/StorefrontHome.jsx":"63c90bd80876","ui_kits/storefront/TopBar.jsx":"02839b8c1ba9","ui_kits/storefront/data.js":"237c30663659"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.MiaoKa_cadc89 = window.MiaoKa_cadc89 || {});

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
.mk-cardkey__copy:active{ background:var(--blue-100); }
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
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2.4",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M20 6 9 17l-5-5"
}));
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
  const copy = () => {
    const text = String(code || '');
    const finish = () => {
      setDone(true);
      onCopy && onCopy(text);
      setTimeout(() => setDone(false), 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(finish).catch(finish);
    } else {
      finish();
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
    onClick: copy
  }, done ? /*#__PURE__*/React.createElement(CheckIcon, null) : /*#__PURE__*/React.createElement(CopyIcon, null), done ? '已复制' : '复制'))));
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
    "aria-pressed": selected
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
    className: "mk-badge__dot"
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
    solid: solid
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

.mk-btn--secondary{ --_bg:#fff; --_fg:var(--brand); --_bd:var(--blue-200); box-shadow:var(--shadow-xs); }
.mk-btn--secondary:hover:not([disabled]){ --_bg:var(--brand-soft); --_bd:var(--blue-300); }

.mk-btn--neutral{ --_bg:#fff; --_fg:var(--text-strong); --_bd:var(--border-strong); box-shadow:var(--shadow-xs); }
.mk-btn--neutral:hover:not([disabled]){ --_bg:var(--surface-sunken); }

.mk-btn--ghost{ --_bg:transparent; --_fg:var(--text-body); box-shadow:none; }
.mk-btn--ghost:hover:not([disabled]){ --_bg:var(--surface-sunken); }

.mk-btn--danger{ --_bg:var(--danger-solid); --_fg:#fff; box-shadow:0 8px 20px rgba(224,68,74,.26); }
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
.mk-input--error:focus{ box-shadow:0 0 0 3px rgba(224,68,74,.24); }
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
    "aria-invalid": !!error
  }, rest))), (error || hint) && /*#__PURE__*/React.createElement("span", {
    className: `mk-field__hint${error ? ' mk-field__hint--error' : ''}`
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

// components/core/PriceTag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.mk-price{ display:inline-flex; align-items:baseline; gap:8px; font-family:var(--font-sans); }
.mk-price__main{ display:inline-flex; align-items:baseline; color:var(--price-accent); font-weight:var(--fw-extra); letter-spacing:var(--ls-snug); font-variant-numeric:tabular-nums; }
.mk-price__sym{ font-size:.62em; font-weight:var(--fw-bold); margin-right:1px; align-self:flex-start; margin-top:.18em; }
.mk-price--neutral .mk-price__main{ color:var(--price-color); }
.mk-price__orig{ color:var(--text-subtle); text-decoration:line-through; font-weight:var(--fw-medium); font-variant-numeric:tabular-nums; }
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
function fmt(n) {
  if (typeof n !== 'number') return n;
  return n.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
function PriceTag({
  amount,
  original,
  currency = '¥',
  size = 'md',
  tone = 'accent',
  className = '',
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    className: ['mk-price', `mk-price--${size}`, tone === 'neutral' ? 'mk-price--neutral' : '', className].filter(Boolean).join(' ')
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "mk-price__main"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mk-price__sym"
  }, currency), fmt(amount)), original != null && /*#__PURE__*/React.createElement("span", {
    className: "mk-price__orig"
  }, currency, fmt(original)));
}
Object.assign(__ds_scope, { PriceTag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/PriceTag.jsx", error: String((e && e.message) || e) }); }

// components/commerce/ProductCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.mk-prod{ display:flex; flex-direction:column; height:100%; }
.mk-prod__top{ display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
.mk-prod__thumb{ width:46px; height:46px; border-radius:var(--radius-md); flex:none; display:flex; align-items:center; justify-content:center; font-size:24px; background:var(--brand-soft); overflow:hidden; }
.mk-prod__thumb img{ width:100%; height:100%; object-fit:cover; }
.mk-prod__name{ font-size:var(--text-md); font-weight:var(--fw-bold); color:var(--text-strong); line-height:var(--lh-snug); letter-spacing:var(--ls-snug); }
.mk-prod__desc{ font-size:var(--text-sm); color:var(--text-muted); margin-top:5px; line-height:var(--lh-snug); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.mk-prod__foot{ display:flex; align-items:flex-end; justify-content:space-between; gap:8px; margin-top:14px; }
.mk-prod__sold{ font-size:var(--text-xs); color:var(--text-subtle); margin-top:6px; }
.mk-prod--out{ opacity:.66; }
`;
if (typeof document !== 'undefined' && !document.getElementById('mk-prod-css')) {
  const s = document.createElement('style');
  s.id = 'mk-prod-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}
function ProductCard({
  name,
  desc,
  price,
  original,
  stock = 0,
  thumb,
  sold,
  badge,
  onClick,
  className = '',
  ...rest
}) {
  const out = stock <= 0;
  return /*#__PURE__*/React.createElement(__ds_scope.Card, _extends({
    interactive: !out,
    onClick: out ? undefined : onClick,
    className: ['mk-prod', out ? 'mk-prod--out' : '', className].filter(Boolean).join(' ')
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "mk-prod__top"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mk-prod__thumb"
  }, thumb), out ? /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    variant: "danger",
    dot: true
  }, "\u7F3A\u8D27") : badge || /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    variant: "success",
    dot: true
  }, "\u6709\u8D27", stock > 0 ? ` ${stock}` : '')), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "mk-prod__name"
  }, name), desc && /*#__PURE__*/React.createElement("div", {
    className: "mk-prod__desc"
  }, desc)), /*#__PURE__*/React.createElement("div", {
    className: "mk-prod__foot"
  }, /*#__PURE__*/React.createElement(__ds_scope.PriceTag, {
    amount: price,
    original: original,
    size: "md"
  }), sold != null && /*#__PURE__*/React.createElement("span", {
    className: "mk-prod__sold"
  }, "\u5DF2\u552E ", sold)));
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
.mk-qty__input:focus{ outline:none; }
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
  const clamp = n => Math.max(min, Math.min(max, n));
  const set = n => onChange && onChange(clamp(n));
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['mk-qty', size === 'sm' ? 'mk-qty--sm' : '', className].filter(Boolean).join(' ')
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
    value: value,
    min: min,
    max: max,
    onChange: e => {
      const n = parseInt(e.target.value, 10);
      set(Number.isNaN(n) ? min : n);
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "mk-qty__btn",
    "aria-label": "\u589E\u52A0",
    disabled: value >= max,
    onClick: () => set(value + 1)
  }, "+"));
}
Object.assign(__ds_scope, { QuantityStepper });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/QuantityStepper.jsx", error: String((e && e.message) || e) }); }

// ui_kits/storefront/App.jsx
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
  const go = s => {
    setScreen(s);
    window.scrollTo(0, 0);
  };
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
    onSelect: selectProduct
  }), screen === 'detail' && product && /*#__PURE__*/React.createElement(ProductDetail, {
    product: product,
    onBuy: buy
  }), screen === 'pay' && order && /*#__PURE__*/React.createElement(PaymentScreen, {
    order: order,
    onPaid: paid
  }), screen === 'lookup' && /*#__PURE__*/React.createElement(OrderLookup, {
    order: order && order.status === 'delivered' ? order : null,
    onShop: () => go(order ? 'pay' : 'home')
  }));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/storefront/Icons.jsx
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
  Package: _ic(['m7.5 4.27 9 5.15', 'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z', 'm3.3 7 8.7 5 8.7-5', 'M12 22V12'])
};
window.Icons = Icons;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/Icons.jsx", error: String((e && e.message) || e) }); }

// ui_kits/storefront/OrderLookup.jsx
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
  } = window.MiaoKa_cadc89;
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
  } = window.MiaoKa_cadc89;
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
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/OrderLookup.jsx", error: String((e && e.message) || e) }); }

// ui_kits/storefront/PaymentScreen.jsx
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
  } = window.MiaoKa_cadc89;
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
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/PaymentScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/storefront/ProductDetail.jsx
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
  } = window.MiaoKa_cadc89;
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
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/ProductDetail.jsx", error: String((e && e.message) || e) }); }

// ui_kits/storefront/StorefrontHome.jsx
try { (() => {
/* Storefront home — merchant store header (cover + avatar + 认证/保证金/联系),
   trust band, category tabs, product grid. */
function TrustChip({
  icon,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      fontSize: 13,
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
      gap: 4,
      height: 22,
      padding: '0 9px 0 7px',
      background: 'var(--brand)',
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
function StorefrontHome({
  onSelect
}) {
  const {
    ProductCard,
    ProductListItem
  } = window.MiaoKa_cadc89;
  const [cat, setCat] = React.useState('all');
  const catName = Object.fromEntries(window.MK_CATEGORIES.map(c => [c.id, c.name]));
  const list = window.MK_PRODUCTS.filter(p => cat === 'all' || p.cat === cat);
  const S = window.MK_SHOP;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 150,
      position: 'relative',
      background: 'radial-gradient(120% 140% at 80% 0%, #2F6BFF 0%, #1A45BD 45%, #11297A 100%)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'radial-gradient(60% 80% at 18% 120%, rgba(15,169,160,.5), transparent 60%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 18,
      bottom: 12,
      color: 'rgba(255,255,255,.5)',
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
      background: 'var(--brand)',
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
    label: "\u5546\u54C1"
  }), /*#__PURE__*/React.createElement(Stat, {
    value: S.stats.deals,
    label: "\u6210\u4EA4"
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
    }
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
      size: 17
    })
  }, "\u5E73\u53F0\u62C5\u4FDD\u4EA4\u6613"), /*#__PURE__*/React.createElement(TrustChip, {
    icon: /*#__PURE__*/React.createElement(Icons.Zap, {
      size: 17
    })
  }, "\u81EA\u52A8\u53D1\u8D27 \xB7 \u79D2\u5230\u8D26"), /*#__PURE__*/React.createElement(TrustChip, {
    icon: /*#__PURE__*/React.createElement(Icons.RefreshCw, {
      size: 17
    })
  }, "\u975E\u4EBA\u4E3A\u95EE\u9898\u5305\u8865"), /*#__PURE__*/React.createElement(TrustChip, {
    icon: /*#__PURE__*/React.createElement(Icons.Headset, {
      size: 17
    })
  }, "7\xD724 \u5728\u7EBF\u5BA2\u670D")))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: 60,
      zIndex: 10,
      background: 'var(--bg-page)',
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-page)',
      margin: '0 auto',
      padding: '0 16px',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 24,
      overflowX: 'auto',
      scrollbarWidth: 'none'
    }
  }, window.MK_CATEGORIES.map(c => {
    const on = c.id === cat;
    return /*#__PURE__*/React.createElement("button", {
      key: c.id,
      onClick: () => setCat(c.id),
      style: {
        flex: 'none',
        position: 'relative',
        height: 46,
        padding: '0 2px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontWeight: on ? 800 : 600,
        fontSize: 15,
        color: on ? 'var(--brand-active)' : 'var(--text-muted)',
        whiteSpace: 'nowrap',
        transition: 'color .15s'
      }
    }, c.name, on && /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 0,
        width: 22,
        height: 3,
        borderRadius: 3,
        background: 'var(--brand)'
      }
    }));
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-page)',
      margin: '0 auto',
      padding: '16px 16px 96px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
      gap: 12
    }
  }, list.map(p => /*#__PURE__*/React.createElement(ProductListItem, {
    key: p.id,
    name: p.name,
    desc: p.desc,
    price: p.price,
    original: p.original,
    stock: p.stock,
    thumb: p.thumb,
    category: catName[p.cat],
    date: p.date,
    onClick: () => onSelect(p)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      color: 'var(--text-subtle)',
      fontSize: 13,
      marginTop: 28
    }
  }, "\u2014 \u6CA1\u6709\u66F4\u591A\u4E86 \u2014")));
}
window.StorefrontHome = StorefrontHome;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/StorefrontHome.jsx", error: String((e && e.message) || e) }); }

// ui_kits/storefront/TopBar.jsx
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
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/TopBar.jsx", error: String((e && e.message) || e) }); }

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
window.MK_CATEGORIES = [{
  id: 'all',
  name: '全部'
}, {
  id: 'stream',
  name: '流媒体会员'
}, {
  id: 'ai',
  name: 'AI 工具'
}, {
  id: 'software',
  name: '软件授权'
}, {
  id: 'game',
  name: '游戏充值'
}];
window.MK_PRODUCTS = [{
  id: 'p1',
  cat: 'stream',
  thumb: '🎬',
  name: 'Netflix 高级会员 · 1个月',
  desc: '4K 超清 · 独享车位 · 自动发货秒到账',
  price: 29.9,
  original: 49,
  stock: 128,
  sold: 2304,
  date: '06-21',
  detail: '官方独享车位,非合租。下单后系统自动发货,卡密含账号与密码,登录即用。支持 4K UHD 与 4 台设备同时观看。如遇问题 24 小时内包补。'
}, {
  id: 'p2',
  cat: 'ai',
  thumb: '🤖',
  name: 'ChatGPT Plus 代充 · 1个月',
  desc: '官方直充本号 · 稳定不掉 · 含 GPT-4o',
  price: 119,
  original: 158,
  stock: 56,
  sold: 1890,
  date: '06-20',
  detail: '代充至您自己的 ChatGPT 账号(非共享号),下单后填写登录信息,30 分钟内充值完成。包含 GPT-4o、高级语音、联网与数据分析。'
}, {
  id: 'p3',
  cat: 'software',
  thumb: '🪟',
  name: 'Windows 11 Pro 专业版密钥',
  desc: '全新正版密钥 · 在线激活 · 永久使用',
  price: 39,
  original: 99,
  stock: 999,
  sold: 5621,
  date: '06-21',
  detail: '全新未使用的零售密钥,支持在线数字激活,绑定微软账号后永久有效,可重装。适用于 Windows 10/11 专业版升级与全新安装。'
}, {
  id: 'p4',
  cat: 'stream',
  thumb: '🎵',
  name: 'Spotify Premium · 3个月',
  desc: '无广告 · 离线下载 · 官方车位',
  price: 45,
  original: 60,
  stock: 0,
  sold: 980,
  date: '06-18',
  detail: '官方独享 Premium,无广告畅听,支持离线下载与无损音质。'
}, {
  id: 'p5',
  cat: 'ai',
  thumb: '🎨',
  name: 'Midjourney 标准版 · 月卡',
  desc: '官方代开 · 15h 快速出图',
  price: 198,
  original: 240,
  stock: 23,
  sold: 432,
  date: '06-19',
  detail: '官方标准订阅代开通,含每月 15 小时 Fast 出图额度与无限 Relax,可商用。'
}, {
  id: 'p6',
  cat: 'game',
  thumb: '🎮',
  name: 'Steam 充值卡 · 100元',
  desc: '国区钱包 · 秒到账 · 官方面值',
  price: 96,
  original: 100,
  stock: 320,
  sold: 8742,
  date: '06-21',
  detail: '国区 Steam 钱包充值码,面值 100 元,下单自动发货,在 Steam 客户端兑换即可到账。'
}, {
  id: 'p7',
  cat: 'software',
  thumb: '📦',
  name: 'Office 2021 专业增强版',
  desc: '正版密钥 · 绑定账号 · 永久激活',
  price: 68,
  original: 129,
  stock: 410,
  sold: 3120,
  date: '06-17',
  detail: '正版零售密钥,绑定微软账号永久有效,含 Word / Excel / PowerPoint / Outlook 全套桌面应用。'
}, {
  id: 'p8',
  cat: 'game',
  thumb: '⚔️',
  name: '原神 创世结晶 · 6480',
  desc: '官方渠道 · 直充 UID · 大额优惠',
  price: 408,
  original: 488,
  stock: 67,
  sold: 1564,
  date: '06-16',
  detail: '官方渠道直充至您的 UID,填写服务器与 UID 后 10 分钟内到账,大额更优惠。'
}];
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/data.js", error: String((e && e.message) || e) }); }

__ds_ns.CardKey = __ds_scope.CardKey;

__ds_ns.CheckoutSteps = __ds_scope.CheckoutSteps;

__ds_ns.OrderStatusBadge = __ds_scope.OrderStatusBadge;

__ds_ns.PaymentOption = __ds_scope.PaymentOption;

__ds_ns.ProductCard = __ds_scope.ProductCard;

__ds_ns.ProductListItem = __ds_scope.ProductListItem;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.PriceTag = __ds_scope.PriceTag;

__ds_ns.QuantityStepper = __ds_scope.QuantityStepper;

})();
