/* ============================================================
   API 适配层 — 前端适配后端真实契约。
   后端统一响应 {code,msg,data};code:0 成功。POST 用表单编码
   (application/x-www-form-urlencoded,与后端 $request->post 对齐)。
   dev 环境走 Vite proxy(相对路径),生产用 VITE_API_BASE 覆盖。
   ============================================================ */

export const BASE = import.meta.env.VITE_API_BASE || '';
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
  2001: '参数有误,请检查后重试',
  2002: '未找到该订单,请核对订单号',
  2003: '订单号或邮箱有误,请核对邮箱',
  3001: '商品已下架',
  3002: '库存不足,请减少购买数量',
  3003: '超过该商品限购数量',
  4001: '订单不存在',
  4002: '订单已支付,请勿重复支付',
  4003: '订单已关闭或已过期,请重新下单',
  4004: '订单金额异常',
  4005: '订单状态异常,请稍后重试',
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
   *    products:[{id,title,price,market_price,stock,image,category_id,sales_count,min_buy,max_buy,purchase_notice,show_stock_type}],
   *    notices:[{id,title,content,create_time}] }  // 平台公告(status=1,按 sort,desc),区别于 store.announcement(商户店铺公告) */
  shop: (slug = SHOP_SLUG) => call(`/s/${encodeURIComponent(slug)}`),
  /** 商品详情:{ id,title,price,description,stock,min_buy,max_buy,delivery_message,purchase_notice,show_stock_type } */
  product: (id) => call(`/buyer/product/${encodeURIComponent(id)}`),
  /** 门户资讯/常见问题列表:type 1资讯/2常见问题/3单页;返回 { items:[{id,type,title,summary,category,views,create_time}] } */
  articles: ({ type = 1, category = '', limit = 50 } = {}) => {
    const qs = new URLSearchParams({ type: String(type), limit: String(limit) });
    if (category) qs.set('category', category);
    return call(`/index/articles?${qs.toString()}`);
  },
  /** 门户资讯详情(访问自增浏览量):{ id,type,title,summary,category,content,views,create_time } */
  article: (id) => call(`/index/articles/${encodeURIComponent(id)}`),
  /** 门户平台统计(公开,非敏感计数):{ merchants, products, orders } */
  platformStats: () => call('/index/platformStats'),
  /** 门户禁售目录(公开,按类目分组):{ groups:[{category, items:[{title,description}]}] } */
  forbiddenCatalog: () => call('/index/forbidden'),
  /** 知识类商品章节目录(购前,仅标题):{ items:[{id,title}] } */
  productChapters: (id) => call(`/buyer/product/${encodeURIComponent(id)}/chapters`),
  /** 购后阅读章节(验证订单归属):{ chapters:[{id,title,content}] } */
  orderChapters: ({ orderNo, email, password }) =>
    call('/buyer/order/chapters', { method: 'POST', body: { order_no: orderNo, ...(password ? { password } : {}), ...(email ? { email } : {}) } }),
  /** 下单:返回 { order_no,total_amount,quantity,expire_at,status };queryPassword 选填(设置后可凭密码查单) */
  createOrder: ({ productId, quantity, email, queryPassword, couponCode }) =>
    call('/buyer/order', {
      method: 'POST',
      body: {
        product_id: productId,
        quantity,
        buyer_email: email,
        ...(queryPassword ? { query_password: queryPassword } : {}),
        ...(couponCode ? { coupon_code: couponCode } : {}),
      },
    }),
  /** 优惠券试算:{ coupon_id, code, original_amount, discount, final_amount };不可用抛 ApiError */
  validateCoupon: ({ code, productId, quantity = 1 }) =>
    call('/buyer/coupon/validate', { method: 'POST', body: { code, product_id: productId, quantity } }),
  /** 结算试算(原价含限时折扣 + 券/满减满折互斥取最优 + 应付):
   *  { original_amount, discount, final_amount, discount_label, coupon_applied };券无效抛 ApiError */
  checkoutPreview: ({ productId, quantity = 1, couponCode }) =>
    call('/buyer/checkout/preview', { method: 'POST', body: { product_id: productId, quantity, ...(couponCode ? { coupon_code: couponCode } : {}) } }),
  /** 发起投诉(order_no+邮箱核验) */
  fileComplaint: ({ orderNo, email, type, description }) =>
    call('/buyer/complaint', { method: 'POST', body: { order_no: orderNo, email, type, description } }),
  /** 查订单投诉列表 */
  queryComplaints: ({ orderNo, email }) =>
    call('/buyer/complaint/query', { method: 'POST', body: { order_no: orderNo, email } }),
  /** 申请平台介入 */
  escalateComplaint: ({ id, orderNo, email }) =>
    call(`/buyer/complaint/${encodeURIComponent(id)}/escalate`, { method: 'POST', body: { order_no: orderNo, email } }),
  /** 发起支付:返回 { payment_no, pay:{ method,url,params{...,sign} } } */
  pay: (orderNo, channel = PAY_CHANNEL) =>
    call(`/buyer/order/${encodeURIComponent(orderNo)}/pay`, { method: 'POST', body: { channel } }),
  /** 查单/取卡:返回订单 +(仅 status=2)cards[];凭证二选一:email 或 password */
  queryOrder: ({ orderNo, email, password }) =>
    call('/buyer/order/query', {
      method: 'POST',
      body: {
        order_no: orderNo,
        ...(password ? { password } : {}),
        ...(email ? { email } : {}),
      },
    }),
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
/* 分类 id 归一化:纯数字串→Number,否则→去空白的 String,空→null。
   避免后端 number 与前端 string 形态不一致导致 === 漏匹配。 */
