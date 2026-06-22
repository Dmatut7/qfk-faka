/* 控制台页面注册表:nav key → 组件。每个屏幕独立成文件,此处统一 import + 映射。 */
import MerchantStats from './merchant/Stats.jsx';
import MerchantProducts from './merchant/Products.jsx';
import MerchantShop from './merchant/Shop.jsx';
import MerchantCategories from './merchant/Categories.jsx';
import MerchantCards from './merchant/Cards.jsx';
import MerchantOrders from './merchant/Orders.jsx';
import MerchantCoupons from './merchant/Coupons.jsx';
import MerchantComplaints from './merchant/Complaints.jsx';
import MerchantWallet from './merchant/Wallet.jsx';

import AdminDashboard from './admin/Dashboard.jsx';
import AdminMerchants from './admin/Merchants.jsx';
import AdminChannels from './admin/Channels.jsx';
import AdminWithdrawals from './admin/Withdrawals.jsx';
import AdminSettlement from './admin/Settlement.jsx';
import AdminAnnouncements from './admin/Announcements.jsx';
import AdminInviteCodes from './admin/InviteCodes.jsx';
import AdminOrders from './admin/Orders.jsx';
import AdminProducts from './admin/Products.jsx';
import AdminSettings from './admin/Settings.jsx';
import AdminLogs from './admin/Logs.jsx';
import AdminBigScreen from './admin/BigScreen.jsx';
import AdminCronJobs from './admin/CronJobs.jsx';
import AdminComplaints from './admin/Complaints.jsx';

export const SCREENS = {
  // 商户后台
  'm-stats': MerchantStats,
  'm-products': MerchantProducts,
  'm-shop': MerchantShop,
  'm-categories': MerchantCategories,
  'm-cards': MerchantCards,
  'm-orders': MerchantOrders,
  'm-complaints': MerchantComplaints,
  'm-coupons': MerchantCoupons,
  'm-wallet': MerchantWallet,
  // 平台后台
  'a-dashboard': AdminDashboard,
  'a-bigscreen': AdminBigScreen,
  'a-merchants': AdminMerchants,
  'a-channels': AdminChannels,
  'a-withdrawals': AdminWithdrawals,
  'a-settlement': AdminSettlement,
  'a-content': AdminAnnouncements,
  'a-invite': AdminInviteCodes,
  'a-orders': AdminOrders,
  'a-products': AdminProducts,
  'a-settings': AdminSettings,
  'a-logs': AdminLogs,
  'a-cron': AdminCronJobs,
  'a-complaints': AdminComplaints,
};
