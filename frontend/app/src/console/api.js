/* ============================================================
   控制台 API 适配层(商户后台 + 平台后台)。
   - 统一响应 {code,msg,data};受保护接口加 Authorization: Bearer。
   - 单活跃会话(role + token),localStorage 持久;1001 令牌失效自动清会话。
   - POST 用表单编码,与后端 $request->post 对齐。
   ============================================================ */

const BASE = import.meta.env.VITE_API_BASE || '';

const ERR_MSG = {
  1001: '登录已失效,请重新登录',
  1002: '资源不存在',
  1003: '无权限执行该操作',
  1004: '参数错误',
  1029: '操作过于频繁,请稍后再试',
  2001: '账号或密码错误',
  2002: '账号已被冻结',
  3002: '库存不足',
  4101: '余额不足',
  4102: '提现金额不合法',
  4103: '提现状态不允许该操作',
};

export class ApiError extends Error {
  constructor(code, msg) {
    super(msg || ERR_MSG[code] || `请求失败(${code})`);
    this.name = 'ApiError';
    this.code = code;
  }
}

/* ---- 会话 ---- */
const TOKEN_KEY = 'mk_console_token';
const ROLE_KEY = 'mk_console_role';
const USER_KEY = 'mk_console_user';
let _token = (typeof localStorage !== 'undefined' && localStorage.getItem(TOKEN_KEY)) || '';
let _role = (typeof localStorage !== 'undefined' && localStorage.getItem(ROLE_KEY)) || '';

export function getSession() {
  let user = null;
  try { user = JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { user = null; }
  return { token: _token, role: _role, user };
}
export function setSession(token, role, user) {
  _token = token; _role = role;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(USER_KEY, JSON.stringify(user || null));
}
export function clearSession() {
  _token = ''; _role = '';
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
}

async function call(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/x-www-form-urlencoded';
  if (auth && _token) headers['Authorization'] = 'Bearer ' + _token;
  let res;
  try {
    res = await fetch(BASE + path, {
      method, headers,
      body: body ? new URLSearchParams(body).toString() : undefined,
    });
  } catch {
    throw new ApiError(-1, '网络连接失败,请检查网络后重试');
  }
  let json;
  try { json = await res.json(); } catch { throw new ApiError(-1, '服务器响应异常'); }
  if (json.code !== 0) {
    if (json.code === 1001) {
      clearSession();
      // 通知 UI 层登出回登录页(ConsoleApp 监听 'mk-session-expired')
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('mk-session-expired'));
    }
    throw new ApiError(json.code, json.msg);
  }
  return json.data;
}

/* ---- 商户后台 ---- */
export const merchantApi = {
  login: (username, password) => call('/merchant/login', { method: 'POST', body: { username, password }, auth: false }),
  register: (d) => call('/merchant/register', { method: 'POST', body: d, auth: false }),
  me: () => call('/merchant/me'),
  logout: () => call('/merchant/logout', { method: 'POST' }),
  changePassword: (old_password, new_password) => call('/merchant/change-password', { method: 'POST', body: { old_password, new_password } }),

  shop: () => call('/merchant/shop'),
  updateShop: (d) => call('/merchant/shop', { method: 'POST', body: d }),

  categories: () => call('/merchant/categories'),
  createCategory: (d) => call('/merchant/categories', { method: 'POST', body: d }),
  updateCategory: (id, d) => call(`/merchant/categories/${id}`, { method: 'POST', body: d }),
  deleteCategory: (id) => call(`/merchant/categories/${id}/delete`, { method: 'POST' }),

  products: (params) => call('/merchant/products' + qs(params)),
  createProduct: (d) => call('/merchant/products', { method: 'POST', body: d }),
  updateProduct: (id, d) => call(`/merchant/products/${id}`, { method: 'POST', body: d }),
  setProductStatus: (id, status) => call(`/merchant/products/${id}/status`, { method: 'POST', body: { status } }),
  deleteProduct: (id) => call(`/merchant/products/${id}/delete`, { method: 'POST' }),

  importCards: (product_id, cards, batch_no) => call('/merchant/cards/import', { method: 'POST', body: { product_id, cards, ...(batch_no ? { batch_no } : {}) } }),
  cards: (productId, params) => call(`/merchant/products/${productId}/cards` + qs(params)),
  cardStats: (productId) => call(`/merchant/products/${productId}/cards/stats`),
  disableCard: (id) => call(`/merchant/cards/${id}/disable`, { method: 'POST' }),
  deleteCard: (id) => call(`/merchant/cards/${id}/delete`, { method: 'POST' }),

  orders: (params) => call('/merchant/orders' + qs(params)),
  order: (id) => call(`/merchant/orders/${id}`),
  closeOrder: (id) => call(`/merchant/orders/${id}/close`, { method: 'POST' }),
  redeliverOrder: (id) => call(`/merchant/orders/${id}/redeliver`, { method: 'POST' }),

  wallet: () => call('/merchant/wallet'),
  fundLogs: (params) => call('/merchant/wallet/fund-logs' + qs(params)),
  withdrawals: (params) => call('/merchant/wallet/withdrawals' + qs(params)),
  applyWithdrawal: (d) => call('/merchant/wallet/withdrawals', { method: 'POST', body: d }),

  statsSummary: () => call('/merchant/stats/summary'),
  topProducts: (params) => call('/merchant/stats/top-products' + qs(params)),
};