export function normId(v) {
  if (v == null) return null;
  const s = String(v).trim();
  if (s === '') return null;
  return /^\d+$/.test(s) ? Number(s) : s;
}

/* String(id) 的稳定字符哈希(djb2),纯字母 id 也能均匀散到不同 emoji。 */
function hashStr(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h;
}

const THUMBS = ['📦', '🎬', '🤖', '🪟', '🎵', '🎨', '🎮', '⚔️', '🎟️', '💎'];
export function normalizeProduct(p) {
  const price = Number(p.price); // 后端 price 恒为应收价(限时折扣生效则为折扣价)
  const onSale = !!p.on_sale;
  // 限时折扣生效:划线价用 original_price(原价);否则用 market_price(静态划线原价)。
  const listPrice = p.original_price != null && p.original_price !== '' ? Number(p.original_price) : undefined;
  const mkt = p.market_price != null && p.market_price !== '' ? Number(p.market_price) : undefined;
  const origRaw = (onSale && listPrice != null) ? listPrice : (mkt != null ? mkt : (p.original != null ? Number(p.original) : undefined));
  const original = origRaw != null && Number.isFinite(origRaw) && origRaw > price ? origRaw : undefined;
  // 商品主图 URL(后端 image),空串视为无图,回落 emoji 占位。
  const image = p.image != null && String(p.image).trim() !== '' ? String(p.image) : '';
  const sales = p.sales_count != null ? Number(p.sales_count) : (p.sold != null ? Number(p.sold) : undefined);
  // category_id 归一化(纯数字串→Number,否则→String去空白,空→null),便于按 id 精确筛选。
  const category_id = normId(p.category_id);
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
    thumb: p.thumb || THUMBS[hashStr(String(p.id)) % THUMBS.length],
    min_buy: Number(p.min_buy ?? 1),
    max_buy: Number(p.max_buy ?? 0), // 0 = 不限
    delivery_message: p.delivery_message || '',
    category_id,
    // 限时折扣:是否促销中 + 结束时间(倒计时),价格已由后端折算进 price。
    on_sale: onSale,
    discount_end: p.discount_end || null,
    // 商品类型:1卡密/2知识/3资源/4权益,缺省卡密。
    goods_type: Number(p.goods_type ?? 1),
    // 购买须知(下单前提示),纯文本;空视为无。
    purchase_notice: p.purchase_notice != null ? String(p.purchase_notice) : '',
    // 库存显示方式:0=模糊标签,1=精确数字。归一化为数字,缺省 0。
    show_stock_type: Number(p.show_stock_type ?? 0),
  };
}

/* ------------------------------------------------------------
   付款后轮询查单,直到发货(status=2)/关闭(3)/异常(5)/超时。
   返回最终订单对象;onTick(order) 每次轮询回调(用于展示「发货中」)。
   ------------------------------------------------------------ */
export async function pollDelivery({ orderNo, email, interval = 2500, timeout = 90000, onTick, maxFails = 6 } = {}) {
  const deadline = Date.now() + timeout;
  // 终态:已发货 / 已关闭 / 已退款 / 异常待人工
  const TERMINAL = new Set([STATUS.DELIVERED, STATUS.CLOSED, STATUS.REFUNDED, STATUS.EXCEPTION]);
  let fails = 0; // 连续失败计数(成功一次即清零)
  for (;;) {
    let order;
    try {
      order = await api.queryOrder({ orderNo, email });
      fails = 0;
    } catch (e) {
      // 查询瞬时失败不立即终止,但要做退避,避免高频重试自我触发限流(1029)。
      order = null;
      fails += 1;
      // 连续失败过多(尤其是被限流)提前结束,交由上层「稍后查单」兜底,
      // 不再继续高频打接口火上浇油。
      if (fails >= maxFails) return null;
    }
    if (order) {
      onTick && onTick(order);
      if (TERMINAL.has(Number(order.status))) return order;
    }
    if (Date.now() >= deadline) return order || null; // 超时:返回最后一次结果(可能仍 pending/paid)
    // 退避:连续失败时按失败次数线性放大间隔(封顶 4 倍),缓解限流压力。
    const wait = fails > 0 ? interval * Math.min(fails + 1, 4) : interval;
    await new Promise((r) => setTimeout(r, wait));
  }
}
