export const meta = {
  name: 'port-storefront-to-new-ui',
  description: '把买家前台 6 屏 port 成新橙色淘宝 UI Kit 布局,保留全部真实业务逻辑与 API 接线',
  phases: [{ title: 'Port screens', detail: '每屏一个 agent:读真实屏+Kit屏,改写为新布局,保留逻辑' }],
}

const DS = '/Users/a1/Desktop/qfk/frontend/design-system'

const SCREENS = [
  {
    key: 'StorefrontHome',
    real: 'frontend/app/src/screens/StorefrontHome.jsx',
    kit: DS + '/ui_kits/storefront/storefronthome.js',
    props: '{ shop, categories, products, loading, error, onReload, onSelect }',
    detail:
      'props.products 是 normalizeProduct 后的对象(id,name,price,original,market_price,image,thumb(emoji占位),stock,sold/sales_count,goods_type[1卡密/2知识/3资源/4权益],category_id,on_sale,discount_end)。props.shop={name,intro,logo,cover,announcement,verified,deposit,sales_count,notices:[{title,content}],contact}。props.categories=[{id,name,image,goods_count}]。onSelect(productObj) 打开详情;onReload() 错误重试。 ' +
      '目标布局(storefronthome.js):公告条(用 shop.notices 轮播,可关闭)→ 橙色封面 banner → 商户卡(圆形 avatar + 店名 + 已认证徽章[shop.verified] + 三联统计[在售数/累计成交 shop.sales_count/保证金 shop.deposit] + 信任 chips + 联系客服)→ 4 横排销售类型卡(按 goods_type 分组计数,点击筛选)→ 搜索框 → 排序/分类筛选(综合/销量/上新/价格 + 分类计数方框,选中橙高亮)→ 2 列 image-led 商品网格(ESM <ProductCard/>)→ 底部 tab bar。 ' +
      '商品卡用 import { ProductCard } from "../../../design-system/components/commerce/ProductCard.jsx";按其 .d.ts 的 props 传(无图 thumb emoji 占位别留白块)。',
    preserve: '分类筛选(按 category_id 精确)、搜索、排序、加载骨架、空店铺态、无搜索结果态、onSelect、onReload(错误态重试)。',
  },
  {
    key: 'TopBar',
    real: 'frontend/app/src/components/TopBar.jsx',
    kit: DS + '/ui_kits/storefront/topbar.js',
    props: '{ shopName, shopIntro, onHome, onLookup, onNews, onFaq, onPortal, back, onBack, title }',
    detail:
      '60px sticky 顶栏。普通态:logo(import logoMark from "../../../design-system/assets/logo-mark.svg")+店名/简介+门户/资讯/帮助入口+「取卡/查单」按钮。返回态(back=true):左返回箭头+title。参考 topbar.js 橙色 blur sticky 视觉。',
    preserve: '全部导航回调(onHome/onLookup/onNews/onFaq/onPortal)与 back/onBack/title 返回态;default export。',
  },
  {
    key: 'ProductDetail',
    real: 'frontend/app/src/screens/ProductDetail.jsx',
    kit: DS + '/ui_kits/storefront/productdetail.js',
    props: '{ productId, initialProduct, shop, onBack, onOrderCreated }',
    detail:
      '调 api.product(productId) 取详情;api.checkoutPreview/validateCoupon 试算;api.createOrder 下单成功→onOrderCreated(apiOrder,email,product);知识类 api.productChapters(id) 取章节目录(仅标题)。 ' +
      '目标(productdetail.js):主图(无图 emoji 占位)→ 徽标行(类型[goods_type]/库存现货N/自动发货/已售)→ 价格区(现价大红+划线原价+「省¥X」)→ 购买表单(QuantityStepper 数量、接收邮箱必填、查单密码选填、优惠券+验证)→ 金额分解(单价×数量−优惠=预计应付)→ 购买须知 → 知识类章节目录预览 → 底部 sticky 购买条。ESM:Button/Input/PriceTag/QuantityStepper/Badge/CheckoutSteps。',
    preserve: '全部 api(product/checkoutPreview/validateCoupon/createOrder/productChapters)、券试算与已优惠提示、起购/限购校验、四类型差异(尤其知识章节预览)、加载/已下架/缺货态、下单→onOrderCreated 的参数顺序。',
  },
  {
    key: 'PaymentScreen',
    real: 'frontend/app/src/screens/PaymentScreen.jsx',
    kit: DS + '/ui_kits/storefront/paymentscreen.js',
    props: '{ order, onBack, onPaid }',
    detail:
      'order={orderNo,total,expireAt,qty,email,product}。调 api.pay(orderNo) 拿支付参数;import { pollDelivery } from "../api.js" 轮询发货,终态→onPaid(deliveredOrder)。倒计时到 expireAt。 ' +
      '目标(paymentscreen.js):CheckoutSteps 进度、订单摘要、支付方式(PaymentOption)、二维码/跳转、「发货中」轮询态、二维码过期可刷新。ESM:Button/PriceTag/CheckoutSteps/PaymentOption。',
    preserve: '完整支付流程、pollDelivery→onPaid、倒计时、过期/异常/关闭/超时各状态与文案、二维码刷新。',
  },
  {
    key: 'OrderLookup',
    real: 'frontend/app/src/screens/OrderLookup.jsx',
    kit: DS + '/ui_kits/storefront/orderlookup.js',
    props: '{ initialResult, onBack, queryTips }',
    detail:
      'api.queryOrder({orderNo,email|password}) 查单/取卡;api.orderChapters 购后阅读;投诉 api(fileComplaint/queryComplaints/escalateComplaint)。ESM CardKey 展示卡密、OrderStatusBadge 状态。initialResult 存在则直达结果。 ' +
      '目标(orderlookup.js):查单表单(订单号+邮箱/查单密码切换+风险提示 queryTips)→ 结果卡(订单号+状态徽标+商品摘要+数量+实付+邮箱)→ 四类型交付区(卡密=CardKey列表+逐条复制+复制全部 / 知识=阅读器左目录右正文 / 资源=下载按钮+30分钟有效期提示 / 权益=权益码+复制)→ 申请售后入口+表单。复制成功统一 Toast「已复制」。',
    preserve: '查单、四类型交付区(尤其知识阅读器与资源下载链)、6 种订单状态展示与文案、复制到剪贴板、售后投诉完整流程(发起/查列表/申请平台介入)、initialResult 直达。',
  },
  {
    key: 'Portal',
    real: 'frontend/app/src/screens/Portal.jsx',
    kit: '(无 Kit — 按 ' + DS + '/readme.md 风格规范 + storefront kit 橙色视觉语言自行设计)',
    props: '{ config, onEnterShop, onLookup, onNews, onFaq, onForbidden }',
    detail:
      '门户官网。调 api.platformStats() 取 {merchants,products,orders};api.articles({type:1}) 最新资讯。 ' +
      '目标(对齐橙色系统):Hero(橙色渐变背景,平台名[config?.site?.name]+标语+「进入商城 onEnterShop」/「开通小店」CTA)→ 平台数据卡(入驻商户/在售商品/累计成交)→ 入口宫格(进入商城/订单查询 onLookup/常见问题 onFaq/最新资讯 onNews/禁售目录 onForbidden/开通小店)→ 最新资讯列表。 ' +
      '关键:现有 Hero 渐变是 teal→蓝→紫(var(--secure-solid,#2563eb)→var(--brand,#4f46e5)...),必须改成橙色(var(--brand-gradient) 或橙阶),去掉所有蓝/紫 fallback。',
    preserve: 'platformStats/articles 拉取、全部导航回调(onEnterShop/onLookup/onNews/onFaq/onForbidden)、加载/空/错态。',
  },
]