/* ---- 平台后台 ---- */
export const adminApi = {
  login: (username, password) => call('/admin/login', { method: 'POST', body: { username, password }, auth: false }),
  dashboard: () => call('/admin/dashboard'),
  me: () => call('/admin/me'),
  logout: () => call('/admin/logout', { method: 'POST' }),

  merchants: (params) => call('/admin/merchants' + qs(params)),
  createMerchant: (d) => call('/admin/merchants', { method: 'POST', body: d }),
  approveMerchant: (id) => call(`/admin/merchants/${id}/approve`, { method: 'POST' }),
  freezeMerchant: (id) => call(`/admin/merchants/${id}/freeze`, { method: 'POST' }),
  unfreezeMerchant: (id) => call(`/admin/merchants/${id}/unfreeze`, { method: 'POST' }),
  setCommission: (id, commission_rate) => call(`/admin/merchants/${id}/commission`, { method: 'POST', body: { commission_rate } }),
  resetMerchantPassword: (id, new_password) => call(`/admin/merchants/${id}/reset-password`, { method: 'POST', body: { new_password } }),

  channels: () => call('/admin/channels'),
  createChannel: (d) => call('/admin/channels', { method: 'POST', body: d }),
  updateChannel: (id, d) => call(`/admin/channels/${id}`, { method: 'POST', body: d }),
  // 后端 setStatus 读 input('enable')(bool),非 status
  setChannelStatus: (id, enable) => call(`/admin/channels/${id}/status`, { method: 'POST', body: { enable: enable ? 1 : 0 } }),
  // 后端 testSign 读 code(+ 可选 sample_params),用渠道 code 自测
  testSign: (id, code = '') => call(`/admin/channels/${id}/test-sign`, { method: 'POST', body: { code } }),

  withdrawals: (params) => call('/admin/withdrawals' + qs(params)),
  approveWithdrawal: (id, d) => call(`/admin/withdrawals/${id}/approve`, { method: 'POST', body: d || {} }),
  rejectWithdrawal: (id, d) => call(`/admin/withdrawals/${id}/reject`, { method: 'POST', body: d || {} }),

  settings: () => call('/admin/settings'),
  setSetting: (key, value) => call('/admin/settings', { method: 'POST', body: { key, value } }),
  settlementReport: (params) => call('/admin/reports/settlement' + qs(params)),

  orders: (params) => call('/admin/orders' + qs(params)),
  products: (params) => call('/admin/products' + qs(params)),

  logs: (params) => call('/admin/logs' + qs(params)),

  announcements: () => call('/admin/announcements'),
  createAnnouncement: (d) => call('/admin/announcements', { method: 'POST', body: d }),
  updateAnnouncement: (id, d) => call('/admin/announcements/' + id, { method: 'POST', body: d }),
  deleteAnnouncement: (id) => call('/admin/announcements/' + id + '/delete', { method: 'POST' }),

  inviteCodes: () => call('/admin/invite-codes'),
  createInviteCodes: (d) => call('/admin/invite-codes', { method: 'POST', body: d }),
  disableInviteCode: (id) => call('/admin/invite-codes/' + id + '/disable', { method: 'POST' }),
  deleteInviteCode: (id) => call('/admin/invite-codes/' + id + '/delete', { method: 'POST' }),
};

function qs(params) {
  if (!params) return '';
  const s = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null && v !== '')
  ).toString();
  return s ? `?${s}` : '';
}
