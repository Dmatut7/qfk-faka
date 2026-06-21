/* Storefront demo data. Attaches to window for the babel scripts to share. */
window.MK_SHOP = {
  name: '极客发卡 · GeekCards',
  intro: '期待为您服务 · 官方授权 · 自动发货秒到账',
  verified: true,
  stats: { products: '36', deals: '38.6万', deposit: '10,000.00' },
};

window.MK_CATEGORIES = [
  { id: 'all', name: '全部' },
  { id: 'stream', name: '流媒体会员' },
  { id: 'ai', name: 'AI 工具' },
  { id: 'software', name: '软件授权' },
  { id: 'game', name: '游戏充值' },
];

window.MK_PRODUCTS = [
  { id: 'p1', cat: 'stream', thumb: '🎬', name: 'Netflix 高级会员 · 1个月', desc: '4K 超清 · 独享车位 · 自动发货秒到账', price: 29.9, original: 49, stock: 128, sold: 2304, date: '06-21',
    detail: '官方独享车位,非合租。下单后系统自动发货,卡密含账号与密码,登录即用。支持 4K UHD 与 4 台设备同时观看。如遇问题 24 小时内包补。' },
  { id: 'p2', cat: 'ai', thumb: '🤖', name: 'ChatGPT Plus 代充 · 1个月', desc: '官方直充本号 · 稳定不掉 · 含 GPT-4o', price: 119, original: 158, stock: 56, sold: 1890, date: '06-20',
    detail: '代充至您自己的 ChatGPT 账号(非共享号),下单后填写登录信息,30 分钟内充值完成。包含 GPT-4o、高级语音、联网与数据分析。' },
  { id: 'p3', cat: 'software', thumb: '🪟', name: 'Windows 11 Pro 专业版密钥', desc: '全新正版密钥 · 在线激活 · 永久使用', price: 39, original: 99, stock: 999, sold: 5621, date: '06-21',
    detail: '全新未使用的零售密钥,支持在线数字激活,绑定微软账号后永久有效,可重装。适用于 Windows 10/11 专业版升级与全新安装。' },
  { id: 'p4', cat: 'stream', thumb: '🎵', name: 'Spotify Premium · 3个月', desc: '无广告 · 离线下载 · 官方车位', price: 45, original: 60, stock: 0, sold: 980, date: '06-18',
    detail: '官方独享 Premium,无广告畅听,支持离线下载与无损音质。' },
  { id: 'p5', cat: 'ai', thumb: '🎨', name: 'Midjourney 标准版 · 月卡', desc: '官方代开 · 15h 快速出图', price: 198, original: 240, stock: 23, sold: 432, date: '06-19',
    detail: '官方标准订阅代开通,含每月 15 小时 Fast 出图额度与无限 Relax,可商用。' },
  { id: 'p6', cat: 'game', thumb: '🎮', name: 'Steam 充值卡 · 100元', desc: '国区钱包 · 秒到账 · 官方面值', price: 96, original: 100, stock: 320, sold: 8742, date: '06-21',
    detail: '国区 Steam 钱包充值码,面值 100 元,下单自动发货,在 Steam 客户端兑换即可到账。' },
  { id: 'p7', cat: 'software', thumb: '📦', name: 'Office 2021 专业增强版', desc: '正版密钥 · 绑定账号 · 永久激活', price: 68, original: 129, stock: 410, sold: 3120, date: '06-17',
    detail: '正版零售密钥,绑定微软账号永久有效,含 Word / Excel / PowerPoint / Outlook 全套桌面应用。' },
  { id: 'p8', cat: 'game', thumb: '⚔️', name: '原神 创世结晶 · 6480', desc: '官方渠道 · 直充 UID · 大额优惠', price: 408, original: 488, stock: 67, sold: 1564, date: '06-16',
    detail: '官方渠道直充至您的 UID,填写服务器与 UID 后 10 分钟内到账,大额更优惠。' },
];
