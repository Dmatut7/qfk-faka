export const meta = {
  name: 'visual-audit-newui',
  description: 'Opus 对抗式视觉审查:全部后台+买家屏的显示问题与未完成项',
  phases: [{ title: 'Adversarial visual audit', detail: '每批一个 Opus agent:看截图+源码+Kit,挑显示/完整性缺陷' }],
}

const AUD = '/Users/a1/Desktop/qfk/frontend/app/e2e/audit'
const NEW = '/Users/a1/Desktop/qfk/frontend/app/e2e/newui'
const SRC = '/Users/a1/Desktop/qfk/frontend/app/src'
const KIT = '/Users/a1/Desktop/qfk/frontend/design-system/ui_kits'

const BATCHES = [
  {
    key: 'merchant',
    shots: ['merchant-00-数据概览', 'merchant-01-商品管理', 'merchant-02-分类管理', 'merchant-03-卡密管理', 'merchant-04-订单管理', 'merchant-05-投诉处理', 'merchant-06-优惠券', 'merchant-07-满减满折', 'merchant-08-钱包提现', 'merchant-09-店铺装修'].map((n) => AUD + '/' + n + '.png'),
    src: SRC + '/console/merchant/(Stats,Products,Categories,Cards,Orders,Complaints,Coupons,Promotions,Wallet,Shop,ChaptersModal).jsx',
    kit: KIT + '/merchant/',
  },
  {
    key: 'admin-A',
    shots: ['admin-00-仪表盘', 'admin-01-大屏数据', 'admin-02-商户审核', 'admin-03-邀请码', 'admin-04-订单跨商户', 'admin-05-商品跨商户', 'admin-06-投诉仲裁', 'admin-07-买家黑名单', 'admin-08-风控记录'].map((n) => AUD + '/' + n + '.png'),
    src: SRC + '/console/admin/(Dashboard,BigScreen,Merchants,InviteCodes,Orders,Products,Complaints,Blacklist,RiskRecords).jsx',
    kit: KIT + '/admin/',
  },
  {
    key: 'admin-B',
    shots: ['admin-09-提现审核', 'admin-10-对账报表', 'admin-11-内容管理', 'admin-12-禁售目录', 'admin-13-支付渠道', 'admin-14-平台配置', 'admin-15-操作日志', 'admin-16-异常日志', 'admin-17-任务计划'].map((n) => AUD + '/' + n + '.png'),
    src: SRC + '/console/admin/(Withdrawals,Settlement,Announcements,Forbidden,Channels,Settings,OperationLogs,Logs,CronJobs).jsx',
    kit: KIT + '/admin/',
  },
  {
    key: 'buyer',
    shots: ['buyer-00-home', 'buyer-01-detail'].map((n) => AUD + '/' + n + '.png').concat(['buyer-home-mobile', 'buyer-home-desktop', 'buyer-detail-mobile', 'buyer-lookup-desktop', 'portal-desktop'].map((n) => NEW + '/' + n + '.png')),
    src: SRC + '/screens/(StorefrontHome,ProductDetail,OrderLookup,PaymentScreen,Portal).jsx',
    kit: KIT + '/storefront/',
  },
]

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    batch: { type: 'string' },
    overallNote: { type: 'string' },
    defects: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          screen: { type: 'string' },
          severity: { type: 'string', enum: ['high', 'med', 'low'] },
          type: { type: 'string', enum: ['display', 'incomplete', 'offbrand', 'overflow', 'data', 'inconsistent'] },
          problem: { type: 'string' },
          evidence: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['screen', 'severity', 'type', 'problem', 'fix'],
      },
    },
  },
  required: ['batch', 'defects'],
}

function prompt(b) {
  return (
    '你是挑剔的资深 UI 审查员。对这批界面做**对抗式审查**——默认"一定有问题",使劲找。不要改文件,只报告。\n\n' +
    '### 看这些截图(用 Read 工具逐张打开看)\n' + b.shots.map((s) => '- ' + s).join('\n') + '\n\n' +
    '### 对照源码(用 Read/Grep)\n' + b.src + '\n### 对照设计 Kit(目标样子)\n' + b.kit + '\n\n' +
    '### 重点挑这些(逐屏过)\n' +
    '- **未完成**:占位/「建设中」/空壳页、明明该有数据却空、功能缺失(对照 Kit/业务该有的:列表该有的列/操作按钮、表单该有的字段、增删改入口、分页、筛选)\n' +
    '- **显示问题**:布局塌陷/错位/不对齐、文字溢出/截断/重叠、卡片或表格挤压、留白突兀、组件缺样式、图标缺失、对比度差(看不清)\n' +
    '- **偏离 Kit / 不一致**:配色或结构跟 Kit 差太多、同类组件多种样子、间距不在刻度\n' +
    '- **残留旧色**:任何蓝/靛/紫当主色\n' +
    '- **数据/态**:空态/错误态/加载态缺失或难看;数字/金额显示异常(NaN、—、错位)\n\n' +
    '### 要求\n每条缺陷给:screen(哪张图)、severity(high/med/low)、type、problem(具体说清哪里不对)、evidence(截图里看到的+源码佐证)、fix(怎么修)。\n' +
    '宁可多报、要具体到"哪个屏哪个区域什么毛病"。如果某屏确实没问题,不用硬报。最后 overallNote 给这批的总体印象与最该先修的 2-3 项。'
  )
}

const results = await parallel(
  BATCHES.map((b) => () =>
    agent(prompt(b), { label: 'audit:' + b.key, phase: 'Adversarial visual audit', schema: SCHEMA, agentType: 'Explore', model: 'opus' })
  )
)

return results.filter(Boolean)
