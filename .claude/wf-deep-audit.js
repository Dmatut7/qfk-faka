export const meta = {
  name: 'deep-audit-newui',
  description: '大型 Opus 审查:全部屏 移动+桌面 的显示bug + 功能缺失(对照 design-brief §7 + Kit)',
  phases: [{ title: 'Deep audit', detail: '11 个 Opus agent 并行:显示+完整性+缺失功能' }],
}

const AUD = '/Users/a1/Desktop/qfk/frontend/app/e2e/audit';
const NEW = '/Users/a1/Desktop/qfk/frontend/app/e2e/newui';
const MOB = '/Users/a1/Desktop/qfk/frontend/app/e2e/mobile';
const SRC = '/Users/a1/Desktop/qfk/frontend/app/src';
const KIT = '/Users/a1/Desktop/qfk/frontend/design-system/ui_kits';
const BRIEF = '/Users/a1/Desktop/qfk/docs/design-brief.md';

const G = [
  { key: 'buyer-home', shots: [MOB+'/m-buyer-home.png', NEW+'/buyer-home-desktop.png', AUD+'/buyer-00-home.png'], src: SRC+'/screens/StorefrontHome.jsx + '+SRC+'/components/TopBar.jsx', kit: KIT+'/storefront/storefronthome.js,topbar.js', brief: 'A.1 店铺首页', focus: '移动端顶栏是否塌陷/店名简介与logo重叠(已知bug);4横排类型卡/分类计数筛选/搜索/排序是否齐;商品卡完整性;底部tab功能是否真可用还是占位' },
  { key: 'buyer-detail', shots: [MOB+'/m-buyer-detail.png', NEW+'/buyer-detail-mobile.png'], src: SRC+'/screens/ProductDetail.jsx', kit: KIT+'/storefront/productdetail.js', brief: 'A.2 商品详情', focus: '知识类章节目录预览、优惠券验证、金额分解、数量步进/起购限购、缺货/下架态;对照brief看缺什么字段/区块' },
  { key: 'buyer-lookup', shots: [MOB+'/m-buyer-lookup.png', NEW+'/buyer-lookup-desktop.png'], src: SRC+'/screens/OrderLookup.jsx', kit: KIT+'/storefront/orderlookup.js', brief: 'A.3 订单查询/取卡', focus: '四类型差异化交付区是否都实现(卡密列表+复制全部 / 知识阅读器左目录右正文 / 资源下载链+有效期 / 权益码);6种订单状态;售后投诉;桌面端大片空白' },
  { key: 'buyer-portal-pay', shots: [MOB+'/m-buyer-portal.png', NEW+'/portal-desktop.png'], src: SRC+'/screens/Portal.jsx + '+SRC+'/screens/PaymentScreen.jsx', kit: KIT+'/storefront/paymentscreen.js', brief: 'B 门户站 + A.4 支付页', focus: '门户数据卡/入口宫格/资讯;支付页轮询/二维码/过期;图标重复;数据是否真接通' },
  { key: 'merchant-core', shots: [AUD+'/merchant-01-商品管理.png', AUD+'/merchant-03-卡密管理.png', MOB+'/m-merchant-dashboard.png'], src: SRC+'/console/merchant/Products.jsx,Cards.jsx,ChaptersModal.jsx,Stats.jsx', kit: KIT+'/merchant/merchantapp.js', brief: 'D.10/11/12/13 数据概览/商品/章节/卡密', focus: '商品新建编辑大表单字段是否齐全(类型/主图/价格划线价/限时折扣+起止/分类/发货方式/起购限购/库存显示方式/购买须知/发货留言/资源地址/知识章节入口);卡密批量导入/作废;章节管理弹窗' },
  { key: 'merchant-trade', shots: [AUD+'/merchant-04-订单管理.png', AUD+'/merchant-05-投诉处理.png'], src: SRC+'/console/merchant/Orders.jsx,Complaints.jsx', kit: KIT+'/merchant/merchantapp.js', brief: 'D.15/16 订单/投诉', focus: '订单筛选/详情/关闭/补发;投诉状态筛选(缺)+回复弹窗是否有' },
  { key: 'merchant-mkt-money', shots: [AUD+'/merchant-06-优惠券.png', AUD+'/merchant-07-满减满折.png', AUD+'/merchant-08-钱包提现.png', AUD+'/merchant-09-店铺装修.png', AUD+'/merchant-02-分类管理.png'], src: SRC+'/console/merchant/Coupons.jsx,Promotions.jsx,Wallet.jsx,Shop.jsx,Categories.jsx', kit: KIT+'/merchant/merchantapp.js', brief: 'D.14/17/18/19/20 分类/券/满减/钱包/装修', focus: '优惠券字段(名称/券码/类型/面值/门槛/封顶/总量/有效期/状态);满减满折;提现申请表单;店铺装修主题/公告/联系方式' },
  { key: 'admin-merchants', shots: [AUD+'/admin-02-商户审核.png', AUD+'/admin-04-订单跨商户.png', AUD+'/admin-05-商品跨商户.png'], src: SRC+'/console/admin/Merchants.jsx,Orders.jsx,Products.jsx', kit: KIT+'/admin/adminapp.js', brief: 'E.23/24 商户审核/跨商户订单', focus: '商户审核全操作(通过/冻结/解冻/设佣金/重置密码/新建商户);跨商户订单退款(确认+原因);筛选/统计卡' },
  { key: 'admin-arb', shots: [AUD+'/admin-06-投诉仲裁.png', AUD+'/admin-07-买家黑名单.png', AUD+'/admin-08-风控记录.png', AUD+'/admin-09-提现审核.png'], src: SRC+'/console/admin/Complaints.jsx,Blacklist.jsx,RiskRecords.jsx,Withdrawals.jsx', kit: KIT+'/admin/adminapp.js', brief: 'E.25/26/27/33 仲裁/黑名单/风控/提现审核', focus: '投诉仲裁裁决弹窗(解决/勾选联动退款/驳回+备注);黑名单拉黑解除;提现通过打款/驳回;待审汇总口径' },
  { key: 'admin-ops', shots: [AUD+'/admin-10-对账报表.png', AUD+'/admin-13-支付渠道.png', AUD+'/admin-14-平台配置.png', AUD+'/admin-12-禁售目录.png', AUD+'/admin-00-仪表盘.png'], src: SRC+'/console/admin/Settlement.jsx,Channels.jsx,Settings.jsx,Forbidden.jsx,Dashboard.jsx', kit: KIT+'/admin/adminapp.js', brief: 'E.21/30/31/32 仪表盘/禁售/支付渠道/平台配置', focus: '支付渠道新建编辑+验签测试(缺?);平台配置KV+费率回填+对账;仪表盘待处理可点跳转;禁售目录增删改' },
  { key: 'mobile-cross', shots: [MOB+'/m-buyer-home.png', MOB+'/m-buyer-detail.png', MOB+'/m-buyer-lookup.png', MOB+'/m-buyer-portal.png', MOB+'/m-merchant-dashboard.png', MOB+'/m-merchant-drawer.png', MOB+'/m-admin-dashboard.png', MOB+'/m-admin-drawer.png'], src: SRC+'/components/TopBar.jsx + '+SRC+'/console/ConsoleApp.jsx', kit: '(对照 design-brief 响应式要求 ≤480移动)', brief: '4 技术约束·响应式', focus: '专查移动端:顶栏塌陷/文字溢出重叠/卡片挤压/按钮触控区/抽屉态/底部tab遮挡/横向溢出。逐张挑出移动端布局问题' },
];

const SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    group: { type: 'string' },
    defects: {
      type: 'array', items: {
        type: 'object', additionalProperties: false,
        properties: {
          screen: { type: 'string' },
          severity: { type: 'string', enum: ['high', 'med', 'low'] },
          type: { type: 'string', enum: ['display', 'missing-function', 'incomplete', 'offbrand', 'overflow', 'logic', 'data'] },
          problem: { type: 'string' },
          evidence: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['screen', 'severity', 'type', 'problem', 'fix'],
      },
    },
    topFix: { type: 'string', description: '本组最该先修的 2-3 项' },
  },
  required: ['group', 'defects'],
};

function prompt(g) {
  return (
    '你是极挑剔的资深产品+UI审查员,代表"最终接手要交付"的工程师。对这组屏做**对抗式深度审查**:不仅找显示bug,更要找**功能缺失**——对照理想设计与业务该有的能力,缺的功能必须揪出来。不要改文件,只报告。\n\n' +
    '### 看截图(Read 逐张打开,含移动+桌面)\n' + g.shots.map((s) => '- ' + s).join('\n') + '\n\n' +
    '### 读源码\n' + g.src + '\n### 对照 Kit(理想视觉)\n' + g.kit + '\n### 对照需求清单(理想功能/字段)\n读 ' + BRIEF + ' 的「' + g.brief + '」相关章节(尤其第7节页面清单与附录B/D),逐条核对该屏"应该有"的区块/字段/操作/状态。\n\n' +
    '### 本组重点\n' + g.focus + '\n\n' +
    '### 必须分类报告(尤其 missing-function)\n' +
    '- **missing-function**:需求/Kit 要求有、但页面里根本没有的功能或字段(如商品表单缺限时折扣/库存显示方式、取卡缺某类型交付区、支付渠道缺验签测试、投诉缺筛选/回复)。这是最重要的一类,务必查全。\n' +
    '- **display/overflow**:移动端塌陷、文字溢出重叠、错位、裁切、挤压、对比度差。\n' +
    '- **incomplete**:有壳但半成品(空数据像没接通、占位、操作不可用)。\n' +
    '- **offbrand/logic/data**:残留旧色、逻辑可疑、数字异常。\n\n' +
    '每条给 screen / severity / type / problem(具体到哪屏哪区域缺什么或坏什么)/ evidence(截图+源码佐证)/ fix(怎么补)。宁可多报、要具体可执行。最后 topFix 给本组最该先修 2-3 项。'
  );
}

const results = await parallel(G.map((g) => () =>
  agent(prompt(g), { label: 'audit:' + g.key, phase: 'Deep audit', schema: SCHEMA, agentType: 'Explore', model: 'opus' })
));
return results.filter(Boolean);
