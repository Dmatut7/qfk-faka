export const meta = {
  name: 'review-storefront-ports',
  description: '并行审计 6 个 port 屏的业务逻辑回归(只看逻辑,不看样式),金额/支付/卡密从严',
  phases: [{ title: 'Review logic regressions', detail: '每屏一个 agent:diff 旧→新,查逻辑回归' }],
}

const BASE = '1d8e22a' // port 前的基线提交(原蓝色版屏幕)

const SCREENS = [
  { key: 'StorefrontHome', path: 'frontend/app/src/screens/StorefrontHome.jsx' },
  { key: 'ProductDetail', path: 'frontend/app/src/screens/ProductDetail.jsx', focus: '金额试算(checkoutPreview/validateCoupon)、起购限购校验、下单 createOrder 参数顺序 onOrderCreated(apiOrder,email,product)、知识章节预览、邮箱校验、缺货/下架态' },
  { key: 'PaymentScreen', path: 'frontend/app/src/screens/PaymentScreen.jsx', focus: '支付状态机(IDLE/WAITING/EXCEPTION/TIMEOUT/CLOSED)、api.pay、pollDelivery→onPaid、4002/4003 分支、倒计时、aliveRef 守卫' },
  { key: 'OrderLookup', path: 'frontend/app/src/screens/OrderLookup.jsx', focus: '四类型交付区(卡密/知识阅读器/资源下载链/权益码)全部保留、6 种订单状态、复制剪贴板、售后投诉流程、initialResult 直达、queryOrder/orderChapters' },
  { key: 'Portal', path: 'frontend/app/src/screens/Portal.jsx', focus: 'platformStats/articles 拉取、导航回调、加载/空/错态' },
  { key: 'TopBar', path: 'frontend/app/src/components/TopBar.jsx', focus: '全部导航回调与 back/title 返回态' },
]

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    screen: { type: 'string' },
    verdict: { type: 'string', enum: ['clean', 'has-regressions'] },
    regressions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          severity: { type: 'string', enum: ['high', 'med', 'low'] },
          area: { type: 'string' },
          oldBehavior: { type: 'string' },
          newBehavior: { type: 'string' },
          evidence: { type: 'string', description: '关键代码/行号证据' },
          suggestedFix: { type: 'string' },
        },
        required: ['severity', 'area', 'oldBehavior', 'newBehavior', 'evidence'],
      },
    },
  },
  required: ['screen', 'verdict', 'regressions'],
}

function prompt(s) {
  return (
    '只读审计:对比这个屏 port 前后的改动,专查**业务逻辑回归**(只看逻辑,不看样式/配色/布局)。不要改文件。\n\n' +
    '### 怎么看\n' +
    '1. 运行 `cd /Users/a1/Desktop/qfk && git diff ' + BASE + ' HEAD -- ' + s.path + '` 看完整 port 改动。\n' +
    '2. 需要时 `git show ' + BASE + ':' + s.path + '` 看旧版全文,Read ' + s.path + ' 看新版全文。\n\n' +
    '### 找这些回归(有就如实列,没有 verdict=clean)\n' +
    '- 被删/改名的 api 调用,或调用参数顺序/字段变了(尤其下单、支付、查单)\n' +
    '- 丢失的状态分支:订单 6 态、支付状态机、四类型交付区、加载/空/错/缺货/过期等边界态\n' +
    '- 丢失或改坏的校验:邮箱格式、必填、起购/限购钳制、金额计算(整数分/bcmath 口径)\n' +
    '- 改坏的条件判断、useEffect 依赖/清理丢失、回调签名变了(如 onOrderCreated/onPaid/onSelect 参数)\n' +
    '- props 契约或 export 形式变化(App.jsx 靠它们接线)\n' +
    (s.focus ? '### 本屏重点核查\n' + s.focus + '\n\n' : '\n') +
    '### 严格度\n金额 / 卡密发放 / 支付回调相关的任何改动按**项目铁规则**从严核查(宁可多报)。port 的目标是"只换渲染与配色、逻辑原样",任何逻辑层面的实质改动都要标出。\n\n' +
    '逐条 regression 给 severity / area / 旧行为 / 新行为 / 证据(代码或行号)/ 建议修法。最后 verdict。'
  )
}

const results = await parallel(
  SCREENS.map((s) => () =>
    agent(prompt(s), { label: 'review:' + s.key, phase: 'Review logic regressions', schema: SCHEMA, agentType: 'Explore' })
  )
)

return results.filter(Boolean)
