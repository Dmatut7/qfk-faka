/* Merchant console demo data. */
window.MC = {
  shop: '极客发卡 · GeekCards',
  summary: { sales_today: 12840.5, sales_yesterday: 9610, sales_total: 386200, orders_today: 128, orders_yesterday: 96, order_total: 38600, profit_today: 3210.4, profit_yesterday: 2480, profit_month: 64200 },
  top: [
    { id: 1, title: 'Steam 充值卡 · 100元', qty: 842, orders: 760, sales: 80832 },
    { id: 2, title: 'Windows 11 Pro 密钥', qty: 521, orders: 498, sales: 20319 },
    { id: 3, title: 'Office 高效办公专栏', qty: 410, orders: 410, sales: 5289 },
    { id: 4, title: 'Netflix 高级会员 · 1月', qty: 304, orders: 290, sales: 9089 },
    { id: 5, title: 'ChatGPT Plus 代充', qty: 189, orders: 189, sales: 22491 },
  ],
  products: [
    { id: 'g1', title: 'Netflix 高级会员 · 1个月', type: '卡密', deliver: '自动', price: 29.9, original: 49, stock: 128, sold: 2304, status: '在售' },
    { id: 'g2', title: 'ChatGPT Plus 代充 · 1个月', type: '权益', deliver: '手动', price: 119, original: 158, stock: 56, sold: 1890, status: '在售' },
    { id: 'g3', title: 'Windows 11 Pro 专业版密钥', type: '权益', deliver: '自动', price: 39, original: 99, stock: 999, sold: 5621, status: '在售' },
    { id: 'g4', title: 'Office 高效办公技巧专栏', type: '知识', deliver: '自动', price: 12.9, original: 29, stock: '—', sold: 3120, status: '在售' },
    { id: 'g5', title: 'Spotify Premium · 3个月', type: '卡密', deliver: '自动', price: 45, original: 60, stock: 0, sold: 980, status: '缺货' },
    { id: 'g6', title: 'Midjourney 提示词包 · 2000条', type: '资源', deliver: '自动', price: 19.9, original: 39, stock: '—', sold: 432, status: '待审' },
  ],
  orders: [
    { no: 'MK20260622A3F9', goods: 'Netflix 高级会员 · 1月', buyer: 'buyer***@qq.com', amt: 29.9, st: '已发货', tone: 'success', time: '06-22 14:08' },
    { no: 'MK20260622B7C2', goods: 'ChatGPT Plus 代充', buyer: 'li***@163.com', amt: 119, st: '发货中', tone: 'brand', time: '06-22 13:55' },
    { no: 'MK20260622D1E8', goods: 'Steam 充值卡 100元', buyer: 'wang***@gmail.com', amt: 96, st: '待支付', tone: 'pending', time: '06-22 13:40' },
    { no: 'MK20260621F5A1', goods: 'Office 2021 密钥', buyer: 'zhao***@qq.com', amt: 68, st: '已退款', tone: 'danger', time: '06-21 22:13' },
    { no: 'MK20260621H2K7', goods: 'Windows 11 Pro 密钥', buyer: 'chen***@outlook.com', amt: 39, st: '已发货', tone: 'success', time: '06-21 20:01' },
    { no: 'MK20260621J9M3', goods: 'Midjourney 提示词包', buyer: 'sun***@foxmail.com', amt: 19.9, st: '异常待人工', tone: 'danger', time: '06-21 18:46' },
  ],
  wallet: { balance: 28640.18, pending: 3210.4, frozen: 1000, flow: [
    { id: 1, type: '收入', desc: '订单 MK…A3F9 成交', amt: 29.9, time: '06-22 14:08', tone: 'success' },
    { id: 2, type: '佣金', desc: '平台佣金 5%', amt: -1.5, time: '06-22 14:08', tone: 'pending' },
    { id: 3, type: '提现', desc: '提现至 支付宝 ****8821', amt: -5000, time: '06-21 10:30', tone: 'neutral' },
    { id: 4, type: '退款', desc: '订单 MK…F5A1 原路退回', amt: -68, time: '06-21 22:13', tone: 'danger' },
  ] },
};
