/* 控制台页面注册表:nav key → 组件。各页面建成后在此登记;未登记的显示「建设中」占位。
   每个屏幕独立成文件(merchant/*.jsx、admin/*.jsx),此处统一 import + 映射,避免并行开发冲突。 */

export const SCREENS = {
  // 商户后台
  // 'm-stats':     MerchantStats,
  // 'm-products':  MerchantProducts,
  // 'm-categories':MerchantCategories,
  // 'm-cards':     MerchantCards,
  // 'm-orders':    MerchantOrders,
  // 'm-wallet':    MerchantWallet,
  // 平台后台
  // 'a-merchants': AdminMerchants,
  // 'a-channels':  AdminChannels,
  // 'a-withdrawals':AdminWithdrawals,
  // 'a-settlement':AdminSettlement,
  // 'a-orders':    AdminOrders,
  // 'a-products':  AdminProducts,
  // 'a-settings':  AdminSettings,
};
