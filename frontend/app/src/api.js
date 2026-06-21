/* ============================================================
   API 适配层 — 前端适配后端真实契约。
   后端统一响应 {code,msg,data};code:0 成功。POST 用表单编码
   (application/x-www-form-urlencoded,与后端 $request->post 对齐)。
   dev 环境走 Vite proxy(相对路径),生产用 VITE_API_BASE 覆盖。
   ============================================================ */

const BASE = import.meta.env.VITE_API_BASE || '';
// 店铺标识(后端 /s/{slug});默认演示店铺 demo,生产用 VITE_SHOP_SLUG 覆盖。
export const SHOP_SLUG = import.meta.env.VITE_SHOP_SLUG || 'demo';
// 支付渠道(本期仅易支付)。
export const PAY_CHANNEL = import.meta.env.VITE_PAY_CHANNEL || 'epay';

/* 订单状态:后端数字枚举 → 设计系统 OrderStatusBadge/CardKey 用的语义键 */
const STATUS_MAP = { 0: 'pending', 1: 'paid', 2: 'delivered', 3: 'closed', 4: 'refunded', 5: 'exception' };
export const statusKey = (n) => STATUS_MAP[Number(n)] ?? 'pending';
export const STATUS = { PENDING: 0, PAID: 1, DELIVERED: 2, CLOSED: 3, REFUNDED: 4, EXCEPTION: 5 };

/* 业务错误码 → 中文文案 */
const ERR_MSG = {
  3001: '商品已下架',
  3002: '库存不足,请减少购买数量',
  3003: '超过该商品限购数量',
  4001: '订单不存在',
  4002: '订单已支付,请勿重复支付',
  4003: '订单已关闭或已过期,请重新下单',
  4004: '订单金额异常',
  4005: '订单状态异常',
  5001: '支付校验失败,请重试',
  5002: '支付渠道不可用',
  1029: '操作过于频繁,请稍后再试',
};

export class ApiError extends Error {
  constructor(code, msg) {
    super(msg || ERR_MSG[code] || `请求失败(${code})`);
    this.name = 'ApiError';
    this.code = code;
  }
}

async function call(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {},
      body: body ? new URLSearchParams(body).toString() : undefined,
    });
  } catch {
    throw new ApiError(-1, '网络连接失败,请检查网络后重试');
  }
  let json;
  try {
    json = await res.json();
  } catch {
    throw new ApiError(-1, '服务器响应异常,请重试');
  }
  if (json.code !== 0) throw new ApiError(json.code, json.msg);
  return json.data;
}

export const api = {
  /** 店铺 + 分类 + 在售商品 + 平台公告。返回:
   *  { store:{name,slug,logo,cover,intro,announcement,verified,deposit,sales_count,contact:{qq,wechat,mobile}},
   *    categories:[{id,name,image,goods_count}],
   *    products:[{id,title,price,market_price,stock,image,category_id,sales_count,min_buy,max_buy}],
   *    notices:[{id,title,content,create_time}] }  // 平台公告(status=1,按 sort,desc),区别于 store.announcement(商户店铺公告) */
  shop: (slug = SHOP_SLUG) => call(`/s/${encodeURIComponent(slug)}`),
  /** 商品详情:{ id,title,price,description,stock,min_buy,max_buy,delivery_message } */
  product: (id) => call(`/buyer/product/${encodeURIComponent(id)}`),
  /** 下单:返回 { order_no,total_amount,quantity,expire_at,status } */
  createOrder: ({ productId, quantity, email }) =>
    call('/buyer/order', { method: 'POST', body: { product_id: productId, quantity, buyer_email: email } }),
  /** 发起支付:返回 { payment_no, pay:{ method,url,params{...,sign} } } */
  pay: (orderNo, channel = PAY_CHANNEL) =>
    call(`/buyer/order/${encodeURIComponent(orderNo)}/pay`, { method: 'POST', body: { channel } }),
  /** 查单/取卡:返回订单 +(仅 status=2)cards[] */
  queryOrder: ({ orderNo, email }) =>
    call('/buyer/order/query', { method: 'POST', body: { order_no: orderNo, email } }),
  /** 平台公开配置(无鉴权):
   *  { site:{title,name}, kefu:{qq,wechat,mobile,qrcode}, order_query_tips }
   *  缺省键返回空串。 */
  config: () => call('/config'),
};

