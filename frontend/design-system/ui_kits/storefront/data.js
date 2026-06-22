/* Storefront demo data. Attaches to window for the babel scripts to share. */
window.MK_SHOP = {
  name: '极客发卡 · GeekCards',
  intro: '期待为您服务 · 官方授权 · 自动发货秒到账',
  verified: true,
  stats: { products: '36', deals: '38.6万', deposit: '10,000.00' },
};

window.MK_ANNOUNCE = [
  '平台公告:618 年中购物节进行中,全场卡密低至 5 折,政府补贴叠加可用。',
  '平台公告:所有商户均缴纳保证金,平台担保交易,假一赔十。',
];

/* 四类销售类型(店铺顶部横排卡) */
window.MK_TYPES = [
  { id: 'card', name: '数字卡密', emoji: '🎫', count: 18, desc: '一卡一售 · 自动发货' },
  { id: 'knowledge', name: '知识文章', emoji: '📚', count: 6, desc: '购后解锁 · 站内阅读' },
  { id: 'resource', name: '资源下载', emoji: '📦', count: 8, desc: '限时签名 · 安全下载' },
  { id: 'right', name: '数字权益', emoji: '👑', count: 4, desc: '权益码 · 一权一售' },
];

window.MK_CATEGORIES = [
  { id: 'all', name: '全部', count: 36 },
  { id: 'stream', name: '流媒体会员', count: 12 },
  { id: 'ai', name: 'AI 工具', count: 8 },
  { id: 'software', name: '软件授权', count: 9 },
  { id: 'game', name: '游戏充值', count: 7 },
];

window.MK_SORTS = ['综合', '销量', '上新', '价格'];

const SUB = { text: '平台担保', tone: 'subsidy' };
window.MK_PRODUCTS = [
  { id: 'p1', cat: 'stream', type: '卡密', thumb: '🎬', name: 'Netflix 高级会员 · 1个月', subtitle: '本店流媒体热销第1名', desc: '4K 超清 · 独享车位 · 自动发货秒到账', price: 29.9, original: 49, priceLabel: '补贴后', stock: 128, sold: 2304, date: '06-21', promo: '超级立减', tags: [SUB, { text: '立减20%', tone: 'promo' }],
    detail: '官方独享车位,非合租。下单后系统自动发货,卡密含账号与密码,登录即用。支持 4K UHD 与 4 台设备同时观看。如遇问题 24 小时内包补。' },
  { id: 'p2', cat: 'ai', type: '权益', thumb: '🤖', name: 'ChatGPT Plus 代充 · 1个月', subtitle: '本店 AI 工具热销第1名', desc: '官方直充本号 · 稳定不掉 · 含 GPT-4o', price: 119, original: 158, priceLabel: '首单价', stock: 56, sold: 1890, date: '06-20', tags: [SUB, { text: '7天包售后', tone: 'promo' }],
    detail: '代充至您自己的 ChatGPT 账号(非共享号),下单后填写登录信息,30 分钟内充值完成。包含 GPT-4o、高级语音、联网与数据分析。' },
  { id: 'p3', cat: 'software', type: '权益', thumb: '🪟', name: 'Windows 11 Pro 专业版密钥', subtitle: '本店软件授权热销第1名', desc: '全新正版密钥 · 在线激活 · 永久使用', price: 39, original: 99, priceLabel: '补贴后', stock: 999, sold: 5621, date: '06-21', promo: '超级立减', tags: [SUB, { text: '立减60%', tone: 'promo' }],
    detail: '全新未使用的零售密钥,支持在线数字激活,绑定微软账号后永久有效,可重装。适用于 Windows 10/11 专业版升级与全新安装。' },
  { id: 'p4', cat: 'stream', type: '卡密', thumb: '🎵', name: 'Spotify Premium · 3个月', subtitle: '官方车位 · 无广告畅听', desc: '无广告 · 离线下载 · 官方车位', price: 45, original: 60, stock: 0, sold: 980, date: '06-18', tags: [SUB],
    detail: '官方独享 Premium,无广告畅听,支持离线下载与无损音质。' },
  { id: 'p5', cat: 'ai', type: '资源', thumb: '🎨', name: 'Midjourney 出图提示词包 · 2000条', subtitle: '资源下载 · 购后限时获取', desc: '高质量中文提示词 · 可商用', price: 19.9, original: 39, priceLabel: '首单价', stock: 23, sold: 432, date: '06-19', tags: [SUB, { text: '立减50%', tone: 'promo' }],
    detail: '2000 条精选 Midjourney 中文提示词,涵盖摄影、插画、电商、海报等场景。购买后获得 30 分钟有效的签名下载链。' },
  { id: 'p6', cat: 'game', type: '卡密', thumb: '🎮', name: 'Steam 充值卡 · 100元', subtitle: '本店游戏充值热销第1名', desc: '国区钱包 · 秒到账 · 官方面值', price: 96, original: 100, stock: 320, sold: 8742, date: '06-21', tags: [SUB, { text: '秒发货', tone: 'promo' }],
    detail: '国区 Steam 钱包充值码,面值 100 元,下单自动发货,在 Steam 客户端兑换即可到账。' },
  { id: 'p7', cat: 'software', type: '知识', thumb: '📚', name: 'Office 高效办公技巧 · 精品专栏', subtitle: '知识文章 · 购后站内阅读', desc: '32 章图文 · 永久回看 · 即买即读', price: 12.9, original: 29, priceLabel: '补贴后', stock: 410, sold: 3120, date: '06-17', promo: '超级立减', tags: [SUB],
    detail: '32 章 Office 三件套实战技巧,购买后立即解锁全部章节,站内阅读,永久回看,持续更新。' },
  { id: 'p8', cat: 'game', type: '权益', thumb: '⚔️', name: '原神 创世结晶 · 6480', subtitle: '官方直充 · 大额优惠', desc: '官方渠道 · 直充 UID · 大额优惠', price: 408, original: 488, priceLabel: '补贴后', stock: 4, sold: 1564, date: '06-16', tags: [SUB, { text: '大额优惠', tone: 'promo' }],
    detail: '官方渠道直充至您的 UID,填写服务器与 UID 后 10 分钟内到账,大额更优惠。' },
];
