export const meta = {
  name: 'admin-global-stat-counts',
  description: '后台统计卡改全局口径(商品前端 + 商户/投诉/提现 后端聚合+前端)',
  phases: [{ title: 'Fix', detail: '每端一个 agent' }],
}
const APP = '/Users/a1/Desktop/qfk';
const REF = '参照 app/service/AdminViewService.php::orders 刚加的 status_counts 写法(用 applyBase 闭包应用非status筛选,再 group(\'status\')->field(\'status, COUNT(*) AS c\')->select() 聚合;ThinkPHP6 bcmath/Money 规矩不变)。';
const TASKS = [
  {
    key: 'ProductsFE', files: 'frontend/app/src/console/admin/Products.jsx(仅前端)',
    fix: '后端 AdminViewService::products 已返回 summary:{on_sale,off_sale,out_stock,total}。在本页 Panel 上方加一行统计卡(StatCard):商品总数(total,tone brand)/在售(on_sale,success)/下架(off_sale,neutral)/缺货(out_stock,danger,icon AlertTriangle)。从 x.data?.summary 取(兜底 0)。保留 batch2 已加的 四类型 Pill 与库存缺货标识、--text-muted 等修正,勿回退。先 Read 本文件。',
  },
  {
    key: 'Merchants', files: 'app/service/AdminMerchantService.php(后端 list)+ frontend/app/src/console/admin/Merchants.jsx(前端统计卡)',
    fix: '后端:AdminMerchantService::list 返回里增加 status_counts(全局各状态 0待审/1正常/2冻结 计数,忽略分页与 status 筛选、保留 keyword 筛选)。' + REF + ' 前端:Merchants.jsx 统计卡(现 items.reduce 本页口径,标签"本页商户")改用 list.data?.status_counts(兜底退化本页);标签去掉"本页",值用全局数;商户总数用各状态之和或 total。先 Read 两个文件。不改审核/冻结/佣金等写操作逻辑。',
  },
  {
    key: 'Complaints', files: 'app/service/ComplaintService.php::adminList + app/controller/admin/Complaints.php + frontend/app/src/console/admin/Complaints.jsx',
    fix: '后端:ComplaintService::adminList 当前返回纯数组、controller 包成 {items}。改为让 adminList(或新增方法)同时返回全局各状态计数;controller 返回 {items, status_counts}(status_counts 为全局各状态 0待处理/1已回复/2平台介入中/3已解决/4已驳回 的计数,忽略 status 筛选、保留 merchant 筛选)。' + REF + ' 前端:Complaints.jsx 统计卡(现"本页投诉"口径)改用 status_counts 全局数。先 Read 三个文件确认状态枚举与字段。不改裁决/退款逻辑。',
  },
  {
    key: 'Withdrawals', files: 'app/service/AdminWithdrawService.php::list + frontend/app/src/console/admin/Withdrawals.jsx',
    fix: '审查:提现"待审核笔数/金额合计"只算本页(前端 rows.filter+reduce)。后端:AdminWithdrawService::list 返回里增加 pending_summary:{count, amount}(全局待审核 status=0 的笔数与金额合计,用 Money/bcadd 累加金额避免浮点;忽略分页、保留其它筛选)。前端:Withdrawals.jsx 待审核统计卡改用后端 pending_summary(兜底退化本页),副文案去掉"仅本页"。先 Read 两文件确认 status 枚举(待审核=0?)与金额字段名。金额累加务必 bcmath。',
  },
];
const SCHEMA = { type: 'object', additionalProperties: false, properties: { key: { type: 'string' }, applied: { type: 'array', items: { type: 'string' } }, skipped: { type: 'array', items: { type: 'string' } }, risk: { type: 'string' } }, required: ['key', 'applied'] };
const results = await parallel(TASKS.map((t) => () =>
  agent(
    '把这一端的后台统计卡改成**全局口径**(现为本页 reduce、翻页失真)。按精确指令做,先 Read 涉及文件理解上下文,再最小改动,保证 PHP/JSX 合法、保留所有现有逻辑。不跑 build/git/composer。\n\n### 涉及文件\n' + APP + ' 下:' + t.files + '\n\n### 改动\n' + t.fix + '\n\n### 硬性要求\n- 只改统计口径相关;金额/卡密/支付/下单/审核/退款的计算与请求逻辑一律不动。\n- 后端聚合是只读 SQL,务必不破坏现有 list 的分页/筛选返回;金额累加用 bcmath(Money 类)。\n- 前端配色走橙色 CSS 变量。确保不破坏现有测试(composer test 会在之后统一跑)。\n- 返回 applied/skipped/risk。',
    { label: 'gc:' + t.key, phase: 'Fix', schema: SCHEMA, agentType: 'claude', model: 'opus' }
  )
));
return results.filter(Boolean);
