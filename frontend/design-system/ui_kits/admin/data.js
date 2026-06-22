/* Platform (admin) console demo data. */
window.AD = {
  dashboard: {
    sales: { today: 184320.6, yesterday: 152800, total: 6820400 },
    orders: { today: 1842, yesterday: 1560, exception: 7 },
    profit: { today: 9216, yesterday: 7640, month: 184200, total: 682040 },
    merchants: { total: 86, today: 2, active: 78, pending: 3, frozen: 1 },
    products: { on_sale: 1240, total: 1560, cards_unsold: 38600 },
    withdrawals: { pending_count: 5, pending_amount: 42800 },
    complaints: { intervene: 2 },
  },
  merchants: [
    { id: 'm1', shop: '极客发卡 · GeekCards', owner: 'geekcards', rate: '5%', deposit: 10000, status: '正常', tone: 'success', time: '2025-12-04' },
    { id: 'm2', shop: '云端会员小铺', owner: 'cloudvip', rate: '6%', deposit: 5000, status: '正常', tone: 'success', time: '2026-01-18' },
    { id: 'm3', shop: '次元游戏点卡', owner: 'aniacg', rate: '5%', deposit: 8000, status: '待审核', tone: 'pending', time: '2026-06-21' },
    { id: 'm4', shop: '极速软件授权', owner: 'fastsoft', rate: '5%', deposit: 6000, status: '待审核', tone: 'pending', time: '2026-06-20' },
    { id: 'm5', shop: '违规测试店', owner: 'baduser', rate: '8%', deposit: 2000, status: '冻结', tone: 'danger', time: '2026-03-02' },
  ],
  orders: [
    { no: 'MK20260622A3F9', shop: '极客发卡', goods: 'Netflix 高级会员', amt: 29.9, st: '已发货', tone: 'success', time: '06-22 14:08' },
    { no: 'MK20260622C2D5', shop: '云端会员小铺', goods: 'YouTube Premium', amt: 35, st: '发货中', tone: 'brand', time: '06-22 13:59' },
    { no: 'MK20260622D1E8', shop: '次元游戏点卡', goods: 'Steam 充值卡 100元', amt: 96, st: '待支付', tone: 'pending', time: '06-22 13:40' },
    { no: 'MK20260621J9M3', shop: '极客发卡', goods: 'Midjourney 提示词包', amt: 19.9, st: '异常待人工', tone: 'danger', time: '06-21 18:46' },
    { no: 'MK20260621F5A1', shop: '极速软件授权', goods: 'Office 2021 密钥', amt: 68, st: '已退款', tone: 'danger', time: '06-21 22:13' },
  ],
  complaints: [
    { id: 'c1', no: 'MK20260621J9M3', buyer: 'sun***@foxmail.com', shop: '极客发卡', type: '未收到货', st: '待仲裁', tone: 'pending', time: '06-21 19:02' },
    { id: 'c2', no: 'MK20260620K2L1', buyer: 'liu***@qq.com', shop: '云端会员小铺', type: '卡密失效', st: '待仲裁', tone: 'pending', time: '06-20 21:40' },
    { id: 'c3', no: 'MK20260619M5N3', buyer: 'zhou***@163.com', shop: '次元游戏点卡', type: '描述不符', st: '已解决', tone: 'success', time: '06-19 10:11' },
  ],
};