const PORT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    screen: { type: 'string' },
    path: { type: 'string' },
    wrote: { type: 'boolean' },
    layoutAdopted: { type: 'string' },
    importsAdded: { type: 'array', items: { type: 'string' } },
    preservedFeatures: { type: 'array', items: { type: 'string' } },
    riskyOrDropped: { type: 'array', items: { type: 'string' } },
    lineCount: { type: 'number' },
  },
  required: ['screen', 'path', 'wrote', 'preservedFeatures', 'riskyOrDropped'],
}

function buildPrompt(s) {
  return (
    '你要把买家前台的一个 React 屏 port 成新橙色淘宝 UI Kit 布局,接入真实产品。只写一个文件:' + s.real + '。不要碰任何其它文件,不要跑 build/git。\n\n' +
    '### 必读(用 Read 真实读取,不要臆造)\n' +
    '1. 真实屏(逻辑事实源,必须完整保留其业务逻辑/API/状态/handler):/Users/a1/Desktop/qfk/' + s.real + '\n' +
    '2. 目标布局 Kit:' + s.kit + '\n' +
    '3. 设计组件(ESM 可 import):' + DS + '/components/ 下 core/{Button,Input,Badge,PriceTag,QuantityStepper}.jsx 与 commerce/{ProductCard,CardKey,OrderStatusBadge,PaymentOption,CheckoutSteps,ProductListItem}.jsx(连同 .d.ts 确认 props 名)。\n' +
    '4. 风格规范:' + DS + '/readme.md(VISUAL FOUNDATIONS / CONTENT)。\n\n' +
    '### props 契约(保持不变,App.jsx 不改)\n' + s.props + '\n\n' +
    '### 屏细节\n' + s.detail + '\n\n' +
    '### 必须保留(删功能=失败)\n' + s.preserve + '\n\n' +
    '### 硬性要求\n' +
    '- 保持 export 形式与 props 与现文件一致。\n' +
    '- 重写的是渲染/布局/配色,不是逻辑:所有 useState/useEffect/api/handler/校验/状态机原样保留,只把 JSX 换成 Kit 淘宝布局、改用上面 ESM 设计组件、配色全走 CSS 变量(橙色 token:--brand #FF5000、--price-accent 红、--brand-gradient 等),绝不出现硬编码蓝/靛/紫(#2563eb/#4f46e5/#4338ca/#eef3ff 等一律不要)。\n' +
    '- import 路径照现文件相对前缀(src/screens/ → ../../../design-system/...;api 用 ../api.js;TopBar 在 src/components/ 同理)。\n' +
    '- 加载/空/错三态都要在;移动端单列、桌面合理列数,别塌陷。\n' +
    '- 输出完整可编译文件(有效 JSX、无未定义变量、无缺失 import),用 Write 覆盖写入 /Users/a1/Desktop/qfk/' + s.real + '。\n\n' +
    '写完后用 StructuredOutput 返回结果(逐条列 preservedFeatures 与 riskyOrDropped)。'
  )
}

const results = await parallel(
  SCREENS.map((s) => () =>
    agent(buildPrompt(s), { label: 'port:' + s.key, phase: 'Port screens', schema: PORT_SCHEMA, agentType: 'claude' })
  )
)

return results.filter(Boolean)