/* ------------------------------------------------------------
   把后端商品字段适配成设计系统组件(ProductCard/ProductListItem)期望的 props。
   后端只给 id/title/price/stock(列表更精简),设计 demo 里的
   desc/original/sold/thumb 后端没有 → 优雅缺省,不报错。
   ------------------------------------------------------------ */
const THUMBS = ['📦', '🎬', '🤖', '🪟', '🎵', '🎨', '🎮', '⚔️', '🎟️', '💎'];
export function normalizeProduct(p) {
  const idNum = parseInt(String(p.id).replace(/\D/g, ''), 10) || 0;
  const price = Number(p.price);
  // market_price 是「划线原价」,仅当 > 实售价才作为 original 展示。
  const mkt = p.market_price != null && p.market_price !== '' ? Number(p.market_price) : undefined;
  // 兼容旧字段 original;新契约用 market_price。
  const origRaw = mkt != null ? mkt : (p.original != null ? Number(p.original) : undefined);
  const original = origRaw != null && Number.isFinite(origRaw) && origRaw > price ? origRaw : undefined;
  // 商品主图 URL(后端 image),空串视为无图,回落 emoji 占位。
  const image = p.image != null && String(p.image).trim() !== '' ? String(p.image) : '';
  const sales = p.sales_count != null ? Number(p.sales_count) : (p.sold != null ? Number(p.sold) : undefined);
  // category_id 统一转数字(便于按 id 精确筛选),非法/缺失为 null。
  const catRaw = p.category_id;
  const category_id = catRaw == null || catRaw === '' ? null : (Number.isNaN(Number(catRaw)) ? catRaw : Number(catRaw));
  return {
    id: p.id,
    name: p.title ?? p.name ?? '商品',
    desc: p.description || p.desc || '',
    detail: p.description || p.detail || '',
    price,
    market_price: mkt,
    original,
    image,
    stock: Number(p.stock ?? 0),
    sales_count: sales,
    sold: sales,
    thumb: p.thumb || THUMBS[idNum % THUMBS.length],
    min_buy: Number(p.min_buy ?? 1),
    max_buy: Number(p.max_buy ?? 0), // 0 = 不限
    delivery_message: p.delivery_message || '',
    category_id,
  };
}

/* ------------------------------------------------------------
   付款后轮询查单,直到发货(status=2)/关闭(3)/异常(5)/超时。
   返回最终订单对象;onTick(order) 每次轮询回调(用于展示「发货中」)。
   ------------------------------------------------------------ */
export async function pollDelivery({ orderNo, email, interval = 2500, timeout = 90000, onTick } = {}) {
  const deadline = Date.now() + timeout;
  // 终态:已发货 / 已关闭 / 已退款 / 异常待人工
  const TERMINAL = new Set([STATUS.DELIVERED, STATUS.CLOSED, STATUS.REFUNDED, STATUS.EXCEPTION]);
  for (;;) {
    let order;
    try {
      order = await api.queryOrder({ orderNo, email });
    } catch (e) {
      // 查询瞬时失败不立即终止,继续轮询直到超时
      order = null;
    }
    if (order) {
      onTick && onTick(order);
      if (TERMINAL.has(Number(order.status))) return order;
    }
    if (Date.now() >= deadline) return order || null; // 超时:返回最后一次结果(可能仍 pending/paid)
    await new Promise((r) => setTimeout(r, interval));
  }
}
